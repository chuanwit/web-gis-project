<template>
  <ChartCard title="事件类型分布">
    <G2Chart :options="options" :data="data" />
  </ChartCard>
</template>
<script setup>
// 事件类型分布(玫瑰图/极坐标柱状): 直观展示各类事故占比
import { computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import G2Chart from '../Charts/G2Chart.vue'
import { useDataStore } from '@/stores'

const dataStore = useDataStore()

const data = computed(() => dataStore.eventTypeDist())

const options = {
  type: 'interval',
  encode: { x: 'type', y: 'count', color: 'type' },
  transform: [{ type: 'stackY' }],
  coordinate: { type: 'polar' },
  scale: { x: { padding: 0.2 } },
  style: { radius: 8 },
  label: {
    text: 'count',
    position: 'outside',
    style: { fill: '#cfd8e3', fontSize: 11 },
  },
  axis: { x: { labelFill: '#cfd8e3' }, y: { labelFill: '#8fa8c2' } },
  legend: false,
}
</script>


