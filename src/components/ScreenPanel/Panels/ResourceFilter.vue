<template>
  <ChartCard title="资源分类筛选">
    <div class="filter-grid">
      <button
        v-for="t in types"
        :key="t.key"
        class="filter-btn"
        :class="{ active: active === t.key }"
        @click="toggle(t.key)"
      >
        <span class="fb-icon" :style="{ color: t.color }">{{ t.icon }}</span>
        <span class="fb-name">{{ t.name }}</span>
        <span class="fb-count num-mono">{{ t.count }}</span>
      </button>
    </div>
    <div class="filter-summary">
      <div class="sum-row"><span>资源总数</span><b class="num-mono">{{ total }}</b> 个</div>
      <div class="sum-row"><span>总容量</span><b class="num-mono">{{ totalCap }}</b></div>
      <div class="sum-row"><span>平均服务半径</span><b class="num-mono">{{ avgRadius }}</b> m</div>
    </div>
  </ChartCard>
</template>
<script setup>
// 资源分类筛选: 点击类型联动地图只显示该类资源
import { ref, computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import { useDataStore } from '@/stores'
import { filterResourceType } from '@/components/SmartCity/hooks/useResources'
import { useMapStore } from '@/stores'

const dataStore = useDataStore()
const mapStore = useMapStore()
const active = ref('all')

const typeDefs = [
  { key: 'hospital', name: '医院', icon: '✚', color: '#ff4d6d' },
  { key: 'fire', name: '消防站', icon: '🚒', color: '#ffb020' },
  { key: 'police', name: '交警队', icon: '🚓', color: '#1990ff' },
]

const types = computed(() => {
  const feats = dataStore.resources?.features || []
  return typeDefs.map((t) => ({
    ...t,
    count: feats.filter((f) => f.properties.type === t.key).length,
  }))
})

const total = computed(() => dataStore.resources?.features.length || 0)
const totalCap = computed(() => {
  const feats = dataStore.resources?.features || []
  return feats.reduce((s, f) => s + (f.properties.capacity || 0), 0)
})
const avgRadius = computed(() => {
  const feats = dataStore.resources?.features || []
  if (!feats.length) return 0
  return Math.round(feats.reduce((s, f) => s + (f.properties.serviceRadius || 0), 0) / feats.length)
})

function toggle(key) {
  active.value = active.value === key ? 'all' : key
  filterResourceType(active.value === 'all' ? 'all' : active.value)
}
</script>
<style scoped>
.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.filter-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  background: rgba(16, 32, 56, 0.5);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 4px;
  color: var(--t-regular, #c6d6e8);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover {
  border-color: rgba(0, 229, 255, 0.4);
}
.filter-btn.active {
  background: rgba(0, 229, 255, 0.12);
  border-color: var(--c-accent, #00e5ff);
  box-shadow: var(--glow-primary);
}
.fb-icon {
  font-size: 20px;
}
.fb-name {
  font-size: 12px;
}
.fb-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-accent, #00e5ff);
}
.filter-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--t-regular, #c6d6e8);
}
.sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(0, 229, 255, 0.1);
}
.sum-row b {
  color: var(--c-accent, #00e5ff);
  font-size: 16px;
  margin: 0 4px;
}
</style>
