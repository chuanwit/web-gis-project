<template>
  <ChartCard title="推演预估与模拟">
    <!-- 未选策略提示 -->
    <div v-if="!hasStrategy" class="empty-tip">
      <div class="tip-icon">◆</div>
      <div class="tip-text">请勾选左侧处置策略<br/>查看预估指标变化</div>
    </div>

    <template v-else>
      <!-- 预估指标对比 -->
      <div class="metrics">
        <div v-for="m in metrics" :key="m.label" class="metric-row">
          <span class="m-label">{{ m.label }}</span>
          <span class="m-before num-mono">{{ m.before }}</span>
          <span class="m-arrow" :class="m.good ? 'good' : 'bad'">{{ m.arrow }}</span>
          <span class="m-after num-mono" :class="m.good ? 'good' : 'bad'">{{ m.after }}</span>
        </div>
      </div>

      <!-- 运行模拟按钮 -->
      <button class="run-btn" :class="{ ran: business.simulationRun }" @click="runSim">
        <span class="run-icon">{{ business.simulationRun ? '↻' : '▶' }}</span>
        {{ business.simulationRun ? '重新模拟' : '运行模拟' }}
      </button>
      <div v-if="business.simulationRun" class="sim-status">
        ✓ 模拟已运行, 地图已更新目标片区降温/降险效果
      </div>
    </template>
  </ChartCard>
</template>
<script setup>
// 推演预估: 勾选策略实时计算指标变化, 运行模拟触发地图更新
import { computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import { useBusinessStore, useDataStore } from '@/stores'

const business = useBusinessStore()
const dataStore = useDataStore()

const hasStrategy = computed(() =>
  Object.values(business.strategies).some(Boolean),
)

// 基于选中区域的基础指标(未选则用最高风险区域)
const baseMetrics = computed(() => {
  const ranking = dataStore.regionRiskRanking()
  const r = ranking.find((x) => x.area === business.selectedArea) || ranking[0]
  return {
    riskIndex: r?.riskScore || 7.5,
    congestion: +(r?.riskScore * 0.8 || 6).toFixed(2),
    coverage: 62,
    recoverMinutes: 30,
  }
})

// 实时预估(不触发 simulationRun, 仅预览)
const preview = computed(() => {
  if (!hasStrategy.value) return null
  // 复用 store 的计算逻辑但不写入(临时算一份)
  const b = baseMetrics.value
  const active = Object.keys(business.strategies).filter((k) => business.strategies[k])
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
  return {
    risk: { before: b.riskIndex, after: +(b.riskIndex + dRisk).toFixed(2), delta: dRisk, good: dRisk < 0 },
    congestion: { before: b.congestion, after: +(b.congestion + dCong).toFixed(2), delta: dCong, good: dCong < 0 },
    coverage: { before: b.coverage, after: Math.min(100, +(b.coverage + dCov).toFixed(1)), delta: dCov, good: dCov > 0 },
    recover: { before: b.recoverMinutes, after: Math.max(5, b.recoverMinutes + dRec), delta: dRec, good: dRec < 0 },
  }
})

const metrics = computed(() => {
  if (!preview.value) return []
  const p = preview.value
  return [
    { label: '风险指数', before: p.risk.before, after: p.risk.after, arrow: '→', good: p.risk.good },
    { label: '拥堵指数', before: p.congestion.before, after: p.congestion.after, arrow: '→', good: p.congestion.good },
    { label: '覆盖率(%)', before: p.coverage.before, after: p.coverage.after, arrow: '→', good: p.coverage.good },
    { label: '恢复(min)', before: p.recover.before, after: p.recover.after, arrow: '→', good: p.recover.good },
  ]
})

function runSim() {
  business.runSimulation(baseMetrics.value)
}
</script>
<style scoped>
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--t-dim, #5f7896);
  text-align: center;
  gap: 12px;
}
.tip-icon {
  font-size: 32px;
  color: var(--c-accent, #00e5ff);
  opacity: 0.5;
}
.tip-text {
  font-size: 13px;
  line-height: 1.8;
}
.metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}
.metric-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(16, 32, 56, 0.4);
  border-radius: 4px;
  border: 1px solid rgba(0, 229, 255, 0.1);
}
.m-label {
  flex: 1;
  font-size: 13px;
  color: var(--t-regular, #c6d6e8);
}
.m-before {
  font-size: 14px;
  color: var(--t-secondary, #8fa8c2);
  text-decoration: line-through;
  opacity: 0.7;
}
.m-arrow {
  font-size: 12px;
}
.m-arrow.good {
  color: var(--c-success, #2ecc40);
}
.m-arrow.bad {
  color: var(--c-danger, #ff4d4d);
}
.m-after {
  font-size: 18px;
  font-weight: 700;
}
.m-after.good {
  color: var(--c-success, #2ecc40);
  text-shadow: 0 0 8px currentColor;
}
.m-after.bad {
  color: var(--c-danger, #ff4d4d);
}
.run-btn {
  margin-top: 14px;
  padding: 12px;
  background: linear-gradient(135deg, #1990ff, #00e5ff);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: var(--glow-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.run-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--glow-accent);
}
.run-btn.ran {
  background: linear-gradient(135deg, #2ecc40, #7fd6ff);
}
.run-icon {
  font-size: 14px;
}
.sim-status {
  margin-top: 10px;
  padding: 8px;
  background: rgba(46, 204, 64, 0.1);
  border: 1px solid rgba(46, 204, 64, 0.3);
  border-radius: 4px;
  font-size: 12px;
  color: var(--c-success, #2ecc40);
  text-align: center;
}
</style>


