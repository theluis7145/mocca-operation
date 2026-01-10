import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (NextAuth routes)
     * - api/test-db (debug endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth|api/test-db).*)',
  ],
}
