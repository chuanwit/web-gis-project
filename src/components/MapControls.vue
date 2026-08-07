<template></template>
<script setup>
// 导入vue
import { watch } from 'vue'
// 导入logo图片(经Vite处理, 返回真实的图片URL)
import logo from '@/assets/imgs/WIT.png'
// 导入注入工具
import { useSceneMap } from '@/composables/useSceneMap'
// 导入控件
import {
  Logo,
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

  // ✅ 添加logo控件 - 放大并放在左上角
  const logoControl = new Logo({
    img: logo,
    url: 'http://www.x-zd.com',
    position: 'topleft',        // ✅ 左上角
    // 通过样式属性控制大小
    style: {
      width: '120px',           // ✅ 宽度调大
      height: 'auto',           // 高度自适应
    },
  })
  scene.addControl(logoControl)

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

<!-- ✅ 添加全局样式进一步控制 Logo 大小 -->
<style>
/* 自定义 Logo 控件样式 - 放大 */
.l7-control-logo {
  width: 120px !important;      /* 宽度 */
  height: auto !important;      /* 高度自适应 */
}

/* 或者使用更精确的选择器 */
.l7-control-logo img {
  width: 100% !important;       /* 图片填满容器 */
  height: auto !important;      /* 保持比例 */
  max-width: 150px !important;  /* 最大宽度限制 */
}

/* Logo 容器背景和圆角优化 */
.l7-control-logo {
  background: rgba(0, 0, 0, 0.6) !important;
  padding: 8px 12px !important;
  border-radius: 8px !important;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
</style>