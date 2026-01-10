import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { findUserByEmail } from '@/lib/d1'
import { authConfig } from '@/lib/auth.config'
import type { FontSize } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      isSuperAdmin: boolean
      fontSize: FontSize
    }
  }

  interface User {
    id: string
    email: string
    name: string
    isSuperAdmin: boolean
    fontSize: FontSize
  }
}

// JWT型の拡張はセッションコールバック内で処理されるため、
// ここでは明示的な型拡張は不要

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください')
        }

        const user = await findUserByEmail(credentials.email as string)

        if (!user) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password_hash
        )

        if (!isPasswordValid) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: Boolean(user.is_super_admin),
          fontSize: user.font_size as FontSize,
        }
      },
    }),
  ],
})
