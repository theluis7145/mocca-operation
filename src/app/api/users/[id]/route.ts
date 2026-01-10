import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findUserById,
  updateUser,
  deleteUser,
  findBusinessAccessesByUser,
  createBusinessAccess,
  getD1Database,
} from '@/lib/d1'

// GET /api/users/[id] - ユーザー詳細を取得（スーパー管理者のみ）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await params

    const user = await findUserById(id)

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    const accesses = await findBusinessAccessesByUser(id)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: Boolean(user.is_super_admin),
      isActive: Boolean(user.is_active),
      fontSize: user.font_size,
      createdAt: user.created_at,
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
      { error: 'ユーザーの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - ユーザーの事業権限を更新（スーパー管理者のみ）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'ユーザー情報の更新権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { businessAccess, isActive } = body

    // ユーザーの存在確認
    const existingUser = await findUserById(id)

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // isActiveの更新がある場合
    if (typeof isActive === 'boolean') {
      // 自分自身を非アクティブにすることはできない
      if (id === session.user.id && !isActive) {
        return NextResponse.json(
          { error: '自分自身を非アクティブにすることはできません' },
          { status: 400 }
        )
      }

      await updateUser(id, { is_active: isActive })
    }

    // businessAccessの更新がある場合
    if (businessAccess !== undefined) {
      // スーパー管理者の場合は事業権限の更新をスキップ
      if (existingUser.is_super_admin) {
        return NextResponse.json(
          { error: 'スーパー管理者の事業権限は変更できません' },
          { status: 400 }
        )
      }

      const db = await getD1Database()

      // 既存のアクセス権を削除
      await db
        .prepare('DELETE FROM business_access WHERE user_id = ?')
        .bind(id)
        .run()

      // 新しいアクセス権を作成
      if (businessAccess && businessAccess.length > 0) {
        for (const access of businessAccess) {
          await createBusinessAccess({
            user_id: id,
            business_id: access.businessId,
            role: access.role,
          })
        }
      }
    }

    // 更新後のユーザー情報を取得して返す
    const updatedUser = await findUserById(id)
    const accesses = await findBusinessAccessesByUser(id)

    return NextResponse.json({
      id: updatedUser!.id,
      email: updatedUser!.email,
      name: updatedUser!.name,
      isSuperAdmin: Boolean(updatedUser!.is_super_admin),
      isActive: Boolean(updatedUser!.is_active),
      fontSize: updatedUser!.font_size,
      createdAt: updatedUser!.created_at,
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
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - ユーザーを削除（スーパー管理者のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'ユーザーの削除権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await params

    // 自分自身は削除できない
    if (id === session.user.id) {
      return NextResponse.json(
        { error: '自分自身を削除することはできません' },
        { status: 400 }
      )
    }

    // ユーザーの存在確認
    const existingUser = await findUserById(id)

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    await deleteUser(id)

    return NextResponse.json({ message: 'ユーザーを削除しました' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    )
  }
}
