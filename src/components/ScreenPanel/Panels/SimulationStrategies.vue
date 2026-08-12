<template>
  <ChartCard title="应急处置策略">
    <!-- 目标片区选择 -->
    <div class="target-select">
      <span class="ts-label">目标片区</span>
      <select v-model="target" class="ts-select" @change="onTarget">
        <option value="">请选择片区</option>
        <option v-for="r in regions" :key="r.area" :value="r.area">
          {{ r.name }}（风险 {{ r.riskScore }}）
        </option>
      </select>
    </div>

    <!-- 策略勾选卡片 -->
    <div class="strategy-list">
      <label
        v-for="s in strategies"
        :key="s.key"
        class="strategy-card"
        :class="{ active: business.strategies[s.key] }"
      >
        <input type="checkbox" :checked="business.strategies[s.key]" @change="business.toggleStrategy(s.key)" />
        <div class="sc-body">
          <div class="sc-title">{{ s.label }}</div>
          <div class="sc-desc">{{ s.desc }}</div>
        </div>
        <span class="sc-check">✓</span>
      </label>
    </div>
  </ChartCard>
</template>
<script setup>
// 情景推演策略勾选 + 目标片区选择
import { ref, computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import { useBusinessStore, useDataStore, SIM_STRATEGIES } from '@/stores'

const business = useBusinessStore()
const dataStore = useDataStore()
const strategies = SIM_STRATEGIES

const target = ref(business.selectedArea || '')

const regions = computed(() => dataStore.regionRiskRanking())

function onTarget() {
  business.selectArea(target.value)
}
</script>
<style scoped>
.target-select {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.ts-label {
  font-size: 13px;
  color: var(--t-secondary, #8fa8c2);
  flex-shrink: 0;
}
.ts-select {
  flex: 1;
  padding: 6px 10px;
  background: rgba(16, 32, 56, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 4px;
  color: var(--t-primary, #eaf3fb);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.ts-select:focus {
  border-color: var(--c-accent, #00e5ff);
}
.strategy-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow: auto;
}
.strategy-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(16, 32, 56, 0.5);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}
.strategy-card:hover {
  border-color: rgba(0, 229, 255, 0.4);
}
.strategy-card.active {
  background: rgba(0, 229, 255, 0.1);
  border-color: var(--c-accent, #00e5ff);
  box-shadow: var(--glow-primary);
}
.strategy-card input {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--t-dim, #5f7896);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
}
.strategy-card.active input {
  background: var(--c-accent, #00e5ff);
  border-color: var(--c-accent, #00e5ff);
}
.sc-body {
  flex: 1;
  min-width: 0;
}
.sc-title {
  font-size: 13px;
  color: var(--t-primary, #eaf3fb);
  margin-bottom: 2px;
}
.sc-desc {
  font-size: 11px;
  color: var(--t-dim, #5f7896);
}
.sc-check {
  color: var(--c-accent, #00e5ff);
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}
.strategy-card.active .sc-check {
  opacity: 1;
}
</style>


