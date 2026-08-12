<template>
  <!-- 最优路径规划结果卡片 -->
  <div class="route-card">
    <button class="close-btn" @click="$emit('close')" aria-label="关闭">✕</button>
    <div class="rc-title">最优路径规划</div>
    <div class="rc-row">
      <span class="label">行驶距离</span>
      <span class="value">{{ result.distanceKm }} km</span>
    </div>
    <div class="rc-row">
      <span class="label">预计耗时</span>
      <span class="value">{{ result.timeMin }} 分钟</span>
    </div>
    <div class="rc-row">
      <span class="label">拥堵指数</span>
      <span class="value">
        <i class="dot" :style="{ background: congColor }"></i>
        {{ result.congestionIndex }}
      </span>
    </div>
    <div class="rc-row">
      <span class="label">绕行事故</span>
      <span class="value" :class="{ warn: result.avoidedAccidents > 0 }">
        {{ result.avoidedAccidents }} 处
      </span>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
})
defineEmits(['close'])

// 拥堵指数 → 颜色(绿<4, 黄4-7, 红>7)
const congColor = computed(() => {
  const v = props.result.congestionIndex
  if (v < 4) return '#2ECC40'
  if (v <= 7) return '#FFD700'
  return '#FF4D4D'
})
</script>
<style scoped>
.route-card {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 150px; /* 位于时间滑块(96px)上方, 避免重叠 */
  width: 300px;
  padding: 14px 18px 16px;
  background: rgba(83, 105, 118, 0.82);
  border-radius: 6px;
  box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 13px;
  z-index: 12;
  backdrop-filter: blur(4px);
}

.close-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.rc-title {
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #7fd6ff;
}

.rc-row {
  display: flex;
  gap: 8px;
  line-height: 1.9;
}
.rc-row .label {
  width: 70px;
  flex-shrink: 0;
  color: #9fb6c8;
}
.rc-row .value {
  display: flex;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.warn {
  color: #ffb14c;
}
</style>


