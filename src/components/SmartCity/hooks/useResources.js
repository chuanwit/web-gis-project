// 应急资源图层(业务模块: 应急资源可达)
// 医院/消防/交警点位 + 服务半径缓冲区, 借鉴参考6(热环境)的资源可达分析
import { getResources } from '@/api/regions'
import { PointLayer, PolygonLayer } from '@antv/l7'
import { buffer } from '@turf/turf'

// 资源类型 -> 颜色
const TYPE_COLORS = {
  hospital: '#ff4d6d', // 医院-红
  fire: '#ffb020', // 消防-橙
  police: '#1990ff', // 交警-蓝
}
const TYPE_ICONS = {
  hospital: '🏥',
  fire: '🚒',
  police: '🚓',
}

let resourceLayer = null
let serviceRadiusLayer = null
let resourcesData = null

// 构建服务半径缓冲区多边形(turf.buffer 按米生成圆)
function buildServiceRadius(data) {
  const circles = data.features.map((f) => {
    const r = f.properties.serviceRadius || 1200
    // turf.buffer 输入单位 km
    return buffer(f, r / 1000, { units: 'kilometers' })
  })
  return {
    type: 'FeatureCollection',
    features: circles.filter(Boolean),
  }
}

async function buildLayers() {
  if (!resourcesData) resourcesData = await getResources()

  // 1. 服务半径缓冲区(半透明填充)
  const radiusData = buildServiceRadius(resourcesData)
  serviceRadiusLayer = new PolygonLayer({
    name: '资源服务半径',
    zIndex: 1,
  })
  serviceRadiusLayer
    .source(radiusData)
    .shape('fill')
    .color('#00e5ff')
    .style({ opacity: 0.12 })
    .active({ color: '#00e5ff', mix: 0.3 })

  // 2. 资源点位
  resourceLayer = new PointLayer({
    name: '应急资源点',
    zIndex: 4,
  })
  resourceLayer
    .source(resourcesData)
    .size(12)
    .shape('circle')
    .color('type', (t) => TYPE_COLORS[t] || '#fff')
    .style({
      opacity: 0.95,
      stroke: '#fff',
      strokeWidth: 1.5,
    })
    .active({ color: '#00e5ff', mix: 0.5 })

  // 悬停弹窗
  resourceLayer.on('mouseenter', (e) => {
    const p = e.feature?.properties || {}
    popupShow(e, p)
  })
  resourceLayer.on('mouseout', () => popupHide())

  return [serviceRadiusLayer, resourceLayer]
}

// 简易 Popup(用 L7 Scene 的 popup)
let popup = null
function popupShow(e, p) {
  // 通过 scene 的 popup API(在 SmartCity 注入 scene 后调用)
  const scene = window.__scene__
  if (!scene) return
  popupHide()
  popup = scene.popup
    ? scene.popup
    : null
  // L7 Scene 提供 addPopup, 这里用更通用的方式: 直接 new
  import('@antv/l7').then(({ Popup }) => {
    if (popup) popup.remove()
    popup = new Popup({
      offsets: [0, 10],
      closeButton: false,
    })
      .setLnglat(e.lngLat || e.coordinates)
      .setHTML(
        `<div style="color:#0a1426;font-size:12px;padding:4px 6px">
          <b>${TYPE_ICONS[p.type] || ''} ${p.name || ''}</b><br/>
          类型: ${p.typeName || p.type}<br/>
          区域: ${p.area || '-'}<br/>
          容量: ${p.capacity || '-'}<br/>
          服务半径: ${p.serviceRadius || '-'}m
        </div>`,
      )
    scene.addPopup(popup)
  })
}
function popupHide() {
  const scene = window.__scene__
  if (popup && scene) {
    try {
      popup.remove()
    } catch (e) {
      /* ignore */
    }
    popup = null
  }
}

export default async () => {
  const layers = await buildLayers()
  return layers
}

export function setResourcesVisible(scene, visible) {
  if (!scene) return
  if (resourceLayer) visible ? resourceLayer.show() : resourceLayer.hide()
  if (serviceRadiusLayer) visible ? serviceRadiusLayer.show() : serviceRadiusLayer.hide()
}

// 资源类型筛选
export function filterResourceType(type) {
  if (!resourceLayer) return
  if (!type || type === 'all') {
    resourceLayer.filter('type', () => true)
  } else {
    resourceLayer.filter('type', (v) => v === type)
  }
}

export async function getResourcesData() {
  if (!resourcesData) resourcesData = await getResources()
  return resourcesData
}

// 暴露 scene 给 popup(由 SmartCity 在挂载时设置)
export function bindScene(scene) {
  window.__scene__ = scene
}
