// 扩展功能 2: 散点动图(PointLayer + shape('circle') + animate 替代雷达/玫瑰图)
// 将交通事故点渲染为扩散波纹脉冲的散点, 按事件类型着色, 视觉上替代原 G2 玫瑰图
import { getEvents } from '@/api'
import { PointLayer } from '@antv/l7'

// 事件类型 -> 颜色
const EVENT_COLORS = [
  '#FF4D4D', // 交通拥堵
  '#FFB84C', // 碰撞
  '#FDDA0D', // 追尾
  '#36CFC9', // 刮擦
  '#9254DE', // 车辆故障
]

export default async () => {
  // 获取事故事件数据(FeatureCollection, Point)
  const events_data = await getEvents()

  // 创建散点图层
  const scatter_layer = new PointLayer({
    name: '实时事件散点',
    zIndex: 3,
  })

  scatter_layer
    .source(events_data)
    .size('level', [5, 16]) // 事件等级(1~3)映射为点半径
    .shape('circle') // 圆形散点
    .color('name', EVENT_COLORS) // 按事件类型着色
    .animate({
      enable: true,
      type: 'wave', // 水波扩散脉冲动效
      speed: 0.6, // 扩散速度
      rings: 3, // 波纹圈数
    })
    .style({
      opacity: 0.85,
    })

  return scatter_layer
}
