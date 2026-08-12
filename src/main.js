import { createApp } from 'vue'
import { pinia } from './stores'
import App from './App.vue'
import './assets/styles/reset.css'
import './assets/styles/theme.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(pinia)
app.use(ElementPlus)
app.mount('#app')


