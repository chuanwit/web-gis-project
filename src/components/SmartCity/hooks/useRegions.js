// 区域多边形图层(业务模块: 风险诊断/资源可达/情景推演共用)
// 借鉴参考4(华农)的 GeoJSON 挤出建模, 参考6(热环境)的区域动画
// 按 riskScore 挤出高度 + 着色, 直观呈现各片区风险等级
import { getRegions } from '@/api/regions'
import { PolygonLayer, LineLayer } from '@antv/l7'

// 风险配色: 低(绿)→中(黄)→高(红)
const RISK_COLORS = ['#2ecc40', '#ffd700', '#ff8c00', '#ff4d4d']

let regionLayer = null
let regionOutline = null
let regionsData = null

// 构建区域填充图层(挤出高度按 riskScore)
async function buildLayers() {
  if (!regionsData) regionsData = await getRegions()

  // 1. 区域填充(挤出)
  regionLayer = new PolygonLayer({
    name: '武汉市区域',
    zIndex: 1,
    depth: true,
  })
  regionLayer
    .source(regionsData)
    .shape('extrude') // 3D 挤出
    .size('riskScore', (v) => Math.max(200, v * 120)) // 风险越高, 挤出越高
    .color('riskScore', RISK_COLORS)
    .style({
      opacity: 0.55,
      pickLight: true,
    })
    .active({ color: '#00e5ff', mix: 0.6 })
    .filter('riskScore', (v) => v >= 0)

  // 2. 区域边线(高亮轮廓)
  regionOutline = new LineLayer({
    name: '武汉市区域边线',
    zIndex: 2,
  })
  regionOutline
    .source(regionsData)
    .shape('line')
    .size(1.5)
    .color('#00e5ff')
    .style({ opacity: 0.8 })

  return [regionLayer, regionOutline]
}

export default async () => {
  const layers = await buildLayers()
  return layers
}

// 按业务模块切换显隐: 仅在 risk/resource/simulation 模块显示区域图层
export function setRegionsVisible(scene, visible) {
  if (!scene) return
  if (regionLayer) {
    visible ? regionLayer.show() : regionLayer.hide()
  }
  if (regionOutline) {
    visible ? regionOutline.show() : regionOutline.hide()
  }
}

// 高亮选中区域(其他区域降低透明度) - 通过 filter 实现
export function highlightRegion(scene, area) {
  if (!regionLayer) return
  if (!area) {
    regionLayer.filter('area', () => true)
  } else {
    regionLayer.filter('area', (v) => v === area)
  }
}

// 获取区域数据(供 UI 排行榜使用)
export async function getRegionsData() {
  if (!regionsData) regionsData = await getRegions()
  return regionsData
}


