<template></template>
<script setup>
import { watch } from 'vue'
// 导入注入工具
import { useSceneMap } from '@/composables/useSceneMap'
// 扩展图层开关的共享状态
import { useLayerToggles } from '@/composables/useLayerToggles'
// 统一时间轴(交通流预测 + 数字孪生共用)
import { useTimeOfDay } from '@/composables/useTimeOfDay'
// 导入hooks
import useBuildings, { updateBuildingStyle } from './hooks/useBuildings'
import useRoads, { rebuildRoads } from './hooks/useRoads'
import useHeatmap from './hooks/useHeatmap'
import useScatterAnimate from './hooks/useScatterAnimate'
import { showFactoryModels, hideFactoryModels, flyToPark } from './hooks/useModels3d'
import useRegions, { setRegionsVisible, highlightRegion } from './hooks/useRegions'
import useResources, { setResourcesVisible, bindScene } from './hooks/useResources'
import useFlyline, { setFlylineVisible } from './hooks/useFlyline'
import { useBusinessStore, MODULE_VIEWS } from '@/stores'

// 通过inject, 获取地图场景对象(shallowRef)
const sceneMap = useSceneMap()
// 模块级单例开关状态(与 Footer 的 LayerToggle 共享)
const toggles = useLayerToggles()
// 统一时间轴状态(hour/period)
const { state: timeState, period } = useTimeOfDay()
// 业务模块状态(顶部业务导航)
const business = useBusinessStore()

// 扩展图层实例(场景就绪后创建一次)
let heatmapLayer = null
let scatterLayer = null
let buildingLayer = null
// 场景与图层是否就绪(时间联动需在就绪后执行, 避免竞态)
let sceneReady = false

watch(sceneMap, async (val) => {
  if (!val) return
  const { scene, map } = val

  // 场景加载完成后, 分别加载建筑和道路数据并创建图层(独立 try-catch 避免互相影响)
  try {
    buildingLayer = await useBuildings()
    if (!scene.getLayers().includes(buildingLayer)) scene.addLayer(buildingLayer)
  } catch (e) {
    console.error('[SmartCity] 建筑图层初始化失败:', e)
  }
  try {
    const roads_layer = await useRoads()
    if (!scene.getLayers().includes(roads_layer)) scene.addLayer(roads_layer)
  } catch (e) {
    console.error('[SmartCity] 道路图层初始化失败:', e)
  }

  // 预创建扩展图层(数据复用同一份事故事件, 避免开关时重复请求)
  const [heat, scatter] = await Promise.all([useHeatmap(), useScatterAnimate()])
  heatmapLayer = heat
  scatterLayer = scatter
  // 两个扩展图层始终挂载, 开关只切换显隐(L7 的 hide/show, 不销毁重建)
  scene.addLayer(heatmapLayer)
  scene.addLayer(scatterLayer)

  // 业务模块图层: 区域多边形 + 应急资源(始终挂载, 按业务模块显隐)
  bindScene(scene) // 为资源 popup 注入 scene
  try {
    const regionLayers = await useRegions()
    regionLayers.forEach((l) => scene.addLayer(l))
    setRegionsVisible(scene, false) // 默认隐藏(综合态势不显示)
  } catch (e) {
    console.error('[SmartCity] 区域图层初始化失败:', e)
  }
  try {
    const resLayers = await useResources()
    resLayers.forEach((l) => scene.addLayer(l))
    setResourcesVisible(scene, false) // 默认隐藏
  } catch (e) {
    console.error('[SmartCity] 资源图层初始化失败:', e)
  }
  // 飞线辐射图层(中心→5 区域弧线飞行动画, 综合态势模块展示)
  try {
    const flylineLayers = await useFlyline()
    flylineLayers.forEach((l) => scene.addLayer(l))
    setFlylineVisible(scene, business.module === 'overview') // 默认按当前模块显隐
  } catch (e) {
    console.error('[SmartCity] 飞线图层初始化失败:', e)
  }

  // 依据当前开关状态初始化(散点动图默认开启, 热力图/三维默认关闭)
  applyToggles(scene, map)
  // 依据当前业务模块初始化图层显隐
  applyBusinessModule(scene, map, business.module)
  // 依据当前时间轴时段初始化(天空/建筑灯光/道路拥堵)
  sceneReady = true
  await applyDigitalTwin(scene, map)

  // 地球视角(zoom<5)隐藏所有 L7 图层, 避免 globe 旋转时道路/建筑漂移
  let lastGlobeMode = false
  map.on('zoom', () => {
    const isGlobe = map.getZoom() < 5
    if (isGlobe === lastGlobeMode) return
    lastGlobeMode = isGlobe
    const layers = scene.getLayers()
    if (isGlobe) {
      // 进入地球视角: 隐藏全部 L7 图层(道路/建筑/区域等), 仅保留 Mapbox 底图
      layers.forEach((l) => l.hide())
    } else {
      // 回到城市视角: 恢复全部图层(不依赖实例变量, HMR 也可靠), 再按业务校正
      layers.forEach((l) => l.show())
      applyToggles(scene, map)
      // 轻量业务校正(不调 applyBusinessModule, 避免其内部 flyTo 打断用户缩放)
      setRegionsVisible(scene, business.module !== 'overview')
      setResourcesVisible(scene, business.module === 'resource')
      setFlylineVisible(scene, business.module === 'overview')
      // 强制场景重绘, 确保恢复的图层立即渲染
      scene.render && scene.render()
    }
  })
})

// 业务模块切换: 联动地图视角 + 区域/资源图层显隐
watch(
  () => business.module,
  (m) => {
    if (!sceneMap.value) return
    const { scene, map } = sceneMap.value
    applyBusinessModule(scene, map, m)
  },
)

// 选中区域变化: 高亮该区域 + 飞行定位
watch(
  () => business.selectedArea,
  (area) => {
    if (!sceneMap.value) return
    const { scene, map } = sceneMap.value
    highlightRegion(scene, area)
    if (area) {
      // 从区域数据找中心点飞行
      import('@/api/regions').then(({ getRegions }) =>
        getRegions().then((data) => {
          const f = data.features.find((x) => x.properties.area === area)
          if (f && map) {
            const [lng, lat] = f.properties.center
            map.flyTo({ center: [lng, lat], zoom: 14.5, pitch: 60, duration: 1200 })
          }
        }),
      )
    }
  },
)

// 按业务模块切换图层显隐 + 飞行视角
function applyBusinessModule(scene, map, m) {
  // 区域图层: risk/resource/simulation 显示, overview 隐藏
  const showRegions = m === 'risk' || m === 'resource' || m === 'simulation'
  setRegionsVisible(scene, showRegions)
  // 资源图层: 仅 resource 显示
  setResourcesVisible(scene, m === 'resource')
  // 飞线辐射: 仅综合态势(overview)显示, 其他模块隐藏避免视觉干扰
  setFlylineVisible(scene, m === 'overview')
  // 飞行到模块对应视角
  const view = MODULE_VIEWS[m]
  if (view && map) {
    map.flyTo({ ...view })
  }
}

// 统一时间轴变化: 交通流预测(道路拥堵变色) + 数字孪生(天空/建筑灯光/道路发光) 联动
watch(
  () => timeState.hour,
  () => {
    if (!sceneMap.value || !sceneReady) return
    applyDigitalTwin(sceneMap.value.scene, sceneMap.value.map)
  }
)

// 依据开关状态切换扩展图层显隐
function applyToggles(scene, map) {
  if (!scene) return

  // 1. 事故热力图(show/hide 幂等, init 前的 reRender 有 inited 保护)
  if (heatmapLayer) {
    toggles.heatmap ? heatmapLayer.show() : heatmapLayer.hide()
  }

  // 2. 散点动图(替代原雷达/玫瑰图, 默认开启)
  if (scatterLayer) {
    toggles.scatter ? scatterLayer.show() : scatterLayer.hide()
  }

  // 3. 三维园区厂房(threebox 独立管理图层, 只切换模型显隐, 不跳视角)
  if (toggles.model3d) {
    map && showFactoryModels(map, false)
  } else {
    hideFactoryModels(map)
  }
}

// 武汉工程大学流芳校区视角(热力图/散点开启时跳转)
const CAMPUS_VIEW = { center: [114.4286, 30.4698], zoom: 14, pitch: 60, duration: 1500 }

// 监听开关变化, 实时切换图层 + 按按钮类型跳转视角
watch(
  () => ({ ...toggles }),
  (newVal, oldVal) => {
    if (!sceneMap.value) return
    const { scene, map } = sceneMap.value
    applyToggles(scene, map)

    // 仅在开关从 false→true 时跳转视角
    for (const key of Object.keys(toggles)) {
      if (newVal[key] && !oldVal?.[key]) {
        if (key === 'model3d') {
          // 三维厂房: 飞向园区近景(地球/城市视角均可)
          flyToPark(map)
        } else if (key === 'heatmap' || key === 'scatter') {
          // 热力图/散点: 飞向流芳校区城市视角
          map.flyTo(CAMPUS_VIEW)
        }
      }
    }
  },
  { deep: true }
)

// 数字孪生: 按当前时段应用天空/建筑/道路效果
async function applyDigitalTwin(scene, map) {
  if (!scene) return
  applySky(map)
  updateBuildingStyle(period.value)
  try {
    await rebuildRoads(scene, timeState.hour)
  } catch (e) {
    console.error('[SmartCity] 道路图层时段更新失败:', e)
  }
}

// 时段 → 天空/大气配置(Mapbox setFog; setSky 仅 v3+ 支持, v2 安全跳过)
// 注意: 不使用 setLight(anchor:'map') — 在 globe 投影下会在地球表面
//       产生固定的昼夜分界线, 导致一个半球过暗不可见
//       但 setLight(anchor:'viewport') 是安全的, 光源跟随视角移动
const PERIOD_SKY = {
  morning: {
    fog: {
      color: '#f5d6b8', // 暖琥珀色地平线(日出光晕)
      'high-color': '#8ec5e8', // 柔和天蓝
      'horizon-blend': 0.45, // 较宽过渡, 展现日出漫射
      'space-color': '#6ba3d0',
      range: [2, 12],
      'star-intensity': 0.5, // 晨曦中可见残星
    },
    light: { color: '#fff4e0', intensity: 0.3 }, // 暖光
  },
  afternoon: {
    fog: {
      color: '#b8dcf5', // 晴朗天蓝
      'high-color': '#4a90d9', // 高空深蓝
      'horizon-blend': 0.3,
      'space-color': '#2e7bc4',
      range: [2, 14],
      'star-intensity': 0.3, // 白天微弱星光
    },
    light: { color: '#ffffff', intensity: 0.5 }, // 明亮白光
  },
  dusk: {
    fog: {
      color: '#ff6b35', // 绚丽落日橙
      'high-color': '#9b3a8e', // 高空品紫
      'horizon-blend': 0.55, // 宽过渡, 营造晚霞渐变
      'space-color': '#2a1045', // 深紫太空
      range: [1.5, 10],
      'star-intensity': 0.7, // 暮色中星光渐亮
    },
    light: { color: '#ff9966', intensity: 0.4 }, // 橙色暮光
  },
  night: {
    fog: {
      color: '#0a1929', // 幽蓝地平线
      'high-color': '#0d2540', // 深蓝高空
      'horizon-blend': 0.3,
      'space-color': '#050b18', // 极深太空
      range: [1.5, 10],
      'star-intensity': 0.9, // 繁星闪烁
    },
    light: { color: '#4a6fa5', intensity: 0.15 }, // 微弱蓝光
  },
}

// 应用天空/大气效果(mapbox setFog + setLight 辅助)
function applySky(map) {
  if (!map) return
  const cfg = PERIOD_SKY[period.value] || PERIOD_SKY.morning
  console.log('[SmartCity] applySky 时段:', period.value, '| fog color:', cfg.fog.color)
  try {
    map.setFog(cfg.fog)
  } catch (e) {
    console.warn('[SmartCity] setFog 失败:', e.message)
  }
  // 辅助: 视口光源(影响 3D 建筑亮度, 不影响地球表面昼夜分界)
  try {
    map.setLight({ anchor: 'viewport', color: cfg.light.color, intensity: cfg.light.intensity })
  } catch (e) {
    // setLight 在某些场景可能不可用, 忽略
  }
}
</script>
<style></style>
