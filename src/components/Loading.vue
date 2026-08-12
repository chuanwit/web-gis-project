<template>
  <!-- Loading 启动遮罩: 品牌字母渐出 + 进度条, 地图就绪后淡出 -->
  <!-- 借鉴参考4(华农)的 Loading 动画, 缓解数据加载焦虑 -->
  <transition name="fade">
    <div v-if="visible" class="loading-mask">
      <div class="loading-inner">
        <div class="brand">
          <span v-for="(ch, i) in brand" :key="i" class="brand-char" :style="{ animationDelay: i * 0.12 + 's' }">{{ ch }}</span>
        </div>
        <div class="subtitle">SMART CITY · WUHAN</div>
        <div class="progress-wrap">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="tip">{{ tip }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  duration: { type: Number, default: 2200 },
})

const visible = ref(true)
const progress = ref(0)
const brand = ['智', '慧', '城', '市']

const tips = [
  '正在初始化三维地球...',
  '加载城市建筑数据...',
  '构建路网拓扑...',
  '接入实时交通事件...',
  '校准数字孪生时段...',
]
const tip = ref(tips[0])

let raf = null
let startTime = 0
let tipTimer = null

onMounted(() => {
  startTime = Date.now()
  let tipIdx = 0
  tipTimer = setInterval(() => {
    tipIdx = (tipIdx + 1) % tips.length
    tip.value = tips[tipIdx]
  }, 450)

  const tick = () => {
    const elapsed = Date.now() - startTime
    progress.value = Math.min(100, (elapsed / props.duration) * 100)
    if (elapsed < props.duration) {
      raf = requestAnimationFrame(tick)
    } else {
      visible.value = false
    }
  }
  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (tipTimer) clearInterval(tipTimer)
})

// 允许外部强制关闭
defineExpose({
  close: () => (visible.value = false),
})
</script>

<style scoped>
.loading-mask {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #0d2240 0%, #050b18 100%);
}
.loading-inner {
  text-align: center;
  width: 320px;
}
.brand {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
}
.brand-char {
  font-size: 38px;
  font-weight: 700;
  color: var(--c-accent, #00e5ff);
  text-shadow: 0 0 14px rgba(0, 229, 255, 0.7);
  opacity: 0;
  transform: translateY(12px);
  animation: charIn 0.6s ease forwards;
}
@keyframes charIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.subtitle {
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--t-secondary, #8fa8c2);
  margin-bottom: 28px;
}
.progress-wrap {
  width: 100%;
  height: 3px;
  background: rgba(0, 229, 255, 0.12);
  border-radius: 2px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--c-primary, #1990ff), var(--c-accent, #00e5ff));
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
  transition: width 0.2s linear;
}
.tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--t-dim, #5f7896);
}
</style>
