<template>
  <ChartCard title="高校学生统计" is-static>
    <div class="list">
      <div>
        <h4>高校 <span>130所</span></h4>
        <img src="@/assets/icons/school.png" alt="" />
      </div>
      <div>
        <h4>在校大学生<span>100万</span></h4>
        <img src="@/assets/icons/student.png" alt="" />
      </div>
    </div>
  </ChartCard>
</template>

<script setup>
// 右侧静态卡片: 高校学生统计
import ChartCard from '../Charts/ChartCard.vue'
</script>

<style scoped>
.list {
  display: flex;
  justify-content: space-evenly;
  font-size: 12px;
  color: #fff;
  text-align: center;
}
.list img {
  width: 40px;
}
.list h4 {
  font-weight: normal;
  margin-bottom: 8px;
}
.list h4 span {
  color: #1990ff;
}
</style>
