// vite-plugin-mock 配置: 拦截 /api 接口, 返回同目录下的模拟数据
// 注意: 使用 CommonJS 形式, 兼容 vite-plugin-mock 内置 esbuild 打包(mock 文件在 Node 环境运行)
const fs = require('fs')
const path = require('path')

// 数据目录(mock 目录, 与 JSON 数据同目录)
const dataDir = __dirname

// 懒加载 JSON 数据
const readJSON = (name) =>
  JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf-8'))

module.exports = [
  {
    // 武汉城市建筑数据
    url: '/api/wuhan_buildings',
    method: 'get',
    response: () => readJSON('Wuhan_Buildings.json'),
  },
  {
    // 武汉道路数据
    url: '/api/wuhan_roads',
    method: 'get',
    response: () => readJSON('Wuhan_roads.json'),
  },
  {
    // 武汉交通事件数据
    url: '/api/wuhan_events',
    method: 'get',
    response: () => readJSON('Wuhan_events.json'),
  },
  {
    // AI 智能分析: 基于事故特征(类型/等级/区域/时段)规则生成分析建议
    // 地点定位: 找距事故点最近的道路名(按 event_id 懒缓存); 建议由类型+时段+等级规则拼接
    url: '/api/ai_analysis',
    method: 'post',
    response: ({ body = {} }) => {
      const { event_id, hour = 8 } = body
      const events = readJSON('Wuhan_events.json').features
      const feature =
        events.find((f) => String(f.properties.id) === String(event_id)) ||
        events[0]
      const { name, level, area } = feature.properties
      const [lng, lat] = feature.geometry.coordinates

      const location = nearestRoadName(lng, lat)
      const analysis = buildAnalysis(name, level, hour)

      return {
        location,
        area,
        type: name,
        level,
        time: pad2(hour) + ':00',
        analysis,
      }
    },
  },
]

// ---------- AI 分析规则(CommonJS 工具函数) ----------

const pad2 = (n) => String(n).padStart(2, '0')

// 事故类型 → 处置建议(每条独立成句)
const TYPE_ADVICE = {
  交通拥堵: ['建议开启交通分流, 诱导周边车辆绕行主干道', '建议联动信号灯优化配时, 疏导积压车流'],
  追尾: ['建议开启交通分流, 引导后车减速变道', '建议加强该路段警示与监控抓拍'],
  碰撞: ['建议交警尽快到场处置, 启动快处快赔流程', '建议临时封闭内侧车道, 引导车辆绕行'],
  刮擦: ['属轻微事故, 建议双方拍照取证后快速撤离', '建议加强该路段监控巡查与警示'],
  车辆故障: ['建议调度拖车清障, 保障道路通畅', '建议提醒后方车辆提前变道避让'],
}

// 事故等级(1-3) → 预计恢复时间(分钟)
const RECOVER_MINUTES = { 1: 10, 2: 20, 3: 30 }

function buildAnalysis(name, level, hour) {
  const items = []
  // 1. 环境提示(类型相关)
  if (name === '追尾' || name === '碰撞') {
    items.push('周边学校/商圈较多, 人车混行风险较高')
  } else if (name === '交通拥堵') {
    items.push('该路段车流量接近饱和, 通行压力集中')
  } else {
    items.push('该区域交通流量平稳, 需防范二次事故')
  }
  // 2. 时段判断
  if (hour >= 7 && hour <= 9) {
    items.push('当前属于早高峰(07-09时), 建议错峰出行')
  } else if (hour >= 17 && hour <= 19) {
    items.push('当前属于晚高峰(17-19时), 建议错峰出行')
  } else {
    items.push('当前处于平峰时段, 交通流整体平稳')
  }
  // 3. 处置建议(类型相关)
  items.push(...(TYPE_ADVICE[name] || ['建议加强现场疏导']))
  // 4. 预计恢复时间(等级相关)
  items.push(`预计${RECOVER_MINUTES[level] || 15}分钟恢复通行`)
  return items
}

// ---------- 最近道路定位(懒缓存) ----------

let _roadsCache = null

// 点到线段最近距离(近似平面距离, 单位: 经纬度度数的缩放米)
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

// 道路线到点的最短距离(经度方向按 cos(lat) 折算, 得到近似米)
function roadDistToPoint(coords, lng, lat) {
  const kx = Math.cos((lat * Math.PI) / 180) * 111320 // 每度经度≈米
  const ky = 110540 // 每度纬度≈米
  let min = Infinity
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i]
    const b = coords[i + 1]
    const d = distToSegment(
      lng * kx,
      lat * ky,
      a[0] * kx,
      a[1] * ky,
      b[0] * kx,
      b[1] * ky,
    )
    if (d < min) min = d
  }
  return min
}

// 找距事件点最近的道路名(跳过空名), 结果按 event_id 缓存
function nearestRoadName(lng, lat) {
  if (!_roadsCache) _roadsCache = readJSON('Wuhan_roads.json').features
  let best = { dist: Infinity, name: '' }
  for (const road of _roadsCache) {
    const nm = road.properties && road.properties.name
    if (!nm) continue
    const d = roadDistToPoint(road.geometry.coordinates, lng, lat)
    if (d < best.dist) {
      best = { dist: d, name: nm }
    }
  }
  return best.name || ''
}