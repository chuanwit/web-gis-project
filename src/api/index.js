// 导入request实例
import request from './requests.js'

// 编写接口

// 获取城市建筑数据
export const getCityBuildings = () => {
  return request({
    url: '/api/wuhan_buildings',
    method: 'GET',
  })
}

// 获取道路数据
export const getRoads = () => {
  return request({
    url: '/api/wuhan_roads',
    method: 'GET',
  })
}

// 获取交通事件数据
export const getEvents = () => {
  return request({
    url: '/api/wuhan_events',
    method: 'GET',
  })
}

// AI 智能分析: 传入事故特征(event_id, 当前hour), 返回地点/类型/分析建议
export const getAiAnalysis = (data) => {
  return request({
    url: '/api/ai_analysis',
    method: 'POST',
    data,
  })
}