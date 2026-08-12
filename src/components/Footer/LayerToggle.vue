<template>
  <div class="item">
    <button
      class="toggle-btn"
      :class="{ active: modelValue }"
      @click="modelValue = !modelValue"
    >
      <img class="btn-icon" :src="icon" :alt="label" />
    </button>
    <p>{{ label }}</p>
  </div>
</template>
<script setup>
// 通用图层开关按钮: 与共享图层状态(useLayerToggles 模块级单例)双向绑定,
// 一处点击, SmartCity 的图层管理与 Footer 的按钮状态全局同步。
import { computed } from 'vue'
import { useLayerToggles } from '@/composables/useLayerToggles'

const toggles = useLayerToggles()

const props = defineProps({
  name: { type: String, required: true }, // toggles 中的键(heatmap/scatter/model3d)
  icon: { type: String, required: true }, // 图标地址
  label: { type: String, default: '' }, // 按钮下方文案
})

const modelValue = computed({
  get: () => toggles[props.name],
  set: (value) => {
    toggles[props.name] = value
  },
})
</script>


