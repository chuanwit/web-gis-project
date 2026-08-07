<template>
  <div class="display-card">
    <!-- 关闭按钮: 右上角, 通知父组件关闭结果表格 -->
    <button class="close-btn" @click="$emit('close')" aria-label="关闭">
      ✕
    </button>
    <el-table
      :data="computedData"
      size="small"
      :max-height="400"
      @row-click="handleRow"
    >
      <el-table-column prop="event_num" label="事件编号"></el-table-column>
      <el-table-column prop="name" label="类型"></el-table-column>
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            link
            @click.stop="handleRow(row)"
            >详情</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { PointLayer } from '@antv/l7'
import { useSceneMap } from '@/composables/useSceneMap'

const sceneMap = useSceneMap()
let markLayer = null

const props = defineProps({
  tableData: {
    type: Array,
  },
})

// 关闭按钮 / 选中某条事故(供父组件弹出 AI 分析)
const emit = defineEmits(['close', 'select'])

const computedData = computed(() => {
  return props.tableData.map((row) => {
    const {
      geometry,
      properties: { event_num, name },
    } = row
    return {
      geometry,
      event_num,
      name,
      raw: row, // 原始 feature, 供 AI 分析使用
    }
  })
})

// 点击行/详情: 在地图上标记事故点并飞行过去, 同时派发 select 供 AI 分析
function handleRow(row) {
  const { scene, map } = sceneMap.value
  if (!scene || !map) return

  // 0. 通知父组件弹出 AI 分析
  if (row.raw) emit('select', row.raw)

  markLayer && scene.removeLayer(markLayer)

  // 1. 根据坐标绘制普通圆点(带脉冲动画)
  const data = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: row.geometry.coordinates,
        },
      },
    ],
  }
  markLayer = new PointLayer()
    .source(data)
    .shape('circle')
    .size(50)
    .color('#f00')
    .animate(true)
  scene.addLayer(markLayer)

  // 2. 根据坐标飞行(切换视角)
  map.flyTo({
    center: row.geometry.coordinates,
    zoom: 15,
    speed: 1,
    pitch: 30,
  })
}

onBeforeUnmount(() => {
  markLayer && sceneMap.value?.scene.removeLayer(markLayer)
})
</script>
<style scoped>
.display-card {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 150px; /* 位于时间滑块(96px)上方, 避免重叠 */
  min-width: 320px;
  background: #53697670;
  border-radius: 4px;
  box-shadow: 0 0 5px 3px #333;
  z-index: 10;
}

/* 关闭按钮: 右上角悬浮, 层级高于表格固定列(否则点击会被操作列挡住) */
.close-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  z-index: 10;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

:deep(.el-table) {
  background-color: transparent;
  /* Element Plus 暗色表格: 通过官方 CSS 变量统一配色 */
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(0, 0, 0, 0.25);
  --el-table-header-text-color: #fff;
  --el-table-text-color: #fff;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.08);
  --el-table-border-color: rgba(255, 255, 255, 0.15);
}

:deep(.el-table tr) {
  background-color: transparent;
  color: #fff;
  cursor: pointer;
}

:deep(.el-table th.el-table__cell) {
  background-color: transparent;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: none;
}

:deep(.el-table__inner-wrapper::before) {
  height: 0;
}

/* 固定列在滚动时保持暗色背景(否则透出默认白底) */
:deep(.el-table .el-table-fixed-column--right) {
  background-color: rgba(0, 0, 0, 0.25);
}
</style>
