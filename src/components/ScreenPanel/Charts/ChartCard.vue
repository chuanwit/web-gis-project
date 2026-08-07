<template>
  <div class="g2-chart" :class="{ static: isStatic }">
    <div class="title">{{ title }}</div>
    <slot></slot>
  </div>
</template>
<script setup>
// 图表卡片(纯表现层): 负责标题/边框装饰/布局, 内容由插槽注入
defineProps({
  title: {
    type: String,
    required: true,
  },
  // 静态卡片(固定高度, 不参与弹性分配)
  isStatic: {
    type: Boolean,
    default: false,
  },
})
</script>
<style scoped>
.g2-chart {
  position: relative;
  padding: 20px;
  /* 半透明渐变 + 毛玻璃(backdrop-filter): 透出底下地图但被模糊; 建筑图层在面板之下(z-index 低于 panel), 不会透出 */
  background: linear-gradient(to bottom, #292e4968, #5369766a);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 允许卡片收缩到弹性分配的高度: 默认 min-height:auto 会以内部画布内容高度为下限,
     显隐切换后画布尺寸一旦错乱, 卡片就会被撑得高低不一导致左右列布局错位 */
  min-height: 0;
}

/* 左上/右上角边框装饰 */
.g2-chart::before {
  display: block;
  content: '';
  position: absolute;
  top: -5px;
  left: -2px;
  width: 111px;
  height: 35px;
  background-image: url('@/assets/imgs/border.png');
  transform: rotate(180deg);
}
.g2-chart::after {
  display: block;
  content: '';
  position: absolute;
  bottom: -5px;
  right: -2px;
  width: 111px;
  height: 35px;
  background-image: url('@/assets/imgs/border.png');
}

.g2-chart .title {
  padding-left: 64px;
  margin-bottom: 16px;
  color: #fff;
  line-height: 46px;
  background: url('@/assets/imgs/chart-item.png') no-repeat;
  flex-shrink: 0;
}

/* 静态卡片: 固定高度, 不参与弹性分配(180px 与左侧图表卡高度协调, 避免右侧饼图过大) */
.g2-chart.static {
  padding: 10px;
  height: 180px;
  box-sizing: border-box;
  flex: none;
}
.g2-chart.static .title {
  transform: scale(0.8);
  transform-origin: left center;
  margin-bottom: 0;
}
/* 静态卡内容垂直居中, 充分利用加高后的空间 */
.g2-chart.static :deep(.list) {
  align-items: center;
  flex: 1;
}
</style>
