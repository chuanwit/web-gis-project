<template>
  <!-- 大屏面板: Grid 网格定位各区域, 非面板区域点击穿透到地图 -->
  <div class="panel">
    <header class="area-header">
      <Header></Header>
    </header>
    <!-- 左侧图表列(客流趋势 + 公交客流雷达/玫瑰图) -->
    <aside class="area-left" v-show="show">
      <TravelChart />
      <BusChart />
    </aside>
    <!-- 右侧图表列(含静态统计卡片) -->
    <aside class="area-right" v-show="show">
      <PopulationChart />
      <HospitalCard />
      <UniversityCard />
    </aside>
    <footer class="area-footer">
      <Footer v-model="show" />
    </footer>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import Header from './Header.vue'
import TravelChart from './Panels/TravelChart.vue'
import BusChart from './Panels/BusChart.vue'
import PopulationChart from './Panels/PopulationChart.vue'
import HospitalCard from './Panels/HospitalCard.vue'
import UniversityCard from './Panels/UniversityCard.vue'
import Footer from 'D:/1创建项目地/专业实习/smart-city/src/components/Footer/index.vue'
// 控制面板显示隐藏
const show = ref(true)
</script>
<style scoped>
/* Grid 叠加层: 面板悬浮在地图之上(absolute 全屏), 统一管理大屏各区域位置 */
.panel {
  position: absolute;
  inset: 0;
  /* 悬浮在地图上层的 z-index, 低于地图控件(MapControls 通常更高) */
  /* 注意必须高于 L7 Scene(z-index: 2): 否则城市视角下建筑/道路图层绘制在面板之上, 看起来就像卡片"半透明"透出了建筑 */
  z-index: 3;
  display: grid;
  /*
   * 命名网格区域: 3 行 3 列的模板, 一眼可读的布局
   * - 头/尾各占满整行(header/footer)
   * - 左右各占一列(left/right)
   * - 中间用 . 留空: 不分配任何面板, 配合外层 pointer-events: none 点击穿透到地图
   */
  grid-template-areas:
    'header header header'
    'left   .      right'
    'footer footer footer';
  /* minmax(0, 1fr) 防止中间行被面板内容撑开, 将 Footer 挤出视口 */
  grid-template-rows: 100px minmax(0, 1fr) 80px;
  grid-template-columns: 340px minmax(0, 1fr) 340px;
  /* 面板整体不接收点击, 未分配区域(如中间地图区)自动穿透; 各区域再单独恢复 */
  pointer-events: none;
}

/* 头部: 占 header 区域, 恢复点击(标题无需交互, 主要是明确归属) */
.area-header {
  grid-area: header;
  pointer-events: auto;
}

/* 左右图表列: 弹性纵向排列卡片 */
.area-left,
.area-right {
  /* 恢复点击: 卡片内部按钮/图表交互可用 */
  pointer-events: auto;
  /* 允许子元素收缩, 否则 flex 子项会把格子撑高 */
  min-height: 0;
  /* 内容超出格子高度时隐藏, 保证不出现滚动条、不破坏大屏布局 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* 卡片之间的纵向间距 */
  gap: 16px;
  padding: 20px;
  box-sizing: border-box;
}
/* 左右两列分别定位到对应网格区域 */
.area-left {
  grid-area: left;
}
.area-right {
  grid-area: right;
}

/* 底部控制栏: 占 footer 区域, 恢复点击(旋转/复位/测量等按钮需要交互) */
.area-footer {
  grid-area: footer;
  pointer-events: auto;
}
</style>
