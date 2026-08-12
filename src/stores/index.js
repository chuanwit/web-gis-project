// Pinia 状态中枢入口
// 统一管理: 地图实例 / 时间轴 / 图层开关 / 业务模块 / AI 对话 / 数据缓存
// 取代原模块级 reactive 单例, 支持 devtools 调试与跨组件联动
import { createPinia } from 'pinia'

export const pinia = createPinia()

export * from './map'
export * from './time'
export * from './layers'
export * from './business'
export * from './ai'
export * from './data'
