<template>
  <ChartCard title="区域风险排行榜">
    <ul class="rank-list">
      <li
        v-for="(r, i) in ranking"
        :key="r.area"
        class="rank-item"
        :class="{ active: selected === r.area }"
        @click="select(r)"
      >
        <span class="rank-no" :class="'no-' + (i + 1)">{{ i + 1 }}</span>
        <div class="rank-info">
          <div class="rank-name">{{ r.name }}<span class="rank-area">{{ r.area }}</span></div>
          <div class="rank-bar-wrap">
            <div class="rank-bar" :style="{ width: (r.riskScore * 10) + '%', background: barColor(r.riskScore) }"></div>
          </div>
        </div>
        <span class="rank-score num-mono">{{ r.riskScore }}</span>
      </li>
    </ul>
  </ChartCard>
</template>
<script setup>
// 区域风险排行榜: 点击联动地图飞行+高亮
import { computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import { useDataStore, useBusinessStore } from '@/stores'

const dataStore = useDataStore()
const business = useBusinessStore()

const ranking = computed(() => dataStore.regionRiskRanking())
const selected = computed(() => business.selectedArea)

function select(r) {
  business.selectArea(r.area)
}

function barColor(score) {
  if (score >= 9) return 'linear-gradient(90deg,#ff4d4d,#ff8c00)'
  if (score >= 7) return 'linear-gradient(90deg,#ffb020,#ffd700)'
  return 'linear-gradient(90deg,#2ecc40,#7fd6ff)'
}
</script>
<style scoped>
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow: auto;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.rank-item:hover {
  background: rgba(0, 229, 255, 0.08);
}
.rank-item.active {
  background: rgba(0, 229, 255, 0.15);
  border-color: rgba(0, 229, 255, 0.4);
}
.rank-no {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: var(--t-secondary, #8fa8c2);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-no.no-1 {
  background: #ff4d4d;
  color: #fff;
}
.rank-no.no-2 {
  background: #ff8c00;
  color: #fff;
}
.rank-no.no-3 {
  background: #ffd700;
  color: #0a1426;
}
.rank-info {
  flex: 1;
  min-width: 0;
}
.rank-name {
  color: var(--t-primary, #eaf3fb);
  font-size: 13px;
  margin-bottom: 4px;
}
.rank-area {
  font-size: 11px;
  color: var(--t-dim, #5f7896);
  margin-left: 6px;
}
.rank-bar-wrap {
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.rank-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}
.rank-score {
  color: var(--c-danger, #ff4d4d);
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}
</style>


