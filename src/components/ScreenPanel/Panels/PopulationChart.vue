<template>
  <ChartCard title="人口统计图">
    <G2Chart :options="options" :data="data" />
  </ChartCard>
</template>
<script setup>
import ChartCard from '../Charts/ChartCard.vue'
import G2Chart from '../Charts/G2Chart.vue'

// 右上图表: 武汉市人口统计(饼图)
const data = [
  { type: '武昌区', value: 27 },
  { type: '洪山区', value: 25 },
  { type: '江夏区', value: 22 },
  { type: '汉口区', value: 18 },
  { type: '汉阳区', value: 16 },
  { type: '硚口区', value: 14 },
  { type: '江岸区', value: 12 },
  { type: '青山区', value: 10 },
  { type: '东西湖区', value: 8 },
  { type: '黄陂区', value: 6 },
  { type: '新洲区', value: 5 },
  { type: '其他', value: 18 },
]
const total = data.reduce((s, d) => s + d.value, 0)

const options = {
  type: 'interval',
  encode: { y: 'value', color: 'type' },
  coordinate: { type: 'theta', innerRadius: 0.55, outerRadius: 0.9 },
  scale: {
    color: {
      type: 'ordinal',
      // 明确指定定义域映射，确保 12 个区与 12 个颜色完全匹配
      domain: data.map(d => d.type),
      range: [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', 
        '#f58231', '#911eb4', '#42d4f4', '#f032e6', 
        '#bfef45', '#fabed4', '#469990', '#dcbeff'
      ],
    },
  },
  label: {
    text: (d) => `${d.type} ${((d.value / total) * 100).toFixed(1)}%`,
    position: 'spider',
    style: { fill: '#fff', fontSize: 11 },
  },
}
</script>
