// 地图工具光标: 工具激活时把鼠标指针改为十字准星, 提供可见的操作反馈
// 背景: l7-draw 把 cursor 设在 .l7-marker-container 上, 但该容器位于 mapbox 画布之上,
//       而画布自身是 grab 指针 → 十字光标永远不显示, 用户看不到工具已激活。
//       这里直接作用于 mapbox 画布(实际的鼠标命中元素)。
export function setToolCursor(map, cursor) {
  const canvas = map?.getCanvas?.()
  if (canvas) canvas.style.cursor = cursor || ''
  // 同步到 l7-draw 依赖的容器, 保持两处一致
  const container = map?.getContainer?.()
  const markerBox = container?.querySelector?.('.l7-marker-container')
  if (markerBox) markerBox.style.cursor = cursor || ''
}
