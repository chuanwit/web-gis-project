// 业务模块状态: 顶部业务导航 + 选中区域/事故 + 情景推演策略
// 借鉴参考6(热环境)的"态势感知→风险诊断→资源可达→情景推演→成果输出"业务闭环
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

export const BUSINESS_MODULES = [
  { key: 'overview', label: '综合态势', icon: 'monitor' },
  { key: 'risk', label: '交通风险诊断', icon: 'heat' },
  { key: 'resource', label: '应急资源可达', icon: 'hospital' },
  { key: 'simulation', label: '情景推演优化', icon: 'route' },
]

// 各业务模块对应的地图视角(飞行参数)
export const MODULE_VIEWS = {
  overview: { center: [114.3, 30.5], zoom: 14, pitch: 70, duration: 1500 },
  risk: { center: [114.4286, 30.4698], zoom: 14, pitch: 60, duration: 1500 },
  resource: { center: [114.3, 30.5], zoom: 13, pitch: 55, duration: 1500 },
  simulation: { center: [114.4286, 30.4698], zoom: 14, pitch: 60, duration: 1500 },
}

// 情景推演策略定义
export const SIM_STRATEGIES = [
  { key: 'signal', label: '信号灯优化配时', desc: '联动周边路口信号, 绿波疏导' },
  { key: 'diversion', label: '交通分流绕行', desc: '诱导车辆绕行主干道' },
  { key: 'ambulance', label: '救护资源调度', desc: '就近调度急救资源到达现场' },
  { key: 'restriction', label: '临时限行管制', desc: '封闭内侧车道, 限制驶入' },
]

export const useBusinessStore = defineStore('business', () => {
  // 当前业务模块
  const module = ref('overview')
  // 选中的区域(区域1-5 或 null)
  const selectedArea = ref(null)
  // 选中的事故 id
  const selectedEventId = ref(null)
  // 情景推演: 策略勾选状态
  const strategies = reactive({
    signal: false,
    diversion: false,
    ambulance: false,
    restriction: false,
  })
  // 是否已运行模拟(触发地图高亮+指标更新)
  const simulationRun = ref(false)
  // 模拟后预估指标变化(由 runSimulation 计算填充)
  const simulationResult = ref(null)

  function setModule(key) {
    module.value = key
    // 切换模块时清空模拟状态
    simulationRun.value = false
    simulationResult.value = null
  }

  function selectArea(area) {
    selectedArea.value = selectedArea.value === area ? null : area
  }

  function selectEvent(id) {
    selectedEventId.value = id
  }

  function toggleStrategy(key) {
    if (key in strategies) {
      strategies[key] = !strategies[key]
      // 勾选变化时清除上次模拟结果(需重新运行)
      simulationRun.value = false
      simulationResult.value = null
    }
  }

  function runSimulation(baseMetrics) {
    // baseMetrics: { riskIndex, congestion, coverage, recoverMinutes }
    const active = Object.keys(strategies).filter((k) => strategies[k])
    if (active.length === 0) {
      simulationResult.value = null
      simulationRun.value = false
      return
    }
    const b = baseMetrics || { riskIndex: 7.5, congestion: 8, coverage: 62, recoverMinutes: 30 }
    // 每个策略的边际效应(简化模型)
    const effect = {
      signal: { risk: -0.6, congestion: -1.2, recover: -4 },
      diversion: { risk: -0.8, congestion: -1.8, recover: -6 },
      ambulance: { risk: -0.4, congestion: -0.2, recover: -3, coverage: +8 },
      restriction: { risk: -0.5, congestion: -0.6, recover: -2 },
    }
    let dRisk = 0, dCong = 0, dRec = 0, dCov = 0
    active.forEach((k) => {
      const e = effect[k]
      dRisk += e.risk || 0
      dCong += e.congestion || 0
      dRec += e.recover || 0
      dCov += e.coverage || 0
    })
    simulationResult.value = {
      strategies: active,
      before: { ...b },
      after: {
        riskIndex: +(b.riskIndex + dRisk).toFixed(2),
        congestion: +(b.congestion + dCong).toFixed(2),
        coverage: Math.min(100, +(b.coverage + dCov).toFixed(1)),
        recoverMinutes: Math.max(5, b.recoverMinutes + dRec),
      },
      deltas: {
        risk: +dRisk.toFixed(2),
        congestion: +dCong.toFixed(2),
        coverage: +dCov.toFixed(1),
        recover: dRec,
      },
    }
    simulationRun.value = true
  }

  function resetSimulation() {
    Object.keys(strategies).forEach((k) => (strategies[k] = false))
    simulationRun.value = false
    simulationResult.value = null
  }

  return {
    module,
    selectedArea,
    selectedEventId,
    strategies,
    simulationRun,
    simulationResult,
    setModule,
    selectArea,
    selectEvent,
    toggleStrategy,
    runSimulation,
    resetSimulation,
  }
})
