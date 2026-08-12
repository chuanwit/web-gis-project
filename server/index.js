// Express 代理服务: DeepSeek 大模型 + SSE 流式 + 规则引擎降级
// 端口 3001, 由 vite dev proxy 转发 /api/ai/chat 到此
// 借鉴参考4(华农)的 DeepSeek + 流式 SSE + 自然语言查询架构
import express from 'express'
import cors from 'cors'
import { buildSystemPrompt, buildContextSummary } from './aiContext.js'
import { generateRuleStream } from './ruleEngine.js'
import { loadEnv } from './env.js'

// 加载 .env (DeepSeek API Key 等)
loadEnv()

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const PORT = process.env.AI_PORT || 3001
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_URL = process.env.DEEPSEEK_URL || 'https://api.deepseek.com/chat/completions'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

// 健康检查
app.get('/api/ai/health', (req, res) => {
  res.json({
    ok: true,
    mode: DEEPSEEK_API_KEY ? 'deepseek' : 'rule',
    model: MODEL,
    time: new Date().toISOString(),
  })
})

// SSE 流式聊天接口
// 请求体: { messages: [{role, content}], context?: {module, selectedArea, hour, ...} }
app.post('/api/ai/chat', async (req, res) => {
  const { messages = [], context = {} } = req.body
  const userMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant')

  // SSE 响应头(必须, 否则浏览器不会触发 onmessage)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx 反代时不缓冲
  })

  // 数据上下文 + system prompt
  const ctx = buildContextSummary(context)
  const systemPrompt = buildSystemPrompt(ctx)

  // 先发 sources(数据溯源标签, 让前端展示"引用了哪些数据")
  res.write(`event: sources\ndata: ${JSON.stringify(ctx.sources)}\n\n`)

  // 降级模式: 规则引擎 + 模拟流式
  if (!DEEPSEEK_API_KEY) {
    console.warn('[AI] DEEPSEEK_API_KEY 未配置, 走规则引擎降级')
    res.write(`event: mode\ndata: ${JSON.stringify('rule')}\n\n`)
    await streamRuleResponse(res, userMessages, ctx)
    res.write('event: done\ndata: [DONE]\n\n')
    return res.end()
  }

  // 真实 DeepSeek 流式
  try {
    res.write(`event: mode\ndata: ${JSON.stringify('deepseek')}\n\n`)
    await streamDeepSeek(res, userMessages, systemPrompt)
    res.write('event: done\ndata: [DONE]\n\n')
    return res.end()
  } catch (err) {
    console.error('[AI] DeepSeek 调用失败, 切规则兜底:', err.message)
    // 重置一条 assistant 占位消息(让前端继续追加)
    res.write(`event: mode\ndata: ${JSON.stringify('rule-fallback')}\n\n`)
    res.write(
      `event: warn\ndata: ${JSON.stringify({ message: '大模型调用失败, 已切换规则引擎' })}\n\n`,
    )
    await streamRuleResponse(res, userMessages, ctx)
    res.write('event: done\ndata: [DONE]\n\n')
    return res.end()
  }
})

// DeepSeek 流式调用: 转发上游 SSE 给前端
async function streamDeepSeek(res, messages, systemPrompt) {
  const payload = {
    model: MODEL,
    stream: true,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  }

  const resp = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`DeepSeek ${resp.status}: ${errText.slice(0, 200)}`)
  }

  // 读取上游 SSE 流并转发(逐 chunk)
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // 按 SSE 协议分行解析
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue

      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
        }
      } catch {
        // 忽略单行解析失败
      }
    }
  }
}

// 规则引擎流式输出(模拟逐字)
async function streamRuleResponse(res, messages, ctx) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const question = lastUser?.content || ''
  const { text, sources } = generateRuleStream(question, ctx)

  // 按字符切分, 模拟打字机效果
  const chunks = splitChunks(text, 2)
  for (const chunk of chunks) {
    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
    await sleep(18)
  }

  if (sources?.length) {
    res.write(`event: refs\ndata: ${JSON.stringify(sources)}\n\n`)
  }
}

function splitChunks(text, size) {
  const chunks = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

app.listen(PORT, () => {
  console.log(`[AI 服务] 已启动: http://localhost:${PORT}`)
  console.log(
    `[AI 服务] 模式: ${DEEPSEEK_API_KEY ? 'DeepSeek 真实大模型' : '规则引擎降级(可填 .env 中 DEEPSEEK_API_KEY 启用真实模型)'}`,
  )
})
