import type { NextAuthConfig } from 'next-auth'

// Edge Runtime 互換の認証設定（ミドルウェア用）
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = !nextUrl.pathname.startsWith('/login')
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')

      if (isOnAdmin) {
        if (isLoggedIn && auth.user.isSuperAdmin) return true
        return false // Redirect to login
      }

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect to login
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl))
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email!
        token.name = user.name!
        token.isSuperAdmin = user.isSuperAdmin
        token.fontSize = user.fontSize
      }

      if (trigger === 'update' && session) {
        if (session.fontSize) {
          token.fontSize = session.fontSize
        }
      }

      return token
    },
    async session({ session, token }) {
      // 型を明示的にキャストして返す
      return {
        ...session,
        user: {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          isSuperAdmin: token.isSuperAdmin as boolean,
          fontSize: token.fontSize,
        },
      } as typeof session
    },
  },
  providers: [], // Providers are added in auth.ts
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
}
