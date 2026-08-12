// 区域 + 应急资源数据接口
import request from './requests.js'

export const getRegions = () =>
  request({ url: '/api/wuhan_regions', method: 'GET' })

export const getResources = () =>
  request({ url: '/api/wuhan_resources', method: 'GET' })


