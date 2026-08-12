// 数据缓存 store: 建筑/道路/事件/区域/资源
// 统一加载 + 降级标记, 单源失败不致命
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import {
  fetchBuildings,
  fetchRoads,
  fetchEvents,
  fetchRegions,
  fetchResources,
} from '@/utils/dataFallback'

export const useDataStore = defineStore('data', () => {
  const buildings = ref(null)
  const roads = ref(null)
  const events = ref(null)
  const regions = ref(null)
  const resources = ref(null)

  // 各数据源降级标记(true=该源失败, 用了兜底)
  const degraded = reactive({
    buildings: false,
    roads: false,
    events: false,
    regions: false,
    resources: false,
  })

  const loaded = reactive({
    buildings: false,
    roads: false,
    events: false,
    regions: false,
    resources: false,
  })

  async function loadBuildings() {
    const { data, degraded: dg } = await fetchBuildings()
    buildings.value = data
    degraded.buildings = dg
    loaded.buildings = true
    return data
  }
  async function loadRoads() {
    const { data, degraded: dg } = await fetchRoads()
    roads.value = data
    degraded.roads = dg
    loaded.roads = true
    return data
  }
  async function loadEvents() {
    const { data, degraded: dg } = await fetchEvents()
    events.value = data
    degraded.events = dg
    loaded.events = true
    return data
  }
  async function loadRegions() {
    const { data, degraded: dg } = await fetchRegions()
    regions.value = data
    degraded.regions = dg
    loaded.regions = true
    return data
  }
  async function loadResources() {
    const { data, degraded: dg } = await fetchResources()
    resources.value = data
    degraded.resources = dg
    loaded.resources = true
    return data
  }

  // 并行加载所有数据
  async function loadAll() {
    await Promise.all([
      loadBuildings(),
      loadRoads(),
      loadEvents(),
      loadRegions(),
      loadResources(),
    ])
  }

  // 派生: 区域风险排行(按 riskScore 降序)
  function regionRiskRanking() {
    if (!regions.value) return []
    return [...regions.value.features]
      .map((f) => ({
        area: f.properties.area,
        name: f.properties.name,
        riskScore: f.properties.riskScore,
        eventCount: f.properties.eventCount,
        avgLevel: f.properties.avgLevel,
        center: f.properties.center,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
  }

  // 派生: 事件类型分布
  function eventTypeDist() {
    if (!events.value) return []
    const dist = {}
    events.value.features.forEach((f) => {
      const t = f.properties.name
      dist[t] = (dist[t] || 0) + 1
    })
    return Object.entries(dist).map(([type, count]) => ({ type, count }))
  }

  return {
    buildings,
    roads,
    events,
    regions,
    resources,
    degraded,
    loaded,
    loadBuildings,
    loadRoads,
    loadEvents,
    loadRegions,
    loadResources,
    loadAll,
    regionRiskRanking,
    eventTypeDist,
  }
})


