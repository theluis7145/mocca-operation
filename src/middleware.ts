import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

// 特定のルートはミドルウェアをスキップ
export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // api/upload はスキップ（独自の認証チェックを行う）
  if (pathname === '/api/upload') {
    return NextResponse.next()
  }

  // api/auth はスキップ（NextAuthが内部で処理）
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // login ページはスキップ
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // 他のパスはNextAuth認証を適用
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return auth(request as any)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
