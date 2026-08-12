<template>
  <ChartCard title="片区资源覆盖效能">
    <ul class="cov-list">
      <li v-for="c in coverage" :key="c.area" class="cov-item">
        <div class="cov-head">
          <span class="cov-name">{{ c.name }}</span>
          <span class="cov-pct num-mono" :class="pctClass(c.pct)">{{ c.pct }}%</span>
        </div>
        <div class="cov-bar-wrap">
          <div class="cov-bar" :style="{ width: c.pct + '%', background: barColor(c.pct) }"></div>
        </div>
        <div class="cov-meta">
          资源 {{ c.resCount }} 个 · 缺口 {{ c.gap }}
        </div>
      </li>
    </ul>
  </ChartCard>
</template>
<script setup>
// 片区资源覆盖效能: 每区域的资源数 + 覆盖率 + 缺口
import { computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import { useDataStore } from '@/stores'

const dataStore = useDataStore()

const coverage = computed(() => {
  const regions = dataStore.regions?.features || []
  const resources = dataStore.resources?.features || []
  return regions.map((r) => {
    const areaRes = resources.filter((x) => x.properties.area === r.properties.area)
    // 覆盖率简化模型: 资源数*30%, 上限100
    const pct = Math.min(100, areaRes.length * 32)
    const gap = Math.max(0, 4 - areaRes.length)
    return {
      area: r.properties.area,
      name: r.properties.name,
      resCount: areaRes.length,
      pct,
      gap: gap > 0 ? gap + '处' : '无',
    }
  })
})

function pctClass(p) {
  if (p >= 90) return 'good'
  if (p >= 60) return 'mid'
  return 'low'
}
function barColor(p) {
  if (p >= 90) return 'linear-gradient(90deg,#2ecc40,#7fd6ff)'
  if (p >= 60) return 'linear-gradient(90deg,#ffd700,#ffb020)'
  return 'linear-gradient(90deg,#ff4d4d,#ff8c00)'
}
</script>
<style scoped>
.cov-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow: auto;
}
.cov-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cov-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cov-name {
  color: var(--t-primary, #eaf3fb);
  font-size: 13px;
}
.cov-pct {
  font-size: 16px;
  font-weight: 700;
}
.cov-pct.good {
  color: var(--c-success, #2ecc40);
}
.cov-pct.mid {
  color: var(--c-warn, #ffb020);
}
.cov-pct.low {
  color: var(--c-danger, #ff4d4d);
}
.cov-bar-wrap {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.cov-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s;
}
.cov-meta {
  font-size: 11px;
  color: var(--t-dim, #5f7896);
}
</style>


