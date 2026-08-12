<template>
  <ChartCard title="人口统计图">
    <G2Chart :options="options" :data="data" />
  </ChartCard>
</template>
<script setup>
import ChartCard from '../Charts/ChartCard.vue'
import G2Chart from '../Charts/G2Chart.vue'

// 右上图表: 武汉市人口统计(饼图)
// 图例简化: 仅保留武昌/洪山/江夏, 其余合并为"其他"
const KEEPS = ['武昌区', '洪山区', '江夏区']
const allData = [
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
const othersValue = allData
  .filter((d) => !KEEPS.includes(d.type))
  .reduce((s, d) => s + d.value, 0)
const data = [
  ...allData.filter((d) => KEEPS.includes(d.type)),
  { type: '其他', value: othersValue },
]
const total = data.reduce((s, d) => s + d.value, 0)

const options = {
  type: 'interval',
  // G2 v5 饼图(θ 坐标)必须 stackY, 否则各扇区不会按颜色堆叠(参考 EventTypeChart)
  transform: [{ type: 'stackY' }],
  encode: { y: 'value', color: 'type' },
  coordinate: { type: 'theta', innerRadius: 0.55, outerRadius: 0.9 },
  scale: {
    color: {
      range: ['#00e5ff', '#2ecc40', '#ffb020', '#4a5568'],
    },
  },
  label: {
    text: (d) => `${d.type} ${((d.value / total) * 100).toFixed(1)}%`,
    position: 'spider',
    style: { fill: '#fff', fontSize: 11 },
  },
}
</script>


