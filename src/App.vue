<template>
  <!-- 登录界面(未登录时全屏显示) -->
  <Login v-if="!loggedIn" @login="onLogin" />

  <!-- 主屏(登录后渲染: 地图 + 面板 + Loading + AI 助手) -->
  <template v-else>
    <ScreenScale>
      <MapContainer>
        <SmartCity></SmartCity>
        <ScreenPanel></ScreenPanel>
        <MapControls></MapControls>
      </MapContainer>
    </ScreenScale>
    <!-- 启动 Loading 遮罩(品牌字母+进度条, 地图就绪后淡出) -->
    <Loading ref="loadingRef" />
    <!-- AI 智能助手: 右下角悬浮入口 + 抽屉式对话窗(放在 ScreenScale 外, 不被缩放) -->
    <AiAssistant />
  </template>
</template>

<script setup>
import { ref } from 'vue'
import MapContainer from '@/components/MapContainer.vue'
import SmartCity from '@/components/SmartCity/index.vue'
import MapControls from '@/components/MapControls.vue'
import ScreenScale from '@/components/ScreenScale.vue'
import ScreenPanel from '@/components/ScreenPanel/ScreenPanel.vue'
import Loading from '@/components/Loading.vue'
import AiAssistant from '@/components/AiAssistant/AiAssistant.vue'
import Login from '@/components/Login.vue'
import { useDataStore } from '@/stores'

const loadingRef = ref(null)
const loggedIn = ref(false)
const dataStore = useDataStore()

// 登录成功: 切换到主屏, 触发数据预加载(降级容错, 不阻塞渲染)
function onLogin(info) {
  console.log('[App] 登录成功, 角色:', info?.role, '用户:', info?.username)
  loggedIn.value = true
  dataStore.loadAll().catch((e) => console.warn('[App] 数据预加载部分失败:', e))
}
</script>

<style scoped></style>
