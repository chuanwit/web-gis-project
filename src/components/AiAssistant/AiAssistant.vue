<template>
  <!-- 右下角悬浮入口(展开时隐藏) -->
  <button
    v-if="!ai.open"
    class="ai-fab"
    @click="ai.toggle(true)"
    title="AI 智能助手"
    aria-label="打开 AI 助手"
  >
    <span class="fab-icon">◆</span>
    <span class="fab-pulse"></span>
    <span class="fab-label">AI</span>
  </button>

  <!-- 右侧抽屉式对话窗 -->
  <Transition name="drawer">
    <aside v-if="ai.open" class="ai-drawer">
      <!-- 顶部: 标题 + 模式标识 + 操作按钮 -->
      <header class="ai-head scan-line">
        <div class="head-left">
          <span class="head-title">AI 智能助手</span>
          <span class="mode-tag" :class="modeClass">{{ modeLabel }}</span>
        </div>
        <div class="head-right">
          <button class="head-btn" @click="ai.clear()" title="清空对话">⟲</button>
          <button class="head-btn" @click="ai.toggle(false)" title="收起">✕</button>
        </div>
      </header>

      <!-- 消息列表 -->
      <main ref="bodyRef" class="ai-body">
        <!-- 欢迎语 + 快捷问题(空对话时) -->
        <div v-if="ai.messages.length === 0" class="welcome">
          <div class="welcome-icon">◆</div>
          <div class="welcome-title">武汉智慧城市交通 AI 助手</div>
          <div class="welcome-desc">
            已接入实时城市数据, 支持自然语言查询<br />态势感知 / 风险诊断 / 资源调度 / 情景推演
          </div>
          <div class="quick-chips">
            <button
              v-for="q in quickQuestions"
              :key="q"
              class="chip"
              @click="send(q)"
            >
              {{ q }}
            </button>
          </div>
        </div>

        <!-- 消息气泡 -->
        <div
          v-for="(msg, i) in ai.messages"
          :key="i"
          class="msg"
          :class="msg.role"
        >
          <div class="bubble">
            <div class="content">
              <template v-if="msg.content">{{ msg.content }}</template>
              <span v-else-if="msg.streaming" class="thinking">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              </span>
              <span v-if="msg.streaming && msg.content" class="cursor">▋</span>
            </div>
            <!-- 数据溯源标签 -->
            <div
              v-if="msg.sources?.length || msg.refs?.length"
              class="sources"
            >
              <span class="src-title">数据溯源:</span>
              <span
                v-for="s in msg.sources || []"
                :key="s.key"
                class="src-tag"
                :title="s.label"
              >
                📎 {{ s.label }}
              </span>
              <span
                v-for="(r, j) in msg.refs || []"
                :key="'r' + j"
                class="src-tag rule"
              >
                ⚙ {{ r }}
              </span>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="ai.error" class="err-tip">⚠ {{ ai.error }}</div>
      </main>

      <!-- 输入区 -->
      <footer class="ai-foot">
        <textarea
          v-model="ai.input"
          class="input"
          placeholder="输入问题, 回车发送 / Shift+回车换行"
          rows="2"
          @keydown.enter.exact.prevent="send()"
        ></textarea>
        <button v-if="!ai.streaming" class="send-btn btn-pulse" @click="send()">
          发送
        </button>
        <button v-else class="stop-btn" @click="ai.abort()">■ 停止</button>
      </footer>
    </aside>
  </Transition>
</template>

<script setup>
// AI 智能助手抽屉: 右下角悬浮入口 + 右侧抽屉式对话窗
// 流式打字机渲染 + 快捷问题芯片 + 数据溯源标签
// 借鉴参考4(华农)的 DeepSeek 大模型 + SSE 流式 + 数据溯源架构
import { ref, computed, watch, nextTick } from 'vue'
import { useAiStore, useBusinessStore, useTimeStore } from '@/stores'

const ai = useAiStore()
const business = useBusinessStore()
const time = useTimeStore()

const bodyRef = ref(null)

// 快捷问题(空对话时展示, 点击直接发送)
const quickQuestions = [
  '当前哪个区域风险最高?',
  '对比流芳校区和光谷中心',
  '推荐应急处置策略',
  '应急资源覆盖情况如何?',
  '当前事件类型分布',
  '情景推演能带来什么效果?',
]

const modeLabel = computed(() => {
  if (!ai.mode) return '待启动'
  if (ai.mode === 'deepseek') return 'DeepSeek'
  if (ai.mode === 'rule') return '规则引擎'
  if (ai.mode === 'rule-fallback') return '降级模式'
  return ai.mode
})

const modeClass = computed(() => {
  if (ai.mode === 'deepseek') return 'mode-ai'
  if (ai.mode === 'rule' || ai.mode === 'rule-fallback') return 'mode-rule'
  return 'mode-idle'
})

// 构建上下文(同步业务模块/选中区域/时段/策略状态)
function buildContext() {
  return {
    module: business.module,
    selectedArea: business.selectedArea,
    hour: time.hour,
    simulationRun: business.simulationRun,
    strategies: business.strategies,
  }
}

function send(text) {
  ai.sendStreamMessage(text, buildContext())
}

// 消息数量变化时, 滚动到底部
watch(
  () => ai.messages.length,
  async () => {
    await nextTick()
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  },
)

// 流式追加内容时, 也持续滚动
watch(
  () => ai.messages[ai.messages.length - 1]?.content,
  async () => {
    await nextTick()
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  },
)
</script>

<style scoped>
/* ============ 悬浮入口按钮 ============ */
.ai-fab {
  position: fixed;
  right: 30px;
  bottom: 110px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  z-index: 50;
  background: linear-gradient(135deg, #1990ff 0%, #00e5ff 100%);
  box-shadow:
    0 0 20px rgba(0, 229, 255, 0.6),
    0 4px 16px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: fab-breath 2.4s ease-in-out infinite;
}
.ai-fab:hover {
  transform: scale(1.08);
  box-shadow:
    0 0 28px rgba(0, 229, 255, 0.85),
    0 6px 20px rgba(0, 0, 0, 0.5);
}
.fab-icon {
  font-size: 18px;
  color: #fff;
  line-height: 1;
}
.fab-label {
  font-size: 9px;
  color: #fff;
  letter-spacing: 1px;
  font-weight: 600;
}
.fab-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(0, 229, 255, 0.55);
  animation: fab-ring 2s ease-out infinite;
  pointer-events: none;
}
@keyframes fab-breath {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(0, 229, 255, 0.6),
      0 4px 16px rgba(0, 0, 0, 0.4);
  }
  50% {
    box-shadow:
      0 0 28px rgba(0, 229, 255, 0.85),
      0 4px 16px rgba(0, 0, 0, 0.4);
  }
}
@keyframes fab-ring {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

/* ============ 抽屉容器 ============ */
.ai-drawer {
  position: fixed;
  right: 20px;
  top: 100px;
  bottom: 100px;
  width: 420px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(16, 32, 56, 0.92) 0%, rgba(10, 20, 38, 0.92) 100%);
  backdrop-filter: blur(14px);
  border: 1px solid var(--b-line-strong, rgba(0, 229, 255, 0.4));
  border-radius: 12px;
  box-shadow:
    0 0 30px rgba(0, 229, 255, 0.18),
    0 8px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* 抽屉滑入动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(440px);
  opacity: 0;
}

/* ============ 顶部 ============ */
.ai-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--b-line, rgba(0, 229, 255, 0.18));
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.08), transparent);
  flex-shrink: 0;
}
.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.head-title {
  font-size: 15px;
  font-weight: 600;
  color: #7fd6ff;
  letter-spacing: 0.5px;
}
.mode-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #8fa8c2;
  background: rgba(255, 255, 255, 0.05);
}
.mode-tag.mode-ai {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.5);
  background: rgba(0, 229, 255, 0.1);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
}
.mode-tag.mode-rule {
  color: #ffb020;
  border-color: rgba(255, 176, 32, 0.5);
  background: rgba(255, 176, 32, 0.08);
}
.head-right {
  display: flex;
  gap: 6px;
}
.head-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #c6d6e8;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  transition: all 0.2s ease;
}
.head-btn:hover {
  background: rgba(0, 229, 255, 0.15);
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.4);
}

/* ============ 消息列表 ============ */
.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* 欢迎区 */
.welcome {
  text-align: center;
  padding: 30px 16px;
  color: #c6d6e8;
}
.welcome-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(25, 144, 255, 0.2));
  border: 1px solid rgba(0, 229, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #00e5ff;
  box-shadow: 0 0 18px rgba(0, 229, 255, 0.3);
}
.welcome-title {
  font-size: 15px;
  font-weight: 600;
  color: #eaf3fb;
  margin-bottom: 8px;
}
.welcome-desc {
  font-size: 12px;
  color: #8fa8c2;
  line-height: 1.7;
  margin-bottom: 18px;
}
.quick-chips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chip {
  padding: 9px 14px;
  font-size: 12px;
  color: #c6d6e8;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}
.chip:hover {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.14);
  border-color: rgba(0, 229, 255, 0.5);
  transform: translateX(2px);
}

/* 消息气泡 */
.msg {
  display: flex;
  max-width: 100%;
}
.msg.user {
  justify-content: flex-end;
}
.msg.assistant {
  justify-content: flex-start;
}
.bubble {
  max-width: 88%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
}
.msg.user .bubble {
  background: linear-gradient(135deg, #1990ff, #2ec5ff);
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(25, 144, 255, 0.3);
}
.msg.assistant .bubble {
  background: rgba(20, 40, 70, 0.7);
  color: #eaf3fb;
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-bottom-left-radius: 4px;
}

.content {
  position: relative;
}

/* 流式光标 */
.cursor {
  display: inline-block;
  margin-left: 1px;
  color: #00e5ff;
  animation: cursor-blink 0.9s steps(2) infinite;
}
@keyframes cursor-blink {
  50% {
    opacity: 0;
  }
}

/* 思考中三点动画 */
.thinking {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 18px;
}
.thinking .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7fd6ff;
  animation: think-bounce 1.2s ease-in-out infinite;
}
.thinking .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.thinking .dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes think-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* 数据溯源 */
.sources {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 229, 255, 0.2);
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}
.src-title {
  font-size: 10px;
  color: #5f7896;
  margin-right: 2px;
}
.src-tag {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 8px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.25);
  color: #7fd6ff;
}
.src-tag.rule {
  background: rgba(255, 176, 32, 0.08);
  border-color: rgba(255, 176, 32, 0.3);
  color: #ffb020;
}

/* 错误提示 */
.err-tip {
  font-size: 12px;
  color: #ff8888;
  background: rgba(255, 77, 77, 0.08);
  border: 1px solid rgba(255, 77, 77, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
}

/* ============ 输入区 ============ */
.ai-foot {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--b-line, rgba(0, 229, 255, 0.18));
  background: rgba(10, 20, 38, 0.6);
  flex-shrink: 0;
}
.input {
  flex: 1;
  resize: none;
  padding: 8px 12px;
  font-size: 13px;
  color: #eaf3fb;
  background: rgba(20, 40, 70, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input:focus {
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.1);
}
.input::placeholder {
  color: #5f7896;
}
.send-btn,
.stop-btn {
  padding: 0 16px;
  font-size: 13px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  align-self: stretch;
}
.send-btn {
  background: linear-gradient(135deg, #1990ff, #00e5ff);
  color: #fff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.35);
}
.send-btn:hover {
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.6);
}
.stop-btn {
  background: rgba(255, 77, 77, 0.85);
  color: #fff;
}
.stop-btn:hover {
  background: rgba(255, 77, 77, 1);
}
</style>


