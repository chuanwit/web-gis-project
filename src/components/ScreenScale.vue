<template>
  <!-- 大屏等比缩放容器: 固定设计稿尺寸, 窗口变化时整体缩放, 内容不挤压 -->
  <div class="screen-scale">
    <div
      class="screen"
      :style="{
        width: designWidth + 'px',
        height: designHeight + 'px',
        transform: `scale(${scale})`,
      }"
    >
      <slot></slot>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// 设计稿尺寸(默认 1920x1080), 窗口任意缩放时整体等比 scale, 保持比例不挤压
const props = defineProps({
  designWidth: {
    type: Number,
    default: 1920,
  },
  designHeight: {
    type: Number,
    default: 1080,
  },
})

const scale = ref(1)

function updateScale() {
  scale.value = Math.min(
    window.innerWidth / props.designWidth,
    window.innerHeight / props.designHeight,
  )
}

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScale)
})
</script>
<style scoped>
.screen-scale {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

.screen {
  position: relative;
  flex-shrink: 0;
  transform-origin: center center;
}
</style>
