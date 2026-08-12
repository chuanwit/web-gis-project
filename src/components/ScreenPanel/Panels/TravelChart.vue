<template>
  <ChartCard title="出行人口统计">
    <G2Chart :options="options" :data="data" />
  </ChartCard>
</template>
<script setup>
// 左上面板: 出行人口统计(柱状图)
import { ref, onBeforeUnmount } from 'vue'
import ChartCard from '../Charts/ChartCard.vue'
import G2Chart from '../Charts/G2Chart.vue'

// 图表数据(动态增长, 由 G2Chart 组件监听 data 变化, 调用 changeData 增量更新)
const data = ref([
  { type: '汉阳区', value: 10000 },
  { type: '武昌区', value: 20000 },
  { type: '洪山区', value: 50000 },
  { type: '江夏区', value: 30000 },
  { type: '江岸区', value: 35000 },
])

// 模拟动态增长
const timer = setInterval(() => {
  data.value = data.value.map((item) => {
    const { value } = item
    return { ...item, value: value + Math.floor(Math.random() * 100) }
  })
}, 1200)

// 组件卸载时清理定时器, 避免内存泄漏
onBeforeUnmount(() => clearInterval(timer))

// G2 柱状图配置(不含 data, 由 G2Chart 组件注入)
const options = {
  type: 'interval',
  encode: { x: 'type', y: 'value' },
  style: {
    fill: (d) =>
      d.value > 40000 ? '#dc3545' : d.value > 20000 ? '#fd7e14' : '#00B96B',
  },
  label: {
    text: 'value',
    position: 'top',
    style: { fill: '#fff', opacity: 0.6, fontSize: 12 },
  },
  axis: {
    x: { labelFill: '#fff' },
    y: { labelFill: '#fff' },
  },
  legend: false,
}
</script>


