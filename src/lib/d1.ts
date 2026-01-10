import { getCloudflareContext } from '@opennextjs/cloudflare'

// ユーザー型定義
export interface D1User {
  id: string
  email: string
  password_hash: string
  name: string
  is_super_admin: boolean | number
  is_active: boolean | number
  avatar_url: string | null
  font_size: string
  created_at: string
  updated_at: string
}

// D1データベースインスタンスを取得
export async function getD1Database() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (env as any).DB
  if (!db) {
    throw new Error('D1 database binding not found')
  }
  return db
}

// ユーザーをメールアドレスで検索
export async function findUserByEmail(email: string): Promise<D1User | null> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first()
  return result as D1User | null
}

// ユーザーをIDで検索
export async function findUserById(id: string): Promise<D1User | null> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first()
  return result as D1User | null
}

// 全ユーザーを取得
export async function findAllUsers(): Promise<D1User[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM users')
    .all()
  return (result.results || []) as D1User[]
}
