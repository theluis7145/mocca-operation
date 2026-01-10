import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findUserById, updateUser, findBusinessAccessesByUser, type D1FontSize } from '@/lib/d1'

// GET /api/auth/me - 現在のユーザー情報を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await findUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const accesses = await findBusinessAccessesByUser(session.user.id)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: Boolean(user.is_super_admin),
      avatarUrl: user.avatar_url,
      fontSize: user.font_size,
      businessAccess: accesses.map((access) => ({
        id: access.id,
        businessId: access.business_id,
        role: access.role,
        business: {
          id: access.business.id,
          name: access.business.name,
          displayNameLine1: access.business.display_name_line1,
          displayNameLine2: access.business.display_name_line2,
        },
      })),
    })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH /api/auth/me - ユーザー設定を更新
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { fontSize, name, avatarUrl } = body

    // 文字サイズの検証
    if (fontSize !== undefined) {
      const validFontSizes: D1FontSize[] = ['SMALL', 'MEDIUM', 'LARGE']
      if (!validFontSizes.includes(fontSize)) {
        return NextResponse.json(
          { error: '無効な文字サイズです' },
          { status: 400 }
        )
      }
    }

    const user = await updateUser(session.user.id, {
      ...(fontSize !== undefined && { font_size: fontSize }),
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: Boolean(user.is_super_admin),
      avatarUrl: user.avatar_url,
      fontSize: user.font_size,
    })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'ユーザー設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
