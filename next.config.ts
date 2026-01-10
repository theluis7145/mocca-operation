import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// 開発環境でのCloudflareバインディング統合を有効化
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // 画像最適化設定
  images: {
    // 外部画像ソースを許可（R2など）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
    ],
    // デバイスサイズ
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // 画像サイズ
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // フォーマット
    formats: ['image/webp', 'image/avif'],
  },
  // 実験的機能
  experimental: {
    // コンポーネントのプリロード最適化
    optimizePackageImports: ['lucide-react', '@dnd-kit/core', '@dnd-kit/sortable'],
  },
};

export default nextConfig;
