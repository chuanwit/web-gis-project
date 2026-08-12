<template>
  <!-- 交通流预测时间滑块: 底部居中横条, 与城市数字孪生共用统一时间轴 -->
  <div class="time-bar">
    <!-- 播放/暂停按钮 -->
    <button
      class="play-btn"
      :class="{ playing }"
      :title="playing ? '暂停' : '自动播放'"
      @click="togglePlaying"
    >
      <svg v-if="!playing" viewBox="0 0 24 24" width="14" height="14">
        <path d="M8 5v14l11-7z" fill="#fff" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="14" height="14">
        <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="#fff" />
      </svg>
    </button>

    <!-- 当前时刻 + 时段标签 -->
    <div class="time-info">
      <span class="time-label">{{ pad(hour) }}:00</span>
      <span class="period-label">{{ periodLabel }}</span>
    </div>

    <!-- 时间滑块 06:00~22:00(覆盖上午→傍晚→夜晚) -->
    <input
      class="slider"
      type="range"
      min="6"
      max="22"
      step="1"
      v-model.number="hour"
    />

    <!-- 拥堵色例 -->
    <div class="legend">
      <span class="legend-item"><i class="dot green"></i>畅通</span>
      <span class="legend-item"><i class="dot yellow"></i>缓行</span>
      <span class="legend-item"><i class="dot red"></i>拥堵</span>
    </div>
  </div>
</template>
<script setup>
// 交通流预测时间滑块: 直接绑定统一时间轴状态(useTimeOfDay 模块级单例),
// SmartCity 监听同一状态即可驱动道路拥堵变色与数字孪生时段, 无需事件传递。
import { computed } from 'vue'
import { useTimeOfDay, PERIOD_LABELS } from '@/composables/useTimeOfDay'

const { state, period, togglePlaying } = useTimeOfDay()

// 滑块绑定 hour(直接读写单例状态)
const hour = computed({
  get: () => state.hour,
  set: (v) => {
    state.hour = v
  },
})

const playing = computed(() => state.playing)
const periodLabel = computed(() => PERIOD_LABELS[period.value])

const pad = (n) => String(n).padStart(2, '0')
</script>
<style scoped>
.time-bar {
  position: fixed;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(83, 105, 118, 0.7);
  border-radius: 24px;
  box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 12px;
  z-index: 11;
  backdrop-filter: blur(4px);
  user-select: none;
}

.play-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(to bottom, rgba(0, 128, 255, 0.9), rgba(0, 128, 255, 0.5));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.play-btn.playing {
  background: linear-gradient(to bottom, rgba(0, 200, 120, 0.9), rgba(0, 200, 120, 0.5));
}

.time-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
  min-width: 42px;
}
.time-label {
  font-size: 16px;
  font-weight: 600;
  font-family: 'DIN', 'Arial', sans-serif;
}
.period-label {
  font-size: 11px;
  color: #9fd6ff;
}

.slider {
  width: 280px;
  accent-color: #1990ff;
  cursor: pointer;
}

.legend {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #cfd8e3;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.green {
  background: #2ecc40;
}
.dot.yellow {
  background: #ffd700;
}
.dot.red {
  background: #ff4d4d;
}
</style>


