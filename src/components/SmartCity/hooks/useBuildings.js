// 城市建筑图层(数字孪生: 按时段切换建筑灯光)
// 原实现: 固定深色 + 蓝色扫光动画。升级为随统一时间轴时段变化:
//   白天(baseColor 偏亮, 窗户暗) → 傍晚(窗户渐亮) → 夜晚(窗户金黄点亮, 底座压暗, 关闭扫光)
// L7 支持运行期 layer.style() 更新(styleNeedUpdate 触发 model 重建), 无需重建图层。
import { getCityBuildings } from '@/api'
import { CityBuildingLayer } from '@antv/l7'

// 工大流芳校区(扫光动画中心, 与三维厂房园区同区)
const SWEEP_CENTER = [114.4286, 30.4698]

// 时段 → 建筑样式(配合 Mapbox setLight 方向光照, 营造真实日照/夜景氛围)
const PERIOD_BUILDING_STYLE = {
  morning: {
    opacity: 0.75,
    baseColor: 'rgb(22, 26, 34)', // 冷调蓝灰底(晨光初照, 微微发亮)
    windowColor: 'rgb(80, 120, 160)', // 明亮蓝灰窗面(反射晨空天光)
    brightColor: 'rgb(255, 190, 100)', // 日出暖金高光(东侧受光面)
    sweep: {
      enable: true,
      sweepRadius: 2,
      sweepColor: '#6db4ec', // 柔和晨蓝扫光
      sweepSpeed: 0.25,
      sweepCenter: SWEEP_CENTER,
    },
  },
  afternoon: {
    opacity: 0.72,
    baseColor: 'rgb(28, 28, 32)', // 中性深底(正午阳光充足)
    windowColor: 'rgb(90, 130, 170)', // 明亮天蓝窗面(强烈正午反光)
    brightColor: 'rgb(255, 220, 100)', // 阳光金色高光(顶面/受光面)
    sweep: {
      enable: true,
      sweepRadius: 2,
      sweepColor: '#1990FF', // 鲜亮蓝扫光
      sweepSpeed: 0.4,
      sweepCenter: SWEEP_CENTER,
    },
  },
  dusk: {
    opacity: 0.82,
    baseColor: 'rgb(20, 12, 16)', // 暖调暗红底(落日余晖中的剪影)
    windowColor: 'rgb(210, 120, 55)', // 暖橙窗面(华灯初上, 渐次点亮)
    brightColor: 'rgb(255, 140, 55)', // 落日橙红边光(西侧受光面)
    sweep: {
      // 傍晚关闭扫光, 让位给万家灯火(保留完整配置避免 L7 uniform 缺失崩溃)
      enable: false,
      sweepRadius: 2,
      sweepColor: '#1990FF',
      sweepSpeed: 0.3,
      sweepCenter: SWEEP_CENTER,
    },
  },
  night: {
    opacity: 0.9,
    baseColor: 'rgb(3, 3, 7)', // 极暗底座(近乎纯黑, 突出窗灯)
    windowColor: 'rgb(255, 210, 90)', // 明亮暖金窗灯(万家灯火)
    brightColor: 'rgb(255, 240, 160)', // 暖白高光(顶部边缘微光)
    sweep: {
      enable: false,
      sweepRadius: 2,
      sweepColor: '#1990FF',
      sweepSpeed: 0.3,
      sweepCenter: SWEEP_CENTER,
    },
  },
}

// 模块级缓存图层实例(供运行期样式更新)
let buildingLayer = null

export default async () => {
  // 获取城市建筑数据
  const buildings_data = await getCityBuildings()

  // 创建城市建筑图层
  const layer = new CityBuildingLayer({
    name: '武汉市建筑图',
  })

  layer
    .source(buildings_data) // 设置数据源
    .size('Elevation', (h) => h) // 根据'Elevation字段'设置大小
    .animate(true) // 开启动画
    .active({
      color: '#0ff', // 鼠标悬停时颜色
      mix: 0.5, // 混合比例
    }) // 鼠标悬停时效果
    .style(PERIOD_BUILDING_STYLE.morning) // 默认上午样式

  buildingLayer = layer
  return layer
}

// 按时段更新建筑灯光样式(L7 运行期 style() 更新)
export function updateBuildingStyle(period) {
  const style = PERIOD_BUILDING_STYLE[period] || PERIOD_BUILDING_STYLE.morning
  if (buildingLayer) {
    buildingLayer.style(style)
  }
}
