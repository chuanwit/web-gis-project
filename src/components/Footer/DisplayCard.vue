<template>
  <div class="display-card">
    <!-- 关闭按钮: 右上角, 通知父组件关闭结果表格 -->
    <button class="close-btn" @click="$emit('close')" aria-label="关闭">
      ✕
    </button>

    <!-- 拉框动态聚合统计: 框内事件数/平均等级/最高等级/主要类型 -->
    <div v-if="stats.total > 0" class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">框内事件</span>
        <span class="stat-value num-mono">{{ stats.total }}</span>
        <span class="stat-unit">起</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-label">平均等级</span>
        <span class="stat-value num-mono" :class="stats.avgLevel >= 2 ? 'high' : ''">{{ stats.avgLevel }}</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-label">最高等级</span>
        <span class="stat-value num-mono" :class="stats.maxLevel >= 3 ? 'danger' : ''">{{ stats.maxLevel }}</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-label">主要类型</span>
        <span class="stat-value">{{ stats.topType?.[0] || '-' }}</span>
        <span v-if="stats.topType" class="stat-unit">{{ stats.topType[1] }}起</span>
      </div>
    </div>

    <!-- 类型分布迷你条 -->
    <div v-if="stats.total > 0" class="type-bars">
      <div v-for="(count, type) in stats.typeDist" :key="type" class="type-bar">
        <span class="tb-label">{{ type }}</span>
        <div class="tb-track">
          <div class="tb-fill" :style="{ width: (count / stats.total * 100) + '%' }"></div>
        </div>
        <span class="tb-count num-mono">{{ count }}</span>
      </div>
    </div>

    <el-table
      :data="computedData"
      size="small"
      :max-height="300"
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

// 拉框动态聚合统计: 实时重算框内事件分布
const stats = computed(() => {
  const data = props.tableData || []
  const total = data.length
  const typeDist = {}
  let levelSum = 0
  let maxLevel = 0
  data.forEach((f) => {
    const p = f.properties || {}
    const t = p.name || '未知'
    typeDist[t] = (typeDist[t] || 0) + 1
    const lv = p.level || 1
    levelSum += lv
    if (lv > maxLevel) maxLevel = lv
  })
  const avgLevel = total ? (levelSum / total).toFixed(1) : '0'
  const topType = Object.entries(typeDist).sort((a, b) => b[1] - a[1])[0]
  return { total, typeDist, avgLevel, maxLevel, topType }
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
  min-width: 380px;
  background: #53697670;
  border-radius: 4px;
  box-shadow: 0 0 5px 3px #333;
  z-index: 10;
  backdrop-filter: blur(6px);
}

/* 拉框聚合统计栏 */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
  background: rgba(0, 229, 255, 0.04);
}
.stat-item {
  display: flex;
  align-items: baseline;
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.stat-label {
  font-size: 10px;
  color: #8fa8c2;
  letter-spacing: 0.5px;
}
.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #00e5ff;
  text-shadow: 0 0 6px rgba(0, 229, 255, 0.4);
}
.stat-value.high {
  color: #ffb020;
  text-shadow: 0 0 6px rgba(255, 176, 32, 0.4);
}
.stat-value.danger {
  color: #ff4d4d;
  text-shadow: 0 0 6px rgba(255, 77, 77, 0.4);
}
.stat-unit {
  font-size: 10px;
  color: #8fa8c2;
}
.stat-divider {
  width: 1px;
  height: 22px;
  background: rgba(0, 229, 255, 0.2);
  flex-shrink: 0;
}

/* 类型分布迷你条 */
.type-bars {
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}
.type-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.tb-label {
  width: 60px;
  color: #c6d6e8;
  flex-shrink: 0;
}
.tb-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.tb-fill {
  height: 100%;
  background: linear-gradient(90deg, #1990ff, #00e5ff);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.tb-count {
  width: 20px;
  text-align: right;
  color: #7fd6ff;
  flex-shrink: 0;
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


