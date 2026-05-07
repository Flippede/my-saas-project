const backendProxyTarget = process.env.BACKEND_PROXY_TARGET || "http://127.0.0.1:8000"

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendProxyTarget}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
