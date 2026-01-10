import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccessibleBusinesses } from '@/lib/permissions'

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
      themeColors: parseThemeColors(b),
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
    const maxSortOrder = await prisma.business.aggregate({
      _max: { sortOrder: true },
    })

    const business = await prisma.business.create({
      data: {
        name,
        displayNameLine1,
        displayNameLine2,
        description,
        icon,
        color,
        themeColors: JSON.stringify(themeColors || []),
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
      include: {
        manuals: true,
      },
    })

    // レスポンス用にthemeColorsをパース
    const response = {
      ...business,
      themeColors: parseThemeColors(business),
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
