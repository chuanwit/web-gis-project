// 地图场景状态: 由 MapContainer 在 onMounted 时写入 scene/map 实例
// 同时保留 provide/inject 作为主通道(与组件生命周期绑定), Pinia 作为镜像供非后代组件访问
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

// shallowRef: 地图实例层次深, 避免深度代理
const sceneRef = shallowRef(null)

export const useMapStore = defineStore('map', () => {
  const setSceneMap = (val) => {
    sceneRef.value = val
  }
  const getSceneMap = () => sceneRef.value
  return { sceneRef, setSceneMap, getSceneMap }
})
