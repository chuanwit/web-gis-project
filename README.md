# 智慧城市可视化大屏 - 武汉

> 基于 Vue 3 + Mapbox GL + AntV L7 的智慧城市三维可视化大屏，以武汉市为示例，实现建筑、道路、事件、区域、资源等多源数据的融合展示、业务闭环分析与 AI 智能辅助决策。

**版本：v10**

---

## 目录

- [项目概述](#项目概述)
- [核心特性](#核心特性)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [架构设计](#架构设计)
- [业务模块详解](#业务模块详解)
- [AI 智能助手](#ai-智能助手)
- [地图图层与可视化](#地图图层与可视化)
- [交互工具](#交互工具)
- [数字孪生时段联动](#数字孪生时段联动)
- [数据面板与图表](#数据面板与图表)
- [登录与体验优化](#登录与体验优化)
- [状态管理（Pinia）](#状态管理pinia)
- [Mock 数据与 API](#mock-数据与-api)
- [Express AI 服务](#express-ai-服务)
- [配置说明](#配置说明)
- [开发注意事项](#开发注意事项)
- [常见问题](#常见问题)
- [浏览器支持](#浏览器支持)

---

## 项目概述

本项目是一个面向城市交通指挥中心的智慧城市可视化大屏，以武汉市为示例区域，融合了三维地图渲染、多源数据可视化、业务闭环分析、AI 大模型辅助决策等多项能力。

### 整体能力一览

| 能力域 | 说明 |
|--------|------|
| 三维地图 | Mapbox GL 地球投影 + AntV L7 地理可视化，建筑/道路/事件/区域/资源多图层融合 |
| 业务闭环 | 综合态势 → 交通风险诊断 → 应急资源可达 → 情景推演优化，四大模块联动切换 |
| AI 大模型 | DeepSeek 真实大模型接入 + SSE 流式响应 + 规则引擎降级兜底 + 数据溯源 |
| 数字孪生 | 上午/下午/傍晚/夜晚四时段天空、建筑灯光、道路拥堵联动 |
| 交互分析 | 矩形拉框事故查询、多边形面积测量、线段长度测量、A* 最优路径规划 |
| 体验优化 | 星空登录界面、Loading 启动动画、KPI 指标卡片、实时天气、飞线辐射动画 |

---

## 核心特性

### 1. 业务闭环（四大模块）

顶部业务导航驱动整个大屏的模块切换，每个模块联动地图视角、图层显隐、左右面板内容、KPI 指标：

| 模块 | 地图视角 | 图层 | 左侧面板 | 右侧面板 |
|------|----------|------|----------|----------|
| 综合态势 | 城市俯瞰 pitch=70 | 飞线辐射 + 建筑道路 | 出行人口 + 公交客流 | 人口统计 + 医院 + 高校 |
| 交通风险诊断 | 风险区域 pitch=60 | 区域 3D 挤出 + 风险着色 | 风险雷达 + 事件类型分布 | 区域风险排行 + 高风险事件列表 |
| 应急资源可达 | 资源俯瞰 pitch=55 | 区域 + 资源点 + 服务半径 | 资源分类筛选 + 覆盖效能 | 医院 + 高校统计 |
| 情景推演优化 | 目标区域 pitch=60 | 区域 3D 挤出 | 策略勾选 + 目标片区 | 预估指标对比 + 运行模拟 |

### 2. AI 智能助手（DeepSeek + SSE 流式）

- 接入 DeepSeek 真实大模型（可配置 API Key）
- SSE 流式响应，打字机效果逐字输出
- 数据上下文注入：将当前城市数据（区域风险排行、事件分布、资源统计）作为 system prompt
- 数据溯源标签：每条回答标注引用了哪些数据源
- 规则引擎降级：未配置 API Key 或调用失败时，自动切换规则引擎保证演示不中断
- 快捷问题芯片：预置 6 个常见问题，一键发送

### 3. 可视化增强

- **飞线辐射动画**：武汉中心 → 5 区域弧线飞行动画，按风险值着色（低→高：青→黄→红）
- **3D 区域挤出**：PolygonLayer extrude，按 riskScore 挤出高度，直观呈现风险等级
- **资源服务半径**：turf.buffer 生成缓冲区多边形，半透明覆盖展示资源覆盖范围
- **实时天气**：Header 显示武汉天气，随时段（上午/下午/傍晚/夜晚）变化
- **拉框动态聚合**：框选事件实时统计总数、平均等级、最高等级、主要类型 + 类型分布迷你条

### 4. 体验优化

- **星空登录界面**：全屏星空粒子背景 + 角色选择（指挥员/分析员/管理员）+ 账号密码
- **Loading 启动动画**：品牌字母渐出 + 进度条 + 加载提示文字轮播
- **一键回首页**：点击 Header 标题回到综合态势模块
- **全局科技感主题**：青蓝主色 + 霓虹强调，CSS 变量统一管理，毛玻璃 + 扫边光动效

---

## 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Vue 3 | ^3.5.40 | 组件化开发 (Composition API + `<script setup>`) |
| 状态管理 | Pinia | ^4.0.2 | 全局状态中枢（地图/时间/图层/业务/AI/数据） |
| 构建工具 | Vite | ^8.2.0 | 开发服务器与构建 |
| 地图底图 | Mapbox GL JS | ^2.14.1 | 三维地球/地图渲染 |
| 地理可视化 | AntV L7 | 2.15.2 | 空间数据图层渲染（建筑/道路/热力图/散点/区域/飞线） |
| 地图适配 | @antv/l7-maps | 2.15.2 | L7 的 Mapbox 适配器 |
| 地图控件 | @antv/l7-component | 2.15.2 | Logo/缩放/全屏/鼠标位置控件 |
| 绘制工具 | AntV L7 Draw | 3.0.25 | 矩形框选、多边形/线测量 |
| 统计图表 | AntV G2 | ^5.4.8 | 柱状图、饼图、玫瑰图、雷达图 |
| 空间分析 | Turf.js | ^7.3.5 | 点面关系判断、buffer 缓冲区生成 |
| 3D 模型 | threebox-plugin | ^2.2.7 | 在 Mapbox 中加载 OBJ 三维模型 |
| UI 组件库 | Element Plus | ^2.14.3 | 表格、按钮等组件 |
| HTTP 客户端 | Axios | ^1.19.0 | 接口请求 |
| Mock 服务 | vite-plugin-mock | 2.9.6 | 本地模拟数据接口 |
| AI 后端 | Express | ^5.2.1 | DeepSeek 代理 + SSE 流式服务 |
| AI 模型 | DeepSeek | deepseek-chat | 大语言模型（可选，支持降级） |

---

## 环境要求

- Node.js >= 18.x（推荐 LTS v20 或 v22）
- npm >= 9.x
- 现代浏览器（Chrome/Firefox/Edge 最新版，需支持 WebGL 2.0）
- Mapbox Access Token（已内置，可替换为自己的）

---

## 快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd smart-city

# （推荐）设置国内镜像加速
npm config set registry https://registry.npmmirror.com

# 安装依赖
npm install
```

### 2. 启动开发服务

项目有两种启动方式：

#### 方式 A：一键启动前端 + AI 服务（推荐）

```bash
npm run dev:all
```

这会同时启动：
- Vite 开发服务器（前端，默认端口 5173）
- Express AI 服务（后端，默认端口 3001）

#### 方式 B：分别启动

```bash
# 终端 1：启动前端
npm run dev

# 终端 2：启动 AI 服务
npm run server
```

### 3. 访问应用

浏览器打开 `http://localhost:5173/`（端口号以终端输出为准）。

### 4. 登录

- 选择角色（指挥员/分析员/管理员）
- 输入任意非空账号密码
- 点击"进入指挥中心"

### 5. 配置 DeepSeek（可选）

如需启用真实 AI 大模型（默认走规则引擎降级）：

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑 .env，填入你的 DeepSeek API Key
# DEEPSEEK_API_KEY=sk-your-key-here
```

获取 API Key：访问 https://platform.deepseek.com/

### 6. 生产构建

```bash
npm run build    # 构建到 dist/
npm run preview  # 本地预览构建产物
```

---

## 项目结构

```
smart-city/
├── mock/                              # Mock 数据接口
│   ├── index.js                       # Mock 路由配置（建筑/道路/事件/区域/资源/天气/AI分析）
│   ├── Wuhan_Buildings.json           # 武汉建筑 GeoJSON
│   ├── Wuhan_roads.json               # 武汉道路 GeoJSON（2314 条）
│   ├── Wuhan_events.json              # 武汉交通事件 GeoJSON（50 条）
│   ├── Wuhan_regions.json             # 武汉区域多边形（5 个片区）
│   └── Wuhan_resources.json           # 应急资源点（15 个：医院/消防/交警）
│
├── server/                            # Express AI 服务（DeepSeek 代理 + SSE）
│   ├── index.js                       # 服务入口（SSE 流式聊天接口）
│   ├── aiContext.js                   # 数据上下文 + system prompt 构建
│   ├── ruleEngine.js                  # 规则引擎降级（关键词意图识别）
│   ├── env.js                         # .env 加载器（不依赖 dotenv）
│   └── .env.example                   # 环境变量模板
│
├── scripts/                           # 工具脚本
│   ├── dev-all.mjs                    # 并行启动 vite + express
│   ├── gen-regions-resources.mjs      # 生成区域/资源 mock 数据
│   └── route-test/                    # 路径规划测试
│
├── public/                            # 静态资源
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── api/                           # 接口层
│   │   ├── index.js                   # 业务接口（建筑/道路/事件/AI分析）
│   │   ├── requests.js                # Axios 实例 + 拦截器
│   │   ├── regions.js                 # 区域/资源接口
│   │   └── ai.js                      # AI 流式聊天接口（fetch + SSE 解析）
│   │
│   ├── stores/                        # Pinia 状态中枢
│   │   ├── index.js                   # 统一导出 + createPinia
│   │   ├── map.js                     # 地图场景状态（scene/map 镜像）
│   │   ├── time.js                    # 时间轴状态（hour/playing/period）
│   │   ├── layers.js                  # 图层开关状态（heatmap/scatter/model3d）
│   │   ├── business.js                # 业务模块状态（module/area/event/策略/模拟）
│   │   ├── ai.js                      # AI 对话状态（messages/streaming/mode）
│   │   └── data.js                    # 数据缓存（建筑/道路/事件/区域/资源 + 降级标记）
│   │
│   ├── composables/                   # 组合式函数（兼容层，代理到 Pinia）
│   │   ├── useSceneMap.js             # inject 地图场景（provide/inject 封装）
│   │   ├── useLayerToggles.js         # 图层开关（代理到 layers store）
│   │   └── useTimeOfDay.js            # 时间轴（代理到 time store）
│   │
│   ├── utils/                         # 工具函数
│   │   ├── dataFallback.js            # 数据请求→缓存→降级 统一工具
│   │   ├── routeGraph.js              # 路径规划路网建图 + A* 搜索
│   │   └── mapCursor.js               # 地图光标样式管理
│   │
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── reset.css              # CSS 重置
│   │   │   └── theme.css              # 全局科技感主题变量 + 通用动效
│   │   ├── icons/                     # SVG/PNG 图标
│   │   ├── imgs/                      # 图片素材（头/底/边框/Logo 等）
│   │   ├── models/                    # 3D 模型（factory.obj/.mtl）
│   │   └── data/                      # 任务文档
│   │
│   ├── components/
│   │   ├── SmartCity/                 # 地图核心逻辑
│   │   │   ├── index.vue              # 图层加载/开关/数字孪生/业务模块联动
│   │   │   └── hooks/
│   │   │       ├── useBuildings.js    # 建筑图层（CityBuildingLayer + 时段灯光）
│   │   │       ├── useRoads.js        # 道路图层（拥堵着色 + 时段重建）
│   │   │       ├── useHeatmap.js      # 热力图层（事故密集点）
│   │   │       ├── useScatterAnimate.js # 散点动图（事件水波脉冲）
│   │   │       ├── useModels3d.js     # 三维厂房（threebox OBJ 模型）
│   │   │       ├── useRegions.js      # 区域多边形（3D 挤出 + 风险着色）
│   │   │       ├── useResources.js    # 应急资源（点位 + 服务半径缓冲区）
│   │   │       └── useFlyline.js      # 飞线辐射（中心→区域弧线动画）
│   │   │
│   │   ├── ScreenPanel/               # 大屏数据面板
│   │   │   ├── ScreenPanel.vue        # 面板容器（Grid 布局 + 模块切换）
│   │   │   ├── Header.vue             # 顶部标题栏（天气 + 时段 + 回首页）
│   │   │   ├── BusinessNav.vue        # 顶部业务导航（4 模块 tab）
│   │   │   ├── KpiBar.vue             # KPI 指标卡片矩阵
│   │   │   ├── Charts/
│   │   │   │   ├── ChartCard.vue      # 图表卡片外壳（装饰边框）
│   │   │   │   └── G2Chart.vue        # G2 图表包装组件
│   │   │   └── Panels/
│   │   │       ├── TravelChart.vue        # 出行人口柱状图
│   │   │       ├── BusChart.vue           # 公交玫瑰图
│   │   │       ├── PopulationChart.vue    # 人口饼图
│   │   │       ├── HospitalCard.vue       # 医院统计卡片
│   │   │       ├── UniversityCard.vue     # 高校统计卡片
│   │   │       ├── RiskRadarChart.vue     # 风险贡献雷达图
│   │   │       ├── EventTypeChart.vue     # 事件类型分布（玫瑰图）
│   │   │       ├── RegionRiskRank.vue     # 区域风险排行榜
│   │   │       ├── HighRiskEvents.vue     # 高风险事件列表
│   │   │       ├── ResourceFilter.vue     # 资源分类筛选
│   │   │       ├── ResourceCoverage.vue   # 片区资源覆盖效能
│   │   │       ├── SimulationStrategies.vue # 应急处置策略勾选
│   │   │       └── SimulationPreview.vue  # 推演预估与模拟
│   │   │
│   │   ├── AiAssistant/               # AI 智能助手
│   │   │   └── AiAssistant.vue        # 悬浮入口 + 抽屉式对话窗（流式 + 溯源）
│   │   │
│   │   ├── Footer/                    # 底部控制栏
│   │   │   ├── index.vue              # 底部栏容器
│   │   │   ├── RotationButton.vue     # 地球自转开关
│   │   │   ├── ChartsToggle.vue       # 面板显隐开关
│   │   │   ├── ViewSwitch.vue         # 地球/城市视角切换
│   │   │   ├── DrawTools.vue          # 事故查询（矩形拉框）
│   │   │   ├── MeasureTools.vue       # 测量工具（面积/长度）
│   │   │   ├── RouteTools.vue         # 最优路径规划
│   │   │   ├── LayerToggle.vue        # 扩展图层开关通用组件
│   │   │   ├── DisplayCard.vue        # 查询结果（拉框聚合统计 + 表格）
│   │   │   ├── AiAnalysisCard.vue     # AI 分析结果卡片（一键追问）
│   │   │   ├── RouteResultCard.vue    # 路径规划结果卡片
│   │   │   └── TimeBar.vue            # 交通流时间轴滑块
│   │   │
│   │   ├── MapContainer.vue           # 地图容器（Mapbox+L7 初始化 + provide）
│   │   ├── MapControls.vue            # 地图控件（Logo/缩放/全屏/鼠标位置）
│   │   ├── ScreenScale.vue            # 大屏等比缩放容器（1920×1080）
│   │   ├── Loading.vue                # 启动 Loading 遮罩
│   │   └── Login.vue                  # 登录界面（星空 + 角色选择）
│   │
│   ├── App.vue                        # 根组件（登录流程 + 主屏组装）
│   └── main.js                        # 应用入口（Pinia + ElementPlus）
│
├── .env                               # 环境变量（Mapbox Token）
├── index.html                         # HTML 入口
├── vite.config.js                     # Vite 配置（别名/Mock/Proxy/构建）
└── package.json                       # 项目依赖与脚本
```

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.vue（根组件）                         │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐  │
│  │  Login.vue  │  │  主屏（登录后渲染）                        │  │
│  │  星空登录    │  │  ┌─────────────────────────────────────┐ │  │
│  └─────────────┘  │  │  ScreenScale（等比缩放 1920×1080）   │ │  │
│                   │  │  ┌─────────────────────────────────┐ │ │  │
│                   │  │  │  MapContainer（Mapbox + L7）    │ │ │  │
│                   │  │  │  ├── SmartCity（图层管理）       │ │ │  │
│                   │  │  │  ├── ScreenPanel（数据面板）     │ │ │  │
│                   │  │  │  └── MapControls（地图控件）     │ │ │  │
│                   │  │  └─────────────────────────────────┘ │ │  │
│                   │  └─────────────────────────────────────┘ │  │
│                   │  Loading.vue    AiAssistant.vue           │  │
│                   └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                      │
         ▼                    ▼                      ▼
   ┌──────────┐       ┌─────────────┐       ┌──────────────┐
   │  Pinia   │       │  Mock 服务  │       │  Express AI  │
   │  状态中枢 │       │  (vite插件) │       │  服务(3001)  │
   └──────────┘       └─────────────┘       └──────────────┘
```

### 组件通信

| 通信方式 | 使用场景 |
|----------|----------|
| **Pinia Store** | 全局状态中枢，所有组件共享（地图/时间/图层/业务/AI/数据） |
| **provide/inject** | MapContainer → 后代组件注入 L7 Scene + Mapbox Map 实例 |
| **defineModel** | Footer ↔ ScreenPanel 双向绑定面板显隐 |
| **watch 联动** | business.module 变化 → SmartCity 切换图层 + flyTo；time.hour 变化 → 数字孪生联动 |

### 数据流

```
用户操作 → Pinia Store 变更 → watch 触发 → 图层/面板/视角联动
                ↓
          dataStore.loadAll()
                ↓
        fetchBuildings/Roads/Events/Regions/Resources
                ↓
          成功 → 缓存 + 显示
          失败 → 降级标记 + 空数据兜底（不阻塞渲染）
```

---

## 业务模块详解

### 模块切换机制

顶部 `BusinessNav` 组件提供 4 个 tab，点击后调用 `business.setModule(key)`，触发以下联动：

1. **SmartCity** 的 `watch(business.module)` 触发 `applyBusinessModule()`：
   - 切换区域图层显隐（risk/resource/simulation 显示，overview 隐藏）
   - 切换资源图层显隐（仅 resource 显示）
   - 切换飞线图层显隐（仅 overview 显示）
   - `map.flyTo()` 飞行到模块对应视角

2. **ScreenPanel** 的 `v-if="business.module === 'xxx'"` 条件渲染左右面板内容

3. **KpiBar** 的 `computed` 按 `business.module` 返回不同 KPI 指标

### 模块一：综合态势（overview）

- **地图**：城市俯瞰视角（zoom=14, pitch=70），飞线辐射动画
- **左侧**：出行人口柱状图（动态增长） + 公交客流玫瑰图
- **右侧**：人口统计饼图 + 医院统计卡片 + 高校统计卡片
- **KPI**：实时事件数、监测区域数、当前时段、道路总量

### 模块二：交通风险诊断（risk）

- **地图**：区域 3D 挤出（按 riskScore 挤出高度 + 着色）
- **左侧**：风险贡献雷达图（事件数/平均等级/风险分/拥堵指数） + 事件类型分布玫瑰图
- **右侧**：区域风险排行榜（点击联动地图高亮+飞行） + 高风险事件列表
- **KPI**：高风险事件数、最高风险区域、风险指数、事件总数

### 模块三：应急资源可达（resource）

- **地图**：区域多边形 + 资源点位（医院/消防/交警）+ 服务半径缓冲区
- **左侧**：资源分类筛选（点击联动地图过滤） + 片区资源覆盖效能
- **右侧**：医院统计卡片 + 高校统计卡片
- **KPI**：资源点数、总容量、服务覆盖率、缺口区域数

### 模块四：情景推演优化（simulation）

- **地图**：区域 3D 挤出（目标片区高亮）
- **左侧**：应急处置策略勾选（4 种策略） + 目标片区选择
- **右侧**：推演预估（实时指标对比） + 运行模拟按钮
- **KPI**：当前风险、预计降幅、覆盖提升、恢复时长

**策略定义：**

| 策略 key | 名称 | 边际效应 |
|----------|------|----------|
| signal | 信号灯优化配时 | 风险 -0.6, 拥堵 -1.2, 恢复 -4min |
| diversion | 交通分流绕行 | 风险 -0.8, 拥堵 -1.8, 恢复 -6min |
| ambulance | 救护资源调度 | 风险 -0.4, 拥堵 -0.2, 恢复 -3min, 覆盖 +8% |
| restriction | 临时限行管制 | 风险 -0.5, 拥堵 -0.6, 恢复 -2min |

---

## AI 智能助手

### 架构

```
前端 AiAssistant.vue
    │
    ├── useAiStore (Pinia)  ─── 消息列表 / 流式状态 / 抽屉开关
    │
    ├── streamChat() (api/ai.js)  ─── fetch + ReadableStream 解析 SSE
    │
    └── /api/ai/chat  ─── vite proxy 转发 ─── Express (3001)
                                                    │
                                        ┌───────────┴───────────┐
                                        │                       │
                                  DeepSeek API            规则引擎降级
                                  (流式 SSE 转发)         (关键词意图识别)
```

### SSE 事件协议

| 事件 | 数据 | 说明 |
|------|------|------|
| `sources` | `[{key, label}]` | 数据溯源标签（引用了哪些数据源） |
| `mode` | `"deepseek"` / `"rule"` / `"rule-fallback"` | 当前响应模式 |
| `warn` | `{message}` | 警告信息（如大模型调用失败） |
| `message` | `{content: "..."}` | 流式文本增量 |
| `refs` | `["规则引擎", ...]` | 规则引擎引用标签 |
| `done` | `[DONE]` | 流结束 |

### 数据上下文注入

`server/aiContext.js` 从 mock 数据构建 system prompt，注入给 DeepSeek：

- 区域风险排行（5 个片区的风险评分、事件数、平均等级）
- 事件类型分布（交通拥堵/碰撞/追尾/刮擦/车辆故障）
- 资源类型分布（医院/消防/交警）
- 当前时段上下文（早高峰/白天/晚高峰/夜间）
- 选中区域信息
- 情景推演上下文（已选策略、是否已运行模拟）

### 规则引擎降级

`server/ruleEngine.js` 通过关键词匹配识别用户意图，生成结构化响应：

| 意图 | 关键词 | 响应内容 |
|------|--------|----------|
| risk_ranking | 风险/最高/排行 | Top 3 风险区域 + 建议 |
| compare | 对比/比较 | 两区域指标对比 |
| strategy | 策略/建议/处置 | 4 种策略推荐 + 预估效果 |
| resource | 资源/医院/覆盖 | 资源概况 + 建议 |
| event_dist | 事件/类型/分布 | 事件类型分布统计 |
| simulation | 推演/模拟/效果 | 推演说明 + 指标变化范围 |
| time | 时段/时间/高峰 | 当前时段 + 总览数据 |
| general | 其他 | 系统总览 + 引导提问 |

---

## 地图图层与可视化

### 图层清单

| 图层 | Hook | L7 类型 | zIndex | 默认 | 可切换 |
|------|------|---------|--------|------|--------|
| 城市建筑 | useBuildings | CityBuildingLayer | - | 开启 | - |
| 城市道路 | useRoads | LineLayer | 0 | 开启 | - |
| 事故热力图 | useHeatmap | HeatmapLayer | 2 | 关闭 | ✅ |
| 事故散点动图 | useScatterAnimate | PointLayer | 3 | 开启 | ✅ |
| 三维厂房 | useModels3d | threebox custom | - | 关闭 | ✅ |
| 区域多边形 | useRegions | PolygonLayer(extrude) | 1 | 按模块 | - |
| 区域边线 | useRegions | LineLayer | 2 | 按模块 | - |
| 应急资源点 | useResources | PointLayer | 4 | 按模块 | - |
| 资源服务半径 | useResources | PolygonLayer(fill) | 1 | 按模块 | - |
| 飞线辐射 | useFlyline | LineLayer(arc) | 5 | 按模块 | - |
| 飞线终点 | useFlyline | PointLayer(wave) | 6 | 按模块 | - |
| 城市中心 | useFlyline | PointLayer(wave) | 7 | 按模块 | - |

### 飞线辐射动画

- 从武汉中心 `[114.3, 30.5]` 向 5 个区域中心发射弧线
- L7 `LineLayer.shape('arc')` 自动生成贝塞尔弧度
- 按风险值着色：`#00e5ff → #7fd6ff → #ffd700 → #ff8c00 → #ff4d4d`
- 流动动画：duration=4s，trailLength=0.6
- 终点脉冲：水波扩散动画（rings=2）
- 中心点脉冲：更大范围水波（rings=3）

### 3D 区域挤出

- `PolygonLayer.shape('extrude')` + `depth: true`
- 挤出高度：`riskScore * 120`（最低 200）
- 风险配色：`#2ecc40(绿) → #ffd700(黄) → #ff8c00(橙) → #ff4d4d(红)`
- 鼠标悬停高亮 + pickLight 效果
- 点击区域排行联动 `highlightRegion()` 高亮选中区域

### 资源服务半径

- 使用 `@turf/turf` 的 `buffer()` 生成圆形缓冲区
- 按资源 `serviceRadius` 属性（1200m / 1500m）生成
- 半透明填充展示覆盖范围
- 资源点按类型着色：医院(红) / 消防(橙) / 交警(蓝)

---

## 交互工具

### 事故查询（矩形拉框）

1. 点击底部「事故查询」激活矩形绘制
2. 地图拖拽绘制矩形区域
3. Turf.js 点面空间分析筛选框内事件
4. DisplayCard 展示：拉框聚合统计 + 类型分布迷你条 + 事件表格
5. 点击表格行 → 地图脉冲标记 + 飞行定位 + AI 分析

### 测量工具

- **面积测量**：多边形绘制，双击闭合，实时显示面积
- **长度测量**：线段绘制，分段显示距离（m/km 自动转换）
- **清除**：清除所有测量图形

### 最优路径规划

- 点击起点（绿点）→ 终点（红点）
- 基于 2314 条道路离线自建路网图 + A* 搜索
- 空间网格连接边缝合碎片化路网（250m 阈值）
- 避让事故开关：事故点 150m 内路段权重 ×100
- 结果卡片：行驶距离 / 预计耗时 / 拥堵指数 / 绕行事故数

---

## 数字孪生时段联动

底部时间轴滑块（06:00~22:00）驱动四时段联动：

### 天空与大气（Mapbox setFog）

| 时段 | 地平线 | 太空 | 星光 | 效果 |
|------|--------|------|------|------|
| 上午 | 暖琥珀 #f5d6b8 | 天蓝 #6ba3d0 | 0.5 | 日出漫射 |
| 下午 | 天蓝 #b8dcf5 | 深蓝 #2e7bc4 | 0.3 | 明亮蓝天 |
| 傍晚 | 落日橙 #ff6b35 | 深紫 #2a1045 | 0.7 | 晚霞渐变 |
| 夜晚 | 幽蓝 #0a1929 | 幽蓝 #0a1929 | 0.9 | 繁星闪烁 |

### 建筑灯光（L7 style 运行期更新）

| 时段 | 底座 | 窗面 | 高光 | 扫光 |
|------|------|------|------|------|
| 上午 | 冷调蓝灰 | 明亮蓝灰 | 日出暖金 | 晨蓝 |
| 下午 | 中性深底 | 明亮天蓝 | 阳光金色 | 鲜亮蓝 |
| 傍晚 | 暖调暗红 | 暖橙 | 落日橙红 | 关闭 |
| 夜晚 | 极暗 | 暖金窗灯 | 暖白 | 关闭 |

### 道路拥堵（按时段重建图层）

| 时段 | 配色 | 线宽 | 透明度 |
|------|------|------|--------|
| 上午/下午 | 标准绿→黄→红 | 1.0 | 0.8 |
| 傍晚 | 暖调偏橙 | 1.2 | 0.85 |
| 夜晚 | 霓虹高饱和 | 1.4 | 0.9 |

---

## 数据面板与图表

### 面板布局

CSS Grid 三行三列布局：
```
┌─────────────────────────────────────┐
│  Header（100px）                     │
├──────────┬──────────────┬───────────┤
│  左侧    │  中间(地图)   │  右侧     │
│  340px   │  flex-1       │  340px   │
├──────────┴──────────────┴───────────┤
│  Footer（80px）                      │
└─────────────────────────────────────┘
```

顶部悬浮：BusinessNav（100px 处）+ KpiBar（150px 处）

### KPI 指标卡片

按业务模块动态切换，毛玻璃 + 扫边光效果：

| 模块 | KPI 1 | KPI 2 | KPI 3 | KPI 4 |
|------|-------|-------|-------|-------|
| 综合态势 | 实时事件数 | 监测区域数 | 当前时段 | 道路总量 |
| 风险诊断 | 高风险事件数 | 最高风险区域 | 风险指数 | 事件总数 |
| 资源可达 | 资源点数 | 总容量 | 服务覆盖率 | 缺口区域数 |
| 情景推演 | 当前风险 | 预计降幅 | 覆盖提升 | 恢复时长 |

### 图表组件

- **ChartCard.vue**：统一卡片外壳（标题 + 装饰边框 + 插槽）
- **G2Chart.vue**：G2 v5 包装组件（创建/渲染/增量更新/销毁生命周期管理）
- 所有 G2 图表使用 `classicDark` 主题，适配暗色大屏

---

## 登录与体验优化

### 登录界面（Login.vue）

- 全屏星空粒子背景（60 个随机位置闪烁星点）
- 角色选择：指挥员 / 分析员 / 管理员
- 账号密码输入（任意非空即可登录）
- 登录按钮扫光动画 + 品牌字母渐出
- 淡出过渡后进入主屏

### Loading 启动动画（Loading.vue）

- 品牌字母"智慧城市"逐字渐出
- 进度条（0→100%，2.2 秒）
- 加载提示文字轮播（初始化三维地球/加载建筑数据/构建路网拓扑...）
- z-index: 10001，确保覆盖在所有图层之上

### Header 顶部栏

- 左侧：实时天气（图标 + 温度 + 描述），随时段变化
- 中间：标题"智慧城市-武汉"，点击一键回综合态势
- 右侧：当前时段（08:00 上午）

### 全局主题（theme.css）

CSS 变量体系：
- 主色：`--c-primary: #1990ff` / `--c-accent: #00e5ff`
- 背景：`--bg-base: #0a1426` / `--bg-panel: rgba(16,32,56,0.72)`
- 文字：`--t-primary: #eaf3fb` / `--t-secondary: #8fa8c2`
- 光晕：`--glow-primary` / `--glow-accent`
- 通用类：`.glass-card`（毛玻璃）/ `.scan-line`（扫边光）/ `.num-mono`（数字字体）/ `.btn-pulse`（按钮微交互）

---

## 状态管理（Pinia）

### Store 清单

| Store | 文件 | 状态 | 职责 |
|-------|------|------|------|
| useMapStore | map.js | sceneRef | 地图场景镜像（供非后代组件访问） |
| useTimeStore | time.js | hour, playing, period | 时间轴（0-23h + 播放 + 时段派生） |
| useLayerStore | layers.js | toggles{heatmap,scatter,model3d} | 扩展图层开关 |
| useBusinessStore | business.js | module, selectedArea, strategies, simulationResult | 业务模块 + 情景推演 |
| useAiStore | ai.js | messages, streaming, open, mode | AI 对话 + 流式状态 |
| useDataStore | data.js | buildings, roads, events, regions, resources, degraded | 数据缓存 + 降级标记 |

### 兼容层设计

`composables/` 下的 `useLayerToggles.js` 和 `useTimeOfDay.js` 是兼容层，代理到 Pinia store，保持老组件接口不变：

```javascript
// 老接口（仍可用）
const toggles = useLayerToggles()  // → store.toggles
const { state, period } = useTimeOfDay()  // → store.hour / store.period
```

### 数据降级机制

`utils/dataFallback.js` 实现统一的请求→缓存→降级策略：

```
请求成功 → 缓存数据 + degraded=false
请求失败 → 有缓存 → 返回缓存 + degraded=true
         → 无缓存 → 返回空 FeatureCollection + degraded=true
```

单源数据失败不阻塞整体渲染，其他数据源正常展示。

---

## Mock 数据与 API

### Mock 接口

通过 `vite-plugin-mock` 拦截 `/api` 请求：

| 接口 | 方法 | 数据文件 | 说明 |
|------|------|----------|------|
| `/api/wuhan_buildings` | GET | Wuhan_Buildings.json | 武汉建筑 GeoJSON |
| `/api/wuhan_roads` | GET | Wuhan_roads.json | 武汉道路（2314 条） |
| `/api/wuhan_events` | GET | Wuhan_events.json | 交通事件（50 条） |
| `/api/wuhan_regions` | GET | Wuhan_regions.json | 区域多边形（5 片区） |
| `/api/wuhan_resources` | GET | Wuhan_resources.json | 应急资源（15 个点） |
| `/api/weather` | GET | 按时段生成 | 实时天气 |
| `/api/ai_analysis` | POST | 规则生成 | 事故 AI 分析（本地） |

> 注意：`/api/ai/chat` 由 vite proxy 转发到 Express 服务（3001），不被 mock 拦截。

### 区域数据结构

每个区域 Feature 包含：
- `area`: 区域编号（区域1~区域5）
- `name`: 区域名称（光谷核心区/流芳科教区等）
- `riskScore`: 风险评分（0-10）
- `eventCount`: 事件数
- `avgLevel`: 平均等级
- `typeDist`: 事件类型分布
- `center`: 中心坐标
- `geometry`: Polygon 多边形

### 资源数据结构

每个资源 Feature 包含：
- `type`: hospital / fire / police
- `typeName`: 医院 / 消防站 / 交警队
- `capacity`: 容量
- `serviceRadius`: 服务半径（米）
- `area`: 所属区域

---

## Express AI 服务

### 服务架构

```
server/
├── index.js       # Express 入口，SSE 流式聊天接口
├── aiContext.js   # 数据上下文 + system prompt 构建
├── ruleEngine.js  # 规则引擎降级
├── env.js         # .env 加载器
└── .env.example   # 环境变量模板
```

### 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ai/health` | GET | 健康检查，返回模式（deepseek/rule） |
| `/api/ai/chat` | POST | SSE 流式聊天 |

### 请求体

```json
{
  "messages": [{"role": "user", "content": "当前哪个区域风险最高?"}],
  "context": {
    "module": "risk",
    "selectedArea": "区域2",
    "hour": 8,
    "simulationRun": false,
    "strategies": {"signal": true, "diversion": false}
  }
}
```

### 降级策略

1. 有 `DEEPSEEK_API_KEY` → 调用 DeepSeek 流式 API，逐 chunk 转发
2. DeepSeek 调用失败 → 切换规则引擎，模拟打字机逐字输出
3. 无 `DEEPSEEK_API_KEY` → 直接走规则引擎

---

## 配置说明

### 环境变量

**根目录 `.env`（前端）：**

```env
VITE_TOKEN=你的_Mapbox_Public_Token
```

**`server/.env`（AI 服务，可选）：**

```env
# DeepSeek API Key（留空走规则引擎降级）
DEEPSEEK_API_KEY=

# 模型名（默认 deepseek-chat，也可用 deepseek-reasoner）
DEEPSEEK_MODEL=deepseek-chat

# 接口地址（默认官方地址）
# DEEPSEEK_URL=https://api.deepseek.com/chat/completions

# Express 端口（默认 3001）
AI_PORT=3001
```

### Vite 配置

- **别名**：`@` → `src/`
- **Mock**：`mockPath: 'mock'`，开发环境启用
- **Proxy**：`/api/ai` → `http://localhost:3001`（AI 服务转发）
- **构建**：`assetsInlineLimit: 0`（所有资源输出为文件，threebox 需要可 fetch 的 URL）

### npm 脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run server` | 启动 Express AI 服务 |
| `npm run dev:all` | 并行启动前端 + AI 服务 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |

---

## 开发注意事项

1. **Pinia 替代模块级单例**：项目从模块级 `reactive` 单例迁移到 Pinia store，支持 devtools 调试与跨组件联动。`composables/` 下保留兼容层代理到 store。

2. **shallowRef 用于地图实例**：Scene 和 Map 实例是第三方库对象，层次很深，使用 `shallowRef` 避免 Vue 深度代理性能问题。

3. **CSS 缩放坐标修正**：ScreenScale 使用 `transform: scale(k)` 缩放大屏，会导致 L7 点击坐标偏移。MapContainer 中 monkey-patch `containerToLngLat` / `lngLatToContainer` 做视觉↔布局坐标换算。

4. **threebox 加载方式**：采用 UMD 构建（`dist/threebox.min.js`），通过 `window.Threebox` 和 `window.tb` 全局变量访问，绕开 Vite ESM 打包兼容问题。

5. **图层显隐而非销毁**：扩展图层（热力图/散点/三维厂房）始终挂载，开关只调用 `show()/hide()`，避免重复请求和创建开销。

6. **独立 try-catch 隔离**：各图层初始化采用独立 try-catch，单个图层失败不影响其他图层。

7. **不使用 setLight**：Mapbox `setLight` 在 globe 投影下会产生固定昼夜分界线，项目仅用 `setFog` 实现时段天空效果。

8. **SSE 代理不缓冲**：vite proxy 转发 `/api/ai` 时需确保不缓冲 SSE 流，`X-Accel-Buffering: no` 头防止 nginx 反代缓冲。

9. **资源清理**：所有组件在 `onBeforeUnmount` 中清理事件监听、销毁地图实例、清除定时器、移除临时图层。

10. **路径规划路网碎片化**：mock 道路在交叉口坐标不共享，`routeGraph.js` 采用空间网格连接边缝合碎片（250m 阈值），优先吸附到大连通分量。

---

## 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 页面空白/黑屏 | Mapbox Token 无效或网络不通 | 检查 `.env` 中 `VITE_TOKEN`，确保能访问 `api.mapbox.com` |
| AI 助手无响应 | Express 服务未启动 | 执行 `npm run server` 或 `npm run dev:all` |
| AI 响应是规则引擎 | 未配置 DeepSeek API Key | 在 `server/.env` 中填写 `DEEPSEEK_API_KEY` |
| 地图加载很慢 | Mapbox 服务器在海外 | 使用代理/VPN，或耐心等待首次加载 |
| `npm install` 报错 | Node 版本过低或网络问题 | 确保 Node >= 18，使用国内镜像 |
| 端口被占用 | 5173/3001 已被使用 | Vite 会自动换端口；AI 服务可在 `.env` 改 `AI_PORT` |
| `dev:all` 启动失败 | Windows spawn 问题 | 已修复（`shell: isWin`），确保使用最新代码 |
| 模块切换面板空白 | 数据未加载完成 | 等待 Loading 完成；数据降级机制会保证空数据不报错 |
| 飞线不显示 | 不在综合态势模块 | 飞线仅在 overview 模块显示，切回该模块即可 |
| 浏览器控制台 ERR_ABORTED | SSE 连接关闭 | 属正常行为，AI 响应不受影响 |

---

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Edge >= 90
- Safari >= 14

需支持 WebGL 2.0（Mapbox GL JS v2 要求）。

---

## 本地运行教程（从零开始）

### 第一步：安装 Node.js

1. 打开 https://nodejs.org/
2. 下载 LTS 版（v20 或 v22）
3. 双击安装包，一路 Next
4. 验证：终端输入 `node -v` 和 `npm -v`，显示版本号即成功

### 第二步：获取项目代码

```bash
git clone <项目仓库地址>
cd smart-city
```

或直接下载 ZIP 压缩包解压。

### 第三步：配置国内镜像（推荐）

```bash
npm config set registry https://registry.npmmirror.com
```

### 第四步：安装依赖

```bash
npm install
```

> 预计 3~10 分钟。如遇版本冲突，尝试 `npm install --legacy-peer-deps`。

### 第五步：配置 Mapbox Token

项目已内置 Token，通常可跳过。如需替换：

编辑根目录 `.env` 文件：
```env
VITE_TOKEN=你的_Mapbox_Public_Token
```

获取 Token：https://account.mapbox.com/access-tokens/

### 第六步：启动服务

```bash
# 一键启动（推荐）
npm run dev:all

# 或分别启动
npm run dev      # 前端
npm run server   # AI 服务
```

### 第七步：访问应用

浏览器打开 `http://localhost:5173/`（端口以终端输出为准）。

### 速查（复制粘贴版）

```bash
cd smart-city
npm config set registry https://registry.npmmirror.com
npm install
npm run dev:all
# 浏览器打开 http://localhost:5173/
```

---

## 进阶：生产构建

```bash
npm run build    # 构建到 dist/
npm run preview  # 本地预览
```

构建产物可部署到任意 Web 服务器（Nginx / Vercel / Netlify 等）。AI 服务需单独部署 Node.js 环境。


