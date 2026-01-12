import {
  findUserById,
  findBusinessAccessByUserAndBusiness,
  findBusinessAccessesByUser,
  findAllBusinesses,
  findManualsByBusiness,
  type D1Role,
} from '@/lib/d1'

export type PermissionLevel = 'none' | 'worker' | 'admin' | 'superadmin'

/**
 * ユーザーの事業に対する権限レベルを取得
 */
export async function getPermissionLevel(
  userId: string,
  businessId: string
): Promise<PermissionLevel> {
  const user = await findUserById(userId)

  if (!user) return 'none'

  // スーパー管理者は全事業で最高権限
  if (user.is_super_admin) return 'superadmin'

  // 事業へのアクセス権を確認
  const access = await findBusinessAccessByUserAndBusiness(userId, businessId)

  if (!access) return 'none'

  return access.role === 'ADMIN' ? 'admin' : 'worker'
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
  const user = await findUserById(userId)

  if (!user) return []

  // スーパー管理者は全事業・全マニュアルにアクセス可能
  if (user.is_super_admin) {
    const businesses = await findAllBusinesses()

    // 各事業のマニュアルを取得
    const result = await Promise.all(
      businesses.map(async (business) => {
        const manuals = await findManualsByBusiness(business.id)
        return {
          ...business,
          // D1形式からアプリ形式に変換
          displayNameLine1: business.display_name_line1,
          displayNameLine2: business.display_name_line2,
          sortOrder: business.sort_order,
          isActive: Boolean(business.is_active),
          createdAt: business.created_at,
          updatedAt: business.updated_at,
          themeColors: business.theme_colors,
          manuals: manuals.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            genre: m.genre,
            status: m.status,
            adminOnly: Boolean(m.admin_only),
            updatedAt: m.updated_at,
          })),
        }
      })
    )

    return result
  }

  // 事業ごとのアクセス権を取得
  const accesses = await findBusinessAccessesByUser(userId)

  // アクセス権のある事業とマニュアルを取得
  const result = await Promise.all(
    accesses.map(async (access) => {
      const business = access.business
      const manuals = await findManualsByBusiness(business.id)
      const isAdmin = access.role === 'ADMIN'

      // フィルタリング: WORKERは公開かつ管理者限定でないもののみ
      const filteredManuals = isAdmin
        ? manuals
        : manuals.filter((m) => m.status === 'PUBLISHED' && !m.admin_only)

      return {
        ...business,
        displayNameLine1: business.display_name_line1,
        displayNameLine2: business.display_name_line2,
        sortOrder: business.sort_order,
        isActive: Boolean(business.is_active),
        createdAt: business.created_at,
        updatedAt: business.updated_at,
        themeColors: business.theme_colors,
        manuals: filteredManuals.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          genre: m.genre,
          status: m.status,
          adminOnly: Boolean(m.admin_only),
          updatedAt: m.updated_at,
        })),
      }
    })
  )

  return result
}

/**
 * ユーザーの事業へのアクセス権と役割を取得
 */
export async function getUserBusinessAccess(userId: string, businessId: string): Promise<{
  hasAccess: boolean
  role: D1Role | null
  isSuperAdmin: boolean
}> {
  const user = await findUserById(userId)

  if (!user) {
    return { hasAccess: false, role: null, isSuperAdmin: false }
  }

  // スーパー管理者は全事業にアクセス可能
  if (user.is_super_admin) {
    return { hasAccess: true, role: 'ADMIN', isSuperAdmin: true }
  }

  const access = await findBusinessAccessByUserAndBusiness(userId, businessId)

  return {
    hasAccess: !!access,
    role: access?.role || null,
    isSuperAdmin: false,
  }
}
