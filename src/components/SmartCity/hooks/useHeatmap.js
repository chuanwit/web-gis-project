// 扩展功能 1: 事故热力图(HeatmapLayer 展示事故发生率)
// 数据源为事故事件点, 因原始点较稀疏(几十条), 围绕每个事件抖动生成密集近邻点,
// 使热力分布平滑可读, 直观呈现事故高发区域(蓝→黄→红渐变)
import { getEvents } from '@/api'
import { HeatmapLayer } from '@antv/l7'

export default async () => {
  // 获取事故事件数据(FeatureCollection)
  const { features = [] } = await getEvents()

  // 每个事件点抖动生成 8 个近邻点(value 1~5 表示发生强度), 合计约几百点
  const densePoints = features.flatMap((feature) => {
    const [lng, lat] = feature.geometry.coordinates
    const clones = []
    for (let i = 0; i < 8; i++) {
      clones.push({
        type: 'Feature',
        properties: {
          value: 1 + Math.random() * 4, // 热力权重
        },
        geometry: {
          type: 'Point',
          // ±0.002° 约为 200 米, 围绕事故点形成聚集热斑
          coordinates: [
            lng + (Math.random() - 0.5) * 0.004,
            lat + (Math.random() - 0.5) * 0.004,
          ],
        },
      })
    }
    return clones
  })

  // 创建热力图层
  const heatmap_layer = new HeatmapLayer({
    name: '事故热力图',
    zIndex: 2, // 位于道路(0)之上、散点(3)之下
  })

  heatmap_layer
    .source({
      type: 'FeatureCollection',
      features: densePoints,
    })
    .shape('heatmap') // 热力图形状
    .size('value', [0, 1]) // 以 value 字段作为热力权重
    .style({
      intensity: 6, // 热力强度
      radius: 18, // 热力半径
      opacity: 0.6, // 整体透明度
      rampColors: {
        colors: ['#2B8A3E', '#FDDA0D', '#FF4D4D'], // 低→中→高热力颜色
        positions: [0, 0.5, 1.0],
      },
    })

  return heatmap_layer
}
