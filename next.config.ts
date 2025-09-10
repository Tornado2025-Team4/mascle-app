import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // セキュリティ強化
  poweredByHeader: false,

  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vlrpessjxwihqkzslstb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // セキュリティヘッダー
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],

  // 実験的機能の有効化
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },

  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 出力設定
  output: 'standalone',

  // ログレベル
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
