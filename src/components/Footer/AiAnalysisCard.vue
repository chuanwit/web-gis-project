<template>
  <!-- AI 城市助手分析卡片: 点击事故查询结果行时弹出 -->
  <div class="ai-card">
    <!-- 关闭按钮: 右上角, 通知父组件关闭 -->
    <button class="close-btn" @click="$emit('close')" aria-label="关闭">✕</button>

    <div class="ai-header">
      <span class="ai-title">🤖 AI 城市助手</span>
      <span v-if="loading" class="ai-loading">智能分析中...</span>
    </div>

    <template v-if="!loading && result">
      <div class="ai-row">
        <span class="label">事故地点</span>
        <span class="value">{{ result.location ? result.location + '（' + result.area + '）' : result.area }}</span>
      </div>
      <div class="ai-row">
        <span class="label">事故类型</span>
        <span class="value">{{ result.type }} · 等级 {{ result.level }}</span>
      </div>
      <div class="ai-row">
        <span class="label">分析时刻</span>
        <span class="value">{{ result.time }}</span>
      </div>

      <div class="ai-divider">AI 分析建议</div>
      <ol class="ai-list">
        <li v-for="(item, i) in result.analysis" :key="i">{{ item }}</li>
      </ol>

      <!-- 一键追问: 把事故上下文带到 AI 助手, 用大模型继续深入分析 -->
      <button class="ask-btn" @click="askInAssistant">
        <span class="ask-icon">◆</span> 在 AI 助手中追问
      </button>
    </template>
  </div>
</template>
<script setup>
// AI 智能分析卡片: 接收事故 feature, 调 mock 接口 /api/ai_analysis 生成分析建议
// 规则内容由 mock 端按 类型/等级/区域/时段 生成
// 增加"在 AI 助手中追问"按钮: 把事故上下文带到 AiAssistant 抽屉, 用真实大模型继续分析
import { ref, watch } from 'vue'
import { getAiAnalysis } from '@/api'
import { useTimeOfDay } from '@/composables/useTimeOfDay'
import { useAiStore, useBusinessStore, useTimeStore } from '@/stores'

const props = defineProps({
  feature: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const { state: timeState } = useTimeOfDay()
const ai = useAiStore()
const business = useBusinessStore()
const timeStore = useTimeStore()

const loading = ref(true)
const result = ref(null)

// 请求序号: 连续点击不同事故时丢弃过期响应
let seq = 0

watch(
  () => props.feature,
  load,
  { immediate: true },
)

async function load() {
  const cur = ++seq
  loading.value = true
  result.value = null
  try {
    const event_id = props.feature?.properties?.id
    const data = await getAiAnalysis({ event_id, hour: timeState.hour })
    if (cur !== seq) return // 过期请求丢弃
    result.value = data
  } catch (e) {
    console.error('[AI助手] 分析请求失败:', e)
  } finally {
    if (cur === seq) loading.value = false
  }
}

// 一键追问: 把事故上下文带到 AI 助手, 用大模型继续分析
function askInAssistant() {
  if (!result.value) return
  const r = result.value
  const loc = r.location ? `${r.location}(${r.area})` : r.area
  const question = `请分析 ${loc} 的 ${r.type} 事故(等级 ${r.level}, 时刻 ${r.time})的处置建议, 并结合当前城市态势给出资源调度方案`

  // 构建上下文(同步业务模块/时段, 让大模型知道当前态势)
  const context = {
    module: business.module,
    selectedArea: business.selectedArea,
    hour: timeStore.hour,
    simulationRun: business.simulationRun,
    strategies: business.strategies,
  }

  // 打开 AI 助手抽屉并发送
  ai.toggle(true)
  ai.sendStreamMessage(question, context)

  // 关闭本卡片(避免遮挡)
  emit('close')
}
</script>
<style scoped>
.ai-card {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 150px; /* 位于时间滑块(96px)上方, 避免重叠 */
  width: 380px;
  padding: 14px 18px 16px;
  background: rgba(83, 105, 118, 0.82);
  border-radius: 6px;
  box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 13px;
  z-index: 12;
  backdrop-filter: blur(4px);
}

.close-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.ai-title {
  font-size: 15px;
  font-weight: 600;
  color: #7fd6ff;
}
.ai-loading {
  font-size: 12px;
  color: #9fd6ff;
  animation: blink 1s infinite;
}
@keyframes blink {
  50% {
    opacity: 0.4;
  }
}

.ai-row {
  display: flex;
  gap: 8px;
  line-height: 1.9;
}
.ai-row .label {
  width: 60px;
  flex-shrink: 0;
  color: #9fb6c8;
}
.ai-row .value {
  color: #fff;
}

.ai-divider {
  margin: 10px 0 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.25);
  color: #7fd6ff;
  font-weight: 600;
  font-size: 13px;
}

.ai-list {
  margin: 0;
  padding-left: 20px;
}
.ai-list li {
  line-height: 1.9;
  color: #eaf3fb;
}

/* 一键追问按钮 */
.ask-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12px;
  color: #00e5ff;
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(25, 144, 255, 0.12));
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.ask-btn:hover {
  color: #fff;
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.3), rgba(25, 144, 255, 0.3));
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
}
.ask-icon {
  font-size: 10px;
}
</style>
