import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findUserById,
  findBusinessAccessById,
  updateBusinessAccessRole,
  deleteBusinessAccess,
} from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string; accessId: string }>
}

// PATCH /api/businesses/:id/members/:accessId - 権限を更新
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // スーパー管理者のみ権限変更可能
    const currentUser = await findUserById(session.user.id)

    if (!currentUser?.is_super_admin) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      )
    }

    const { id: businessId, accessId } = await context.params
    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json(
        { error: '権限は必須です' },
        { status: 400 }
      )
    }

    // アクセス権が存在し、正しい事業に属しているか確認
    const existingAccess = await findBusinessAccessById(accessId)

    if (!existingAccess || existingAccess.business_id !== businessId) {
      return NextResponse.json(
        { error: 'アクセス権が見つかりません' },
        { status: 404 }
      )
    }

    const access = await updateBusinessAccessRole(accessId, role)

    if (!access) {
      return NextResponse.json(
        { error: 'アクセス権の更新に失敗しました' },
        { status: 500 }
      )
    }

    // ユーザー情報を取得
    const user = await findUserById(access.user_id)

    return NextResponse.json({
      id: access.id,
      userId: access.user_id,
      businessId: access.business_id,
      role: access.role,
      createdAt: access.created_at,
      updatedAt: access.updated_at,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
      } : null,
    })
  } catch (error) {
    console.error('Failed to update member:', error)
    return NextResponse.json(
      { error: '権限の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/businesses/:id/members/:accessId - メンバーを削除
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // スーパー管理者のみメンバー削除可能
    const currentUser = await findUserById(session.user.id)

    if (!currentUser?.is_super_admin) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      )
    }

    const { id: businessId, accessId } = await context.params

    // アクセス権が存在し、正しい事業に属しているか確認
    const existingAccess = await findBusinessAccessById(accessId)

    if (!existingAccess || existingAccess.business_id !== businessId) {
      return NextResponse.json(
        { error: 'アクセス権が見つかりません' },
        { status: 404 }
      )
    }

    await deleteBusinessAccess(accessId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete member:', error)
    return NextResponse.json(
      { error: 'メンバーの削除に失敗しました' },
      { status: 500 }
    )
  }
}
