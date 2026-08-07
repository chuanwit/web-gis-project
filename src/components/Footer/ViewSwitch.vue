<template>
  <div class="item">
    <button class="toggle-btn" @click="flyTo">
      <img class="btn-icon" src="@/assets/icons/crosshair.svg" alt="切换" />
    </button>
    <p>{{ flyMsg }}</p>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useSceneMap } from '@/composables/useSceneMap'

const sceneMap = useSceneMap()
const isCityView = ref(false)

// 按钮文案: 当前视角 -> 点击后要切换到的目标视角
const flyMsg = computed(() => {
  return isCityView.value ? '地球视角' : '城市视角'
})

// 城市/地球视角切换飞行
function flyTo() {
  const { map, scene } = sceneMap.value || {}
  if (!map || !scene) return

  isCityView.value = !isCityView.value

  if (isCityView.value) {
    map.flyTo({
      center: [114.3, 30.5],
      zoom: 14,
      pitch: 70,
    })
  } else {
    // 切到地球视角: 测量仅在城市视角有意义, 清理测量产生的临时图层
    // 识别依据: l7-draw 创建图层时未设置 name, L7 回退用自增数字 id 作为 name(纯数字串);
    // 城市建筑("武汉市")/道路("武汉市道路")图层设置了明确 name, 不会被误删
    scene.getLayers().forEach((layer) => {
      if (/^\d+$/.test(layer.name ?? '')) {
        scene.removeLayer(layer)
      }
    })
    map.flyTo({
      center: [114.3, 30.5],
      zoom: 1,
      pitch: 0,
    })
  }
}
</script>
