# 项目全局总结报告

## 1. 项目背景与技术栈概览

### 一句话项目定位
这是一个基于 Next.js 的 AI 工具平台前端：用营销官网承接流量，提供微信扫码登录、会员支付、工具控制台，并调用后端接口生成短视频裂变脚本。

### 核心技术栈
- 前端框架：`Next.js 14`（App Router，`app/` 目录）
- 语言：`TypeScript` + `React 19`
- 样式系统：`Tailwind CSS v4` + `tw-animate-css`
- 组件体系：`shadcn/ui` + `Radix UI` + 自定义视觉组件
- 动画/视觉增强：`framer-motion`、`@tsparticles/react`、`@splinetool/react-spline`、`three` 生态
- 二维码：`qrcode.react`
- 构建/发布：`next build`，并启用 `output: "export"`（静态导出）
- 统计：`@vercel/analytics`
- 工具函数：`clsx` + `tailwind-merge`（`cn` 类名合并）

---

## 2. 核心功能与业务清单

### 功能模块全量清单
- 官网营销展示（`/`）
  - Hero 区、问题-方案区、功能区、案例区、收益区、定价区、流程区、CTA、页脚
  - 目标：引导用户登录、进入控制台、付费开通
- 全局用户状态头部（右上角悬浮）
  - 检测本地 token（`xcc_token`）
  - 拉取用户信息（是否 VIP）
  - 非 VIP 可发起支付升级，显示支付二维码并轮询支付状态
  - 支付成功后刷新用户信息并显示成功提示
- 微信扫码登录（`/login`）
  - 获取登录二维码 + 会话 ID
  - 轮询登录状态
  - 成功后将 token / user_id 写入 `localStorage`，并跳转首页
- 支付订阅（`/checkout`）
  - 创建微信支付订单
  - 展示二维码和倒计时（120 秒）
  - 轮询支付状态，成功后跳转工具页
- 工具控制台（`/dashboard`）
  - 工具入口聚合页
  - 当前接入“短视频裂变脚本生成器”
- 工具页：脚本生成器（`/tools/script-generator`）
  - 输入：卡密、视频链接、关键词
  - 调用本地后端接口生成脚本
  - 展示 JSON 结果与错误提示
- 工作台页：Prompt 生成（`/generate`）
  - 输入 Prompt
  - 使用登录 token 调用线上工具接口
  - 展示生成结果 JSON
- 合规页面
  - 隐私政策（`/privacy`）
  - 服务条款（`/terms`）

### 核心业务数据流（端到端）
- 登录流
  1. 用户访问 `/login`
  2. 前端请求 `GET /api/v1/auth/get_login_qrcode`
  3. 用户扫码后，前端轮询 `GET /api/v1/auth/login_status`
  4. 成功后写入 `localStorage(xcc_token, xcc_user_id)`，跳转首页
- 会员支付流
  1. 用户点击“升级 VIP”或 `/checkout` 订阅按钮
  2. 前端调用 `POST /api/v1/payment/create` 创建订单
  3. 展示 `code_url` 二维码并轮询 `GET /api/v1/payment/status`
  4. 支付成功后更新 token/状态，进入生成工具
- 工具调用流
  1. 用户在 `/generate` 或 `/tools/script-generator` 输入参数
  2. 前端发起 `POST /api/v1/tools`
  3. 接收 JSON 并渲染结果/错误

---

## 3. 核心目录结构与文件说明

> 已忽略 `node_modules`、`.next`、`out`、`build`、`dist`、`.git` 等非源码目录。

### 源码树状结构（核心）

```text
AI-tools/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ globals.css
│  ├─ login/page.tsx
│  ├─ checkout/page.tsx
│  ├─ dashboard/page.tsx
│  ├─ generate/page.tsx
│  ├─ privacy/page.tsx
│  ├─ terms/page.tsx
│  └─ tools/
│     └─ script-generator/page.tsx
├─ components/
│  ├─ app-header.tsx
│  ├─ theme-provider.tsx
│  └─ ui/
│     ├─ pricing.tsx
│     ├─ navbar.tsx
│     ├─ bento-grid.tsx
│     ├─ spotlight.tsx
│     ├─ spline-scene.tsx
│     ├─ sparkles.tsx
│     ├─ animated-gradient-background.tsx
│     ├─ button.tsx / card.tsx / input.tsx / textarea.tsx ...
│     ├─ dialog.tsx / drawer.tsx / sheet.tsx / popover.tsx ...
│     ├─ tabs.tsx / table.tsx / select.tsx / form.tsx ...
│     ├─ toast.tsx / toaster.tsx / sonner.tsx / use-toast.ts
│     └─ 其余 shadcn 基础组件（共 50+）
├─ hooks/
│  ├─ use-toast.ts
│  ├─ use-media-query.ts
│  └─ use-mobile.ts
├─ lib/
│  ├─ payment.ts
│  └─ utils.ts
├─ public/
│  ├─ icon.svg / icon-light-32x32.png / icon-dark-32x32.png / apple-icon.png
│  ├─ placeholder*.png|jpg|svg
│  └─ assets/3d/texture_earth.jpg
├─ styles/
│  └─ globals.css
├─ package.json
├─ next.config.mjs
├─ tsconfig.json
├─ components.json
└─ UI_Architecture_Overview.md
```

### 业务-文件映射（重点说明）
- `app/layout.tsx`
  - 全站根布局，注入字体、`AppHeader`、Analytics。
  - 作用：全页面共享登录态入口与用户身份展示。
- `components/app-header.tsx`
  - 真正的账户与会员中枢。
  - 负责：用户信息拉取、VIP 状态展示、支付弹窗、支付轮询、登出、跳转工作台。
- `app/page.tsx` + `components/ui/pricing.tsx` + `components/ui/navbar.tsx`
  - 首页营销与转化主链路。
  - `pricing.tsx` 直接将所有方案 CTA 跳到 `/checkout`，是付费转化关键桥梁。
- `app/login/page.tsx`
  - 微信扫码登录闭环（生成二维码 + 轮询状态 + 落 token）。
- `app/checkout/page.tsx` + `lib/payment.ts`
  - 支付下单与支付状态查询。
  - `lib/payment.ts` 封装创建订单请求（带鉴权 token）。
- `app/dashboard/page.tsx`
  - 工具导航层（目前只挂了脚本生成器入口）。
- `app/tools/script-generator/page.tsx`
  - 业务工具输入表单 + 本地接口调用 + 结果展示。
- `app/generate/page.tsx`
  - 另一套工具调用页（Prompt -> 线上接口），依赖登录 token。
- `hooks/*` 与 `components/ui/*`
  - 提供通用交互能力（toast、响应式、弹层、表单、导航等），支撑业务页面快速搭建。

---

## 4. 重要接口与核心契约 (API & Interfaces)

### 外部 API（前端调用）
- `GET https://x-creator.cc/api/v1/auth/get_login_qrcode`
  - 用途：登录二维码初始化
  - 出参契约：`scene_id`, `qrcode_url`, `expires_in`, `message`
  - 支撑模块：`/login`
- `GET https://x-creator.cc/api/v1/auth/login_status?session_id=...`
  - 用途：登录状态轮询
  - 出参契约：`status`, `token`, `user_id`, `message`
  - 支撑模块：`/login`
- `GET https://x-creator.cc/api/v1/user/info`（Bearer token）
  - 用途：用户资料/VIP 状态
  - 出参契约：`user_id`, `username`, `is_vip`, `expire_at`
  - 支撑模块：`AppHeader`
- `POST https://x-creator.cc/api/v1/payment/create`（Bearer token）
  - 入参：`{ plan: "storyboard_x_49_monthly" }`
  - 出参：`code_url`, `order_id`, `message`
  - 支撑模块：`/checkout`、`AppHeader`
- `GET https://x-creator.cc/api/v1/payment/status?order_id=...`
  - 用途：支付状态轮询
  - 出参：`status`, `token|vip_token|Token`, `message`
  - 支撑模块：`/checkout`、`AppHeader`
- `POST https://x-creator.cc/api/v1/tools`（Bearer token）
  - 入参：`{ prompt: string }`
  - 出参：业务 JSON（`message` + 动态字段）
  - 支撑模块：`/generate`
- `POST http://127.0.0.1:8000/api/v1/tools`（本地服务）
  - 入参：`{ tool, card_key, video_url, keywords }`
  - 出参：`{ success?, message?, data? }`
  - 支撑模块：`/tools/script-generator`

### 关键 TypeScript 契约（本地声明）
- `CreateOrderResponse`（`lib/payment.ts`）
- `LoginQrcodeResponse`、`LoginStatusResponse`（`app/login/page.tsx`）
- `PaymentStatusResponse`（`app/checkout/page.tsx`、`components/app-header.tsx`）
- `ToolResponse`（`app/generate/page.tsx`、`app/tools/script-generator/page.tsx`）
- `UserInfoResponse`（`components/app-header.tsx`）
- `PricingPlan`（`components/ui/pricing.tsx`）

### 路由（Routes）与页面控制器映射
- `/` -> `app/page.tsx`（官网主页面）
- `/login` -> `app/login/page.tsx`（扫码登录）
- `/checkout` -> `app/checkout/page.tsx`（支付页）
- `/dashboard` -> `app/dashboard/page.tsx`（工具控制台）
- `/generate` -> `app/generate/page.tsx`（Prompt 工具页）
- `/tools/script-generator` -> `app/tools/script-generator/page.tsx`（脚本生成工具）
- `/privacy` -> `app/privacy/page.tsx`（隐私政策）
- `/terms` -> `app/terms/page.tsx`（服务条款）

---

## 5. 待办与潜在优化点（代码扫描结论）

### TODO 扫描结果
- 业务源码中未发现显式 TODO/FIXME/HACK。
- 命中项主要在 `node_modules` / `.next` 构建产物，属于依赖内部注释，可忽略。

### 可优化痛点（建议优先级从高到低）
- 令牌键名不一致
  - 存在 `xcc_token` 与 `x_token` 两种写法，容易导致状态错乱。
- 接口环境不统一
  - 一部分调用线上 `x-creator.cc`，一部分调用本地 `127.0.0.1:8000`；建议统一环境变量管理（dev/staging/prod）。
- 支付状态契约不统一
  - `token`/`vip_token`/`Token` 混用，建议后端统一字段，前端做兼容层封装。
- Next 配置忽略 TS 构建错误
  - `next.config.mjs` 里 `ignoreBuildErrors: true`，会掩盖潜在线上问题。
- UI 结构存在双头部可能
  - `layout.tsx` 全局注入 `AppHeader`，部分页面再加 `Navbar`，需确认设计上是否期望并存。
- 契约分散
  - 各页面各自声明 response type，建议集中到 `lib/api-types.ts`，减少重复与漂移。
