// 统一时间轴(模块级单例: 各组件引用同一 reactive 对象, 一处改动全局同步)
// 任务二「交通流预测时间滑块」与任务三「城市数字孪生时段」共用这一个时间状态:
//   hour   → 道路拥堵程度(任务二)
//   period → 天空/建筑灯光/道路发光(任务三)
// 仿 useLayerToggles.js 的模块级单例模式, 保证 Footer 的滑块与 SmartCity 的图层联动。
import { reactive, computed } from 'vue'

const state = reactive({
  hour: 8, // 当前小时 0-23(默认上午 8 点)
  playing: false, // 是否自动播放(每小时一跳的演示快进)
})

// 时段划分: 6-10 上午 | 11-15 下午 | 16-18 傍晚 | 19-23,0-5 夜晚
export function hourToPeriod(hour) {
  if (hour >= 6 && hour <= 10) return 'morning'
  if (hour >= 11 && hour <= 15) return 'afternoon'
  if (hour >= 16 && hour <= 18) return 'dusk'
  return 'night'
}

// 时段的中文文案
export const PERIOD_LABELS = {
  morning: '上午',
  afternoon: '下午',
  dusk: '傍晚',
  night: '夜晚',
}

// 当前时段(派生值)
const period = computed(() => hourToPeriod(state.hour))

// 自动播放定时器句柄(单例内管理, 卸载即停)
let timer = null

// 播放/暂停: 每小时一跳(演示用快进), 24 小时后回到 0 循环
function startPlaying() {
  if (timer) return
  timer = setInterval(() => {
    state.hour = (state.hour + 1) % 24
  }, 1200) // 每 1.2 秒推进 1 小时
}
function stopPlaying() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 切换播放状态(TimeBar 播放按钮调用)
function togglePlaying() {
  state.playing = !state.playing
  if (state.playing) startPlaying()
  else stopPlaying()
}

// 设置小时(滑块调用), 同时自动纠正播放状态
function setHour(h) {
  state.hour = Math.max(0, Math.min(23, Math.round(h)))
}

// 提供给 TimeBar / SmartCity 使用
export function useTimeOfDay() {
  return {
    state,
    period,
    PERIOD_LABELS,
    setHour,
    togglePlaying,
  }
}
