// 最优路径规划: 基于武汉道路 LineString 离线构建路网图 + A* 搜索
// 数据特点: mock 道路在交叉处坐标有微小偏差(约数十米), 直接按共享顶点建图会严重碎片化。
// 因此建图分两步:
//   1. 按 5 位小数坐标聚合出道路链(节点=坐标点, 边=相邻段, 无向)
//   2. 空间网格(250m)给不同道路链的相近节点添加"连接边"(每条链≤5条最近连接),
//      将碎片网络缝合为主连通网络(主分量 ~88%)
// A* 特性:
//   - 边权 = 里程 × 拥堵系数(道路类型+当前小时), ≥ 真实里程, haversine 启发式可保证最优
//   - 避让事故: 距事故点 <150m 的边权 ×100 → 自动绕行
//   - 起终点吸附: 优先吸附到"大分量"(≥500 节点)的最近节点, 避免落在孤立小团上
// 返回路径坐标 + 统计(距离/耗时/拥堵指数/绕行事故数)。全程离线, 无外部 API 依赖。
import { getRoads, getEvents } from '@/api'

const R = 6371 // 地球半径(km)

// haversine 距离(km)
function haversineKm(a, b) {
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// 道路类型 → 基准速度(km/h)
const TYPE_SPEED = {
  motorway: 80,
  motorway_link: 60,
  trunk: 60,
  primary: 50,
  secondary: 40,
  tertiary: 30,
  residential: 20,
  service: 15,
  unclassified: 25,
  cycleway: 12,
}

// 道路类型 → 拥堵敏感度(高峰时更易堵)
const TYPE_CONCEST = {
  motorway: 0.55,
  motorway_link: 0.5,
  trunk: 0.6,
  primary: 0.65,
  secondary: 0.7,
  tertiary: 0.75,
  residential: 0.85,
  unclassified: 0.8,
  service: 0.9,
  cycleway: 0.95,
}

// 确定性伪随机(由 osm_id 决定各道路差异, 保证结果稳定)
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// 单条道路某时刻拥堵指数(0-10), 与 useRoads 保持一致
function congestionOf(osmId, type, hour) {
  const base = TYPE_CONCEST[type] ?? 0.8
  const r = rand(osmId)
  const peak =
    (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
      ? 1
      : (hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 20)
        ? 0.75
        : 0.4
  const night = hour >= 22 || hour <= 5 ? 0.6 : 1
  return Math.max(1, Math.min(10, Math.round(base * (0.5 + r * 0.9) * peak * night * 10)))
}

// 拥堵系数(≥1, 用于 A* 边权): 拥堵路段的行程成本放大 → A* 倾向绕行拥堵
function congestionFactor(type, hour) {
  const base =
    {
      motorway: 1.2,
      motorway_link: 1.3,
      trunk: 1.3,
      primary: 1.4,
      secondary: 1.5,
      tertiary: 1.6,
      residential: 1.8,
      service: 2.0,
      unclassified: 1.7,
      cycleway: 2.2,
    }[type] ?? 1.6
  const peak =
    (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
      ? 1.6
      : (hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 20)
        ? 1.25
        : 1.0
  const night = hour >= 22 || hour <= 5 ? 0.9 : 1.0
  return Math.max(1, +(base * peak * night * 0.72).toFixed(2))
}

// ---------- 图构建(模块级缓存) ----------

// 连接边参数(经实测: 250m/每链5条 → 主分量约 88%)
const CONNECT_RADIUS_M = 250
const CONNECT_MAX = 5
const SNAP_MIN_COMP_SIZE = 500 // 吸附时要求所在连通分量至少这么大

let built = false
let nodes = [] // [ [lng, lat], ... ] 下标即节点 id
let adj = [] // adj[id] = [{ to, dist, type, key, osmId }]
let edges = [] // { u, v, dist, type, key, osmId }  (路径统计用)
let nodeIndex = new Map() // "lng,lat"(5位) -> id
let chainOf = new Map() // 节点 id -> Set(所属道路 osm_id), 用于识别同链避免捷径
let comp = null // 节点 -> 连通分量 id
let compSizes = null // 分量 id -> 节点数
let blockedKeys = null // 距事故点 <150m 的边 key 集合
let eventsCache = null

function nodeIdOf(lng, lat, chain) {
  const key = lng.toFixed(5) + ',' + lat.toFixed(5)
  let id = nodeIndex.get(key)
  if (id === undefined) {
    id = nodes.length
    nodeIndex.set(key, id)
    nodes.push([lng, lat])
    adj.push([])
    chainOf.set(id, new Set())
  }
  chainOf.get(id).add(chain)
  return id
}

function edgeKey(u, v) {
  return u < v ? u + '|' + v : v + '|' + u
}

// 给不同道路链的相近节点添加连接边(空间网格加速, 缝合碎片化路网)
function connectNearbyNodes() {
  const cellLat = CONNECT_RADIUS_M / 110540
  const cellLng = CONNECT_RADIUS_M / (111320 * Math.cos((30.5 * Math.PI) / 180))
  // 平面距离系数(城市尺度内近似足够, 用于候选筛选; 真正建边时才用 haversine)
  const kx = 111320 * Math.cos((30.5 * Math.PI) / 180)
  const ky = 110540
  const R2 = CONNECT_RADIUS_M * CONNECT_RADIUS_M
  const grid = new Map()
  const ck = (i, j) => i + ',' + j
  for (let i = 0; i < nodes.length; i++) {
    const k = ck(
      Math.floor(nodes[i][0] / cellLng),
      Math.floor(nodes[i][1] / cellLat),
    )
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k).push(i)
  }
  const shareChain = (u, v) => {
    const su = chainOf.get(u)
    const sv = chainOf.get(v)
    for (const c of su) if (sv.has(c)) return true
    return false
  }
  // 全局去重: 同一对节点只连一次(候选均为跨链, 不会与链内基边重复)
  const connSeen = new Set()
  let added = 0
  for (let u = 0; u < nodes.length; u++) {
    const gi = Math.floor(nodes[u][0] / cellLng)
    const gj = Math.floor(nodes[u][1] / cellLat)
    const ux = nodes[u][0]
    const uy = nodes[u][1]
    const cand = []
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const cell = grid.get(ck(gi + di, gj + dj))
        if (!cell) continue
        for (const v of cell) {
          if (v === u || shareChain(u, v)) continue
          const ex = (nodes[v][0] - ux) * kx
          const ey = (nodes[v][1] - uy) * ky
          const d2 = ex * ex + ey * ey
          if (d2 <= R2) cand.push([v, d2])
        }
      }
    }
    cand.sort((a, b) => a[1] - b[1])
    let n = 0
    for (const [v] of cand) {
      const key = edgeKey(u, v)
      if (connSeen.has(key)) continue
      connSeen.add(key)
      const dist = haversineKm(nodes[u], nodes[v])
      adj[u].push({ to: v, dist, type: 'tertiary', key, osmId: 0 })
      adj[v].push({ to: u, dist, type: 'tertiary', key, osmId: 0 })
      edges.push({ u, v, dist, type: 'tertiary', key, osmId: 0 })
      if (++n >= CONNECT_MAX) break
    }
    added += n
  }
  console.log('[路径规划] 连接边新增:', added)
}

// 计算连通分量(供吸附策略使用)
function computeComponents() {
  comp = new Int32Array(nodes.length).fill(-1)
  let cid = 0
  for (let i = 0; i < nodes.length; i++) {
    if (comp[i] >= 0) continue
    const q = [i]
    comp[i] = cid
    while (q.length) {
      const u = q.pop()
      for (const e of adj[u]) {
        if (comp[e.to] < 0) {
          comp[e.to] = cid
          q.push(e.to)
        }
      }
    }
    cid++
  }
  compSizes = new Array(cid).fill(0)
  for (let i = 0; i < nodes.length; i++) compSizes[comp[i]]++
}

async function ensureGraph() {
  if (built) return
  console.time('[路径规划] 建图')
  const roads = await getRoads()
  roads.features.forEach((f) => {
    const coords = f.geometry.coordinates
    const type = f.properties?.type
    const osmId = f.properties?.osm_id
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i]
      const b = coords[i + 1]
      const u = nodeIdOf(a[0], a[1], osmId)
      const v = nodeIdOf(b[0], b[1], osmId)
      if (u === v) continue
      const dist = haversineKm(a, b)
      const key = edgeKey(u, v)
      adj[u].push({ to: v, dist, type, key, osmId })
      adj[v].push({ to: u, dist, type, key, osmId })
      edges.push({ u, v, dist, type, key, osmId })
    }
  })
  connectNearbyNodes()
  computeComponents()
  built = true
  console.timeEnd('[路径规划] 建图')
  console.log('[路径规划] 节点', nodes.length, '边', edges.length, '主分量', compSizes[0] ? (compSizes.reduce((a, b) => Math.max(a, b)) / nodes.length * 100).toFixed(1) + '%' : '')
}

// 预计算事故附近(150m)的边集合(数据不变, 缓存一次)
// 用 150m 网格索引边中点, 仅对每个事故点 3×3 邻域内的边做精确判定 → 由数秒降到几十毫秒
async function ensureBlockedKeys() {
  if (blockedKeys) return
  if (!eventsCache) eventsCache = (await getEvents()).features
  console.time('[路径规划] 事故屏蔽边')
  const cellLat = 150 / 110540
  const cellLng = 150 / (111320 * Math.cos((30.5 * Math.PI) / 180))
  const grid = new Map() // 格key -> [[edgeIdx, mx, my], ...]
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]
    const mx = (nodes[e.u][0] + nodes[e.v][0]) / 2
    const my = (nodes[e.u][1] + nodes[e.v][1]) / 2
    const k = Math.floor(mx / cellLng) + ',' + Math.floor(my / cellLat)
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k).push([i, mx, my])
  }
  const R2 = 150 * 150
  blockedKeys = new Set()
  for (const f of eventsCache) {
    const [lng, lat] = f.geometry.coordinates
    const gi = Math.floor(lng / cellLng)
    const gj = Math.floor(lat / cellLat)
    const kx = 111320 * Math.cos((lat * Math.PI) / 180)
    const ky = 110540
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const cell = grid.get(gi + di + ',' + (gj + dj))
        if (!cell) continue
        for (const [idx, mx, my] of cell) {
          const dx = (mx - lng) * kx
          const dy = (my - lat) * ky
          if (dx * dx + dy * dy <= R2) blockedKeys.add(edges[idx].key)
        }
      }
    }
  }
  console.timeEnd('[路径规划] 事故屏蔽边')
  console.log('[路径规划] 事故屏蔽边数:', blockedKeys.size)
}

// 起终点吸附: 优先吸附到"大分量"最近节点(避免落在孤立小团), 否则最近节点
function snapToNode(lng, lat) {
  let abs = -1
  let absD = Infinity
  let big = -1
  let bigD = Infinity
  for (let i = 0; i < nodes.length; i++) {
    const d = (nodes[i][0] - lng) ** 2 + (nodes[i][1] - lat) ** 2
    if (d < absD) {
      absD = d
      abs = i
    }
    if (compSizes[comp[i]] >= SNAP_MIN_COMP_SIZE && d < bigD) {
      bigD = d
      big = i
    }
  }
  return big >= 0 ? big : abs
}

// 二叉最小堆
class MinHeap {
  constructor() {
    this.h = []
  }
  get size() {
    return this.h.length
  }
  push(item) {
    this.h.push(item)
    let i = this.h.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.h[p][0] <= this.h[i][0]) break
      ;[this.h[p], this.h[i]] = [this.h[i], this.h[p]]
      i = p
    }
  }
  pop() {
    const top = this.h[0]
    const last = this.h.pop()
    if (this.h.length) {
      this.h[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let m = i
        if (l < this.h.length && this.h[l][0] < this.h[m][0]) m = l
        if (r < this.h.length && this.h[r][0] < this.h[m][0]) m = r
        if (m === i) break
        ;[this.h[m], this.h[i]] = [this.h[i], this.h[m]]
        i = m
      }
    }
    return top
  }
}

// 预热: 提前构建路网图(避让事故时一并预计算屏蔽边), 避免首次点击卡顿
export function preloadRouteGraph() {
  return ensureGraph().then(() => ensureBlockedKeys())
}

/**
 * 求起点→终点的最优路径
 * @param {[number,number]} start [lng,lat]
 * @param {[number,number]} end [lng,lat]
 * @param {{ avoidAccidents?: boolean, hour?: number }} opts
 * @returns {null | { coordinates, distanceKm, timeMin, congestionIndex, avoidedAccidents }}
 */
export async function findRoute(start, end, opts = {}) {
  const { avoidAccidents = true, hour = 8 } = opts
  await ensureGraph()
  if (avoidAccidents) await ensureBlockedKeys()

  const startId = snapToNode(start[0], start[1])
  const endId = snapToNode(end[0], end[1])
  if (startId < 0 || endId < 0 || startId === endId) return null

  const gScore = new Map([[startId, 0]])
  const cameFrom = new Map()
  const closed = new Set()
  const heap = new MinHeap()
  heap.push([haversineKm(nodes[startId], nodes[endId]), startId])

  let found = false
  while (heap.size) {
    const [, cur] = heap.pop()
    if (closed.has(cur)) continue
    closed.add(cur)
    if (cur === endId) {
      found = true
      break
    }
    const g = gScore.get(cur)
    for (const e of adj[cur]) {
      if (closed.has(e.to)) continue
      let w = e.dist * congestionFactor(e.type, hour)
      if (avoidAccidents && blockedKeys.has(e.key)) w *= 100
      const tentative = g + w
      if (tentative < (gScore.get(e.to) ?? Infinity)) {
        gScore.set(e.to, tentative)
        cameFrom.set(e.to, { from: cur, type: e.type, dist: e.dist, key: e.key, osmId: e.osmId })
        const h = haversineKm(nodes[e.to], nodes[endId])
        heap.push([tentative + h, e.to])
      }
    }
  }
  if (!found) return null

  // 回溯路径与经过的边
  const path = []
  const routeEdges = []
  let cur = endId
  while (cur !== startId) {
    path.push(nodes[cur])
    const info = cameFrom.get(cur)
    routeEdges.push(info)
    cur = info.from
  }
  path.push(nodes[startId])
  path.reverse()
  routeEdges.reverse()

  // 统计
  const distanceKm = routeEdges.reduce((s, e) => s + e.dist, 0)
  const timeMin = routeEdges.reduce(
    (s, e) => s + (e.dist * congestionFactor(e.type, hour)) / (TYPE_SPEED[e.type] || 30) * 60,
    0,
  )
  const congSum = routeEdges.reduce((s, e) => s + e.dist * congestionOf(e.osmId, e.type, hour), 0)
  const congestionIndex = distanceKm ? congSum / distanceKm : 0
  const avoidedAccidents = routeEdges.filter((e) => blockedKeys.has(e.key)).length

  return {
    coordinates: path,
    distanceKm: +distanceKm.toFixed(2),
    timeMin: Math.round(timeMin),
    congestionIndex: +congestionIndex.toFixed(1),
    avoidedAccidents,
  }
}


