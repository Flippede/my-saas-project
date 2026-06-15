import { buildApiUrl, jsonHeaders } from "@/lib/app-config"

export type ServiceOrderResponse = {
  order_id: string
  product_code: string
  product_name: string
  amount: string
  status: string
  service_status: string
  code_url?: string
  paid_at?: string
  message?: string
  detail?: string
}

async function readServiceOrderResponse(response: Response): Promise<ServiceOrderResponse> {
  try {
    return (await response.json()) as ServiceOrderResponse
  } catch {
    return {
      order_id: "",
      product_code: "",
      product_name: "",
      amount: "",
      status: "",
      service_status: "",
      message: `请求失败，HTTP ${response.status}`,
    }
  }
}

export async function createOpenClawInstallPayment(token: string): Promise<ServiceOrderResponse> {
  const response = await fetch(buildApiUrl("/api/v1/service-orders/openclaw-install/create-payment"), {
    method: "POST",
    headers: jsonHeaders(token),
  })
  const data = await readServiceOrderResponse(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "创建服务订单失败。")
  }
  if (!data.order_id || !data.code_url) {
    throw new Error(data.detail || data.message || "服务订单返回数据不完整。")
  }

  return data
}

export async function getServiceOrder(orderId: string, token: string): Promise<ServiceOrderResponse> {
  const response = await fetch(buildApiUrl(`/api/v1/service-orders/${encodeURIComponent(orderId)}`), {
    cache: "no-store",
    headers: jsonHeaders(token),
  })
  const data = await readServiceOrderResponse(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "获取服务订单状态失败。")
  }

  return data
}
