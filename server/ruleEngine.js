// 规则引擎降级: DeepSeek 不可用时, 基于关键词匹配生成响应
// 模拟流式输出体验, 保证答辩演示不中断
// 同时作为 DeepSeek 响应失败时的兜底

// 意图识别(关键词匹配)
export function detectIntent(question) {
  const q = question.toLowerCase()
  if (/风险|最高|最严重|排行|哪个区域|哪个片区/.test(q)) return 'risk_ranking'
  if (/对比|比较|vs|和.*哪个|谁.*高/.test(q)) return 'compare'
  if (/策略|建议|处置|怎么办|如何应对|怎么处理/.test(q)) return 'strategy'
  if (/资源|医院|消防|交警|可达|覆盖|响应/.test(q)) return 'resource'
  if (/事件|事故|类型|分布|多少/.test(q)) return 'event_dist'
  if (/推演|模拟|降温|降幅|效果/.test(q)) return 'simulation'
  if (/时段|时间|现在|当前|高峰/.test(q)) return 'time'
  return 'general'
}

// 基于意图 + 上下文生成响应文本 + 溯源标签
export function generateRuleStream(question, ctx) {
  const intent = detectIntent(question)
  const { ranking, typeDist, resByType, totalEvents, totalResources, period, selectedRegion } = ctx

  let text = ''
  const sources = ['规则引擎']

  switch (intent) {
    case 'risk_ranking': {
      const top = ranking.slice(0, 3)
      text = `当前风险最高的三个片区:
${top.map((r, i) => `${i + 1}. ${r.name}: 风险评分 ${r.riskScore}, 事件 ${r.eventCount} 起, 平均等级 ${r.avgLevel}`).join('\n')}

建议优先关注 ${top[0].name}, 可在"情景推演优化"模块勾选"信号灯优化"+"交通分流"策略, 预计风险下降 1.4。`
      sources.push('区域风险排行')
      break
    }
    case 'compare': {
      const matched = ranking.filter(
        (r) => question.includes(r.name) || question.includes(r.area),
      )
      if (matched.length >= 2) {
        const [a, b] = matched
        const higher = a.riskScore >= b.riskScore ? a : b
        text = `区域对比:
• ${a.name}: 风险${a.riskScore}, 事件${a.eventCount}起, 均级${a.avgLevel}
• ${b.name}: 风险${b.riskScore}, 事件${b.eventCount}起, 均级${b.avgLevel}

${higher.name} 风险更高, 差值 ${Math.abs(a.riskScore - b.riskScore).toFixed(1)}, 建议优先调度应急资源。`
      } else {
        text = `请明确指出要对比的两个区域(如"对比流芳校区和光谷中心")。当前已有 ${ranking.length} 个片区数据:
${ranking.map((r, i) => `${i + 1}. ${r.name}`).join('、')}`
      }
      sources.push('区域对比')
      break
    }
    case 'strategy': {
      text = `针对当前${period}态势, 推荐处置策略组合:
1. 信号灯优化配时(signal): 联动路口绿波, 缓解拥堵
2. 交通分流绕行(diversion): 诱导车辆走主干道
3. 救护资源调度(ambulance): 就近派急救
4. 临时限行管制(restriction): 封闭内侧车道

建议同时勾选 signal + diversion, 预计:
• 风险下降 1.4
• 拥堵下降 3.0
• 恢复时长缩短 10 分钟`
      sources.push('策略库', '情景推演模型')
      break
    }
    case 'resource': {
      text = `应急资源概况:
• 总数: ${totalResources} 个
• 类型分布: ${Object.entries(resByType)
        .map(([t, c]) => `${t}(${c})`)
        .join('、')}

建议在风险最高的 ${ranking[0].name} 增设临时医疗点, 缩短响应时间至 5 分钟内。`
      sources.push('资源数据')
      break
    }
    case 'event_dist': {
      const sorted = Object.entries(typeDist).sort((a, b) => b[1] - a[1])
      text = `事件类型分布(共 ${totalEvents} 条):
${sorted.map(([t, c], i) => `${i + 1}. ${t}: ${c} 起 (${((c / totalEvents) * 100).toFixed(0)}%)`).join('\n')}

${sorted[0][0]} 占比最高, 是重点防控对象。`
      sources.push('事件统计')
      break
    }
    case 'simulation': {
      text = `情景推演说明:
在情景推演模块勾选策略后, 系统会实时预估指标变化:
• 风险指数: 下降 0.4~0.8
• 拥堵指数: 下降 0.2~1.8
• 应急覆盖率: 提升最高 +8%
• 恢复时长: 缩短 2~6 分钟

点击"运行模拟"后, 地图将高亮目标片区的降温/降险效果。`
      sources.push('情景推演模型')
      break
    }
    case 'time': {
      text = `当前时段: ${period}
- 事件总数: ${totalEvents} 条
- 资源总数: ${totalResources} 个
- 最高风险片区: ${ranking[0].name}(${ranking[0].riskScore})`
      sources.push('时段上下文')
      break
    }
    default:
      text = `我是武汉智慧城市交通AI助手, 当前${period}。
已加载 ${totalEvents} 条事件、${totalResources} 个资源点、${ranking.length} 个片区数据。

你可以问我:
• "哪个区域风险最高"
• "对比流芳校区和光谷中心"
• "推荐处置策略"
• "资源覆盖情况"
• "事件类型分布"`
      sources.push('系统总览')
  }

  return { text, sources }
}


