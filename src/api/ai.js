// AI 聊天流式接口: 使用 fetch + ReadableStream 解析 SSE
// 与 server/index.js 的 /api/ai/chat 对接
// 借鉴参考4(华农)的 SSE 流式实现

/**
 * 流式聊天请求
 * @param {Object} params
 * @param {Array} params.messages - 消息列表 [{role, content}]
 * @param {Object} params.context - 数据上下文 {module, selectedArea, hour, ...}
 * @param {Object} handlers - 事件回调
 * @param {Function} [handlers.onDelta]    - 收到增量文本 (text) => void
 * @param {Function} [handlers.onSources]  - 收到溯源标签 (sources[]) => void
 * @param {Function} [handlers.onRefs]     - 收到规则引擎引用 (refs[]) => void
 * @param {Function} [handlers.onMode]     - 收到模式 (mode: 'deepseek'|'rule'|'rule-fallback') => void
 * @param {Function} [handlers.onWarn]     - 收到警告 (warn) => void
 * @param {Function} [handlers.onDone]     - 流结束 () => void
 * @param {Function} [handlers.onError]    - 错误 (err) => void
 * @param {AbortSignal} [signal] - 可选, 用于中断
 */
export async function streamChat({ messages, context = {} }, handlers = {}, signal) {
  let resp
  try {
    resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      handlers.onDone?.()
      return
    }
    handlers.onError?.({ message: 'AI 服务连接失败, 请确认 Express 已启动 (npm run server)' })
    handlers.onDone?.()
    return
  }

  if (!resp.ok) {
    handlers.onError?.({ message: `AI 请求失败: HTTP ${resp.status}` })
    handlers.onDone?.()
    return
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE 帧以空行分隔
    const frames = buffer.split('\n\n')
    buffer = frames.pop() || ''

    for (const frame of frames) {
      const lines = frame.split('\n')
      let event = 'message'
      let data = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          data = line.slice(5).trim()
        }
      }
      if (!data) continue

      // data 可能是 JSON 字符串或裸字符串(如 "deepseek")
      let parsed
      try {
        parsed = JSON.parse(data)
      } catch {
        parsed = data.replace(/^"|"$/g, '')
      }

      switch (event) {
        case 'sources':
          handlers.onSources?.(parsed)
          break
        case 'refs':
          handlers.onRefs?.(parsed)
          break
        case 'mode':
          handlers.onMode?.(parsed)
          break
        case 'warn':
          handlers.onWarn?.(parsed)
          break
        case 'error':
          handlers.onError?.(parsed)
          break
        case 'done':
          handlers.onDone?.()
          return
        default: // message
          if (parsed?.content) {
            handlers.onDelta?.(parsed.content)
          }
      }
    }
  }
  handlers.onDone?.()
}


