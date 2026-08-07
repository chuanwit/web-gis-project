<template>
  <div class="item">
    <button
      class="toggle-btn"
      :class="{ active: isRotating }"
      :title="isRotating ? '停止自转' : '开始自转'"
      @click="handleRotation"
    >
      <img class="btn-icon" :src="globeIcon" alt="自转" />
    </button>
    <p>{{ isRotating ? '停止自转' : '开始自转' }}</p>
  </div>
</template>

<script setup>
// 切换地球的自转/停止状态, 初始状态为自转中
import { ref, watch, onBeforeUnmount } from 'vue'
import { useSceneMap } from '@/composables/useSceneMap.js'
import globeIcon from '@/assets/icons/globe.svg'

const sceneMap = useSceneMap()

// 是否处于自转状态, 初始为自转中
const isRotating = ref(true)

// 保存地图实例与 moveend 监听函数, 便于移除, 避免重复注册导致自转加速
let mapInstance = null
let onMoveEnd = null

// 让地球自转一格(经度+10), 复制一份 center, 避免修改 getCenter() 返回的对象
function rotateOnce(map) {
  const center = map.getCenter()
  map.easeTo({
    center: { lng: center.lng + 10, lat: center.lat },
    duration: 1000,
    easing: (n) => n,
  })
}

// 注册 moveend 监听并开始自转
function startRotation(map) {
  rotateOnce(map)
  // 先移除旧的监听, 防止每次调用都新增监听导致不断累积
  if (onMoveEnd) {
    map.off('moveend', onMoveEnd)
  }
  onMoveEnd = () => {
    // 停止自转或地图放大到一定程度时暂停自转
    if (!isRotating.value || map.getZoom() >= 5) return
    rotateOnce(map)
  }
  map.on('moveend', onMoveEnd)
  
}

// 停止自转: 立即中断当前动画并移除监听
function stopRotation(map) {
  map.stop()
  if (onMoveEnd) {
    map.off('moveend', onMoveEnd)
    onMoveEnd = null
  }
}

// 切换自转/停止状态
function handleRotation() {
  isRotating.value = !isRotating.value
  if (!mapInstance) return
  if (isRotating.value) {
    startRotation(mapInstance)
  } else {
    stopRotation(mapInstance)
  }
}

// 等地图初始化完成后再启动初始自转
watch(sceneMap, (val) => {
  if (!val) return

  const { map } = val
  mapInstance = map
  startRotation(map)
})

// 组件卸载时移除监听, 避免内存泄漏
onBeforeUnmount(() => {
  if (mapInstance && onMoveEnd) {
    mapInstance.off('moveend', onMoveEnd)
  }
})
</script>

<style scoped></style>
