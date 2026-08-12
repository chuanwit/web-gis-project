// 数据请求→缓存→降级 统一工具
// 借鉴参考6(热环境)的"智能状态降级, 单一数据源故障不影响核心功能"
// 策略: 请求成功→缓存; 失败→用缓存; 无缓存→空数据+降级标记(不抛错)
import { getCityBuildings, getRoads, getEvents } from '@/api'

// 内存缓存(模块级, 跨组件共享)
const cache = {
  buildings: null,
  roads: null,
  events: null,
}

// 降级用的空 GeoJSON(保证下游 .features 不报错)
const emptyFC = () => ({ type: 'FeatureCollection', features: [] })

// 带降级的请求: 成功缓存; 失败回退缓存; 都没有回退空数据
async function withFallback(key, fetcher) {
  try {
    const data = await fetcher()
    cache[key] = data
    return { data, degraded: false }
  } catch (e) {
    console.warn(`[dataFallback] ${key} 请求失败, 使用${cache[key] ? '缓存' : '空数据'}兜底:`, e?.message || e)
    if (cache[key]) return { data: cache[key], degraded: true }
    return { data: emptyFC(), degraded: true }
  }
}

export async function fetchBuildings() {
  return withFallback('buildings', getCityBuildings)
}
export async function fetchRoads() {
  return withFallback('roads', getRoads)
}
export async function fetchEvents() {
  return withFallback('events', getEvents)
}

// 资源/区域数据走独立 mock 接口(在 mock/index.js 注册)
export async function fetchRegions() {
  return withFallback('regions', async () => {
    const res = await import('@/api/regions.js').then((m) => m.getRegions())
    return res
  })
}
export async function fetchResources() {
  return withFallback('resources', async () => {
    const res = await import('@/api/regions.js').then((m) => m.getResources())
    return res
  })
}

export function getCached(key) {
  return cache[key] || null
}
