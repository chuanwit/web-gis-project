# 智慧城市可视化大屏 - 武汉

基于 Vue 3 + Mapbox GL + AntV L7 的智慧城市三维可视化大屏项目，以武汉市为示例，实现建筑、道路、交通事件等多源数据的融合展示与交互分析。

---

## 📗 本地运行教程（从零开始）
>
> **本教程将安装的软件**：Node.js、npm、Git（可选）、VS Code
>
> **本教程将安装的项目依赖包**：Vue、Vite、Mapbox GL、AntV L7、Element Plus、Axios、Turf.js、threebox-plugin 等 500+ 个包（通过 `npm install` 一次性自动安装）

---

### 第一步：安装 Node.js（必需）

Node.js 是运行 JavaScript 的环境，也是本项目依赖的核心。安装 Node.js 会**自动安装 npm**（包管理工具）。

1. 打开 Node.js 官网：<https://nodejs.org/>
2. 下载 **LTS（长期支持版）**，例如 `v20.x.x`（点击页面上的绿色 "LTS" 按钮下载）
   - Windows 用户下载 `.msi` 安装包
   - Mac 用户下载 `.pkg` 安装包
3. 双击安装包，**一路点「Next」**即可，无需修改任何选项
4. 安装完成后，验证是否成功：
   - **Windows**：按 `Win + R`，输入 `cmd` 回车打开命令提示符
   - **Mac**：打开「终端」应用（在启动台中搜索"终端"）
   - 输入以下命令并回车：

   ```bash
   node -v
   npm -v
   ```

   如果显示版本号（如 `v20.18.0` 和 `10.8.2`），说明安装成功 ✅

> **什么是 npm？** npm 是 Node.js 自带的包管理工具，用来安装项目需要的各种第三方库（类似手机的应用商店）。后面用到的 Vue、Mapbox 等所有库都通过 npm 安装。

> **关于 Node 版本**：本项目要求 Node.js >= 16，建议安装最新的 LTS 版（v20 或 v22）。如果版本过低（如 v14），部分依赖会安装失败。

---

### 第二步：安装 Git（可选，推荐）

Git 是版本控制工具，用于从代码仓库克隆项目。如果你已经拿到项目压缩包，可以跳过此步。

#### Windows 安装 Git

1. 打开 Git 官网：<https://git-scm.com/downloads>
2. 点击 "Windows" 下载安装包
3. 双击安装，**一路 Next 即可**（所有选项保持默认）
4. 安装完成后，在终端验证：

   ```bash
   git --version
   ```

   显示 `git version 2.x.x` 即安装成功 ✅

#### Mac 安装 Git

- 方式一：安装 Xcode Command Line Tools（推荐）

  ```bash
  xcode-select --install
  ```

  弹窗中点"安装"，等待完成即可。

- 方式二：用 Homebrew 安装

  ```bash
  brew install git
  ```

---

### 第三步：安装 VS Code 编辑器（推荐）

VS Code 是微软出品的免费代码编辑器，前端开发几乎都用它。

1. 打开 <https://code.visualstudio.com/>
2. 下载对应系统的安装包，双击安装（一路 Next）
3. （可选但推荐）安装以下插件提升开发体验：
   - 打开 VS Code
   - 点击左侧栏的 **扩展** 图标（或按 `Ctrl+Shift+X`）
   - 依次搜索并安装：
     - **Vue - Official**（Vue 语法高亮和补全）
     - **ESLint**（代码规范检查，可选）

---

### 第四步：获取项目代码

#### 方式 A：用 Git 克隆（推荐，便于后续更新）

```bash
# 在任意文件夹右键 → 打开终端（或 Git Bash）
git clone <项目仓库地址>
cd smart-city
```

#### 方式 B：直接下载 ZIP 压缩包

1. 下载项目的 ZIP 压缩包
2. 解压到任意目录，例如 `D:\projects\smart-city`
3. 在该目录下打开终端：
   - **Windows**：进入项目文件夹，在地址栏输入 `cmd` 回车
   - **Mac**：在终端中输入 `cd `（注意有空格），然后把文件夹拖进终端，回车

> **如何确认当前在项目目录？** 终端中输入 `dir`（Windows）或 `ls`（Mac），能看到 `package.json`、`vite.config.js`、`src` 等文件/文件夹，说明位置正确。

---

### 第五步：配置国内 npm 镜像（强烈推荐）

由于默认 npm 源在海外，国内访问较慢。**强烈建议**先切换为国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

验证是否设置成功：

```bash
npm config get registry
```

输出 `https://registry.npmmirror.com/` 即可 ✅

> **说明**：此设置为全局配置，只需执行一次。后续所有 `npm install` 都会自动走国内镜像，速度大幅提升。

---

### 第六步：安装项目依赖（关键步骤）

在项目根目录的终端中执行：

```bash
npm install
```

> **这一步在做什么？** 读取项目的 `package.json` 文件，自动下载所有依赖包到 `node_modules/` 文件夹。

> **预计耗时**：3~10 分钟（取决于网络速度），期间会显示大量滚动文字，这是正常的，请耐心等待。

> **本项目主要依赖的包**（npm install 会自动安装，无需手动）：
>
> | 包名 | 作用 |
> |------|------|
> | `vue` | 前端框架，构建用户界面 |
> | `vite` | 开发服务器和构建工具 |
> | `@vitejs/plugin-vue` | Vite 的 Vue 插件 |
> | `mapbox-gl` | 三维地图渲染引擎 |
> | `@antv/l7` | 地理可视化图层（建筑/道路/热力图等） |
> | `@antv/l7-maps` | L7 的地图适配器 |
> | `@antv/l7-draw` | L7 的绘制工具（矩形/多边形/线段） |
> | `@antv/g2` | 统计图表库（柱状图/饼图/玫瑰图） |
> | `@turf/turf` | 地理空间计算（点面关系、距离等） |
> | `threebox-plugin` | 在 Mapbox 中加载 3D 模型 |
> | `element-plus` | UI 组件库（表格、按钮等） |
> | `axios` | HTTP 请求库 |
> | `vite-plugin-mock` | 本地 Mock 数据服务 |

> **如果报错怎么办？** 常见原因和解决方案：
> - `npm ERR! network`：网络问题，确认已执行第五步切换国内镜像
> - `npm ERR! ERESOLVE`：依赖版本冲突，尝试 `npm install --legacy-peer-deps`
> - 权限错误（Mac/Linux）：在命令前加 `sudo`，即 `sudo npm install`
> - Node 版本太低：确认 `node -v` 输出 >= 16，如过低请回到第一步重新安装
> - `EPERM` 或 `EACCES`：文件权限问题，关闭编辑器和占用 `node_modules` 的程序后重试

**安装成功的标志**：终端最后一行显示类似 `added 500 packages in 30s`，且项目目录下出现了 `node_modules` 文件夹。

---

### 第七步：配置 Mapbox Token（已内置，通常可跳过）

项目根目录的 `.env` 文件中配置

```env
VITE_TOKEN= .....
```

**何时需要替换自己的 Token？**
- 网络环境无法访问 Mapbox 服务
- 内置 Token 被限流
- 需要部署到生产环境

**如何获取自己的 Token？**
1. 访问 <https://account.mapbox.com/access-tokens/> 注册/登录
2. 创建一个新的 Token
3. 复制 Token 字符串
4. 用编辑器打开项目根目录的 `.env` 文件
5. 替换 `VITE_TOKEN=` 后面的值，保存

> **注意**：修改 `.env` 后需要**重启开发服务器**（在终端按 `Ctrl+C` 停止，再执行 `npm run dev`）。

---

### 第八步：启动开发服务器 🚀

在终端中执行：

```bash
npm run dev
```

终端会显示类似如下输出：

```
  VITE v8.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**用浏览器打开 `http://localhost:5173/` 即可看到大屏页面！** 🎉

> **注意**：开发服务器运行期间终端窗口要保持打开。按 `Ctrl + C` 可以停止服务器。
>
> **端口被占用？** 如果 5173 端口被占用，Vite 会自动换用 5174、5175 等端口，以终端输出的为准。
>
> **首次加载较慢**：第一次打开页面时，Mapbox 地图瓦片和数据需要从服务器下载，可能需要等待 10~30 秒。后续访问会快很多（浏览器缓存）。
>
> **控制台报红色错误？** 按 `F12` 打开浏览器控制台查看。如果是网络请求失败（如 401/403），通常是 Mapbox Token 或网络问题；如果是脚本错误，请检查依赖是否安装完整。

---

### 第九步：常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 页面空白/黑屏 | Mapbox Token 无效或网络不通 | 检查 `.env` 文件，确保网络能访问 `api.mapbox.com` |
| 地图加载很慢 | Mapbox 服务器在海外 | 使用代理/VPN，或耐心等待首次加载 |
| `npm install` 报错 | Node 版本过低或网络问题 | 确保 Node >= 16，使用国内镜像 |
| `npm install` 卡住不动 | 网络问题 | 确认已切换国内镜像，或尝试 `npm install --legacy-peer-deps` |
| 终端提示 `vite: command not found` | 依赖未安装成功 | 重新执行 `npm install` |
| 页面有报错 `Failed to fetch` | Mock 服务未正常启动 | 确认 `vite.config.js` 中 mock 插件配置正确 |
| 地图不显示/白屏 | 浏览器不支持 WebGL | 使用 Chrome 90+ 或 Edge 90+ 浏览器 |
| 修改代码后页面无变化 | 浏览器缓存 | 按 `Ctrl+Shift+R` 强制刷新，或关闭再重新打开 |
| `EPERM: operation not permitted` | 文件被占用 | 关闭编辑器/资源管理器中打开的 `node_modules`，重试 |

---

### 教程速查（复制粘贴版）

```bash
# ===== 一次性环境准备 =====
# 1. 安装 Node.js（去官网下载 LTS 版）：https://nodejs.org/
# 2. （可选）安装 Git：https://git-scm.com/downloads
# 3. （可选）安装 VS Code：https://code.visualstudio.com/

# ===== 项目运行 =====
# 4. 打开终端，进入项目目录
cd smart-city

# 5. （推荐）设置国内镜像，加速下载
npm config set registry https://registry.npmmirror.com

# 6. 安装项目依赖（首次需要 3~10 分钟）
npm install

# 7. 启动开发服务器
npm run dev

# 8. 浏览器打开 http://localhost:5173/
```

---

### 进阶：生产环境构建与预览

如果你想把项目打包成静态文件部署到服务器：

```bash
# 构建生产版本（输出到 dist/ 目录）
npm run build

# 本地预览生产构建效果
npm run preview
```

构建完成后，`dist/` 目录包含所有静态文件，可以部署到任意 Web 服务器（如 Nginx、Vercel、Netlify 等）。

---

## 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Vue 3 | ^3.5.40 | 组件化开发 (Composition API + `<script setup>`) |
| 构建工具 | Vite | ^8.2.0 | 开发服务器与构建 |
| 地图底图 | Mapbox GL JS | ^2.14.1 | 三维地球/地图渲染 |
| 地理可视化 | AntV L7 | 2.15.2 | 空间数据图层渲染（建筑/道路/热力图/散点） |
| 绘制工具 | AntV L7 Draw | 3.0.25 | 矩形框选、多边形/线测量 |
| 统计图表 | AntV G2 | ^5.4.8 | 柱状图、饼图、玫瑰图 |
| 空间分析 | Turf.js | ^7.3.5 | 点面关系判断等地理计算 |
| 3D模型 | threebox-plugin | ^2.2.7 | 在 Mapbox 中加载 OBJ 三维模型 |
| UI组件库 | Element Plus | ^2.14.3 | 表格、弹窗等组件 |
| HTTP客户端 | Axios | ^1.19.0 | 接口请求 |
| Mock服务 | vite-plugin-mock | 2.9.6 | 本地模拟数据接口 |

## 环境要求

- Node.js >= 16.x
- npm 或 pnpm 或 yarn
- 现代浏览器（Chrome/Firefox/Edge 最新版，需支持 WebGL 2.0）

## 快速开始（有前端经验的开发者）

```bash
npm install
npm run dev
```

启动后访问 `http://localhost:5173/`（端口号可能因环境不同而变化，以终端输出为准）。

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 功能总览

### 🗺️ 地图与视角控制

- **地球/城市双视角切换**：点击底部「地球视角/城市视角」按钮在全球视角与武汉市鸟瞰视角之间飞行切换。
  - 城市视角：`center: [114.3, 30.5]`, `zoom: 14`, `pitch: 70`（倾斜俯视）
  - 地球视角：`center: [114.3, 30.5]`, `zoom: 1`, `pitch: 0`（正视全球）
- **地球自转**：默认开启自转；点击底部「开始自转/停止自转」按钮可手动切换。地球视角下持续缓慢旋转，放大到一定级别后自动暂停。
- **地图控件**：
  - Logo 控件（左上角，WIT校徽）
  - 鼠标经纬度位置（底部居中）
  - 缩放控件（右下角）
  - 全屏控件
  - 地图主题切换控件

### 🏙️ 核心图层

| 图层 | 说明 | 默认状态 | 可切换 |
|------|------|----------|--------|
| 城市建筑 | 武汉市三维建筑，带扫光动画效果（蓝色扫描波以工大流芳校区为中心向外扩散），鼠标悬停高亮；随数字孪生时段调整灯光（傍晚/夜晚渐亮） | 开启 | - |
| 城市道路 | 武汉市道路网络，流线动画模拟交通流动；拥堵度数据驱动着色（绿→黄→红），随时间轴时段动态变化 | 开启 | - |
| 事故热力图 | 基于交通事件点生成，蓝→黄→红渐变呈现事故高发区域 | 关闭 | ✅ |
| 事故散点动图 | 交通事件点水波脉冲动画，按事件类型着色（拥堵/碰撞/追尾/刮擦/故障） | 开启 | ✅ |
| 三维厂房 | 基于 OBJ/MTL 加载的园区厂房模型，摆放在武汉工大流芳校区附近，共3座 | 关闭 | ✅ |

### 🔧 交互工具

- **事故查询（矩形拉框）**
  - 点击底部「事故查询」按钮激活矩形绘制
  - 在地图上拖拽绘制矩形区域
  - 使用 Turf.js 进行点面空间分析，筛选出区域内的交通事件
  - 结果以表格形式展示（事件编号、类型、详情按钮）
  - 点击表格行可在地图上脉冲标记该点并飞行定位
  - 点击右上角关闭按钮或再次点击「事故查询」按钮退出查询

- **测量工具**
  - **测量面积**：绘制多边形，**双击闭合**后实时显示闭合区域面积
  - **测量长度**：绘制线段，分段显示距离（自动转换 m/km 单位）
  - **清除**：清除所有测量图形并退出测量模式
  - 激活测量工具时自动切换到适合测量的俯视视角，鼠标显示十字准星

- **最优路径规划**
  - 点击底部「路径规划」按钮激活，地图上依次点击**起点**（绿点）→**终点**（红点）
  - 激活时自动切到城市俯视视角，鼠标显示十字准星
  - 基于 2314 条道路 LineString **离线自建路网图 + A\* 搜索**，无需外部导航 API
  - 路线贴合真实道路绘制，结果卡片显示**行驶距离 / 预计耗时 / 拥堵指数 / 绕行事故数**
  - 「避让事故」开关（默认开启）：事故点附近 150m 的路段权重放大 100 倍，路径自动绕行；耗时与拥堵指数随时间轴当前时刻动态计算

### 🕐 交通流预测动画（时空动态分析）

- 底部中央**时间轴滑块**（06:00~22:00）绑定全局统一时间状态
- 道路按当前时刻的拥堵度动态着色（**绿→黄→红**），流线动画速度随拥堵程度变化
- 播放/暂停按钮可自动循环快进演示高峰→平峰变化
- 城市建筑灯光、天空氛围等数字孪生效果与时间轴联动（见下）

### 🌆 城市数字孪生（四时段天空/建筑/道路联动）

由时间轴时段派生四个阶段：**上午 / 下午 / 傍晚 / 夜晚**，每个时段从三个维度营造氛围：

**天空与大气（Mapbox `setFog`）：**

| 时段 | 地平线颜色 | 太空颜色 | 星光强度 | 视觉效果 |
|------|-----------|---------|---------|---------|
| 上午 | 暖琥珀色 `#f5d6b8` | 柔和天蓝 `#6ba3d0` | 0.5 | 日出漫射，晨曦残星 |
| 下午 | 晴朗天蓝 `#b8dcf5` | 深蓝 `#2e7bc4` | 0.3 | 明亮蓝天，微弱星光 |
| 傍晚 | 绚丽落日橙 `#ff6b35` | 深紫 `#2a1045` | 0.7 | 晚霞渐变，星光渐亮 |
| 夜晚 | 幽蓝 `#0a1929` | 幽蓝 `#0a1929` | 0.9 | 纯净夜空，繁星闪烁 |

> 星光由 Mapbox fog 内置的 `star-intensity` 渲染，自动只在太空大气层中显示，不会透过地球表面。
>
> 注意：项目不使用 `setLight`（在 globe 投影下会产生固定的昼夜分界线，导致一个半球过暗）。

**建筑灯光（L7 `CityBuildingLayer` 运行期 `style()` 更新）：**

| 时段 | 底座色 | 窗面色 | 高光色 | 扫光 |
|------|--------|--------|--------|------|
| 上午 | 冷调蓝灰 | 明亮蓝灰窗面 | 日出暖金 | 晨蓝扫光 |
| 下午 | 中性深底 | 明亮天蓝窗面 | 阳光金色 | 鲜亮蓝扫光 |
| 傍晚 | 暖调暗红底 | 暖橙窗面 | 落日橙红边光 | 关闭（让位万家灯火） |
| 夜晚 | 极暗底座 | 明亮暖金窗灯 | 暖白高光 | 关闭 |

**道路配色（L7 `LineLayer` 按时段重建）：**

| 时段 | 拥堵配色风格 | 线宽 | 透明度 |
|------|-------------|------|--------|
| 上午/下午 | 标准绿→黄→红 | 1.0 | 0.8 |
| 傍晚 | 暖调偏橙 | 1.2 | 0.85 |
| 夜晚 | 霓虹高饱和发光 | 1.4 | 0.9 |

### 🤖 AI 智能分析

- 在「事故查询」结果表格中**点击任一行**，弹出 AI 分析卡片
- 通过本地 mock 接口 `POST /api/ai_analysis` 规则生成（无需真实大模型），返回：
  - **事故地点**：自动定位到最近的有名道路（如「民族大道」）
  - **事故类型 / 等级 / 分析时刻**
  - **结构化分析建议列表**（① 环境提示 ② 高峰判断 ③ 处置建议 ④ 预计恢复时间）
- 分析结果随当前时间轴时刻动态变化（早/晚高峰判断、拥堵程度等）

### 📊 数据面板

左右两侧悬浮面板，采用毛玻璃半透明效果，通过 CSS Grid 定位布局。点击底部「控制中心」按钮可整体显隐。

**左侧面板：**
- **出行人口统计**：各行政区出行人口柱状图，数据每1.2秒动态增长（模拟实时数据），按数值阈值分色显示
- **实时公交在线图**：各行政区在线公交数量玫瑰图（极坐标柱状图）

**右侧面板：**
- **人口统计图**：武汉市各行政区人口占比环形饼图，标签以蜘蛛网形式展开
- **武汉市三甲医院**：静态统计卡片（医院30家、门诊部300个、病床3000张）
- **高校学生统计**：静态统计卡片（高校130所、在校大学生100万）

### 📐 大屏适配

采用等比缩放方案：设计稿基准分辨率 **1920×1080**，监听窗口 `resize` 事件，通过 CSS `transform: scale(k)` 对整体大屏进行等比缩放，确保在任意分辨率下不变形、不挤压内容。同时修正了 CSS 缩放下 L7 地图点击坐标偏移问题。

## 项目结构

```
smart-city/
├── mock/                          # Mock 数据接口
│   ├── index.js                   # Mock 路由配置
│   ├── Wuhan_Buildings.json       # 武汉建筑 GeoJSON 数据
│   ├── Wuhan_roads.json           # 武汉道路 GeoJSON 数据
│   └── Wuhan_events.json          # 武汉交通事件 GeoJSON 数据
├── public/                        # 静态资源（不经构建处理）
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/                       # 接口层
│   │   ├── index.js               # 业务接口定义（建筑/道路/事件）
│   │   └── requests.js            # Axios 实例封装与拦截器
│   ├── assets/                    # 资源文件
│   │   ├── data/                  # 任务文档
│   │   ├── icons/                 # SVG/PNG 图标
│   │   ├── imgs/                  # 图片素材（头/底/边框/Logo等）
│   │   ├── models/                # 3D模型文件（factory.obj/.mtl）
│   │   └── styles/
│   │       └── reset.css          # CSS 重置样式
│   ├── components/                # Vue 组件
│   │   ├── Footer/                # 底部控制栏
│   │   │   ├── index.vue          # 底部栏容器
│   │   │   ├── RotationButton.vue # 地球自转开关
│   │   │   ├── ChartsToggle.vue   # 面板显隐开关
│   │   │   ├── ViewSwitch.vue     # 地球/城市视角切换
│   │   │   ├── DrawTools.vue      # 事故查询（矩形拉框）
│   │   │   ├── MeasureTools.vue   # 测量工具（面积/长度）
│   │   │   ├── RouteTools.vue     # 最优路径规划（点击起终点）
│   │   │   ├── LayerToggle.vue    # 扩展图层开关通用组件
│   │   │   ├── DisplayCard.vue    # 查询结果表格卡片
│   │   │   ├── AiAnalysisCard.vue # AI 智能分析结果卡片
│   │   │   ├── RouteResultCard.vue# 路径规划结果卡片
│   │   │   └── TimeBar.vue        # 交通流时间轴滑块
│   │   ├── ScreenPanel/           # 大屏数据面板
│   │   │   ├── ScreenPanel.vue    # 面板容器（Grid布局）
│   │   │   ├── Header.vue         # 顶部标题栏
│   │   │   ├── Charts/
│   │   │   │   ├── ChartCard.vue  # 图表卡片外壳（装饰边框）
│   │   │   │   └── G2Chart.vue    # G2 图表包装组件
│   │   │   └── Panels/
│   │   │       ├── TravelChart.vue    # 出行人口柱状图
│   │   │       ├── BusChart.vue       # 公交玫瑰图
│   │   │       ├── PopulationChart.vue# 人口饼图
│   │   │       ├── HospitalCard.vue   # 医院统计卡片
│   │   │       └── UniversityCard.vue # 高校统计卡片
│   │   ├── SmartCity/             # 地图核心逻辑
│   │   │   ├── index.vue          # 图层加载、开关管理、数字孪生时段联动
│   │   │   └── hooks/
│   │   │       ├── useBuildings.js    # 建筑图层（时段灯光样式）
│   │   │       ├── useRoads.js        # 道路图层（时段拥堵配色）
│   │   │       ├── useHeatmap.js      # 热力图层
│   │   │       ├── useScatterAnimate.js # 散点动画图层
│   │   │       └── useModels3d.js     # 三维厂房模型
│   │   ├── MapContainer.vue       # 地图容器（初始化Mapbox+L7，provide场景）
│   │   ├── MapControls.vue        # 地图控件（Logo/缩放/全屏等）
│   │   └── ScreenScale.vue        # 大屏等比缩放容器
│   ├── composables/               # 组合式函数（逻辑复用）
│   │   ├── useSceneMap.js         # 注入地图场景（provide/inject封装）
│   │   ├── useLayerToggles.js     # 扩展图层开关共享状态（模块级单例）
│   │   └── useTimeOfDay.js        # 统一时间轴状态（模块级单例，驱动拥堵/数字孪生/AI/路径）
│   ├── utils/                     # 工具函数
│   │   └── routeGraph.js          # 路径规划路网建图 + A* 搜索（离线）
│   ├── App.vue                    # 根组件
│   ├── main.js                    # 应用入口
│   └── style.css                  # 全局样式
├── .env                           # 环境变量（Mapbox Access Token）
├── index.html                     # HTML 入口
├── vite.config.js                 # Vite 配置（别名/插件/构建选项）
└── package.json                   # 项目依赖与脚本
```

## 配置说明

### 环境变量

项目根目录 `.env` 文件：

```env
# Mapbox 访问令牌（公开 pk token，生产环境建议配置 URL 白名单）
# 请在 https://account.mapbox.com/access-tokens/ 获取自己的 Token 后填入
VITE_TOKEN=你的_Mapbox_Public_Token
```

如需替换为自己的 Mapbox Token，请在 [Mapbox 官网](https://www.mapbox.com/) 注册获取。

### 路径别名

`@` 指向 `src/` 目录，导入模块时可使用 `@/components/xxx.vue` 代替相对路径。

### Vite 特殊配置

- `assetsInlineLimit: 0`：所有静态资源一律输出为文件、不做 base64 内联。threebox 需要真实可 fetch 的 `.obj/.mtl` URL（内联成 data URL 无法被 MTLLoader 加载）。

## 架构设计

### 组件通信

- **provide/inject**：[MapContainer.vue](src/components/MapContainer.vue) 通过 `provide` 将 L7 Scene 与 Mapbox Map 实例注入到后代组件，子组件通过 [useSceneMap.js](src/composables/useSceneMap.js) 这个 composable 获取，避免了 props 层层传递。
- **模块级单例状态**：[useLayerToggles.js](src/composables/useLayerToggles.js) 在模块作用域创建一个 `reactive` 对象作为图层开关的共享状态，Footer 的按钮与 SmartCity 的图层管理引用同一对象，实现一处改动全局同步。
- **统一时间轴**：[useTimeOfDay.js](src/composables/useTimeOfDay.js) 采用同样的模块级单例模式，维护 `hour`（0-23）与 `period`（上午/下午/傍晚/夜晚）两个全局状态。道路拥堵着色、数字孪生天空/灯光、AI 分析时段判断、路径规划耗时计算**四处共享同一时间轴**，拖动滑块或自动播放时全局联动。
- **defineModel 双向绑定**：ChartsToggle 与 Footer、ScreenPanel 之间通过 `v-model` 控制面板显隐。

### 图层管理

- 建筑、道路图层始终显示，不可关闭。
- 热力图、散点、三维厂房三个扩展图层始终挂载在场景上，开关只调用 L7 的 `show()/hide()` 切换显隐，不销毁重建，避免重复请求数据和重复创建图层带来的性能开销。
- 三维厂房由 threebox 独立管理（Mapbox custom layer），只切换 THREE 对象的 `visibility` 属性。
- 图层初始化采用独立 try-catch 隔离，单个图层创建失败不会影响其他图层。

### 数字孪生时段联动

时间轴变化时，`applyDigitalTwin` 函数按顺序执行：
1. `applySky(map)` — 通过 `map.setFog()` 更新天空/大气/星光
2. `updateBuildingStyle(period)` — 通过 L7 `layer.style()` 更新建筑灯光
3. `rebuildRoads(scene, hour)` — 移除旧道路图层，按新时刻重建（颜色/粗细/透明度）

每步均有 try-catch 保护，单步失败不中断整体联动。

### Mock 数据

开发环境通过 `vite-plugin-mock` 拦截 `/api` 前缀的请求，直接返回 `mock/` 目录下的 JSON 文件，无需启动后端服务。四个接口：

| 接口 | 方法 | 数据文件 |
|------|------|----------|
| `/api/wuhan_buildings` | GET | Wuhan_Buildings.json |
| `/api/wuhan_roads` | GET | Wuhan_roads.json |
| `/api/wuhan_events` | GET | Wuhan_events.json |
| `/api/ai_analysis` | POST | 规则生成（基于 events + roads 数据） |

数据格式为标准 GeoJSON（FeatureCollection）。

## 开发注意事项

1. **threebox 加载方式**：threebox-plugin 的 CommonJS 源码与 Vite ESM 预打包存在兼容问题，项目中采用其 UMD 构建（`dist/threebox.min.js`），通过 `window.Threebox` 和 `window.tb` 全局变量访问。
2. **shallowRef 用于地图实例**：Scene 和 Map 实例是第三方库对象，层次很深，使用 `shallowRef` 而非 `ref` 避免 Vue 深度代理带来的性能问题。
3. **CSS 缩放坐标修正**：ScreenScale 使用 CSS transform scale 缩放大屏，会导致 L7 点击坐标偏移。MapContainer 中通过 monkey-patch `containerToLngLat` / `lngLatToContainer` 方法做了视觉坐标与布局坐标的换算。
4. **切回地球视角清理临时图层**：L7 Draw 创建的图层 name 为自增数字串，ViewSwitch 在切回地球视角时会通过正则 `/^\d+$/` 匹配并移除这些临时测量/绘制图层，而不影响建筑/道路等命名图层。路径规划图层命名为 `route-line` / `route-start` / `route-end`，不受影响。
5. **路径规划路网碎片化**：mock 道路在真实交叉口处坐标不共享（OSM 数据精度所致），直接按共享顶点建图会形成上千个孤立小连通块。`routeGraph.js` 采用**空间网格连接边**（250m 阈值、每链≤5条）将碎片缝合为主连通网络（~88%），起终点吸附时**优先吸附到 ≥500 节点的大连通分量**，避免落在孤立小团导致路径无解；构建结果与事故屏蔽边均做模块级缓存，首次调用（挂载时预热）约 1s，后续计算毫秒级。
6. **不使用 setLight**：Mapbox `setLight` 在 globe 投影下会产生固定的昼夜分界线（一个半球过暗不可见），因此项目仅使用 `setFog` 实现时段天空效果，不使用 `setLight`。
7. **资源清理**：所有组件在 `onBeforeUnmount` 中清理事件监听、销毁地图实例、清除定时器、移除临时图层，避免内存泄漏。

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Edge >= 90
- Safari >= 14

需支持 WebGL 2.0（Mapbox GL JS v2 要求）。
