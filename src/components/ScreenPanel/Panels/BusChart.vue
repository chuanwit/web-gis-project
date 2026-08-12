<template>
  <ChartCard title="实时公交在线图">
    <G2Chart :options="options" :data="data" />
  </ChartCard>
</template>
<script setup>
import ChartCard from '../Charts/ChartCard.vue'
import G2Chart from '../Charts/G2Chart.vue'

// 左下图表: 实时公交在线图(玫瑰图)
const data = [
  { type: '汉阳区', value: 27 },
  { type: '武昌区', value: 25 },
  { type: '硚口区', value: 18 },
  { type: '江夏区', value: 15 },
  { type: '洪山区', value: 10 },
  { type: '其他', value: 10 },
]

// G2 玫瑰图配置(interval + polar)
const options = {
  type: 'interval',
  encode: { x: 'type', y: 'value', color: 'type' },
  coordinate: { type: 'polar' },
  scale: { y: { nice: true } },
  axis: { x: { grid: true } },
  interaction: [{ type: 'elementHighlight', background: true }],
}
</script>


