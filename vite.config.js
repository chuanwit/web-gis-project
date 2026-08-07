import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({
  plugins: [
    vue(),
    // mock 服务: 拦截 /api 接口, 返回 mock 目录下的模拟数据
    viteMockServe({
      mockPath: 'mock',
      localEnabled: true,
      watchFiles: true,
      logger: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 所有静态资源一律输出为文件、不做 base64 内联:
  // threebox 需要真实可 fetch 的 .obj/.mtl URL(内联成 data URL 无法被 MTLLoader 加载)
  build: {
    assetsInlineLimit: 0,
  },
})