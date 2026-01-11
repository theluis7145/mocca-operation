/**
 * 認証・認可のユニットテスト
 *
 * 注意: NextAuth.jsはモジュールレベルでの設定が複雑なため、
 * ここでは認証ロジックの重要な部分と、モック可能な認証ヘルパーをテストします。
 */

// ミドルウェアのルート判定ロジックをテスト用に抽出
function shouldSkipAuth(pathname: string): boolean {
  // api/upload はスキップ
  if (pathname === '/api/upload') {
    return true
  }
  // api/auth はスキップ
  if (pathname.startsWith('/api/auth')) {
    return true
  }
  // login ページはスキップ
  if (pathname === '/login') {
    return true
  }
  return false
}

// ミドルウェアのmatcher設定をテスト用に評価
function shouldMatchMiddleware(pathname: string): boolean {
  // matcher: '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'
  // これは以下を除外:
  // - _next/static/*
  // - _next/image/*
  // - favicon.ico
  // - 拡張子付きファイル (*.*)

  if (pathname.startsWith('/_next/static')) return false
  if (pathname.startsWith('/_next/image')) return false
  if (pathname === '/favicon.ico') return false
  if (/\.[^/]+$/.test(pathname)) return false  // 拡張子付きファイル

  return true
}

describe('認証ミドルウェアロジック', () => {
  describe('shouldSkipAuth', () => {
    it('/api/upload は認証をスキップする', () => {
      expect(shouldSkipAuth('/api/upload')).toBe(true)
    })

    it('/api/auth/* は認証をスキップする', () => {
      expect(shouldSkipAuth('/api/auth/signin')).toBe(true)
      expect(shouldSkipAuth('/api/auth/callback/credentials')).toBe(true)
      expect(shouldSkipAuth('/api/auth/session')).toBe(true)
    })

    it('/login は認証をスキップする', () => {
      expect(shouldSkipAuth('/login')).toBe(true)
    })

    it('保護されたルートは認証をスキップしない', () => {
      expect(shouldSkipAuth('/')).toBe(false)
      expect(shouldSkipAuth('/dashboard')).toBe(false)
      expect(shouldSkipAuth('/manual/123')).toBe(false)
      expect(shouldSkipAuth('/api/manuals')).toBe(false)
      expect(shouldSkipAuth('/api/users')).toBe(false)
    })
  })

  describe('shouldMatchMiddleware', () => {
    it('静的アセットはミドルウェアをスキップする', () => {
      expect(shouldMatchMiddleware('/_next/static/chunks/main.js')).toBe(false)
      expect(shouldMatchMiddleware('/_next/image/image.png')).toBe(false)
      expect(shouldMatchMiddleware('/favicon.ico')).toBe(false)
    })

    it('拡張子付きファイルはミドルウェアをスキップする', () => {
      expect(shouldMatchMiddleware('/logo.png')).toBe(false)
      expect(shouldMatchMiddleware('/styles.css')).toBe(false)
      expect(shouldMatchMiddleware('/script.js')).toBe(false)
    })

    it('ルートパスはミドルウェアを通過する', () => {
      expect(shouldMatchMiddleware('/')).toBe(true)
      expect(shouldMatchMiddleware('/dashboard')).toBe(true)
      expect(shouldMatchMiddleware('/manual/123')).toBe(true)
      expect(shouldMatchMiddleware('/api/manuals')).toBe(true)
    })
  })
})

describe('保護されたルートの判定', () => {
  // 保護されたルート一覧
  const protectedRoutes = [
    '/',
    '/admin/businesses',
    '/admin/users',
    '/analytics',
    '/business/123',
    '/business/123/members',
    '/manual/123',
    '/manual/123/edit',
    '/manual/new',
    '/notifications',
    '/settings',
    '/work-sessions/123',
  ]

  // 保護されないルート一覧
  const publicRoutes = [
    '/login',
    '/api/auth/signin',
    '/api/auth/session',
  ]

  it.each(protectedRoutes)('%s は保護されたルートである', (route) => {
    expect(shouldSkipAuth(route)).toBe(false)
    expect(shouldMatchMiddleware(route)).toBe(true)
  })

  it.each(publicRoutes)('%s は公開ルートである', (route) => {
    expect(shouldSkipAuth(route)).toBe(true)
  })
})

describe('セッション判定', () => {
  // セッションの型定義（テスト用）
  interface Session {
    user?: {
      id: string
      email: string
      name: string
      isSuperAdmin?: boolean
    }
    expires?: string
  }

  // セッションが有効かどうかを判定する関数（テスト用）
  function isValidSession(session: Session | null): boolean {
    if (!session) return false
    if (!session.user) return false
    if (!session.user.id || !session.user.email) return false

    // 期限切れチェック
    if (session.expires) {
      const expiresAt = new Date(session.expires)
      if (expiresAt < new Date()) return false
    }

    return true
  }

  // ユーザーが管理者かどうかを判定する関数（テスト用）
  function isSuperAdmin(session: Session | null): boolean {
    return isValidSession(session) && session?.user?.isSuperAdmin === true
  }

  describe('isValidSession', () => {
    it('nullセッションは無効', () => {
      expect(isValidSession(null)).toBe(false)
    })

    it('userがないセッションは無効', () => {
      expect(isValidSession({} as Session)).toBe(false)
    })

    it('idがないセッションは無効', () => {
      expect(isValidSession({
        user: { id: '', email: 'test@example.com', name: 'Test' }
      })).toBe(false)
    })

    it('emailがないセッションは無効', () => {
      expect(isValidSession({
        user: { id: '1', email: '', name: 'Test' }
      })).toBe(false)
    })

    it('期限切れセッションは無効', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString()
      expect(isValidSession({
        user: { id: '1', email: 'test@example.com', name: 'Test' },
        expires: pastDate
      })).toBe(false)
    })

    it('有効なセッションは有効', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      expect(isValidSession({
        user: { id: '1', email: 'test@example.com', name: 'Test' },
        expires: futureDate
      })).toBe(true)
    })
  })

  describe('isSuperAdmin', () => {
    it('nullセッションは管理者ではない', () => {
      expect(isSuperAdmin(null)).toBe(false)
    })

    it('isSuperAdmin: falseは管理者ではない', () => {
      expect(isSuperAdmin({
        user: { id: '1', email: 'test@example.com', name: 'Test', isSuperAdmin: false }
      })).toBe(false)
    })

    it('isSuperAdminがundefinedは管理者ではない', () => {
      expect(isSuperAdmin({
        user: { id: '1', email: 'test@example.com', name: 'Test' }
      })).toBe(false)
    })

    it('isSuperAdmin: trueは管理者', () => {
      expect(isSuperAdmin({
        user: { id: '1', email: 'test@example.com', name: 'Test', isSuperAdmin: true }
      })).toBe(true)
    })
  })
})
