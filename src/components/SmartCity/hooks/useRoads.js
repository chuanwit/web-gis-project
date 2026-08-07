// 城市道路图层(交通流预测动画版)
// 原实现: 固定蓝色流线。升级为「时空动态分析」:
//   - 每条道路按(道路类型 + 当前小时)确定性生成 congestion 拥堵指数(0-10)
//   - 颜色数据驱动: 绿(畅通) → 黄(缓行) → 红(拥堵), 随时段变化
//   - 流线动画速度(duration/interval)随拥堵程度变化: 越堵流得越慢
//   - 夜晚(数字孪生)道路发光: 霓虹亮色 + 加粗 + 提亮
// 数据在模块级缓存, 小时变化时重建图层(同 name, zIndex 0), 避免重复请求。
import { getRoads } from '@/api'
import { LineLayer } from '@antv/l7'
import { hourToPeriod } from '@/composables/useTimeOfDay'

// 拥堵指数 → 颜色(绿→黄→红连续渐变); 按时段切换: 白天/傍晚暖调/夜晚霓虹
const CONGESTION_COLORS = ['#2ECC40', '#FFD700', '#FF4D4D']
const CONGESTION_COLORS_DUSK = ['#5DD469', '#FFA500', '#FF6B3D'] // 傍晚暖调(偏橙)
const CONGESTION_COLORS_NIGHT = ['#4CFF88', '#FFD800', '#FF5A5A'] // 夜晚霓虹(高饱和发光)

// 道路类型 → 拥堵敏感度(高峰时更易拥堵; 越小越易堵)
const TYPE_CONCEST = {
  motorway: 0.55,
  motorway_link: 0.5,
  trunk: 0.6,
  primary: 0.65,
  secondary: 0.7,
  tertiary: 0.75,
  residential: 0.85,
  unclassified: 0.8,
  service: 0.9,
  cycleway: 0.95,
}
const DEFAULT_CONCEST = 0.8

// 模块级缓存: 道路数据 + 当前图层实例
let roadsData = null
let layer = null

// 高峰时段抬升系数(早 7-9, 晚 17-19 最堵; 清晨/深夜畅通)
function peakFactor(hour) {
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1
  if ((hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 20)) return 0.75
  return 0.4
}

// 确定性伪随机(由 osm_id 决定各道路差异, 保证同一时刻结果稳定)
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// 单条道路在某时刻的拥堵指数(0-10, 越高越堵)
function congestionOf(osm_id, type, hour) {
  const base = TYPE_CONCEST[type] ?? DEFAULT_CONCEST
  const r = rand(osm_id)
  const peak = peakFactor(hour)
  const night = hour >= 22 || hour <= 5 ? 0.6 : 1 // 夜间明显畅通
  const val = base * (0.5 + r * 0.9) * peak * night * 10
  return Math.max(1, Math.min(10, Math.round(val)))
}

// 拥堵 → 流线动画时长(越堵流得越慢: 畅通 0.8s, 拥堵 2.4s)
function durationOf(congestion) {
  return +(0.8 + (congestion / 10) * 1.6).toFixed(2)
}

// 为数据补充 congestion 字段(原地修改缓存数据)
function enrich(data, hour) {
  data.features.forEach((f) => {
    const { osm_id, type } = f.properties || {}
    f.properties.congestion = congestionOf(osm_id, type, hour)
  })
  return data
}

// 依据时刻构建道路图层(按时段切换颜色/粗细/透明度)
function buildLayer(data, hour) {
  const period = hourToPeriod(hour)
  const isNight = period === 'night'
  const isDusk = period === 'dusk'

  // 时段 → 道路配色
  const colors = isNight
    ? CONGESTION_COLORS_NIGHT
    : isDusk
      ? CONGESTION_COLORS_DUSK
      : CONGESTION_COLORS

  // 夜晚最粗(发光), 傍晚次之(暖光), 白天标准
  const lineWidth = isNight ? 1.4 : isDusk ? 1.2 : 1
  const lineOpacity = isNight ? 0.9 : isDusk ? 0.85 : 0.8

  const lyr = new LineLayer({
    name: '武汉市道路',
    zIndex: 0,
    depth: true,
  })
  lyr
    .source(data)
    .size(lineWidth)
    .shape('line')
    .color('congestion', colors)
    .animate({
      trailLength: 2,
      duration: durationOf(hour >= 6 && hour <= 22 ? hour : 8),
      interval: durationOf(hour >= 6 && hour <= 22 ? hour : 8) / 2,
    })
    .style({ opacity: lineOpacity })
    .filter('coordinates', (evt) => evt.length > 20)
  return lyr
}

// 初始创建(由 SmartCity 调用一次; 幂等: 已创建则直接返回现有图层)
export default async () => {
  if (!roadsData) roadsData = await getRoads()
  if (!layer) layer = buildLayer(enrich(roadsData, 8), 8)
  return layer
}

// 小时变化: 重建道路图层(移除旧图层→按新时刻构建→重新添加)
// 保证 name 不变, ViewSwitch 的 /^\d+$/ 清理规则不受影响
export async function rebuildRoads(scene, hour) {
  if (!scene) return
  if (!roadsData) roadsData = await getRoads()
  const oldLayer = layer
  layer = buildLayer(enrich(roadsData, hour), hour)
  if (oldLayer && scene.getLayers().includes(oldLayer)) {
    scene.removeLayer(oldLayer)
  }
  scene.addLayer(layer)
}
