<template>
  <ScreenScale>
    <MapContainer>
      <SmartCity></SmartCity>
      <ScreenPanel></ScreenPanel>
      <MapControls></MapControls>
    </MapContainer>
  </ScreenScale>
</template>

<script setup>
import MapContainer from '@/components/MapContainer.vue'
import SmartCity from '@/components/SmartCity/index.vue'
import MapControls from '@/components/MapControls.vue'
import ScreenScale from '@/components/ScreenScale.vue'
import ScreenPanel from '@/components/ScreenPanel/ScreenPanel.vue'
</script>

<style scoped></style>
