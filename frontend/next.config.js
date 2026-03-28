/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'

const nextConfig = {
  env: {
    // Empty string = relative URLs → goes through rewrites below
    // 'http://localhost:3001' = direct calls for local dev without rewrites
    NEXT_PUBLIC_API_URL: 'NEXT_PUBLIC_API_URL' in process.env
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    }
    return config
  },
}

module.exports = nextConfig

