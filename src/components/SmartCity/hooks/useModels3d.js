// 扩展功能 3: 三维模型(threebox 在 Mapbox 中加载 obj 园区/厂房模型)
// 在 mapbox 地图上注册一个 custom 3d 图层, 通过 threebox 把本地生成的三维厂房 obj
// 摆放在 武汉工大流芳校区 附近, 3 座排布成微型工业园区, 可随地图视角旋转/俯仰浏览。
//
// 说明: threebox-plugin 的源码是 CommonJS 且带旧版 GLTF/FBX loader, 直接 import 会被
// Vite 预打包解析报错; 这里改用其自包含的 UMD 构建(dist/threebox.min.js), 由它把
// Threebox/THREE 挂到 window 上, 绕开打包问题。obj/mtl 用 ?url 显式作为静态资源导入。
//
// 重要: threebox 内部(set/duplicate/animation 等方法)硬编码引用裸全局 tb.map.repaint,
// 官方 README 的用法就是把实例挂到 window.tb 上。若用模块内变量而不用全局 tb, 这些路径
// 会抛 ReferenceError: tb is not defined。因此这里统一用 window.tb 作为唯一实例引用。
import 'threebox-plugin/dist/threebox.min.js'
import factoryObj from '@/assets/models/factory.obj?url'
import factoryMtl from '@/assets/models/factory.mtl?url'

const Threebox = window.Threebox

const LAYER_ID = 'threebox-layer'

// 园区中心位置: 与建筑扫描动画同区域(工大流芳校区旁空地)
const PARK_CENTER = [114.4286, 30.4698]
// 三座厂房东西向排布(相邻约 100 米), 组成园区
const PLACEMENTS = [
  [114.4286, 30.4698],
  [114.4297, 30.4698],
  [114.4308, 30.4698],
]

// threebox 实例挂在 window.tb(见文件头注释); 模型加载结果缓存在模块作用域
let factoryModels = [] // 已加载的厂房模型组
let isFirstLoad = true // 标记是否为首次加载

// 飞向园区的动画函数(三维厂房近景视角)
export function flyToPark(map) {
  if (!map) return
  map.flyTo({
    center: PARK_CENTER,
    zoom: 16,
    pitch: 60,
    bearing: 30,
    duration: 1500,
    essential: true, // 确保动画一定会执行
  })
}

// 幂等注册 threebox 自定义 3d 图层; onAdd 回调会拿到 WebGL 上下文并初始化 threebox
function ensureLayer(map) {
  if (map.getLayer(LAYER_ID)) return
  console.log('[三维厂房] 添加 custom 3d 图层...')
  map.addLayer({
    id: LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) {
      window.tb = new Threebox(_map, gl, { defaultLights: true })
      console.log('[三维厂房] onAdd 触发, window.tb 已创建:', !!window.tb, ', 投影:', _map.getProjection().type)
    },
    render() {
      // 每帧把 threebox 场景合成到 mapbox 上
      window.tb && window.tb.update()
    },
  })
}

// 显示园区厂房模型
// fly=true 时飞向园区近景(仅三维厂房按钮点击时传入); fly=false 时仅显示模型不跳视角
export async function showFactoryModels(map, fly = true) {
  // 向 mapbox 添加自定义图层要求样式已加载完成
  if (!map.loaded()) {
    map.once('load', () => showFactoryModels(map, fly))
    return
  }

  ensureLayer(map)
  const tb = window.tb

  // 极少数情况下 addLayer 后 onAdd 尚未同步执行, 等地图空闲后再试
  if (!tb) {
    map.once('idle', () => showFactoryModels(map, fly))
    return
  }

  // 仅在 fly=true 时跳转视角(三维厂房按钮专用)
  if (fly) flyToPark(map)

  if (factoryModels.length) {
    // 已加载过, 仅恢复可见(threebox 的 remove 会释放几何体, 开关只用 visibility)
    factoryModels.forEach((m) => (m.visibility = true))
    // 切换仅改 THREE 对象可见性, 需主动触发地图重绘才立即生效
    map.triggerRepaint()
    return
  }

  // 加载本地 obj 模型; clone:false 直接返回模型组(threebox 内部按 URL 缓存)
  const model = await tb.loadObj(
    {
      obj: factoryObj,
      mtl: factoryMtl,
      type: 'mtl',
      units: 'meters', // obj 以米为单位, 1 单位 = 1 米
      scale: 1,
      rotation: { x: 90, y: 0, z: 0 }, // OBJ 是 y-up, threebox 世界是 z-up, 绕 X 转 90° 立起来
      anchor: 'bottom', // 以底部为锚点, 模型落在地面
      clone: false,
    },
    () => {}
  )

  // 失败时 loadObj 的 Promise 会 resolve 为错误字符串, 这里兜底
  if (typeof model !== 'object') {
    console.error('[三维厂房] 模型加载失败:', model)
    return
  }

  // 复制 2 份并摆成园区
  factoryModels = PLACEMENTS.map((coords, i) => {
    const m = i === 0 ? model : model.duplicate()
    m.setCoords(coords)
    tb.add(m, LAYER_ID)
    return m
  })

  // 首次加载完成后, 若需要则补飞一次(确保模型加载完成后视角到位)
  if (fly) {
    setTimeout(() => flyToPark(map), 500)
  }
}

// 隐藏园区厂房模型(保留图层与模型, 便于再次开启)
export function hideFactoryModels(map) {
  if (!factoryModels.length) {
    console.log('[三维厂房] 没有模型需要隐藏')
    return
  }
  factoryModels.forEach((m) => (m.visibility = false))
  // 同上: 主动重绘使隐藏立即生效
  map && map.triggerRepaint()
  console.log('[三维厂房] 已隐藏所有厂房模型')
}

// 切换显示/隐藏状态
export function toggleFactoryModels(map) {
  if (!map) {
    console.warn('[三维厂房] map 实例不存在')
    return
  }
  
  // 检查当前是否有模型可见
  const isVisible = factoryModels.length > 0 && factoryModels.some(m => m.visibility === true)
  
  if (isVisible) {
    hideFactoryModels(map)
  } else {
    showFactoryModels(map)
  }
}

// 重置视角到园区（独立功能，不控制模型显示）
export function resetViewToPark(map) {
  if (!map) return
  flyToPark(map)
}

// 获取当前厂房模型状态
export function getFactoryModelsStatus() {
  return {
    loaded: factoryModels.length > 0,
    visible: factoryModels.length > 0 && factoryModels.some(m => m.visibility === true),
    count: factoryModels.length,
  }
}

