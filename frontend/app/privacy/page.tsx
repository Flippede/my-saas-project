import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl font-bold text-white mb-4">隐私政策</h1>
            <p className="text-gray-400">更新日期：2024 年 12 月</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">我们收集哪些信息</h2>
                <p className="mb-4">
                  我们会收集您直接提供给我们的信息，例如当您创建账号、申请我们的服务或联系我们获取支持时。
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>联系信息（姓名、邮箱、手机号）</li>
                  <li>企业信息与需求</li>
                  <li>沟通偏好</li>
                  <li>使用数据与分析信息</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">我们如何使用您的信息</h2>
                <p className="mb-4">我们会将收集到的信息用于：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>提供并优化我们的 AI 服务</li>
                  <li>就相关服务与您进行沟通</li>
                  <li>分析使用行为并优化性能</li>
                  <li>遵守法律法规要求</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">数据安全</h2>
                <p>
                  我们将采取合理的技术与组织措施，以保护您的个人信息，防止遭受未授权访问、更改、泄露或毁坏。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">联系我们</h2>
                <p>
                  如您对本隐私政策有任何疑问，请通过以下方式联系我们{" "}
                  <a href="mailto:privacy@aiagency.com" className="text-blue-400 hover:text-blue-300">
                    privacy@aiagency.com
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
