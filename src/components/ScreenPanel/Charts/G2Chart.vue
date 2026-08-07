<template>
  <div ref="el" class="chart-body"></div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Chart } from '@antv/g2'

// G2 v5 图表包装组件: 统一管理 创建/渲染/增量更新/销毁 生命周期
const props = defineProps({
  // G2 mark 配置(不含 data, data 单独注入便于 changeData 增量更新)
  options: {
    type: Object,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
  theme: {
    type: String,
    default: 'classicDark',
  },
})

const el = ref(null)
let chart = null

onMounted(async () => {
  chart = new Chart({ container: el.value, autoFit: true, theme: props.theme })
  chart.options({ ...props.options, data: props.data })
  await chart.render()
})

// 数据变化时增量更新, 避免整图重建
watch(
  () => props.data,
  (val) => {
    chart?.changeData(val)
  },
)

// 卸载时销毁图表, 释放资源
onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>
<style scoped>
/* 图表区域: 填满卡片剩余空间, 由 G2 autoFit 自适应 */
.chart-body {
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>
