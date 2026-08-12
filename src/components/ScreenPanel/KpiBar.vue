<template>
  <!-- KPI 指标卡片矩阵: 顶部悬浮, 按业务模块切换内容 -->
  <!-- 借鉴参考4(华农)的顶部统计卡片 + 参考6(热环境)的指标卡片 -->
  <transition name="fade" mode="out-in">
    <div class="kpi-bar" :key="current">
      <div v-for="k in kpis" :key="k.label" class="kpi-card glass-card scan-line">
        <div class="kpi-icon" :style="{ color: k.color }">{{ k.icon }}</div>
        <div class="kpi-body">
          <div class="kpi-value num-mono" :style="{ color: k.color }">
            {{ k.value }}<span class="kpi-unit" v-if="k.unit">{{ k.unit }}</span>
          </div>
          <div class="kpi-label">{{ k.label }}</div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useBusinessStore, useDataStore, useTimeStore, PERIOD_LABELS } from '@/stores'

const business = useBusinessStore()
const dataStore = useDataStore()
const timeStore = useTimeStore()

const current = computed(() => business.module)

const kpis = computed(() => {
  const events = dataStore.events?.features || []
  const ranking = dataStore.regionRiskRanking()
  const m = business.module

  if (m === 'overview') {
    const totalEvents = events.length
    const regions = dataStore.regions?.features.length || 5
    return [
      { icon: '◉', label: '实时事件', value: totalEvents, unit: '起', color: '#00e5ff' },
      { icon: '◈', label: '监测区域', value: regions, unit: '个', color: '#7fd6ff' },
      { icon: '⏱', label: '当前时段', value: PERIOD_LABELS[timeStore.period], color: '#2ecc40' },
      { icon: '📊', label: '道路总量', value: dataStore.roads?.features.length || 2314, unit: '条', color: '#ffb020' },
    ]
  }
  if (m === 'risk') {
    const highRisk = events.filter((e) => e.properties.level >= 2).length
    const topRegion = ranking[0]
    return [
      { icon: '⚠', label: '高风险事件', value: highRisk, unit: '起', color: '#ff4d4d' },
      { icon: '★', label: '最高风险区域', value: topRegion?.name || '-', color: '#ff8c00' },
      { icon: '▲', label: '风险指数', value: topRegion?.riskScore || 0, color: '#ffb020' },
      { icon: '◈', label: '事件总数', value: events.length, unit: '起', color: '#00e5ff' },
    ]
  }
  if (m === 'resource') {
    const resources = dataStore.resources?.features || []
    const totalCap = resources.reduce((s, r) => s + (r.properties.capacity || 0), 0)
    return [
      { icon: '✚', label: '资源点', value: resources.length, unit: '个', color: '#00e5ff' },
      { icon: '▣', label: '总容量', value: totalCap, color: '#7fd6ff' },
      { icon: '◎', label: '服务覆盖', value: 62, unit: '%', color: '#2ecc40' },
      { icon: '⚠', label: '缺口区域', value: 1, unit: '个', color: '#ffb020' },
    ]
  }
  // simulation
  const r = business.simulationResult
  const base = ranking[0]
  if (r) {
    return [
      { icon: '⚠', label: '当前风险', value: r.before.riskIndex, color: '#ff4d4d' },
      { icon: '▼', label: '预计降幅', value: Math.abs(r.deltas.risk).toFixed(2), color: '#2ecc40' },
      { icon: '▲', label: '覆盖提升', value: '+' + r.deltas.coverage, unit: '%', color: '#00e5ff' },
      { icon: '⏱', label: '恢复时长', value: r.after.recoverMinutes, unit: 'min', color: '#ffb020' },
    ]
  }
  return [
    { icon: '⚠', label: '当前风险', value: base?.riskScore || 7.5, color: '#ff4d4d' },
    { icon: '◆', label: '已选策略', value: countActive(), unit: '项', color: '#ffb020' },
    { icon: '◎', label: '当前覆盖', value: 62, unit: '%', color: '#2ecc40' },
    { icon: '⏱', label: '预计恢复', value: 30, unit: 'min', color: '#00e5ff' },
  ]
})

function countActive() {
  return Object.values(business.strategies).filter(Boolean).length
}
</script>

<style scoped>
.kpi-bar {
  position: absolute;
  left: 50%;
  top: 150px; /* header(100px) + BusinessNav(约40px) + 间距 */
  transform: translateX(-50%);
  display: flex;
  gap: 14px;
  z-index: 4;
  pointer-events: auto;
}
.kpi-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  min-width: 130px;
}
.kpi-icon {
  font-size: 22px;
  text-shadow: 0 0 8px currentColor;
}
.kpi-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  text-shadow: 0 0 8px currentColor;
}
.kpi-unit {
  font-size: 12px;
  margin-left: 2px;
  opacity: 0.8;
}
.kpi-label {
  font-size: 11px;
  color: var(--t-secondary, #8fa8c2);
  letter-spacing: 1px;
  margin-top: 2px;
}
</style>
