import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/reset.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 测试接口
import { getCityBuildings } from './api/index.js'
getCityBuildings().then((res) => {
  console.log(res)
})

createApp(App).use(ElementPlus).mount('#app')