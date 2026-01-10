import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findUserById, findBusinessAccessByUserAndBusiness } from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/businesses/:id/members/me - 現在のユーザーの権限を取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: businessId } = await context.params

    // ユーザー情報を取得
    const user = await findUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // スーパー管理者は全事業で ADMIN 権限
    if (user.is_super_admin) {
      return NextResponse.json({
        role: 'ADMIN',
        isSuperAdmin: true,
        hasAccess: true,
      })
    }

    // 事業へのアクセス権を確認
    const access = await findBusinessAccessByUserAndBusiness(session.user.id, businessId)

    if (!access) {
      return NextResponse.json({
        role: null,
        isSuperAdmin: false,
        hasAccess: false,
      })
    }

    // 事業内での権限を返す
    return NextResponse.json({
      role: access.role,
      isSuperAdmin: false,
      hasAccess: true,
    })
  } catch (error) {
    console.error('Failed to fetch user role:', error)
    return NextResponse.json(
      { error: 'ユーザー権限の取得に失敗しました' },
      { status: 500 }
    )
  }
}
