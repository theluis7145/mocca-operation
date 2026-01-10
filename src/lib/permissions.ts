import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

export type PermissionLevel = 'none' | 'worker' | 'admin' | 'superadmin'

/**
 * ユーザーの事業に対する権限レベルを取得
 */
export async function getPermissionLevel(
  userId: string,
  businessId: string
): Promise<PermissionLevel> {
  // ユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      businessAccess: {
        where: { businessId },
        select: { role: true },
      },
    },
  })

  if (!user) return 'none'

  // スーパー管理者は全事業で最高権限
  if (user.isSuperAdmin) return 'superadmin'

  // 事業へのアクセス権がない場合
  if (user.businessAccess.length === 0) return 'none'

  // 事業内での権限
  const role = user.businessAccess[0].role
  return role === 'ADMIN' ? 'admin' : 'worker'
}

/**
 * マニュアル編集権限があるか確認
 */
export function canEditManual(level: PermissionLevel): boolean {
  return level === 'admin' || level === 'superadmin'
}

/**
 * マニュアル閲覧権限があるか確認
 */
export function canViewManual(level: PermissionLevel): boolean {
  return level !== 'none'
}

/**
 * 事業管理権限があるか確認（スーパー管理者のみ）
 */
export function canManageBusinesses(level: PermissionLevel): boolean {
  return level === 'superadmin'
}

/**
 * ユーザー管理権限があるか確認（スーパー管理者のみ）
 */
export function canManageUsers(level: PermissionLevel): boolean {
  return level === 'superadmin'
}

/**
 * ユーザーがアクセス可能な事業一覧を取得
 * WORKERは公開マニュアルのみ、ADMIN/スーパー管理者は全マニュアルを取得
 */
export async function getAccessibleBusinesses(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      businessAccess: {
        select: {
          businessId: true,
          role: true,
        },
      },
    },
  })

  if (!user) return []

  // スーパー管理者は全事業・全マニュアルにアクセス可能
  if (user.isSuperAdmin) {
    return prisma.business.findMany({
      where: { isActive: true },
      include: {
        manuals: {
          where: { isArchived: false },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            adminOnly: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  // 事業ごとの権限をマップ化
  const businessRoles = new Map(
    user.businessAccess.map((access) => [access.businessId, access.role])
  )

  // アクセス権のある事業を取得
  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      businessAccess: {
        some: { userId },
      },
    },
    include: {
      manuals: {
        where: { isArchived: false },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          adminOnly: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 各事業のマニュアルを権限に基づいてフィルタリング
  return businesses.map((business) => {
    const role = businessRoles.get(business.id)
    const isAdmin = role === 'ADMIN'

    return {
      ...business,
      manuals: isAdmin
        ? business.manuals // ADMINは全マニュアル
        : business.manuals.filter((m) => m.status === 'PUBLISHED' && !m.adminOnly), // WORKERは公開かつ管理者限定でないもののみ
    }
  })
}

/**
 * ユーザーの事業へのアクセス権と役割を取得
 */
export async function getUserBusinessAccess(userId: string, businessId: string): Promise<{
  hasAccess: boolean
  role: Role | null
  isSuperAdmin: boolean
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      businessAccess: {
        where: { businessId },
        select: { role: true },
      },
    },
  })

  if (!user) {
    return { hasAccess: false, role: null, isSuperAdmin: false }
  }

  // スーパー管理者は全事業にアクセス可能
  if (user.isSuperAdmin) {
    return { hasAccess: true, role: 'ADMIN', isSuperAdmin: true }
  }

  const access = user.businessAccess[0]
  return {
    hasAccess: !!access,
    role: access?.role || null,
    isSuperAdmin: false,
  }
}
