<template>
  <div class="item">
    <button
      class="toggle-btn"
      :class="{ active: phase !== 'idle' }"
      @click="toggleDraw"
    >
      <img
        class="btn-icon"
        src="@/assets/icons/pen-tool.svg"
        alt="事故查询"
      />
    </button>
    <p>事故查询</p>
  </div>
  <!-- 查询结果表格(右上角 x 即关闭并退出会话) -->
  <DisplayCard
    v-if="showTable"
    :table-data="dataSource"
    @close="toggleDraw"
    @select="onSelectEvent"
  ></DisplayCard>
  <!-- AI 智能分析卡片(点击事故行弹出) -->
  <AiAnalysisCard
    v-if="showAi"
    :feature="aiFeature"
    @close="aiFeature = null"
  ></AiAnalysisCard>
</template>
<script setup>
// 功能组件: 事故查询(矩形拉框查询), 绘制工具实例由本组件自行管理
// 交互状态机(简化):
//   idle(未激活) → 点按钮 → drawing(矩形绘制中, 拉框范围可见)
//   drawing → 绘制完成(Add 事件) → 有结果: result(展示表格, 绘制工具已关闭); 无结果: 保持 drawing 可继续画
//   result → 点表格 x / 再点按钮 → idle(清空结果并恢复城市初始视角)
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { DrawEvent, DrawRect } from '@antv/l7-draw'
import DisplayCard from './DisplayCard.vue'
import AiAnalysisCard from './AiAnalysisCard.vue'
import { useSceneMap } from '@/composables/useSceneMap'
import { point, polygon, booleanPointInPolygon } from '@turf/turf'
import { getEvents } from '@/api'
import { setToolCursor } from '@/utils/mapCursor'

const sceneMap = useSceneMap()

// 城市初始视角: 激活拉框与关闭结果表格时使用
const CITY_VIEW = { center: [114.3, 30.5], zoom: 14, pitch: 70 }

// 当前矩形绘制实例
let draw = null

// 事故数据(绘制完成后用于筛选)
let eventsData = null

// 查询结果
const dataSource = ref([])
// 有查询结果时显示表格
const showTable = computed(() => dataSource.value.length > 0)

// 会话阶段: idle | drawing | result
const phase = ref('idle')

// AI 智能分析: 点击事故行后选中该事件(卡片可关闭)
const aiFeature = ref(null)
const showAi = computed(() => !!aiFeature.value)

// 选中事故行: 交给 AI 分析卡片
function onSelectEvent(feature) {
  aiFeature.value = feature
}

onMounted(async () => {
  const res = await getEvents()
  eventsData = res.features
})

// 创建并激活矩形拉框工具
// 说明: l7-draw 的 DrawRect 默认 trigger:'click'(需两次点击才画框), 用户按 README 是拖拽,
//       因此显式指定 trigger:'drag' 支持拖拽画框。
//       光标: l7-draw 把十字准星设在 .l7-marker-container 上, 被 mapbox 画布的 grab 指针遮挡,
//       必须直接作用于画布才能让用户看到工具已激活(否则"看不见"操作反馈)。
function startDrawing(fly = false) {
  clearDraw()
  const { scene, map } = sceneMap.value || {}
  if (!scene) return
  if (fly) map?.flyTo({ ...CITY_VIEW, duration: 1200 })
  setToolCursor(map, 'crosshair')
  draw = new DrawRect(scene, { trigger: 'drag' })
  draw.enable()
  draw.on(DrawEvent.Add, onDrawAdd)
  phase.value = 'drawing'
}

// 清理当前绘制实例并恢复默认光标(保留会话阶段, 用于"绘制完成展示结果")
function clearDraw() {
  if (!draw) return
  draw.disable()
  draw.clear()
  draw = null
  setToolCursor(sceneMap.value?.map, '')
}

// 绘制完成回调(DrawEvent.Add, 绘制完成时触发一次): 筛选框内事故点
function onDrawAdd(feature) {
  let resData = []
  if (eventsData && eventsData.length && feature) {
    const {
      geometry: { coordinates },
    } = feature

    // 使用 turf 判断哪些事故点落在绘制的拉框中
    resData = eventsData.filter((item) => {
      const { geometry } = item
      if (geometry.type === 'Point') {
        return booleanPointInPolygon(
          point(geometry.coordinates),
          polygon(coordinates),
        )
      }
      return false
    })
  }
  dataSource.value = resData

  // 绘制完成即关闭绘制工具
  clearDraw()
  if (resData.length) {
    // 有结果: 展示表格, 等待用户关闭
    phase.value = 'result'
  } else {
    // 无结果: 重新激活拉框, 可继续画
    startDrawing()
  }
}

// 点击事故查询按钮: 激活 / 退出会话(退出同时清空结果并恢复城市初始视角)
function toggleDraw() {
  if (phase.value === 'idle') {
    startDrawing(true)
  } else {
    clearDraw()
    dataSource.value = []
    aiFeature.value = null
    phase.value = 'idle'
    sceneMap.value?.map?.flyTo({ ...CITY_VIEW })
  }
}

// 组件卸载时清理绘制实例, 避免图层残留
onBeforeUnmount(clearDraw)
</script>
