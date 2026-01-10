import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findBusinessById, updateBusiness, findManualsByBusiness } from '@/lib/d1'
import { getPermissionLevel, canViewManual, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// themeColorsをパースするヘルパー関数
function parseThemeColors(themeColors?: string | string[] | null) {
  if (!themeColors) return []
  if (Array.isArray(themeColors)) return themeColors
  try {
    return JSON.parse(themeColors)
  } catch {
    return []
  }
}

// GET /api/businesses/:id - 事業詳細を取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params
    const level = await getPermissionLevel(session.user.id, id)

    if (!canViewManual(level)) {
      return NextResponse.json(
        { error: 'この事業へのアクセス権がありません' },
        { status: 403 }
      )
    }

    const business = await findBusinessById(id)

    if (!business) {
      return NextResponse.json(
        { error: '事業が見つかりません' },
        { status: 404 }
      )
    }

    // マニュアル一覧を取得
    const manuals = await findManualsByBusiness(id)

    // 管理者でない場合、adminOnlyマニュアルと非公開マニュアルをフィルタリング
    const isAdmin = canEditManual(level)
    const filteredManuals = isAdmin
      ? manuals
      : manuals.filter((m) => m.status === 'PUBLISHED' && !m.admin_only)

    // レスポンス用に変換
    const response = {
      id: business.id,
      name: business.name,
      displayNameLine1: business.display_name_line1,
      displayNameLine2: business.display_name_line2,
      description: business.description,
      icon: business.icon,
      color: business.color,
      themeColors: parseThemeColors(business.theme_colors),
      sortOrder: business.sort_order,
      isActive: Boolean(business.is_active),
      createdAt: business.created_at,
      updatedAt: business.updated_at,
      manuals: filteredManuals.map((m) => ({
        id: m.id,
        businessId: m.business_id,
        title: m.title,
        description: m.description,
        status: m.status,
        adminOnly: Boolean(m.admin_only),
        sortOrder: m.sort_order,
        isArchived: Boolean(m.is_archived),
        version: m.version,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch business:', error)
    return NextResponse.json(
      { error: '事業の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH /api/businesses/:id - 事業を更新（スーパー管理者のみ）
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: '事業の更新権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, displayNameLine1, displayNameLine2, description, icon, color, themeColors, sortOrder, isActive } = body

    const business = await updateBusiness(id, {
      ...(name !== undefined && { name }),
      ...(displayNameLine1 !== undefined && { display_name_line1: displayNameLine1 }),
      ...(displayNameLine2 !== undefined && { display_name_line2: displayNameLine2 }),
      ...(description !== undefined && { description }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(themeColors !== undefined && { theme_colors: JSON.stringify(themeColors) }),
      ...(sortOrder !== undefined && { sort_order: sortOrder }),
      ...(isActive !== undefined && { is_active: isActive }),
    })

    if (!business) {
      return NextResponse.json(
        { error: '事業が見つかりません' },
        { status: 404 }
      )
    }

    // マニュアル一覧を取得
    const manuals = await findManualsByBusiness(id)

    // レスポンス用に変換
    const response = {
      id: business.id,
      name: business.name,
      displayNameLine1: business.display_name_line1,
      displayNameLine2: business.display_name_line2,
      description: business.description,
      icon: business.icon,
      color: business.color,
      themeColors: parseThemeColors(business.theme_colors),
      sortOrder: business.sort_order,
      isActive: Boolean(business.is_active),
      createdAt: business.created_at,
      updatedAt: business.updated_at,
      manuals: manuals.map((m) => ({
        id: m.id,
        businessId: m.business_id,
        title: m.title,
        description: m.description,
        status: m.status,
        adminOnly: Boolean(m.admin_only),
        sortOrder: m.sort_order,
        isArchived: Boolean(m.is_archived),
        version: m.version,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to update business:', error)
    return NextResponse.json(
      { error: '事業の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/businesses/:id - 事業を削除（論理削除、スーパー管理者のみ）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: '事業の削除権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // 論理削除
    await updateBusiness(id, { is_active: false })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete business:', error)
    return NextResponse.json(
      { error: '事業の削除に失敗しました' },
      { status: 500 }
    )
  }
}
