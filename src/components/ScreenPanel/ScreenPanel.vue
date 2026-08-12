<template>
  <!-- 大屏面板: Grid 网格定位各区域, 非面板区域点击穿透到地图 -->
  <!-- 业务模块切换: BusinessNav 驱动 business.store, 左右面板按模块切换内容 -->
  <div class="panel">
    <header class="area-header">
      <Header></Header>
    </header>

    <!-- 顶部业务导航(悬浮在 header 下方中央) -->
    <BusinessNav class="business-nav-wrap" />
    <!-- KPI 指标卡片(悬浮在导航下方) -->
    <KpiBar />

    <!-- 左侧图表列: 按业务模块切换内容 -->
    <aside class="area-left" v-show="show">
      <!-- 综合态势: 出行人口 + 公交客流 -->
      <template v-if="business.module === 'overview'">
        <TravelChart />
        <BusChart />
      </template>
      <!-- 交通风险诊断: 风险雷达 + 事件类型分布 -->
      <template v-else-if="business.module === 'risk'">
        <RiskRadarChart />
        <EventTypeChart />
      </template>
      <!-- 应急资源可达: 资源筛选 + 覆盖率 -->
      <template v-else-if="business.module === 'resource'">
        <ResourceFilter />
        <ResourceCoverage />
      </template>
      <!-- 情景推演优化: 策略勾选 -->
      <template v-else-if="business.module === 'simulation'">
        <SimulationStrategies />
      </template>
    </aside>

    <!-- 右侧图表列: 按业务模块切换内容 -->
    <aside class="area-right" v-show="show">
      <!-- 综合态势: 人口 + 医院 + 高校 -->
      <template v-if="business.module === 'overview'">
        <PopulationChart />
        <HospitalCard />
        <UniversityCard />
      </template>
      <!-- 交通风险诊断: 区域风险排行 + 高风险事件列表 -->
      <template v-else-if="business.module === 'risk'">
        <RegionRiskRank />
        <HighRiskEvents />
      </template>
      <!-- 应急资源可达: 医院 + 高校(保留统计) -->
      <template v-else-if="business.module === 'resource'">
        <HospitalCard />
        <UniversityCard />
      </template>
      <!-- 情景推演优化: 预估指标 + 运行模拟 -->
      <template v-else-if="business.module === 'simulation'">
        <SimulationPreview />
      </template>
    </aside>

    <footer class="area-footer">
      <Footer v-model="show" />
    </footer>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import Header from './Header.vue'
import BusinessNav from './BusinessNav.vue'
import KpiBar from './KpiBar.vue'
// 综合态势面板
import TravelChart from './Panels/TravelChart.vue'
import BusChart from './Panels/BusChart.vue'
import PopulationChart from './Panels/PopulationChart.vue'
import HospitalCard from './Panels/HospitalCard.vue'
import UniversityCard from './Panels/UniversityCard.vue'
// 交通风险诊断面板
import RiskRadarChart from './Panels/RiskRadarChart.vue'
import EventTypeChart from './Panels/EventTypeChart.vue'
import RegionRiskRank from './Panels/RegionRiskRank.vue'
import HighRiskEvents from './Panels/HighRiskEvents.vue'
// 应急资源可达面板
import ResourceFilter from './Panels/ResourceFilter.vue'
import ResourceCoverage from './Panels/ResourceCoverage.vue'
// 情景推演优化面板
import SimulationStrategies from './Panels/SimulationStrategies.vue'
import SimulationPreview from './Panels/SimulationPreview.vue'

import Footer from 'D:/1创建项目地/专业实习/smart-city/src/components/Footer/index.vue'
import { useBusinessStore } from '@/stores'

// 控制面板显示隐藏
const show = ref(true)
// 业务模块状态(驱动左右面板切换)
const business = useBusinessStore()
</script>
<style scoped>
/* Grid 叠加层: 面板悬浮在地图之上(absolute 全屏), 统一管理大屏各区域位置 */
.panel {
  position: absolute;
  inset: 0;
  /* 悬浮在地图上层的 z-index, 低于地图控件(MapControls 通常更高) */
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

/* 头部: 占 header 区域, 恢复点击 */
.area-header {
  grid-area: header;
  pointer-events: auto;
}

/* 业务导航容器: 悬浮在 header 下方, 恢复点击 */
.business-nav-wrap {
  position: absolute;
  left: 50%;
  top: 100px;
  transform: translateX(-50%);
  z-index: 5;
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
  padding-top: 60px; /* 为顶部 BusinessNav + KpiBar 留空间 */
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


