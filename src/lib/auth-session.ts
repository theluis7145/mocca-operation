import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// セッション確認専用のauth関数（bcryptjsをインポートしない）
// Cloudflare Workers環境でfs.readFileエラーを回避するため
const { auth: sessionAuth } = NextAuth({
  ...authConfig,
  providers: [], // プロバイダーなし - セッション確認のみ
})

export { sessionAuth }
