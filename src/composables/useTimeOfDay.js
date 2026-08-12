// 统一时间轴(代理到 Pinia time store, 保持老组件接口不变)
// 老接口: { state: {hour, playing}, period, PERIOD_LABELS, setHour, togglePlaying }
import { reactive } from 'vue'
import { useTimeStore, hourToPeriod, PERIOD_LABELS } from '@/stores/time'

export { hourToPeriod, PERIOD_LABELS }

export function useTimeOfDay() {
  const store = useTimeStore()
  // 构建 reactive state 代理到 store(保持老接口 state.hour / state.playing 读写)
  const state = reactive({
    get hour() {
      return store.hour
    },
    set hour(v) {
      store.hour = v
    },
    get playing() {
      return store.playing
    },
    set playing(v) {
      store.playing = v
    },
  })
  return {
    state,
    period: store.period, // computed ref
    PERIOD_LABELS,
    setHour: (h) => store.setHour(h),
    togglePlaying: () => store.togglePlaying(),
  }
}
