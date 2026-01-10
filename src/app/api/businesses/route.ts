import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createBusiness, getD1Database } from '@/lib/d1'
import { getAccessibleBusinesses } from '@/lib/permissions'

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

// GET /api/businesses - アクセス可能な事業一覧を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const businesses = await getAccessibleBusinesses(session.user.id)

    // themeColorsをパースして返す
    const parsedBusinesses = businesses.map(b => ({
      ...b,
      themeColors: parseThemeColors(b.themeColors),
    }))

    return NextResponse.json(parsedBusinesses)
  } catch (error) {
    console.error('Failed to fetch businesses:', error)
    return NextResponse.json(
      { error: '事業の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/businesses - 新規事業を作成（スーパー管理者のみ）
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: '事業の作成権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, displayNameLine1, displayNameLine2, description, icon, color, themeColors } = body

    if (!name || !displayNameLine1 || !displayNameLine2) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // 最大のsortOrderを取得
    const db = await getD1Database()
    const maxResult = await db
      .prepare('SELECT MAX(sort_order) as max_sort FROM businesses')
      .first<{ max_sort: number | null }>()
    const maxSortOrder = maxResult?.max_sort || 0

    const business = await createBusiness({
      name,
      display_name_line1: displayNameLine1,
      display_name_line2: displayNameLine2,
      description,
      icon,
      color,
      theme_colors: JSON.stringify(themeColors || []),
      sort_order: maxSortOrder + 1,
    })

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
      manuals: [],
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Failed to create business:', error)
    return NextResponse.json(
      { error: '事業の作成に失敗しました' },
      { status: 500 }
    )
  }
}
