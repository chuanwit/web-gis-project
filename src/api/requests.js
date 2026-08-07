// 导入axios
import axios from 'axios'

// 创建axios实例
// baseURL 为空: 与 dev server 同源, /api 接口由 vite-plugin-mock 拦截
const instance = axios.create({
  baseURL: '',
  timeout: 10000,
})

// 配置响应拦截器
instance.interceptors.response.use(
  (res) => {
    if (res.status === 200) {
      return res.data
    } else {
      console.error('请求失败')
      return Promise.reject('请求失败')
    }
  },
  (err) => {
    return Promise.reject(err)
  },
)

// 导出实例
export default instance