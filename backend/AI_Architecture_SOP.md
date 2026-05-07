> [!WARNING] AI 核心守则 (System Directive)
> 作为本项目的 AI 编程助手，你在执行任何全局架构修改、新增通用工具类、或引入新的全局依赖库之后，**必须主动且自动地更新本 `AI_Architecture_SOP.md` 文件**，以保证本文件始终是当前项目最准确的架构快照。

# AI Architecture SOP

## 1) 项目定位

本项目定位为**微型 SaaS AI 工具矩阵**：以最小可行后端能力快速验证商业化链路，通过统一网关承载多个可插拔 AI 工具模块，支持持续扩展与快速迭代。

## 2) 核心架构

- **前端形态：** 瘦客户端，使用纯 `HTML/CSS/Vanilla JS`，不引入前端框架。
- **后端形态：** 统一网关胖服务端，基于 `Python + FastAPI`。
- **设计目标：**
  - 前端保持极简，只负责参数收集、请求发起、结果展示。
  - 后端集中承载鉴权、路由分发、业务编排、AI 调用与响应标准化。
  - AI 工具以模块化方式维护，支持横向扩展。

## 3) 后端网关规范 (`main.py`)

`main.py` 是统一网关入口，必须遵守以下约束：

1. 必须包含统一路由：`POST /api/v1/tools`。
2. 必须强制检验请求头 `Authorization` 字段（用于会员/Token 校验）。
3. 请求体必须接收标准 JSON 结构：
   - `tool_id`：工具标识（字符串）
   - `payload`：工具入参对象（JSON 对象）
4. 网关职责包括：
   - 请求鉴权与访问控制
   - 按 `tool_id` 分发到对应工具处理函数
   - 未匹配工具时返回明确的错误响应（如 `404`）
   - 返回统一、可前端直接消费的 JSON 响应

推荐请求结构示例：

```json
{
  "tool_id": "script_generator",
  "payload": {
    "video_url": "https://douyin.com/xxx",
    "keywords": "美妆, 平价"
  }
}
```

## 4) 工具模块化规范 (`tools/` 目录)

`tools/` 目录用于承载所有 AI 工具模块，每个工具必须独立为一个 `.py` 文件，并遵守以下约束：

1. 每个工具文件只负责一个明确业务能力（单一职责）。
2. 对外暴露异步处理函数（`async def`），输入为 `payload`，输出为统一 JSON。
3. 调用大模型时，必须使用官方 `AsyncOpenAI` 库进行异步请求。
4. 所有工具必须包含基础异常捕获，确保网关始终拿到可序列化 JSON 响应。
5. 工具返回结构建议包含：
   - `success`（布尔）
   - `tool_id`（字符串）
   - `input`（原始/规整后的输入）
   - `result`（生成结果）
   - `message`（状态信息）
   - `error`（失败时错误信息，可选）

## 5) AI 对话开发模板（通用 Prompt 模板）

以后开发新工具时，你只需提供**工具名称**与简要需求，AI 助手将自动按本 SOP 输出：

1. 后端业务逻辑（`tools/<tool_name>.py`）
2. 网关对接代码（更新 `main.py` 的 `tool_id` 分发）
3. 极简前端页面（纯 `HTML/CSS/Vanilla JS`）

可直接复用以下 Prompt 模板：

```text
你现在是本项目的首席架构师，请基于 AI_Architecture_SOP.md 为我开发新工具：

工具名称：<tool_name>
功能目标：<一句话描述工具用途>
输入参数：<字段列表>
输出结果：<期望返回结构或展示方式>

请严格按以下顺序交付：
1) 新建 tools/<tool_name>.py，使用 AsyncOpenAI 异步调用模型并返回统一 JSON；
2) 修改 main.py：在 POST /api/v1/tools 中新增该 tool_id 的分发逻辑，保持 Authorization 强制鉴权；
3) 生成一个极简前端页面（纯 HTML/CSS/Vanilla JS），可填写参数并调用 /api/v1/tools 展示结果；
4) 给出本地启动与测试步骤（含 curl 示例）。
```

## 6) 维护与更新机制

为确保架构文档持续有效，执行以下机制：

- 当发生以下任一变更时，必须同步更新本文件：
  - 全局架构修改
  - 新增/重构通用工具类
  - 引入新的全局依赖库
  - 网关协议或工具返回规范调整
- 更新优先级：代码变更完成后，立即更新本 SOP，再进行下一轮功能开发。
- 目标：保证 `AI_Architecture_SOP.md` 始终作为项目“唯一可信架构快照”。

## 7) 支付与发卡链路（当前架构快照）

当前 MVP 支付链路已切换为**微信支付官方 Native V3 自动发卡**模式。

- **创建订单接口：** `POST /api/v1/payment/create`
  - 行为：创建固定金额 `49.00` 订单并调用微信 `Native` 下单接口
  - 出参：`order_id` + `code_url`（前端可直接转二维码展示）
- **微信回调接口：** `POST /api/v1/wechat/webhook`
  - 核心安全：执行微信 V3 签名验签（`Wechatpay-*` 头 + RSA-SHA256）
  - 核心安全：使用 `WECHAT_V3_KEY` 对 `resource.ciphertext` 进行 AES-256-GCM 解密
  - 支付成功：订单状态改为 `success`，自动生成 30 天 `XCC_` Token
  - 返回：`{"code":"SUCCESS","message":"成功"}`
- **查单接口：** `GET /api/v1/payment/status?order_id=xxx`
  - 未支付：`{"status":"pending"}`
  - 已支付：`{"status":"success","token":"XCC_xxx"}`

数据库结构（当前实现）：
- `orders(order_id, user_id, amount, status, created_at)`
- `tokens(token, order_id, openid, expire_date, status)`
- `users(id, username, is_vip, expire_at)`

支付激活策略（订单号桥接）：
- `POST /api/v1/payment/create` 必须携带 `user_id`，下单时写入 `orders.user_id`
- `POST /api/v1/wechat/webhook` 成功回调后，通过 `out_trade_no` 反查 `orders.user_id`，直接激活 `users.is_vip=1` 并更新 `expire_at`
- 回调处理不依赖 OpenID 进行用户匹配

最新支付创建策略（上线版）：
- `POST /api/v1/payment/create` 不再依赖前端传 `user_id`
- 由后端通过 `Authorization` token 反查 `tokens.openid -> users.id` 自动识别付款用户

服务号扫码登录（新增）：
- `GET /api/v1/auth/get_login_qrcode`：生成登录会话并向微信服务号创建带参数二维码，返回 `qrcode_url` 与 `session_id`
- `GET /api/v1/auth/login_status?session_id=...`：前端轮询登录状态，成功时返回登录 token
- `POST /api/v1/wechat/webhook` 同时处理两类回调：
  - 微信支付 JSON 回调（原有链路）
  - 服务号 XML 事件回调（`SCAN` / `subscribe`），按 `EventKey(scene)` 绑定会话并标记登录成功

扫码登录会话表（当前实现）：
- `login_sessions(scene_id, openid, status, created_at)`
