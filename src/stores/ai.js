// AI 对话状态: 消息列表 + 流式状态 + 抽屉开关 + 数据溯源
// 借鉴参考4(华农)的 DeepSeek + 流式 SSE + 自然语言查询 + 数据溯源
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { streamChat } from '@/api/ai'

export const useAiStore = defineStore('ai', () => {
  // 对话消息: { role: 'user'|'assistant', content, sources?:[], refs?:[], time, streaming?:boolean }
  const messages = ref([])
  // 是否正在流式输出
  const streaming = ref(false)
  // 抽屉是否展开
  const open = ref(false)
  // 输入框内容
  const input = ref('')
  // 错误信息(请求失败时)
  const error = ref('')
  // 当前模式: 'deepseek' | 'rule' | 'rule-fallback'
  const mode = ref('')
  // 中断控制器(用于流式中手动停止)
  let abortController = null

  function toggle(force) {
    open.value = typeof force === 'boolean' ? force : !open.value
  }

  function pushMessage(msg) {
    messages.value.push(msg)
  }

  // 流式更新最后一条 assistant 消息(逐字追加)
  function appendToLast(text) {
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant') {
      last.content += text
    }
  }

  // 替换最后一条 assistant 消息(用于规则模式一次性写入)
  function setLastContent(text, sources) {
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant') {
      last.content = text
      if (sources) last.sources = sources
    }
  }

  // 为最后一条消息附加溯源/引用
  function attachToLast({ sources, refs }) {
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant') {
      if (sources) last.sources = sources
      if (refs) last.refs = refs
    }
  }

  function clear() {
    messages.value = []
    error.value = ''
    mode.value = ''
  }

  // 中断当前流式
  function abort() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    streaming.value = false
    // 标记最后一条消息流式结束
    const last = messages.value[messages.value.length - 1]
    if (last) last.streaming = false
  }

  /**
   * 发送消息(流式)
   * @param {string} text - 用户输入
   * @param {Object} context - 数据上下文 {module, selectedArea, hour, ...}
   */
  async function sendStreamMessage(text, context = {}) {
    const content = (text ?? input.value).trim()
    if (!content || streaming.value) return

    error.value = ''
    input.value = ''

    // 推入用户消息
    pushMessage({
      role: 'user',
      content,
      time: Date.now(),
    })

    // 推入空的 assistant 占位(流式追加)
    pushMessage({
      role: 'assistant',
      content: '',
      time: Date.now(),
      streaming: true,
    })

    streaming.value = true
    abortController = new AbortController()

    // 构造给后端的消息(去掉本地占位)
    const history = messages.value
      .filter((m, i) => !(i === messages.value.length - 1 && m.role === 'assistant' && !m.content))
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      await streamChat(
        { messages: history, context },
        {
          onSources: (sources) => attachToLast({ sources }),
          onRefs: (refs) => attachToLast({ refs }),
          onMode: (m) => {
            mode.value = m
          },
          onDelta: (delta) => appendToLast(delta),
          onWarn: (warn) => {
            error.value = warn.message || ''
          },
          onError: (err) => {
            error.value = err.message || 'AI 服务异常'
            // 给空 assistant 消息兜底
            const last = messages.value[messages.value.length - 1]
            if (last && !last.content) {
              last.content = '抱歉, 当前无法获取分析结果, 请稍后重试。'
            }
          },
          onDone: () => {
            streaming.value = false
            abortController = null
            const last = messages.value[messages.value.length - 1]
            if (last) last.streaming = false
          },
        },
        abortController.signal,
      )
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = err.message || 'AI 服务异常'
      }
      streaming.value = false
      abortController = null
      const last = messages.value[messages.value.length - 1]
      if (last) last.streaming = false
    }
  }

  return {
    messages,
    streaming,
    open,
    input,
    error,
    mode,
    toggle,
    pushMessage,
    appendToLast,
    setLastContent,
    attachToLast,
    clear,
    abort,
    sendStreamMessage,
  }
})


