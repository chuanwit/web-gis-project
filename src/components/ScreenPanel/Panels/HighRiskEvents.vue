<template>
  <ChartCard title="高风险事件列表" is-static>
    <ul class="event-list">
      <li v-for="e in topEvents" :key="e.id" class="event-item" @click="pick(e)">
        <span class="ev-type" :style="{ background: typeColor(e.name) }">{{ e.name }}</span>
        <span class="ev-area">{{ e.area }}</span>
        <span class="ev-level">L{{ e.level }}</span>
      </li>
    </ul>
  </ChartCard>
</template>
<script setup>
// 高风险事件列表: 取 level>=2 的事件, 点击联动地图
import { computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import { useDataStore, useBusinessStore } from '@/stores'

const dataStore = useDataStore()
const business = useBusinessStore()

const topEvents = computed(() => {
  const events = dataStore.events?.features || []
  return events
    .filter((e) => e.properties.level >= 2)
    .slice(0, 6)
    .map((e) => ({
      id: e.properties.id,
      name: e.properties.name,
      area: e.properties.area,
      level: e.properties.level,
    }))
})

function pick(e) {
  business.selectEvent(e.id)
}

const TYPE_COLORS = {
  交通拥堵: '#ff4d4d',
  碰撞: '#ffb84c',
  追尾: '#fdda0d',
  刮擦: '#36cfc9',
  车辆故障: '#9254de',
}
function typeColor(t) {
  return TYPE_COLORS[t] || '#1990ff'
}
</script>
<style scoped>
.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  font-size: 12px;
  color: var(--t-regular, #c6d6e8);
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s;
}
.event-item:hover {
  background: rgba(0, 229, 255, 0.1);
}
.ev-type {
  padding: 1px 8px;
  border-radius: 10px;
  color: #fff;
  font-size: 11px;
}
.ev-area {
  flex: 1;
  color: var(--t-secondary, #8fa8c2);
}
.ev-level {
  color: var(--c-danger, #ff4d4d);
  font-weight: 700;
  font-family: var(--font-mono);
}
</style>
