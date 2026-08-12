<template>
  <!-- 顶部业务模块导航: 四大业务闭环切换 -->
  <!-- 借鉴参考6(热环境)的顶部业务功能窗口设计 -->
  <nav class="business-nav">
    <button
      v-for="m in modules"
      :key="m.key"
      class="nav-tab"
      :class="{ active: current === m.key }"
      @click="select(m.key)"
    >
      <span class="tab-icon">{{ iconMap[m.icon] }}</span>
      <span class="tab-label">{{ m.label }}</span>
      <span class="tab-glow"></span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useBusinessStore, BUSINESS_MODULES } from '@/stores'

const business = useBusinessStore()
const modules = BUSINESS_MODULES
const current = computed(() => business.module)

const iconMap = {
  monitor: '◉',
  heat: '◈',
  hospital: '✚',
  route: '➤',
}

function select(key) {
  business.setModule(key)
}
</script>

<style scoped>
.business-nav {
  /* 定位由父容器 .business-nav-wrap 控制, 这里只管布局 */
  display: flex;
  gap: 4px;
}
.nav-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: rgba(16, 32, 56, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 4px;
  color: var(--t-secondary, #8fa8c2);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(6px);
  overflow: hidden;
}
.nav-tab:hover {
  color: var(--c-accent, #00e5ff);
  border-color: rgba(0, 229, 255, 0.5);
  box-shadow: var(--glow-primary);
}
.nav-tab.active {
  color: #fff;
  background: linear-gradient(180deg, rgba(25, 144, 255, 0.35), rgba(25, 144, 255, 0.12));
  border-color: var(--c-accent, #00e5ff);
  box-shadow: var(--glow-accent);
}
.tab-icon {
  font-size: 14px;
  color: var(--c-accent, #00e5ff);
}
.tab-label {
  letter-spacing: 1px;
}
/* 激活态底部光线 */
.tab-glow {
  position: absolute;
  left: 10%;
  bottom: 0;
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-accent), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.nav-tab.active .tab-glow {
  opacity: 1;
}
</style>


