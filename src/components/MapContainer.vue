<template>
  <div class="map-container">
    <!-- 地图容器: 由 Vue 管理 DOM 生命周期(模板 ref), 占满父容器 -->
    <div ref="mapEl" id="map" class="map-el"></div>
    <!-- 上层面板(子组件处于 MapContainer 内部, 可通过 inject 获取地图场景) -->
    <slot></slot>
  </div>
</template>

<script setup>
// 1. 初始化mapboxgl实例(map), 初始化L7的地图场景(scene)
// 2. 通过provide提供给后代组件使用
import { ref, shallowRef, onMounted, onBeforeUnmount, provide } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Scene } from '@antv/l7'
import { Mapbox } from '@antv/l7-maps'

import { SCENE_MAP_KEY } from '@/composables/useSceneMap.js'
import { useMapStore } from '@/stores'

const mapStore = useMapStore()

// 获取地图容器对应的dom元素
const mapEl = ref(null)

// 地图与场景实例对象层次比较深(shallowRef, 避免被 Vue 深度代理, 只保留第一层的代理)
const sceneMap = shallowRef(null)

onMounted(() => {
  // console.log(mapEl.value)
  // 1. 创建Mapbox的map实例对象
  const map = new mapboxgl.Map({
    container: mapEl.value, // 指定地图容器元素
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [114.3, 30.5],
    zoom: 14, // 初始即城市视角(非地球俯瞰), 避免 Loading 后再飞行
    projection: 'globe',
    accessToken: import.meta.env.VITE_TOKEN,
    pitch: 70,
  })
  map.on('style.load', () => {
    // 设置地球的初始大气层(morning 默认, 后续由 SmartCity applySky 按时段覆盖)
    // 注意: 不能用 setFog({}) 空对象, 否则会覆盖 applySky 设置的时段雾化
    map.setFog({
      color: '#f5d6b8',
      'high-color': '#8ec5e8',
      'horizon-blend': 0.45,
      'space-color': '#6ba3d0',
      range: [2, 12],
      'star-intensity': 0.5,
    })
  })

  // 2. 创建L7的场景
  const scene = new Scene({
    id: 'map', // 指定地图容器的id, 给上面的div的id值保持一致
    map: new Mapbox({
      mapInstance: map,
    }), // 指定L7使用的底图, 将mapbox创建map对象和L7场景使用的底图关联
    logoVisible: false, // 不显示L7的logo
  })
  // 设置sceneMap.value的值, 为后续组件提供地图场景和地图实例对象
  sceneMap.value = { scene, map }
  // 同步镜像到 Pinia map store(供非后代组件如 AI 助手访问)
  mapStore.setSceneMap({ scene, map })

  // 修正 CSS 缩放下 L7 的点击坐标偏差(见 patchL7ContainerScale 注释)
  // 注意: 必须用 scene.getMapService()(L7 地图服务), 不能用 scene.map(mapbox 实例)
  patchL7ContainerScale(scene.getMapService(), mapEl.value)
})

// L7 交互坐标修正: ScreenScale 用 CSS `transform: scale(k)` 缩放整个大屏容器,
// 此时 mapbox 的 unproject 期望的是"布局坐标"(mapbox 内部会读取祖先 transform 折算),
// 而 L7 的 InteractionService 却用 getBoundingClientRect(视觉坐标) 计算点击像素,
// 两者相差因子 k → 点击处与实际落点对不上(k=1 即未缩放时无影响)。
// 这里在 L7 地图服务层做 视觉↔布局 换算, 使点击/绘制精确对齐。
function patchL7ContainerScale(mapService, el) {
  // 有效缩放系数 = 视觉宽度 / 布局宽度 (offsetWidth 不受 CSS transform 影响)
  const getScale = () => {
    if (!el) return 1
    const rect = el.getBoundingClientRect()
    return rect.width > 0 ? rect.width / el.offsetWidth : 1
  }
  const rawToLngLat = mapService.containerToLngLat.bind(mapService)
  const rawLngLatTo = mapService.lngLatToContainer.bind(mapService)
  // 像素 → 经纬度: 先除以 k 还原为布局像素, 再交给 mapbox.unproject
  mapService.containerToLngLat = (pixel) => {
    const k = getScale()
    return k === 1 ? rawToLngLat(pixel) : rawToLngLat([pixel[0] / k, pixel[1] / k])
  }
  // 经纬度 → 像素: mapbox 返回布局像素, 乘回 k 交给视觉空间的调用方
  mapService.lngLatToContainer = (lngLat) => {
    const k = getScale()
    const xy = rawLngLatTo(lngLat)
    return k === 1 ? xy : [xy[0] * k, xy[1] * k]
  }
}

onBeforeUnmount(() => {
  // 1. 销毁L7的场景
  sceneMap.value?.scene.destroy() // 确保不会出现undefined报错
  // 2. 销毁Mapbox的map实例
  sceneMap.value?.map.remove()
  sceneMap.value = null
})
// 3. 通过provide提供给后代组件使用
provide(SCENE_MAP_KEY, sceneMap)
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.map-el {
  width: 100%;
  height: 100%;
}
</style>


