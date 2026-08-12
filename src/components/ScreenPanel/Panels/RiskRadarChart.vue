<template>
  <ChartCard title="区域风险贡献对比">
    <G2Chart :options="options" :data="data" />
  </ChartCard>
</template>
<script setup>
// 区域风险贡献对比: 分组柱状图(比雷达图更稳定, G2 原生支持好)
// x 轴=区域, y 轴=归一化分值(0-10), color=维度, 分组柱状
import { computed } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import G2Chart from '../Charts/G2Chart.vue'
import { useDataStore } from '@/stores'

const dataStore = useDataStore()

const data = computed(() => {
  const regions = dataStore.regions?.features || []
  if (!regions.length) return []

  const dims = ['事件数', '平均等级', '风险分', '拥堵指数']

  // 计算每个维度最大值(归一化用)
  const maxVals = {}
  dims.forEach((d) => {
    maxVals[d] = Math.max(
      ...regions.map((f) => {
        const p = f.properties
        switch (d) {
          case '事件数': return p.eventCount || 0
          case '平均等级': return p.avgLevel || 0
          case '风险分': return p.riskScore || 0
          case '拥堵指数': return +(p.riskScore * 0.8).toFixed(2)
        }
      }),
    )
  })

  // 归一化到 0-10, 转长格式
  const result = []
  regions.forEach((f) => {
    const p = f.properties
    const raw = {
      事件数: p.eventCount || 0,
      平均等级: p.avgLevel || 0,
      风险分: p.riskScore || 0,
      拥堵指数: +(p.riskScore * 0.8).toFixed(2),
    }
    dims.forEach((d) => {
      const max = maxVals[d] || 1
      result.push({
        area: p.name,
        dimension: d,
        value: +((raw[d] / max) * 10).toFixed(1),
      })
    })
  })
  return result
})

const options = {
  type: 'view',
  children: [
    {
      type: 'interval',
      encode: { x: 'area', y: 'value', color: 'dimension' },
      transform: [{ type: 'dodgeX' }],
      scale: { color: { range: ['#00e5ff', '#2ecc40', '#ffb020', '#ff4d4d'] } },
      style: { radiusTopLeft: 2, radiusTopRight: 2 },
    },
  ],
  scale: { y: { domainMin: 0, domainMax: 10 } },
  axis: {
    x: { labelFill: '#cfd8e3', gridStroke: 'rgba(0,229,255,0.08)' },
    y: { labelFill: '#8fa8c2', gridStroke: 'rgba(0,229,255,0.08)', labelFontSize: 10 },
  },
  legend: {
    color: {
      labelFill: '#cfd8e3',
      layout: { justifyContent: 'center' },
    },
  },
}
</script>


