// AI 数据上下文: 从 mock 数据生成 system prompt + 溯源标签
// 让大模型知道当前城市态势, 实现数据溯源(回答基于哪些数据)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mockDir = path.resolve(__dirname, '../mock')

// 懒加载缓存(进程内常驻)
let _regions = null
let _events = null
let _resources = null

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(mockDir, name), 'utf-8'))
}

function getRegions() {
  if (!_regions) _regions = loadJson('Wuhan_regions.json')
  return _regions
}
function getEvents() {
  if (!_events) _events = loadJson('Wuhan_events.json')
  return _events
}
function getResources() {
  if (!_resources) _resources = loadJson('Wuhan_resources.json')
  return _resources
}

// 构建上下文摘要(用于 system prompt + 溯源标签)
export function buildContextSummary(context = {}) {
  const { module: curModule, selectedArea, hour, simulationRun, strategies } = context
  const regions = getRegions()
  const events = getEvents()
  const resources = getResources()

  // 区域风险排行
  const ranking = [...regions.features]
    .map((f) => ({
      area: f.properties.area,
      name: f.properties.name,
      riskScore: f.properties.riskScore,
      eventCount: f.properties.eventCount,
      avgLevel: f.properties.avgLevel,
    }))
    .sort((a, b) => b.riskScore - a.riskScore)

  // 事件类型分布
  const typeDist = {}
  events.features.forEach((f) => {
    const t = f.properties.name
    typeDist[t] = (typeDist[t] || 0) + 1
  })

  // 资源类型统计
  const resByType = {}
  resources.features.forEach((f) => {
    const t = f.properties.type
    resByType[t] = (resByType[t] || 0) + 1
  })

  // 当前选中区域信息
  const selectedRegion = selectedArea
    ? regions.features.find((f) => f.properties.area === selectedArea)?.properties
    : null

  // 时段判断
  const h = parseInt(hour ?? 8, 10)
  const period =
    h >= 6 && h <= 10
      ? '早高峰(06-10时)'
      : h >= 11 && h <= 15
        ? '白天平峰(11-15时)'
        : h >= 16 && h <= 18
          ? '晚高峰(16-18时)'
          : '夜间(19-05时)'

  // 溯源标签(前端展示"引用了哪些数据")
  const sources = [
    { key: 'regions', label: `区域风险数据(${regions.features.length}个片区)` },
    { key: 'events', label: `交通事件数据(${events.features.length}条)` },
    { key: 'resources', label: `应急资源数据(${resources.features.length}个点)` },
    { key: 'time', label: `时段上下文(${h}:00, ${period})` },
  ]
  if (selectedArea) {
    sources.push({ key: 'area', label: `选中区域: ${selectedRegion?.name || selectedArea}` })
  }
  if (curModule === 'simulation') {
    sources.push({ key: 'simulation', label: `情景推演模型` })
  }

  return {
    module: curModule,
    selectedArea,
    selectedRegion,
    hour: h,
    period,
    simulationRun,
    strategies: strategies ? Object.keys(strategies).filter((k) => strategies[k]) : [],
    ranking,
    typeDist,
    resByType,
    totalEvents: events.features.length,
    totalResources: resources.features.length,
    sources,
  }
}

// 构建 system prompt(注入给 DeepSeek)
export function buildSystemPrompt(ctx) {
  const {
    module: curModule,
    ranking,
    typeDist,
    resByType,
    totalEvents,
    totalResources,
    period,
    selectedRegion,
    simulationRun,
    strategies,
  } = ctx

  const moduleLabel =
    {
      overview: '综合态势',
      risk: '交通风险诊断',
      resource: '应急资源可达',
      simulation: '情景推演优化',
    }[curModule] || '综合态势'

  const lines = [
    '你是"武汉智慧城市交通指挥中心"AI助手, 服务于城市交通指挥大屏。',
    `当前业务模块: ${moduleLabel}。当前时段: ${period}。`,
    '',
    '## 城市数据上下文(实时同步自指挥中心大屏)',
    `- 总事件数: ${totalEvents} 条`,
    `- 总资源点: ${totalResources} 个`,
    `- 事件类型分布: ${Object.entries(typeDist)
      .map(([t, c]) => `${t}(${c})`)
      .join('、')}`,
    `- 资源类型分布: ${Object.entries(resByType)
      .map(([t, c]) => `${t}(${c})`)
      .join('、')}`,
    '',
    '## 区域风险排行(由高到低)',
    ...ranking.map(
      (r, i) => `${i + 1}. ${r.name}: 风险${r.riskScore}, 事件${r.eventCount}起, 均级${r.avgLevel}`,
    ),
    '',
  ]

  if (selectedRegion) {
    lines.push(`## 当前选中区域: ${selectedRegion.name}`)
    lines.push(`- 风险评分: ${selectedRegion.riskScore}`)
    lines.push(`- 事件数: ${selectedRegion.eventCount}`)
    lines.push(`- 平均等级: ${selectedRegion.avgLevel}`)
    lines.push('')
  }

  if (curModule === 'simulation') {
    lines.push('## 情景推演上下文')
    lines.push(`- 已选策略: ${strategies.length ? strategies.join('、') : '未选择'}`)
    lines.push(`- 是否已运行模拟: ${simulationRun ? '是' : '否'}`)
    lines.push('')
    lines.push(
      '可用策略: signal(信号灯优化配时)、diversion(交通分流绕行)、ambulance(救护资源调度)、restriction(临时限行管制)',
    )
    lines.push('')
  }

  lines.push('## 回答规范')
  lines.push('1. 用中文, 简洁专业, 避免冗长')
  lines.push('2. 引用具体数据时附带数字(如"流芳校区风险7.8")')
  lines.push('3. 提建议时给出可执行动作(具体到策略名)')
  lines.push('4. 不确定时直说"暂无数据", 不要编造')
  lines.push('5. 回答控制在 200 字以内, 用要点形式呈现')

  return lines.join('\n')
}


