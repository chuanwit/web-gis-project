// 回归测试: 用 stub 替换 @/api, 运行真实 routeGraph.js 的 findRoute, 验证跨城路径
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..', '..')

// 1. 读取真实 routeGraph.js, 替换 @/api 导入 → 本地 stub
let src = readFileSync(join(root, 'src', 'utils', 'routeGraph.js'), 'utf-8')
src = src.replace(
  "import { getRoads, getEvents } from '@/api'",
  "import { getRoads, getEvents } from './stub-api.mjs'",
)
const tmp = join(__dir, '_routeGraph.test.mjs')
writeFileSync(tmp, src)

// 2. 加载事件坐标作为测试点
const events = JSON.parse(
  readFileSync(join(root, 'mock', 'Wuhan_events.json'), 'utf-8'),
).features
const pts = events.map((f) => f.geometry.coordinates)

const { findRoute } = await import(pathToFileURL(tmp).href)

// 3. 测试组合: [起点, 终点, 标签]
const cases = [
  [[114.3, 30.5], pts[10], '市中心 → 事件10'],
  [pts[0], pts[25], '事件0 → 事件25'],
  [pts[8], pts[40], '事件8 → 事件40'],
  [pts[30], pts[3], '事件30 → 事件3'],
]

console.log('\n===== 路径回归测试(8:00 早高峰, 避让事故) =====')
let pass = 0
for (const [s, e, label] of cases) {
  const t0 = Date.now()
  const r = await findRoute(s, e, { avoidAccidents: true, hour: 8 })
  const ms = Date.now() - t0
  if (r) {
    pass++
    console.log(
      `✓ ${label}  距离 ${r.distanceKm}km  耗时 ${r.timeMin}分  拥堵 ${r.congestionIndex}  绕行事故 ${r.avoidedAccidents}  路径点数 ${r.coordinates.length}  (${ms}ms)`,
    )
  } else {
    console.log(`✗ ${label}  返回 null (${ms}ms)`)
  }
}

console.log('\n===== 事故绕行对比(扫描事件点对, 找出避让生效的例子) =====')
let detourDemo = null
for (let i = 0; i < pts.length && !detourDemo; i++) {
  for (let j = i + 1; j < pts.length; j += 7) {
    const [ra, rb] = await Promise.all([
      findRoute(pts[i], pts[j], { avoidAccidents: true, hour: 8 }),
      findRoute(pts[i], pts[j], { avoidAccidents: false, hour: 8 }),
    ])
    if (ra && rb && ra.coordinates.length !== rb.coordinates.length) {
      detourDemo = { i, j, ra, rb }
      break
    }
  }
}
if (detourDemo) {
  const { i, j, ra, rb } = detourDemo
  console.log(`发现避让差异: 事件${i} → 事件${j}`)
  console.log(
    `  避让=是  距离 ${ra.distanceKm}km  耗时 ${ra.timeMin}分  绕行事故 ${ra.avoidedAccidents}  路径点数 ${ra.coordinates.length}`,
  )
  console.log(
    `  避让=否  距离 ${rb.distanceKm}km  耗时 ${rb.timeMin}分  绕行事故 ${rb.avoidedAccidents}  路径点数 ${rb.coordinates.length}`,
  )
} else {
  console.log('  未发现差异(所有样本都自然避开事故区)')
}

console.log(`\n结果: ${pass}/${cases.length} 条路径成功`)
process.exit(pass === cases.length ? 0 : 1)
