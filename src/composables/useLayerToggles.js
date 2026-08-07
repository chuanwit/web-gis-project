// 扩展图层开关的共享状态(模块级单例: 各组件引用同一 reactive 对象, 一处改动全局同步)
// heatmap: 事故热力图 | scatter: 散点动图(替代雷达/玫瑰图) | model3d: 三维园区厂房
import { reactive } from 'vue'

const toggles = reactive({
  heatmap: false,
  scatter: true, // 替代原雷达图, 默认开启
  model3d: false,
})

// 提供给 Footer 开关按钮与 SmartCity 图层管理使用
export function useLayerToggles() {
  return toggles
}
