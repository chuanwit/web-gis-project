// 生成区域多边形 + 应急资源数据(基于现有 events 数据派生)
// 用法: node scripts/gen-regions-resources.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mockDir = path.resolve(__dirname, '../mock')

const events = JSON.parse(
  fs.readFileSync(path.join(mockDir, 'Wuhan_events.json'), 'utf-8'),
)

// 按区域分组
const groups = {}
for (const f of events.features) {
  const area = f.properties.area
  if (!groups[area]) groups[area] = []
  groups[area].push(f)
}

// 为每个区域计算 bbox + padding, 生成矩形多边形
const pad = 0.008 // ~800m padding
const regions = {
  type: 'FeatureCollection',
  features: [],
}

// 区域元信息(给区域加个有意义的名称)
const AREA_META = {
  区域1: { name: '光谷核心区', desc: '高新产业聚集, 通勤流量大' },
  区域2: { name: '流芳科教区', desc: '高校密集, 人车混行' },
  区域3: { name: '南湖居住区', desc: '大型居住社区, 潮汐交通' },
  区域4: { name: '关山商贸区', desc: '商圈密集, 停车需求高' },
  区域5: { name: '珞喻联络区', desc: '主干道交汇, 过境车流' },
}

// 风险等级映射(根据事件数 + 平均等级)
function riskScore(count, avgLevel) {
  // 综合分: 事件数权重 0.6 + 等级权重 0.4, 归一到 0-10
  const raw = count * 0.6 + avgLevel * 1.5
  return Math.min(10, +raw.toFixed(2))
}

const regionStats = {}

Object.keys(groups)
  .sort((a, b) => a.localeCompare(b, 'zh'))
  .forEach((area) => {
    const feats = groups[area]
    const lons = feats.map((f) => f.geometry.coordinates[0])
    const lats = feats.map((f) => f.geometry.coordinates[1])
    const minLon = Math.min(...lons) - pad
    const maxLon = Math.max(...lons) + pad
    const minLat = Math.min(...lats) - pad
    const maxLat = Math.max(...lats) + pad
    const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2]

    // 类型分布
    const typeDist = {}
    let levelSum = 0
    feats.forEach((f) => {
      const t = f.properties.name
      typeDist[t] = (typeDist[t] || 0) + 1
      levelSum += f.properties.level
    })
    const avgLevel = +(levelSum / feats.length).toFixed(2)
    const score = riskScore(feats.length, avgLevel)

    const meta = AREA_META[area] || { name: area, desc: '' }

    regions.features.push({
      type: 'Feature',
      properties: {
        area,
        name: meta.name,
        desc: meta.desc,
        eventCount: feats.length,
        avgLevel,
        riskScore: score,
        typeDist,
        center,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat],
          ],
        ],
      },
    })

    regionStats[area] = { center, eventCount: feats.length, riskScore: score }
  })

// 生成应急资源点(医院/消防/交警) - 每个区域 2-3 个, 围绕中心散布
const RESOURCE_TYPES = [
  { type: 'hospital', name: '医院', capacityField: 'beds' },
  { type: 'fire', name: '消防站', capacityField: 'vehicles' },
  { type: 'police', name: '交警队', capacityField: 'officers' },
]

const RES_NAMES = {
  hospital: ['中心医院', '人民医院', '协和医院', '同济医院', '中医院'],
  fire: ['消防救援站', '特勤消防站', '消防中队'],
  police: ['交警大队', '交通中队', '执勤点'],
}

const resources = {
  type: 'FeatureCollection',
  features: [],
}

let resId = 1
Object.keys(regionStats)
  .sort((a, b) => a.localeCompare(b, 'zh'))
  .forEach((area) => {
    const { center } = regionStats[area]
    // 每区域 3 个资源(每种类型一个), 围绕中心偏移
    RESOURCE_TYPES.forEach((rt, i) => {
      const angle = (i / 3) * Math.PI * 2 + (resId % 7) * 0.3
      const dist = 0.006 + (resId % 3) * 0.002
      const lon = +(center[0] + Math.cos(angle) * dist).toFixed(6)
      const lat = +(center[1] + Math.sin(angle) * dist).toFixed(6)
      const nameList = RES_NAMES[rt.type]
      const name = nameList[resId % nameList.length]
      resources.features.push({
        type: 'Feature',
        properties: {
          id: 'R' + String(resId).padStart(4, '0'),
          type: rt.type,
          typeName: rt.name,
          name: `${area}-${name}`,
          area,
          capacity: 20 + (resId * 7) % 80,
          serviceRadius: rt.type === 'hospital' ? 1500 : 1200, // 米
        },
        geometry: { type: 'Point', coordinates: [lon, lat] },
      })
      resId++
    })
  })

fs.writeFileSync(
  path.join(mockDir, 'Wuhan_regions.json'),
  JSON.stringify(regions, null, 2),
  'utf-8',
)
fs.writeFileSync(
  path.join(mockDir, 'Wuhan_resources.json'),
  JSON.stringify(resources, null, 2),
  'utf-8',
)

console.log(`Generated ${regions.features.length} regions, ${resources.features.length} resources`)
console.log('Regions:')
regions.features.forEach((f) => {
  console.log(
    `  ${f.properties.area}(${f.properties.name}): events=${f.properties.eventCount} risk=${f.properties.riskScore} center=[${f.properties.center[0]},${f.properties.center[1]}]`,
  )
})
