<template>
  <!-- 顶部 Header: 天气(左) + 标题(中) + 时段(右) -->
  <!-- 借鉴参考4(华农)的实时天气展示 + 时间轴联动 -->
  <header class="header">
    <!-- 左侧: 实时天气 -->
    <div class="header-left">
      <span class="weather-icon">{{ weatherIcon }}</span>
      <div class="weather-info">
        <span class="weather-temp num-mono">{{ weather.temp }}°C</span>
        <span class="weather-text">{{ weather.text }} · {{ weather.wind }}</span>
      </div>
    </div>

    <!-- 中间: 标题(点击一键回首页: 综合态势 + 城市俯瞰) -->
    <div class="header-title" @click="goHome" title="点击返回综合态势">智慧城市-武汉</div>

    <!-- 右侧: 当前时段 -->
    <div class="header-right">
      <span class="time-hour num-mono">{{ String(time.hour).padStart(2, '0') }}:00</span>
      <span class="time-period">{{ periodLabel }}</span>
    </div>
  </header>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import request from '@/api/requests.js'
import { useTimeStore, useBusinessStore, PERIOD_LABELS } from '@/stores'

const time = useTimeStore()
const business = useBusinessStore()
const periodLabel = computed(() => PERIOD_LABELS[time.period] || '')

// 一键回首页: 切换到综合态势模块(地图 flyTo 由 business.module watch 自动处理)
function goHome() {
  business.setModule('overview')
}

// 天气数据(mock /api/weather 按时段返回)
const weather = ref({ temp: 18, text: '晴', humidity: 65, wind: '东南风2级' })

// 天气图标映射
const weatherIcon = computed(() => {
  const t = weather.value.text || ''
  if (t.includes('雨')) return '🌧'
  if (t.includes('雪')) return '❄'
  if (t.includes('云')) return '⛅'
  if (t.includes('阴')) return '☁'
  return '☀' // 晴
})

// 时段变化时重新获取天气
async function fetchWeather(hour) {
  try {
    const data = await request({
      url: '/api/weather',
      method: 'GET',
      params: { hour },
    })
    if (data) weather.value = data
  } catch (e) {
    console.warn('[Header] 天气获取失败, 使用默认值:', e.message)
  }
}

watch(
  () => time.hour,
  (h) => fetchWeather(h),
  { immediate: true },
)
</script>
<style scoped>
.header {
  width: 100%;
  height: 100%;
  font-size: 32px;
  background: url('@/assets/imgs/Header.png') center no-repeat;
  background-size: cover;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  box-sizing: border-box;
  z-index: 1;
}

/* 中间标题(保持原有视觉, 可点击回首页) */
.header-title {
  flex: 1;
  text-align: center;
  line-height: 100px;
  font-size: 32px;
  letter-spacing: 4px;
  text-shadow: 0 0 12px rgba(0, 229, 255, 0.6);
  cursor: pointer;
  transition: text-shadow 0.25s ease;
}
.header-title:hover {
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.9);
}

/* 左侧天气 */
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  font-size: 13px;
}
.weather-icon {
  font-size: 28px;
  filter: drop-shadow(0 0 6px rgba(0, 229, 255, 0.5));
}
.weather-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.weather-temp {
  font-size: 20px;
  font-weight: 600;
  color: #00e5ff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
}
.weather-text {
  font-size: 11px;
  color: #c6d6e8;
  letter-spacing: 0.5px;
}

/* 右侧时段 */
.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 220px;
  text-align: right;
}
.time-hour {
  font-size: 20px;
  font-weight: 600;
  color: #7fd6ff;
  text-shadow: 0 0 8px rgba(127, 214, 255, 0.5);
}
.time-period {
  font-size: 11px;
  color: #c6d6e8;
  letter-spacing: 1px;
}
</style>
