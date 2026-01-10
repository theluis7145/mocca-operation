import { PrismaClient } from '@prisma/client'

// グローバルキャッシュ用の型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 開発環境用のPrismaクライアント
// 注意: 本番環境（Cloudflare Workers）では src/lib/d1.ts を使用すること
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 非推奨: Cloudflare Workers では D1 を直接使用する
// このファイルは開発環境でのみ使用される
export async function getPrismaClient(): Promise<PrismaClient> {
  return prisma
}
