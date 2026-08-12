<template>
  <div class="item">
    <button class="toggle-btn" @click="show = !show">
      <img class="btn-icon" src="@/assets/icons/monitor.svg" alt="控制中心" />
    </button>
    <p>控制中心</p>
  </div>
</template>
<script setup>
// 功能组件: 控制中心(图表面板显隐), 通过 defineModel 与父组件双向绑定
// 默认 modelValue, 与 ScreenPanel 的 v-model 打通
const show = defineModel()
</script>


