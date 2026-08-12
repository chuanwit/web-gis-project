// 时间轴状态: hour(0-23) / playing / period(派生)
// 迁移自 useTimeOfDay.js, 保留同名导出以兼容老组件
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 时段划分: 6-10 上午 | 11-15 下午 | 16-18 傍晚 | 19-23,0-5 夜晚
export function hourToPeriod(hour) {
  if (hour >= 6 && hour <= 10) return 'morning'
  if (hour >= 11 && hour <= 15) return 'afternoon'
  if (hour >= 16 && hour <= 18) return 'dusk'
  return 'night'
}

export const PERIOD_LABELS = {
  morning: '上午',
  afternoon: '下午',
  dusk: '傍晚',
  night: '夜晚',
}

export const useTimeStore = defineStore('time', () => {
  const hour = ref(8)
  const playing = ref(false)
  const period = computed(() => hourToPeriod(hour.value))

  let timer = null
  function startPlaying() {
    if (timer) return
    timer = setInterval(() => {
      hour.value = (hour.value + 1) % 24
    }, 1200)
  }
  function stopPlaying() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  function togglePlaying() {
    playing.value = !playing.value
    if (playing.value) startPlaying()
    else stopPlaying()
  }
  function setHour(h) {
    hour.value = Math.max(0, Math.min(23, Math.round(h)))
  }

  return { hour, playing, period, setHour, togglePlaying, startPlaying, stopPlaying }
})
