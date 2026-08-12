// 图层开关状态: heatmap / scatter / model3d
// 迁移自 useLayerToggles.js
import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useLayerStore = defineStore('layers', () => {
  const toggles = reactive({
    heatmap: false,
    scatter: true,
    model3d: false,
  })
  function toggle(key) {
    if (key in toggles) toggles[key] = !toggles[key]
  }
  function set(key, val) {
    if (key in toggles) toggles[key] = val
  }
  return { toggles, toggle, set }
})


