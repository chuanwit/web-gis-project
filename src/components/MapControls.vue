<template></template>
<script setup>
// 导入vue
import { watch } from 'vue'
// 导入注入工具
import { useSceneMap } from '@/composables/useSceneMap'
// 导入控件
import {
  Zoom,
  Fullscreen,
  MouseLocation,
  MapTheme,
} from '@antv/l7-component'

const sceneMap = useSceneMap()

// 地图就绪后注册控件
watch(sceneMap, (val) => {
  if (!val) return
  const { scene } = val

  // 鼠标位置控件
  const mouseLocation = new MouseLocation({
    transform: ([lng, lat]) => [+lng.toFixed(4), +lat.toFixed(4)],
    position: 'bottomcenter',
  })
  scene.addControl(mouseLocation)

  // 添加放大缩小控件
  const zoom = new Zoom({
    zoomInTitle: '放大',
    zoomOutTitle: '缩小',
    position: 'bottomright',
  })
  scene.addControl(zoom)

  // 添加全屏控件
  const fullscreen = new Fullscreen({
    btnText: '全屏',
    exitBtnText: '退出全屏',
  })
  scene.addControl(fullscreen)

  // 主题切换控件
  const mapTheme = new MapTheme()
  scene.addControl(mapTheme)
})
</script>

<style></style>

