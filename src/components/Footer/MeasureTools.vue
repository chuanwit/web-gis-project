<template>
  <div class="item">
    <el-popover
      v-model:visible="popoverVisible"
      placement="top"
      trigger="click"
      popper-style="background-color:#53697670;color:#fff"
      :width="120"
    >
      <template #reference>
        <button class="toggle-btn" :class="{ active: isActive }">
          <img
            class="btn-icon"
            src="@/assets/icons/ruler.svg"
            alt="测量"
          />
        </button>
      </template>
      <div class="popover-w column">
        <span
          v-for="item in tools"
          :key="item"
          class="query-item"
          @click="selectTool(item)"
        >
          {{ labelOf(item) }}
        </span>
      </div>
    </el-popover>
    <p>测量工具</p>
  </div>
</template>

<script setup>
// 功能组件: 测量工具(只保留两个核心功能: 多边形测面积, 线测长度), 绘制实例由本组件自行管理
// 交互: 点尺子按钮弹出工具列表 → 选中即激活并自动关闭弹窗
//   每次绘制完成即停止测量并保留图形数据, 再次选中同类型工具重新激活(数据累积), 删除 = 清除测量并退出
import { ref, onBeforeUnmount, watch } from 'vue'
import { DrawEvent, DrawPolygon, DrawLine } from '@antv/l7-draw'
import { useSceneMap } from '@/composables/useSceneMap'
import { setToolCursor } from '@/utils/mapCursor'

const sceneMap = useSceneMap()

// 地图与场景实例
let map = null
let scene = null

// 当前测量绘制实例
let draw = null
// 当前实例对应的工具类型(同类型激活时复用实例以保留已绘数据)
let currentType = null

// 弹窗显隐: 选中工具后自动关闭
const popoverVisible = ref(false)

// 当前是否处于测量会话(按钮高亮)
const isActive = ref(false)

// 工具类型列表
const tools = ['drawPolygonTool', 'line', 'delete']

// 工具类型 -> 中文文案
const LABELS = {
  drawPolygonTool: '测量面积',
  line: '测量长度',
  delete: '清除',
}
const labelOf = (type) => LABELS[type] || type

// ✅ 测量工具对应的视角配置
const MEASURE_VIEW = {
  center: [114.3, 30.5],
  zoom: 14,
  pitch: 40,
  bearing: 0,
  duration: 1500,
}

// ✅ 切换视角到测量模式
function flyToMeasureView() {
  if (!map) return
  map.flyTo(MEASURE_VIEW)
  console.log('[测量工具] 已切换到测量视角')
}

// 创建绘制工具实例(按类型分支: 多边形展示面积, 线展示距离)
function createDraw(type, scene) {
  switch (type) {
    case 'drawPolygonTool':
      return new DrawPolygon(scene, {
        // 展示面积
        areaOptions: {},
      })
    case 'line':
      return new DrawLine(scene, {
        distanceOptions: {
          // 是否展示总距离
          showTotalDistance: false,
          // 是否展示一段的距离
          showDashDistance: true,
          // 展示的格式
          format: (meters) => {
            if (meters >= 1000) {
              return +(meters / 1000).toFixed(2) + 'km'
            } else {
              return +meters.toFixed(2) + 'm'
            }
          },
        },
      })
    default:
      return null
  }
}

// 绘制完成回调(DrawEvent.Add, 一次性测量): 保留图形数据并停止测量
function onDrawAdd() {
  draw?.disable()
  isActive.value = false
  setToolCursor(map, '')
}

// 获取当前绘制实例创建的所有图层(render 为各渲染器对象, 每个渲染器持有自己的图层)
function getDrawLayers(draw) {
  return Object.values(draw.render ?? {}).flatMap(
    (render) => render?.getLayers?.() ?? [],
  )
}

// 绘制实例的图层是否仍存在于场景中
// (切到地球视角时 ViewSwitch 会直接移除测量图层, 复用前需校验, 避免激活已失效的图层导致画不出图形)
function drawAlive(scene, draw) {
  return getDrawLayers(draw).some((layer) => scene.getLayers().includes(layer))
}

// 激活测量工具: 同类型复用实例(保留已绘数据), 不同类型重建
function startDrawing(type) {
  if (!scene) return

  // ✅ 激活测量时自动切换视角
  flyToMeasureView()
  // 十字准星光标: 直接作用于 mapbox 画布, 否则被 grab 指针遮挡看不见操作反馈
  setToolCursor(map, 'crosshair')

  if (draw && currentType === type && drawAlive(scene, draw)) {
    draw.enable()
    isActive.value = true
    return
  }
  stop()
  const instance = createDraw(type, scene)
  if (!instance) return
  draw = instance
  currentType = type
  draw.on(DrawEvent.Add, onDrawAdd)
  draw.enable()
  isActive.value = true
}

// 选择工具: 关闭弹窗后激活; delete 表示清除测量并退出
function selectTool(type) {
  popoverVisible.value = false
  if (type === 'delete') {
    stop()
  } else {
    startDrawing(type)
  }
}

// 清理当前绘制实例并退出测量会话
function stop() {
  if (!draw) return
  draw.disable()
  draw.clear()
  draw = null
  currentType = null
  isActive.value = false
  setToolCursor(map, '')
}

// ✅ 监听地图实例初始化
watch(
  sceneMap,
  (val) => {
    if (!val) return
    map = val.map
    scene = val.scene
  },
  { immediate: true },
)

// 组件卸载时清理绘制实例, 避免图层残留
onBeforeUnmount(stop)
</script>

<style scoped>
/* 弹窗工具列表(el-popover 内容 teleport 到 body, 需在组件自身 scoped 内定义) */
.popover-w {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: stretch;
}
.query-item {
  padding: 4px 8px;
  color: #fff;
  cursor: pointer;
}
.query-item:hover {
  background: linear-gradient(
    to bottom,
    rgba(0, 128, 255, 0.6),
    rgba(0, 128, 255, 0.281)
  );
}
</style>

