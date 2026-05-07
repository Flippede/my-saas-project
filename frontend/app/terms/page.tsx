import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回首页
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white mb-4">服务条款</h1>
            <p className="text-gray-400">更新日期：2024 年 12 月</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">条款接受</h2>
                <p>
                  通过访问并使用我们的 AI 服务，您即表示同意并愿意遵守本协议条款及相关约定。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">服务内容</h2>
                <p className="mb-4">
                  AI 工具集平台提供包括但不限于以下服务：
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>AI 聊天机器人开发与部署</li>
                  <li>工作流自动化系统</li>
                  <li>AI 集成服务</li>
                  <li>定制 AI 解决方案开发</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">用户义务</h2>
                <p className="mb-4">您同意：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>提供真实、完整的信息</li>
                  <li>依法合规使用我们的服务</li>
                  <li>不干扰或破坏我们的服务</li>
                  <li>妥善保管账户凭证，确保安全</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">责任限制</h2>
                <p>
                  因您使用本服务产生的任何索赔情形下，我们的责任不超过您为导致索赔的具体服务已支付的金额。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">联系信息</h2>
                <p>
                  如有疑问，请与我们联系{" "}
                  <a href="mailto:legal@aiagency.com" className="text-blue-400 hover:text-blue-300">
                    legal@aiagency.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
