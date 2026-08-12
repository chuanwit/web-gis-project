// 扩展图层开关(代理到 Pinia layers store, 保持老接口不变)
// 老接口: 返回 reactive 对象 { heatmap, scatter, model3d }
import { useLayerStore } from '@/stores/layers'

export function useLayerToggles() {
  const store = useLayerStore()
  // store.toggles 是 reactive 对象, Pinia 单例保证跨组件共享
  return store.toggles
}
