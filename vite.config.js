import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({
  plugins: [
    vue(),
    // mock 服务: 拦截 /api 接口, 返回 mock 目录下的模拟数据
    // 注意: mock 仅匹配 mock/index.js 中声明的 url, /api/ai/* 由下方 proxy 转发到 Express
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
  server: {
    proxy: {
      // AI 流式接口转发到 Express 代理服务(端口 3001, 见 server/index.js)
      // vite proxy 优先于 mock middleware, /api/ai/chat 不会被 mock 拦截
      '/api/ai': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // SSE 流式响应需要关闭代理缓冲, 否则前端会一次性收到全部内容
        // ws: false, // http-proxy 默认不缓冲, 这里仅作注释说明
      },
    },
  },
  // 所有静态资源一律输出为文件、不做 base64 内联:
  // threebox 需要真实可 fetch 的 .obj/.mtl URL(内联成 data URL 无法被 MTLLoader 加载)
  build: {
    assetsInlineLimit: 0,
  },
})

