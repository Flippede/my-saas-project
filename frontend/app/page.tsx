import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { SplineScene } from "@/components/ui/spline-scene"
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background"
import { SparklesCore } from "@/components/ui/sparkles"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { Navbar } from "@/components/ui/navbar"
import { Pricing } from "@/components/ui/pricing"
import Link from "next/link"
import {
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Bot,
  Workflow,
  Brain,
  MessageSquare,
  Cog,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Component */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="container mx-auto px-4">
          <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-none">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />

            <div className="flex h-full">
              {/* Left content */}
              <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text">
                  AI 爆款脚本引擎：成本更低，转化更猛
                </h1>
                <p className="mt-4 text-neutral-300 max-w-lg">
                  把短视频引流脚本自动化生成：用 AI 24/7 持续产出爆款脚本，帮你降本增效、引流变现。
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
                    <Link href="/dashboard">
                      进入工具控制台
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 bg-transparent"
                  >
                    <Link href="/login">登录 / 获取卡密</Link>
                  </Button>
                </div>

                <div className="flex items-center gap-8 text-sm text-neutral-400 mt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>不收建站/部署费</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>30 天见效加速承诺</span>
                  </div>
                </div>
              </div>

              {/* Right content */}
              <div className="flex-1 relative">
                <SplineScene
                  scene="https://prod.spline.design/UbM7F-HZcyTbZ4y3/scene.splinecode"
                  className="w-full h-full"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">还在手搓脚本？流量白白浪费！</h2>
              <div className="space-y-4 text-gray-300">
                <p className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  把时间花在重复写作？AI 一键接管
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  错过咨询？AI 随时生成引流话术
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  想起量却招人？用 AI 扩量省成本
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  对手用 AI 抢流量，你还在等？
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">让 AI 给你持续产出可投放脚本</h3>
              <div className="space-y-4 text-gray-300">
                <p className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  AI 助你把问题变成引流脚本，马上可用
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  脚本自动生成，每周省下 20+ 小时
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  无需复杂对接，上线即用
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  上线 30 天内更高概率跑出 ROI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">核心印钞功能（不是空话）</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              专为短视频裂变脚本打造，让你更快获取咨询和订单
            </p>
          </div>

          <BentoGrid className="lg:grid-rows-3">
            <BentoCard
              name="AI 引流脚本生成器"
              className="lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3"
              background={<div className="absolute inset-0 bg-black/85 border border-white/10" />}
              Icon={Bot}
              description="AI 自动生成引导文案：覆盖问答、线索筛选与私域转化话术，24/7 可投放。"
              href="#"
              cta="立即生成"
            />
            <BentoCard
              name="自动裂变脚本流程"
              className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3"
              background={<div className="absolute inset-0 bg-black/85 border border-white/10" />}
              Icon={Workflow}
              description="把爆款脚本拆解成可复制流程，减少人工重复编辑，平均每周省 20+ 小时。"
              href="#"
              cta="开始体验"
            />
            <BentoCard
              name="私域对接即用"
              className="lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4"
              background={<div className="absolute inset-0 bg-black/85 border border-white/10" />}
              Icon={Cog}
              description="无需开发对接：把 AI 能力直接嵌入你的裂变节奏，适配常见业务场景。"
              href="#"
              cta="一键上车"
            />
            <BentoCard
              name="爆款洞察与优化建议"
              className="lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2"
              background={<div className="absolute inset-0 bg-black/85 border border-white/10" />}
              Icon={Brain}
              description="提供可执行建议：帮你调整标题、开场、节奏与转化点，提升转化率。"
              href="#"
              cta="看效果"
            />
            <BentoCard
              name="定制私域裂变方案"
              className="lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4"
              background={<div className="absolute inset-0 bg-black/85 border border-white/10" />}
              Icon={MessageSquare}
              description="按你的业务需求定制裂变脚本模板，从灵感到落地一条龙。"
              href="#"
              cta="获取样稿"
            />
          </BentoGrid>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="testimonials" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">真实团队用起来的结果</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-black/80 border-white/10">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex text-yellow-400">{"★".repeat(5)}</div>
                  <p className="text-gray-300">
                    "用 AI 引流脚本后，我们的线索转化提升 200%，咨询问题能自动生成应对话术；首月就看见回报。"
                  </p>
                  <div>
                    <p className="font-semibold text-white">张晓峰</p>
                    <p className="text-sm text-gray-400">增长负责人，科技星</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-white/10">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex text-yellow-400">{"★".repeat(5)}</div>
                  <p className="text-gray-300">
                    "自动化脚本让我们每周省下 25 小时，团队把精力放到选题和投放节奏上。"
                  </p>
                  <div>
                    <p className="font-semibold text-white">李明</p>
                    <p className="text-sm text-gray-400">增长负责人，增长集团</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-white/10">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex text-yellow-400">{"★".repeat(5)}</div>
                  <p className="text-gray-300">
                    "AI 引流脚本对接后，电商转化大幅提升，销售增长 180%，用户体验更顺滑。"
                  </p>
                  <div>
                    <p className="font-semibold text-white">陈雨</p>
                    <p className="text-sm text-gray-400">创始人，零售极致</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">数据说话：你要的就是结果</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              上线后立刻影响转化与现金流
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">80%</h3>
              <p className="text-gray-300">手工时间节省</p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-blue-900/40 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">300%</h3>
              <p className="text-gray-300">6 个月内 ROI 更可控</p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-purple-900/40 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">150%</h3>
              <p className="text-gray-300">线索转化提升</p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-orange-900/40 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">24/7</h3>
              <p className="text-gray-300">全天候私域答疑</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-black">
        <Pricing
          title="选对 AI 裂变方案，直接开干"
          description="按你的增长节奏自动扩量\n所有方案包含上线指导、脚本模板与 30 天无忧保障"
          plans={[
            {
              name: "入门版",
              price: "997",
              yearlyPrice: "797",
              period: "month",
              features: [
                "AI 引流脚本（客服式话术）",
                "基础裂变流程（3 步）",
                "私域素材接入",
                "基础数据面板",
                "脚本迭代支持",
                "30 天无忧保障",
              ],
              description: "适合刚起步的团队：先把脚本跑起来",
              buttonText: "立即体验爆款生成",
              href: "#contact",
              isPopular: false,
            },
            {
              name: "专业版",
              price: "2497",
              yearlyPrice: "1997",
              period: "month",
              features: [
                "进线索筛选的 AI 引导脚本",
                "完整裂变流程（10+ 步）",
                "常见业务场景适配",
                "高级数据与复盘建议",
                "优先支持与脚本优化",
                "定制脚本模板训练",
                "每月增长优化",
                "ROI 跟踪与效果报告",
              ],
              description: "适合要起量的团队：更快跑出 ROI",
              buttonText: "扫码开通专业版",
              href: "#contact",
              isPopular: true,
            },
            {
              name: "旗舰版",
              price: "4997",
              yearlyPrice: "3997",
              period: "month",
              features: [
                "定制裂变方案与部署支持",
                "无限次裂变流程扩展",
                "深度系统对接",
                "专属私域策略师",
                "全天候优先支持",
                "增强安全与合规方案",
                "白标化解决方案",
                "季度增长复盘",
                "定制培训与工作坊",
              ],
              description: "适合需要全栈增长落地的组织",
              buttonText: "联系 AI 客服",
              href: "#contact",
              isPopular: false,
            },
          ]}
        />
      </section>

      {/* Process Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">3 步走完，从0到可投</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              咨询-生成-迭代，一套流程直接上手
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-6">
              <div className="h-20 w-20 bg-white text-black rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-white">提交需求，立刻给你引流方案</h3>
              <p className="text-gray-300">
                提交关键需求后，我们帮你生成可直接投放的脚本结构与话术
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="h-20 w-20 bg-white text-black rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-white">AI 选题与脚本拆解</h3>
              <p className="text-gray-300">
                系统读取你的业务目标，生成匹配的裂变策略与节奏
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="h-20 w-20 bg-white text-black rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-white">一键落地并持续优化</h3>
              <p className="text-gray-300">
                把脚本生成、投放复盘串起来，让效果越来越稳
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <AnimatedGradientBackground
          Breathing={true}
          gradientColors={["#0A0A0A", "#2979FF", "#FF80AB", "#FF6D00", "#FFD600", "#00E676", "#3D5AFE"]}
          gradientStops={[35, 50, 60, 70, 80, 90, 100]}
        />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="relative h-32 w-full flex flex-col items-center justify-center">
              <div className="w-full absolute inset-0">
                <SparklesCore
                  id="ctasparticles"
                  background="transparent"
                  minSize={0.6}
                  maxSize={1.4}
                  particleDensity={100}
                  className="w-full h-full"
                  particleColor="#FFFFFF"
                  speed={0.8}
                />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 relative z-20 text-balance">
                现在扫码，AI 立刻帮你出爆款脚本
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-gray-100">
                立即开始生成
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                添加 AI 客服微信咨询
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative py-20 bg-black border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/90" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">AI 工具集平台</h3>
                <p className="text-gray-300 leading-relaxed">
                  用智能自动化与专业 AI 能力，帮你快速裂变引流与变现。
                </p>
              </div>

              <div className="flex space-x-4">
                <a
                  href="#"
                  className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">平台功能</h4>
              <ul className="space-y-3">
                {[
                  "AI 引流脚本生成",
                  "裂变流程自动化",
                  "私域对接即用",
                  "爆款洞察与优化",
                  "定制脚本模板服务",
                ].map((service) => (
                  <li key={service}>
                    <a
                      href="#services"
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {service}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">平台</h4>
              <ul className="space-y-3">
                {[
                  { name: "关于我们", href: "#" },
                  { name: "爆款案例", href: "#testimonials" },
                  { name: "增长干货", href: "#" },
                  { name: "加入我们", href: "#" },
                  { name: "联系我们", href: "#contact" },
                ].map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">联系 AI 客服</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <a href="mailto:hello@aiagency.com" className="hover:text-white transition-colors duration-300">
                    hello@aiagency.com
                  </a>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                    <Phone className="h-4 w-4" />
                  </div>
                  <a href="tel:+15551234567" className="hover:text-white transition-colors duration-300">
                    (555) 123-4567
                  </a>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span>中国运营中心（以客服为准）</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 mt-16 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <p className="text-gray-400 text-center lg:text-left">© 2024 AI 工具集平台 版权所有</p>

              <div className="flex flex-wrap justify-center lg:justify-end space-x-8">
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm">
                  隐私政策
                </a>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm">
                  服务条款
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
