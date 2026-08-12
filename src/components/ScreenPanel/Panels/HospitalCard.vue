<template>
  <ChartCard title="武汉市三甲医院" is-static>
    <div class="list">
      <div>
        <h4>医院 <span>30家</span></h4>
        <img src="@/assets/icons/hospital.png" />
      </div>
      <div>
        <h4>门诊部 <span>300个</span></h4>
        <img src="@/assets/icons/building.png" />
      </div>
      <div>
        <h4>病床 <span>3000张</span></h4>
        <img src="@/assets/icons/bed.png" />
      </div>
    </div>
  </ChartCard>
</template>
<script setup>
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


