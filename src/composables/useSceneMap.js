import { inject } from 'vue'

export const SCENE_MAP_KEY = 'sceneMap'

export function useSceneMap() {
  const sceneMap = inject(SCENE_MAP_KEY)

  if (!sceneMap) {
    throw new Error('useSceneMap必须在MapContainer的子组件中使用')
  }

  return sceneMap
}