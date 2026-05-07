# UI Architecture Overview

## 1) 技术栈与目录结构全景

### 核心技术栈
- `Next.js 14`（App Router，`app/` 目录）
- `React 19` + `TypeScript`
- `Tailwind CSS v4`（含 `tailwindcss-animate`）
- `shadcn/ui`（基于 `Radix UI`，配置见 `components.json`）
- `lucide-react` 图标
- `framer-motion`（动效）
- 3D/视觉增强：`@splinetool/react-spline`、`three`、`@react-three/fiber`

### 关键目录（精简树状图）
```text
.
├─ app/                      # 页面入口（Next App Router）
│  ├─ layout.tsx             # 全局布局、字体、Analytics 注入
│  ├─ page.tsx               # 首页/主视图（核心展示与交互入口）
│  ├─ privacy/page.tsx       # 隐私政策页面
│  └─ terms/page.tsx         # 服务条款页面
├─ components/
│  ├─ ui/                    # 视觉与交互组件库（按钮、导航、卡片、定价等）
│  │  ├─ navbar.tsx          # 顶部导航（移动端菜单开关）
│  │  ├─ pricing.tsx         # 定价模块（计费开关等交互）
│  │  └─ ...                 # 其余 shadcn/ui 与自定义 UI 组件
│  └─ theme-provider.tsx     # 主题相关 provider
├─ hooks/                    # 自定义 hooks（媒体查询、toast 等）
├─ lib/                      # 工具函数（如 className 合并）
├─ public/                   # 静态资源（图标、图片、3D 纹理）
├─ styles/                   # 额外全局样式
├─ package.json              # 依赖与脚本
└─ components.json           # shadcn/ui 配置与路径别名
```

## 2) 核心页面与视觉组件清单

### 首页/主视图
- 主入口文件：`app/page.tsx`
- 导出的页面函数：`HomePage()`

### 首页中的核心交互组件（当前可直接改造）
- 导航与菜单交互：`components/ui/navbar.tsx`
  - `toggleMenu()` 控制移动端菜单展开/收起。
- 主要 CTA 按钮（可挂后端请求）：
  - `app/page.tsx` Hero 区按钮：`Book Free Consultation`
  - `app/page.tsx` CTA 区按钮：`Book Free Consultation`
- 定价区交互：`components/ui/pricing.tsx`
  - `handleToggle()` 控制月/年切换并触发动效。

> 当前首页没有“输入框组 + 提交 + 结果展示区”这类业务表单组件，属于营销展示页结构。

## 3) 后端对接点定位（重点）

后端目标：
- `POST http://127.0.0.1:8000/api/v1/tools`
- Header 需带 `Authorization` Token

### 最推荐接入位置（首选）
- 文件：`app/page.tsx`
- 函数体：`HomePage()` 内新增 `handleSubmit()`（或 `handleRunTool()`）并绑定到 CTA 按钮 `onClick`。
- 具体落点：优先改 Hero 区主按钮（当前在 `Book Free Consultation` 这一段 JSX 附近）。

### 建议请求写法（放在 `HomePage()` 内）
- 在 `handleSubmit` 中使用原生 `fetch`：
  - `method: "POST"`
  - `headers: { "Content-Type": "application/json", "Authorization": \`Bearer ${token}\` }`
  - `body: JSON.stringify(payload)`

### Token 输入框定位建议
- 现状：**没有专门的 Token（卡密）输入框**（全项目页面未发现业务输入表单）。
- 建议：在 `app/page.tsx` 的 Hero 区按钮上方新增一个小型输入组（Token Input + 提交按钮），原因：
  - 用户首屏可见，调试最快；
  - 与 CTA 行为靠近，便于把 Token 和请求动作绑定；
  - 后续你可再抽离成 `components/tool-runner-form.tsx` 独立组件。

## 4) 启动与调试指南

在项目根目录执行：

```bash
npm install
npm run dev
```

然后浏览器打开：
- [http://localhost:3000](http://localhost:3000)

如端口占用可改：
```bash
npm run dev -- -p 3001
```
