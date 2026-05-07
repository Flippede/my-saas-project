import { buildApiUrl, jsonHeaders } from "@/lib/app-config"

export type CreateOrderResponse = {
  code_url?: string
  order_id?: string
  amount?: string
  status?: string
  message?: string
}

export async function createOrder(token: string): Promise<CreateOrderResponse> {
  const response = await fetch(buildApiUrl("/api/v1/payment/create"), {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({
      plan: "storyboard_x_monthly",
    }),
  })

  const payload = (await response.json()) as CreateOrderResponse

  if (!response.ok) {
    throw new Error(payload?.message || `创建支付订单失败（HTTP ${response.status}）`)
  }

  if (!payload?.code_url || !payload?.order_id) {
    throw new Error(payload?.message || "支付订单返回数据不完整")
  }

  return payload
}
