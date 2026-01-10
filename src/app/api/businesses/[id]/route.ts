import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canViewManual, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// themeColorsをパースするヘルパー関数
function parseThemeColors(business: { themeColors?: string | string[] | null }) {
  if (!business.themeColors) return []
  if (Array.isArray(business.themeColors)) return business.themeColors
  try {
    return JSON.parse(business.themeColors)
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

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        manuals: {
          where: { isArchived: false },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        },
      },
    })

    if (!business) {
      return NextResponse.json(
        { error: '事業が見つかりません' },
        { status: 404 }
      )
    }

    // 管理者でない場合、adminOnlyマニュアルと非公開マニュアルをフィルタリング
    const isAdmin = canEditManual(level)
    const filteredManuals = isAdmin
      ? business.manuals
      : business.manuals.filter((m) => m.status === 'PUBLISHED' && !m.adminOnly)

    // themeColorsをパースして返す
    const response = {
      ...business,
      manuals: filteredManuals,
      themeColors: parseThemeColors(business),
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

    const business = await prisma.business.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(displayNameLine1 !== undefined && { displayNameLine1 }),
        ...(displayNameLine2 !== undefined && { displayNameLine2 }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(themeColors !== undefined && { themeColors: JSON.stringify(themeColors) }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        manuals: {
          where: { isArchived: false },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        },
      },
    })

    // themeColorsをパースして返す
    const response = {
      ...business,
      themeColors: parseThemeColors(business),
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
    await prisma.business.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete business:', error)
    return NextResponse.json(
      { error: '事業の削除に失敗しました' },
      { status: 500 }
    )
  }
}
