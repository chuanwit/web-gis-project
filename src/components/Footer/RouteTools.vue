<template>
  <div class="item">
    <el-popover
      v-model:visible="popoverVisible"
      placement="top"
      trigger="click"
      popper-style="background-color:#53697670;color:#fff"
      :width="150"
    >
      <template #reference>
        <button class="toggle-btn" :class="{ active: isActive }">
          <img class="btn-icon" src="@/assets/icons/route.svg" alt="路径规划" />
        </button>
      </template>
      <div class="popover-w column">
        <span class="query-item" @click="startPlanning">开始路径规划</span>
        <span class="query-item" @click="stop">清除</span>
        <label class="query-item checkbox-item">
          <input type="checkbox" v-model="avoidAccidents" />
          <span>避让事故</span>
        </label>
      </div>
    </el-popover>
    <p>路径规划</p>
  </div>

  <!-- 选择起/终点提示气泡 -->
  <div v-if="isActive" class="route-tip">
    {{ tipText }}
  </div>

  <!-- 路径结果卡片 -->
  <RouteResultCard
    v-if="routeResult"
    :result="routeResult"
    @close="routeResult = null"
  ></RouteResultCard>
</template>
<script setup>
// 功能组件: 最优路径规划(点击起点→终点, 路网图 A* 求最短路, 事故自动绕行)
// 交互状态机: idle → picking(等待点起点/终点) → done(展示路线与结果卡片)
//   路网图由 @/utils/routeGraph 离线构建(2314 条道路 LineString), 无网络依赖。
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { PointLayer, LineLayer } from '@antv/l7'
import { useSceneMap } from '@/composables/useSceneMap'
import { useTimeOfDay } from '@/composables/useTimeOfDay'
import { findRoute, preloadRouteGraph } from '@/utils/routeGraph'
import { setToolCursor } from '@/utils/mapCursor'
import RouteResultCard from './RouteResultCard.vue'

const sceneMap = useSceneMap()
const { state: timeState } = useTimeOfDay()

let map = null
let scene = null

// 城市初始视角: 激活路径选择时切换到城市俯视, 便于点击起终点
const CITY_VIEW = { center: [114.3, 30.5], zoom: 14, pitch: 70 }

const popoverVisible = ref(false)
// 是否处于选择起/终点模式
const isActive = ref(false)
// 当前等待选择起点还是终点
const pickingStart = ref(true)
// 是否避让事故(对事故附近路段加大权重 → 自动绕行)
const avoidAccidents = ref(true)
// 路径结果
const routeResult = ref(null)

// 临时图层实例
let startMarker = null // 起点圆点
let endMarker = null // 终点圆点
let routeLine = null // 路径线
let clickHandler = null

// 起终点坐标
let startCoord = null
let endCoord = null

const tipText = computed(() => {
  if (!isActive.value) return ''
  return pickingStart.value ? '请点击地图选择起点' : '请点击地图选择终点'
})

function ensureScene() {
  const v = sceneMap.value
  if (v) {
    map = v.map
    scene = v.scene
  }
  return !!scene
}

// 激活选择模式
function startPlanning() {
  popoverVisible.value = false
  if (!ensureScene()) return
  // 切到城市视角 + 十字准星光标(直接作用于画布, 否则被 grab 指针遮挡看不见反馈)
  map.flyTo({ ...CITY_VIEW, duration: 1200 })
  setToolCursor(map, 'crosshair')
  isActive.value = true
  pickingStart.value = true
  clickHandler = (e) => onMapClick(e)
  map.on('click', clickHandler)
}

// 地图点击: 收集起点/终点, 成对后计算路径
function onMapClick(e) {
  const coord = [e.lngLat.lng, e.lngLat.lat]
  if (pickingStart.value) {
    startCoord = coord
    setMarker('start', coord)
    pickingStart.value = false
  } else {
    endCoord = coord
    setMarker('end', coord)
    pickingStart.value = true
    computeRoute()
  }
}

// 打点(起点绿 / 终点红)
function setMarker(role, coord) {
  const isStart = role === 'start'
  if (isStart && startMarker) {
    scene.removeLayer(startMarker)
    startMarker = null
  }
  if (!isStart && endMarker) {
    scene.removeLayer(endMarker)
    endMarker = null
  }
  const layer = new PointLayer({
    name: isStart ? 'route-start' : 'route-end',
    zIndex: 10,
  })
    .source({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coord },
        },
      ],
    })
    .shape('circle')
    .size(14)
    .color(isStart ? '#2ECC40' : '#FF4D4D')
    .style({ stroke: '#ffffff', strokeWidth: 2 })
  scene.addLayer(layer)
  if (isStart) startMarker = layer
  else endMarker = layer
}

// 计算并绘制路径
async function computeRoute() {
  const result = await findRoute(startCoord, endCoord, {
    avoidAccidents: avoidAccidents.value,
    hour: timeState.hour,
  })
  if (!result) {
    console.warn('[路径规划] 未找到可行路径')
    return
  }
  if (routeLine) {
    scene.removeLayer(routeLine)
    routeLine = null
  }
  routeLine = new LineLayer({
    name: 'route-line',
    zIndex: 5,
  })
    .source({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: result.coordinates,
          },
        },
      ],
    })
    .shape('line')
    .size(4)
    .color('#00D4FF')
    .style({ opacity: 0.95 })
  scene.addLayer(routeLine)

  routeResult.value = result
  // 计算完成, 退出选择模式
  exitPickMode()
}

function exitPickMode() {
  isActive.value = false
  if (map && clickHandler) {
    map.off('click', clickHandler)
    clickHandler = null
  }
  setToolCursor(map, '')
}

// 清除所有路径相关图层并复位
function stop() {
  exitPickMode()
  if (scene) {
    ;[startMarker, endMarker, routeLine].forEach((l) => l && scene.removeLayer(l))
  }
  startMarker = null
  endMarker = null
  routeLine = null
  startCoord = null
  endCoord = null
  routeResult.value = null
}

// 监听地图实例初始化
watch(
  sceneMap,
  (val) => {
    if (!val) return
    map = val.map
    scene = val.scene
  },
  { immediate: true },
)

// 挂载时后台预热路网图(建图+事故屏蔽边约数百 ms), 避免首次点击卡顿
onMounted(() => {
  preloadRouteGraph()
})

// 组件卸载时清理
onBeforeUnmount(stop)
</script>
<style scoped>
/* 选择起/终点提示气泡 */
.route-tip {
  position: fixed;
  left: 50%;
  bottom: 152px;
  transform: translateX(-50%);
  padding: 8px 20px;
  background: rgba(0, 128, 255, 0.75);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 0 8px 2px rgba(0, 0, 0, 0.3);
  z-index: 12;
  animation: tip-pulse 1.2s infinite;
}
@keyframes tip-pulse {
  50% {
    opacity: 0.6;
  }
}

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
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.checkbox-item input {
  cursor: pointer;
}
</style>


