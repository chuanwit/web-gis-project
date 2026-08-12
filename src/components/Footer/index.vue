<template>
  <footer class="footer">
    <div class="btn-groups">
      <RotationButton />
      <ChartsToggle v-model="show" />
      <ViewSwitch />
      <DrawTools />
      <MeasureTools />
      <RouteTools />
      <!-- 扩展图层开关: 热力图 / 散点动图(替代雷达图) / 三维厂房 -->
      <LayerToggle name="heatmap" :icon="heatIcon" label="热力图" />
      <LayerToggle name="scatter" :icon="scatterIcon" label="事故散点" />
      <LayerToggle name="model3d" :icon="cubeIcon" label="三维厂房" />
    </div>
    <!-- 交通流预测时间滑块(固定悬浮于底部栏上方, 与数字孪生共用时间轴) -->
    <TimeBar />
  </footer>
</template>
<script setup>
import RotationButton from './RotationButton.vue'
import ChartsToggle from './ChartsToggle.vue'
import ViewSwitch from './ViewSwitch.vue'
import DrawTools from './DrawTools.vue'
import MeasureTools from './MeasureTools.vue'
import RouteTools from './RouteTools.vue'
import LayerToggle from './LayerToggle.vue'
import TimeBar from './TimeBar.vue'

import heatIcon from '@/assets/icons/heat.svg'
import scatterIcon from '@/assets/icons/scatter.svg'
import cubeIcon from '@/assets/icons/cube.svg'

const show = defineModel()
</script>
<style scoped>
.footer {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 9;
  background: url('@/assets/imgs/footer.png') center no-repeat;
  background-size: cover;
}
.btn-groups {
  display: flex;
  justify-content: center;
  font-size: 12px;
  color: #fff;
}

/* 按钮公共样式(穿透到各功能组件): 图标按钮 + 下方文案 */
:deep(.item) {
  margin-left: 20px;
  text-align: center;
}
:deep(.toggle-btn) {
  margin-bottom: 4px;
  width: 40px;
  height: 40px;
  border: none;
  outline: none;
  color: #fff;
  background: linear-gradient(
    to bottom,
    rgba(0, 128, 255, 0.377),
    rgba(0, 128, 255, 0.281)
  );
  border-radius: 50%;
  box-shadow: 0 0 5px 3px rgba(0, 0, 0, 0.3);
}
:deep(.toggle-btn:hover) {
  background: linear-gradient(
    to bottom,
    rgba(0, 128, 255, 1),
    rgba(0, 128, 255, 0.281)
  );
  cursor: pointer;
}
/* 激活态: 当前有绘制会话进行中(事故查询/测量工具) */
:deep(.toggle-btn.active) {
  background: linear-gradient(
    to bottom,
    rgba(0, 128, 255, 1),
    rgba(0, 128, 255, 0.6)
  );
}
/* 按钮图标(本地 SVG, 白色线条) */
:deep(.toggle-btn .btn-icon) {
  width: 18px;
  height: 18px;
  display: block;
  margin: 0 auto;
}
</style>


