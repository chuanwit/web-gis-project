// 飞线辐射图层: 武汉中心 → 5 区域弧线飞行动画
// 借鉴参考4(华农)的飞线辐射动画, L7 LineLayer + arc 形状 + animate
// 综合态势模块下展示, 直观呈现城市核心对各片区的辐射关系
import { getRegions } from '@/api/regions'
import { LineLayer, PointLayer } from '@antv/l7'

// 城市中心点(与 MODULE_VIEWS.overview.center 一致)
const CITY_CENTER = [114.3, 30.5]

// 风险配色: 低→高 渐变(用于飞线着色, 区分辐射强度)
const FLY_COLORS = ['#00e5ff', '#7fd6ff', '#ffd700', '#ff8c00', '#ff4d4d']

let flylineLayer = null
let endpointLayer = null
let centerLayer = null

export default async () => {
  const regionsData = await getRegions()

  // 1. 飞线数据: 中心 → 每个区域中心(GeoJSON LineString, 两点成弧)
  const lineFeatures = regionsData.features.map((f) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [CITY_CENTER, f.properties.center],
    },
    properties: {
      name: f.properties.name,
      riskScore: f.properties.riskScore,
      area: f.properties.area,
    },
  }))

  // 飞线图层(arc 弧线 + 流动动画)
  flylineLayer = new LineLayer({
    name: '飞线辐射',
    zIndex: 5,
    blend: 'normal',
  })
  flylineLayer
    .source({
      type: 'FeatureCollection',
      features: lineFeatures,
    })
    .shape('arc') // 弧线形状(L7 自动用三点贝塞尔生成弧度)
    .size('riskScore', [1, 2.5]) // 风险越高, 飞线越粗
    .color('riskScore', FLY_COLORS)
    .animate({
      enable: true,
      duration: 4, // 一条飞线完整流动周期(秒)
      interval: 0.4, // 飞线间隔
      trailLength: 0.6, // 拖尾长度
    })
    .style({
      opacity: 0.85,
    })

  // 2. 终点脉冲点(区域中心波纹扩散)
  endpointLayer = new PointLayer({
    name: '飞线终点',
    zIndex: 6,
  })
  endpointLayer
    .source(regionsData)
    .shape('circle')
    .size(10)
    .color('riskScore', FLY_COLORS)
    .animate({
      enable: true,
      type: 'wave', // 水波扩散脉冲动效
      speed: 0.5,
      rings: 2,
    })
    .style({
      opacity: 0.8,
    })

  // 3. 中心点(城市核心, 稍大的脉冲)
  centerLayer = new PointLayer({
    name: '城市中心',
    zIndex: 7,
  })
  centerLayer
    .source({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: '武汉核心' },
          geometry: { type: 'Point', coordinates: CITY_CENTER },
        },
      ],
    })
    .shape('circle')
    .size(14)
    .color('#00e5ff')
    .animate({
      enable: true,
      type: 'wave',
      speed: 0.4,
      rings: 3,
    })
    .style({
      opacity: 0.9,
    })

  return [flylineLayer, endpointLayer, centerLayer]
}

// 按业务模块切换显隐: 仅综合态势(overview)模块显示飞线
export function setFlylineVisible(scene, visible) {
  if (!scene) return
  if (flylineLayer) visible ? flylineLayer.show() : flylineLayer.hide()
  if (endpointLayer) visible ? endpointLayer.show() : endpointLayer.hide()
  if (centerLayer) visible ? centerLayer.show() : centerLayer.hide()
}
