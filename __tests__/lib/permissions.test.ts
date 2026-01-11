/**
 * 権限管理のユニットテスト
 *
 * テスト対象:
 * - Pure functions: canEditManual, canViewManual, canManageBusinesses, canManageUsers
 * - Async functions: getPermissionLevel, getUserBusinessAccess
 *
 * 重点テストケース:
 * - 未ログイン/セッションなし（null/undefined）
 * - 各ロール（ADMIN/WORKER）での権限判定
 * - businessId mismatch（別事業へのアクセス試行）
 * - 想定外入力での安全側フォールバック
 */

import type { PermissionLevel } from '@/lib/permissions'

// d1モジュールのモック
jest.mock('@/lib/d1', () => ({
  findUserById: jest.fn(),
  findBusinessAccessByUserAndBusiness: jest.fn(),
  findBusinessAccessesByUser: jest.fn(),
  findAllBusinesses: jest.fn(),
  findManualsByBusiness: jest.fn(),
}))

// モック関数の型付きインポート
import {
  findUserById,
  findBusinessAccessByUserAndBusiness,
} from '@/lib/d1'

import {
  getPermissionLevel,
  canEditManual,
  canViewManual,
  canManageBusinesses,
  canManageUsers,
  getUserBusinessAccess,
} from '@/lib/permissions'

const mockFindUserById = findUserById as jest.MockedFunction<typeof findUserById>
const mockFindBusinessAccess = findBusinessAccessByUserAndBusiness as jest.MockedFunction<
  typeof findBusinessAccessByUserAndBusiness
>

// テスト用のモックデータ
const mockUsers = {
  superAdmin: {
    id: 'user-super-admin',
    email: 'superadmin@example.com',
    password_hash: 'hash',
    name: 'Super Admin',
    is_super_admin: 1, // SQLite boolean: true
    is_active: 1,
    avatar_url: null,
    font_size: 'MEDIUM' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  normalUser: {
    id: 'user-normal',
    email: 'user@example.com',
    password_hash: 'hash',
    name: 'Normal User',
    is_super_admin: 0, // SQLite boolean: false
    is_active: 1,
    avatar_url: null,
    font_size: 'MEDIUM' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  inactiveUser: {
    id: 'user-inactive',
    email: 'inactive@example.com',
    password_hash: 'hash',
    name: 'Inactive User',
    is_super_admin: 0,
    is_active: 0,
    avatar_url: null,
    font_size: 'MEDIUM' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

const mockBusinessAccess = {
  admin: {
    id: 'access-admin',
    user_id: 'user-normal',
    business_id: 'business-1',
    role: 'ADMIN' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  worker: {
    id: 'access-worker',
    user_id: 'user-normal',
    business_id: 'business-1',
    role: 'WORKER' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

describe('permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ========================================
  // Pure Functions (同期関数)
  // ========================================

  describe('canEditManual', () => {
    it.each<[PermissionLevel, boolean]>([
      ['none', false],
      ['worker', false],
      ['admin', true],
      ['superadmin', true],
    ])('権限レベル "%s" の場合、編集可能は %s', (level, expected) => {
      expect(canEditManual(level)).toBe(expected)
    })

    it('不正な権限レベルでも安全側（deny）になる', () => {
      // TypeScript的にはエラーだが、実行時の安全性をテスト
      expect(canEditManual('invalid' as PermissionLevel)).toBe(false)
      expect(canEditManual('' as PermissionLevel)).toBe(false)
      expect(canEditManual(undefined as unknown as PermissionLevel)).toBe(false)
      expect(canEditManual(null as unknown as PermissionLevel)).toBe(false)
    })
  })

  describe('canViewManual', () => {
    it.each<[PermissionLevel, boolean]>([
      ['none', false],
      ['worker', true],
      ['admin', true],
      ['superadmin', true],
    ])('権限レベル "%s" の場合、閲覧可能は %s', (level, expected) => {
      expect(canViewManual(level)).toBe(expected)
    })

    it('不正な権限レベルでも閲覧可能（noneではないため）', () => {
      // 'none' 以外は全て true になる実装
      // セキュリティ上は getPermissionLevel で先にフィルタされる前提
      expect(canViewManual('invalid' as PermissionLevel)).toBe(true)
    })
  })

  describe('canManageBusinesses', () => {
    it.each<[PermissionLevel, boolean]>([
      ['none', false],
      ['worker', false],
      ['admin', false],
      ['superadmin', true],
    ])('権限レベル "%s" の場合、事業管理可能は %s', (level, expected) => {
      expect(canManageBusinesses(level)).toBe(expected)
    })

    it('不正な権限レベルでは管理不可', () => {
      expect(canManageBusinesses('invalid' as PermissionLevel)).toBe(false)
      expect(canManageBusinesses(undefined as unknown as PermissionLevel)).toBe(false)
    })
  })

  describe('canManageUsers', () => {
    it.each<[PermissionLevel, boolean]>([
      ['none', false],
      ['worker', false],
      ['admin', false],
      ['superadmin', true],
    ])('権限レベル "%s" の場合、ユーザー管理可能は %s', (level, expected) => {
      expect(canManageUsers(level)).toBe(expected)
    })

    it('不正な権限レベルでは管理不可', () => {
      expect(canManageUsers('invalid' as PermissionLevel)).toBe(false)
      expect(canManageUsers(null as unknown as PermissionLevel)).toBe(false)
    })
  })

  // ========================================
  // Async Functions (非同期関数)
  // ========================================

  describe('getPermissionLevel', () => {
    describe('ユーザーが存在しない場合', () => {
      it('存在しないユーザーIDは "none" を返す', async () => {
        mockFindUserById.mockResolvedValue(null)

        const result = await getPermissionLevel('nonexistent-user', 'business-1')
        expect(result).toBe('none')
      })

      it('空のユーザーIDは "none" を返す', async () => {
        mockFindUserById.mockResolvedValue(null)

        const result = await getPermissionLevel('', 'business-1')
        expect(result).toBe('none')
      })
    })

    describe('スーパー管理者の場合', () => {
      it('スーパー管理者は常に "superadmin" を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.superAdmin)

        const result = await getPermissionLevel('user-super-admin', 'business-1')
        expect(result).toBe('superadmin')
        // BusinessAccessの確認はスキップされる
        expect(mockFindBusinessAccess).not.toHaveBeenCalled()
      })

      it('スーパー管理者は別事業でも "superadmin" を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.superAdmin)

        const result = await getPermissionLevel('user-super-admin', 'business-other')
        expect(result).toBe('superadmin')
      })
    })

    describe('通常ユーザーの場合', () => {
      it('ADMIN権限を持つ場合は "admin" を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(mockBusinessAccess.admin)

        const result = await getPermissionLevel('user-normal', 'business-1')
        expect(result).toBe('admin')
      })

      it('WORKER権限を持つ場合は "worker" を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(mockBusinessAccess.worker)

        const result = await getPermissionLevel('user-normal', 'business-1')
        expect(result).toBe('worker')
      })

      it('事業へのアクセス権がない場合は "none" を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(null)

        const result = await getPermissionLevel('user-normal', 'business-1')
        expect(result).toBe('none')
      })
    })

    describe('businessId mismatch（別事業へのアクセス試行）', () => {
      it('アクセス権のない事業IDでは "none" を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        // business-2へのアクセス権はない
        mockFindBusinessAccess.mockResolvedValue(null)

        const result = await getPermissionLevel('user-normal', 'business-2')
        expect(result).toBe('none')
        expect(mockFindBusinessAccess).toHaveBeenCalledWith('user-normal', 'business-2')
      })
    })

    describe('エッジケース', () => {
      it('空のbusinessIdでも正常にクエリが実行される', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(null)

        const result = await getPermissionLevel('user-normal', '')
        expect(result).toBe('none')
      })

      it('非アクティブユーザーでもDB上は存在するためチェックが行われる', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.inactiveUser)
        mockFindBusinessAccess.mockResolvedValue(mockBusinessAccess.worker)

        // 注: is_activeのチェックはgetPermissionLevelでは行われていない
        // 実際のアプリではセッション認証時にチェックされる前提
        const result = await getPermissionLevel('user-inactive', 'business-1')
        expect(result).toBe('worker')
      })
    })
  })

  describe('getUserBusinessAccess', () => {
    describe('ユーザーが存在しない場合', () => {
      it('存在しないユーザーは hasAccess: false を返す', async () => {
        mockFindUserById.mockResolvedValue(null)

        const result = await getUserBusinessAccess('nonexistent', 'business-1')
        expect(result).toEqual({
          hasAccess: false,
          role: null,
          isSuperAdmin: false,
        })
      })
    })

    describe('スーパー管理者の場合', () => {
      it('スーパー管理者は hasAccess: true, role: ADMIN, isSuperAdmin: true を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.superAdmin)

        const result = await getUserBusinessAccess('user-super-admin', 'business-1')
        expect(result).toEqual({
          hasAccess: true,
          role: 'ADMIN',
          isSuperAdmin: true,
        })
        // BusinessAccessの確認はスキップされる
        expect(mockFindBusinessAccess).not.toHaveBeenCalled()
      })
    })

    describe('通常ユーザーの場合', () => {
      it('ADMIN権限を持つ場合は正しく返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(mockBusinessAccess.admin)

        const result = await getUserBusinessAccess('user-normal', 'business-1')
        expect(result).toEqual({
          hasAccess: true,
          role: 'ADMIN',
          isSuperAdmin: false,
        })
      })

      it('WORKER権限を持つ場合は正しく返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(mockBusinessAccess.worker)

        const result = await getUserBusinessAccess('user-normal', 'business-1')
        expect(result).toEqual({
          hasAccess: true,
          role: 'WORKER',
          isSuperAdmin: false,
        })
      })

      it('アクセス権がない場合は hasAccess: false を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(null)

        const result = await getUserBusinessAccess('user-normal', 'business-1')
        expect(result).toEqual({
          hasAccess: false,
          role: null,
          isSuperAdmin: false,
        })
      })
    })

    describe('businessId mismatch', () => {
      it('別事業へのアクセスは hasAccess: false を返す', async () => {
        mockFindUserById.mockResolvedValue(mockUsers.normalUser)
        mockFindBusinessAccess.mockResolvedValue(null)

        const result = await getUserBusinessAccess('user-normal', 'business-other')
        expect(result).toEqual({
          hasAccess: false,
          role: null,
          isSuperAdmin: false,
        })
      })
    })
  })

  // ========================================
  // 権限チェックの組み合わせテスト
  // ========================================

  describe('権限フローの統合テスト', () => {
    it('スーパー管理者は全ての操作が可能', async () => {
      mockFindUserById.mockResolvedValue(mockUsers.superAdmin)

      const level = await getPermissionLevel('user-super-admin', 'any-business')

      expect(canViewManual(level)).toBe(true)
      expect(canEditManual(level)).toBe(true)
      expect(canManageBusinesses(level)).toBe(true)
      expect(canManageUsers(level)).toBe(true)
    })

    it('ADMIN権限者は閲覧・編集可能だが、事業・ユーザー管理は不可', async () => {
      mockFindUserById.mockResolvedValue(mockUsers.normalUser)
      mockFindBusinessAccess.mockResolvedValue(mockBusinessAccess.admin)

      const level = await getPermissionLevel('user-normal', 'business-1')

      expect(canViewManual(level)).toBe(true)
      expect(canEditManual(level)).toBe(true)
      expect(canManageBusinesses(level)).toBe(false)
      expect(canManageUsers(level)).toBe(false)
    })

    it('WORKER権限者は閲覧のみ可能', async () => {
      mockFindUserById.mockResolvedValue(mockUsers.normalUser)
      mockFindBusinessAccess.mockResolvedValue(mockBusinessAccess.worker)

      const level = await getPermissionLevel('user-normal', 'business-1')

      expect(canViewManual(level)).toBe(true)
      expect(canEditManual(level)).toBe(false)
      expect(canManageBusinesses(level)).toBe(false)
      expect(canManageUsers(level)).toBe(false)
    })

    it('アクセス権なしは全ての操作が不可', async () => {
      mockFindUserById.mockResolvedValue(mockUsers.normalUser)
      mockFindBusinessAccess.mockResolvedValue(null)

      const level = await getPermissionLevel('user-normal', 'business-other')

      expect(canViewManual(level)).toBe(false)
      expect(canEditManual(level)).toBe(false)
      expect(canManageBusinesses(level)).toBe(false)
      expect(canManageUsers(level)).toBe(false)
    })

    it('未ログイン（ユーザー不在）は全ての操作が不可', async () => {
      mockFindUserById.mockResolvedValue(null)

      const level = await getPermissionLevel('', 'business-1')

      expect(canViewManual(level)).toBe(false)
      expect(canEditManual(level)).toBe(false)
      expect(canManageBusinesses(level)).toBe(false)
      expect(canManageUsers(level)).toBe(false)
    })
  })
})
