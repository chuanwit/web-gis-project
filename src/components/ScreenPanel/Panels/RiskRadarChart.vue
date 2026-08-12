<template>
  <ChartCard title="区域风险贡献雷达">
    <G2Chart :options="options" :data="data" />
  </ChartCard>
</template>
<script setup>
// 风险贡献雷达图: 各区域在 事件数/平均等级/风险分/拥堵 四维度的对比
import { computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import G2Chart from '../Charts/G2Chart.vue'
import { useDataStore } from '@/stores'

const dataStore = useDataStore()

const data = computed(() => {
  const regions = dataStore.regions?.features || []
  return regions.map((f) => ({
    area: f.properties.name,
    事件数: f.properties.eventCount,
    平均等级: f.properties.avgLevel,
    风险分: f.properties.riskScore,
    拥堵指数: +(f.properties.riskScore * 0.8).toFixed(2),
  }))
})

const options = {
  type: 'view',
  children: [
    {
      type: 'area',
      encode: { x: 'area', y: '事件数', color: 'area' },
      style: { fillOpacity: 0.15 },
      coordinate: { type: 'polar' },
    },
    {
      type: 'line',
      encode: { x: 'area', y: '事件数', color: 'area' },
      style: { lineWidth: 2 },
      coordinate: { type: 'polar' },
    },
    {
      type: 'point',
      encode: { x: 'area', y: '事件数', color: 'area' },
      style: { r: 3 },
      coordinate: { type: 'polar' },
    },
  ],
  scale: { y: { domainMin: 0 } },
  axis: {
    x: { labelFill: '#cfd8e3', gridStroke: 'rgba(0,229,255,0.15)' },
    y: { labelFill: '#8fa8c2', gridStroke: 'rgba(0,229,255,0.1)' },
  },
  legend: { color: { labelFill: '#cfd8e3' } },
}
</script>
