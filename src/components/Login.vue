<template>
  <!-- 登录界面: 全屏星空 + 角色选择 + 账号密码 -->
  <!-- 借鉴参考6(热环境)的登录界面 + 参考4(华农)的科技感主题 -->
  <transition name="login-fade">
    <div v-if="visible" class="login-mask">
      <!-- 星空背景 -->
      <div class="stars">
        <span v-for="i in 60" :key="i" class="star" :style="starStyle(i)"></span>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card glass-card scan-line">
        <div class="login-header">
          <div class="login-brand">
            <span v-for="(ch, i) in brand" :key="i" class="brand-char" :style="{ animationDelay: i * 0.1 + 's' }">{{ ch }}</span>
          </div>
          <div class="login-subtitle">SMART CITY · WUHAN</div>
          <div class="login-tagline">交通指挥中心 · 统一身份认证</div>
        </div>

        <!-- 角色选择 -->
        <div class="role-section">
          <div class="section-label">选择角色</div>
          <div class="role-list">
            <div
              v-for="r in roles"
              :key="r.key"
              class="role-card"
              :class="{ active: selectedRole === r.key }"
              @click="selectedRole = r.key"
            >
              <div class="role-icon">{{ r.icon }}</div>
              <div class="role-name">{{ r.name }}</div>
              <div class="role-desc">{{ r.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 账号密码 -->
        <div class="form-section">
          <div class="form-item">
            <span class="form-icon">👤</span>
            <input
              v-model="username"
              type="text"
              class="form-input"
              placeholder="请输入账号"
              @keydown.enter="handleLogin"
            />
          </div>
          <div class="form-item">
            <span class="form-icon">🔒</span>
            <input
              v-model="password"
              type="password"
              class="form-input"
              placeholder="请输入密码"
              @keydown.enter="handleLogin"
            />
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-tip">⚠ {{ error }}</div>

        <!-- 登录按钮 -->
        <button class="login-btn btn-pulse" @click="handleLogin">
          <span class="btn-text">进 入 指 挥 中 心</span>
          <span class="btn-glow"></span>
        </button>

        <div class="login-hint">提示: 任意非空账号密码即可登录</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['login'])

const visible = ref(true)
const brand = ['智', '慧', '城', '市']

const roles = [
  { key: 'commander', name: '指挥员', icon: '⭐', desc: '全权限: 指挥调度 + 推演' },
  { key: 'analyst', name: '分析员', icon: '📊', desc: '分析权限: 风险诊断 + 资源' },
  { key: 'admin', name: '管理员', icon: '⚙', desc: '系统权限: 配置 + 管理' },
]

const selectedRole = ref('commander')
const username = ref('')
const password = ref('')
const error = ref('')

function handleLogin() {
  if (!username.value.trim()) {
    error.value = '请输入账号'
    return
  }
  if (!password.value.trim()) {
    error.value = '请输入密码'
    return
  }
  error.value = ''
  // 淡出动画后通知父组件
  setTimeout(() => {
    visible.value = false
    emit('login', { role: selectedRole.value, username: username.value })
  }, 200)
}

// 星空粒子样式(随机位置 + 闪烁延迟)
function starStyle(i) {
  const top = Math.random() * 100
  const left = Math.random() * 100
  const size = Math.random() * 2 + 1
  const delay = Math.random() * 3
  const duration = Math.random() * 2 + 1.5
  return {
    top: top + '%',
    left: left + '%',
    width: size + 'px',
    height: size + 'px',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
  }
}
</script>

<style scoped>
.login-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #0d2240 0%, #050b18 70%, #02060f 100%);
  overflow: hidden;
}

/* 星空背景 */
.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  animation: star-twinkle ease-in-out infinite;
}
@keyframes star-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.4); }
}

/* 登录卡片 */
.login-card {
  position: relative;
  width: 420px;
  padding: 36px 40px 32px;
  background: linear-gradient(160deg, rgba(16, 32, 56, 0.92), rgba(10, 20, 38, 0.92));
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 16px;
  box-shadow:
    0 0 40px rgba(0, 229, 255, 0.15),
    0 12px 60px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
}

/* 头部品牌 */
.login-header {
  text-align: center;
  margin-bottom: 24px;
}
.login-brand {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}
.brand-char {
  font-size: 32px;
  font-weight: 700;
  color: #00e5ff;
  text-shadow: 0 0 16px rgba(0, 229, 255, 0.7);
  opacity: 0;
  transform: translateY(10px);
  animation: brand-in 0.6s ease forwards;
}
@keyframes brand-in {
  to { opacity: 1; transform: translateY(0); }
}
.login-subtitle {
  font-size: 11px;
  letter-spacing: 5px;
  color: #5f7896;
  margin-bottom: 4px;
}
.login-tagline {
  font-size: 12px;
  color: #8fa8c2;
  letter-spacing: 1px;
}

/* 角色选择 */
.role-section {
  margin-bottom: 20px;
}
.section-label {
  font-size: 12px;
  color: #8fa8c2;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.role-list {
  display: flex;
  gap: 8px;
}
.role-card {
  flex: 1;
  padding: 10px 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.role-card:hover {
  background: rgba(0, 229, 255, 0.08);
  border-color: rgba(0, 229, 255, 0.3);
}
.role-card.active {
  background: rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
}
.role-icon {
  font-size: 22px;
  margin-bottom: 4px;
}
.role-name {
  font-size: 13px;
  color: #eaf3fb;
  font-weight: 600;
  margin-bottom: 2px;
}
.role-desc {
  font-size: 10px;
  color: #5f7896;
  line-height: 1.3;
}

/* 表单 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.form-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: rgba(20, 40, 70, 0.5);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-item:focus-within {
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.1);
}
.form-icon {
  font-size: 14px;
  opacity: 0.7;
}
.form-input {
  flex: 1;
  padding: 11px 0;
  background: transparent;
  border: none;
  outline: none;
  color: #eaf3fb;
  font-size: 13px;
  font-family: inherit;
}
.form-input::placeholder {
  color: #5f7896;
}

/* 错误提示 */
.error-tip {
  font-size: 12px;
  color: #ff8888;
  margin-bottom: 12px;
  text-align: center;
}

/* 登录按钮 */
.login-btn {
  position: relative;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #1990ff, #00e5ff);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 3px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.35);
}
.login-btn:hover {
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.6);
  transform: translateY(-1px);
}
.login-btn:active {
  transform: translateY(0);
}
.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: btn-sweep 2.5s ease-in-out infinite;
}
@keyframes btn-sweep {
  0% { left: -100%; }
  60%, 100% { left: 100%; }
}

.login-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 11px;
  color: #5f7896;
}

/* 登录淡出动画 */
.login-fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.login-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
