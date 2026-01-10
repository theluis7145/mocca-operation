import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        isActive: true,
        fontSize: true,
        createdAt: true,
        businessAccess: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                displayNameLine1: true,
                displayNameLine2: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
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
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isSuperAdmin: true },
    })

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

      await prisma.user.update({
        where: { id },
        data: { isActive },
      })
    }

    // businessAccessの更新がある場合
    if (businessAccess !== undefined) {
      // スーパー管理者の場合は事業権限の更新をスキップ
      if (existingUser.isSuperAdmin) {
        return NextResponse.json(
          { error: 'スーパー管理者の事業権限は変更できません' },
          { status: 400 }
        )
      }

      // 既存の事業アクセスを全て削除して、新しいものを作成
      await prisma.$transaction(async (tx) => {
        // 既存のアクセス権を削除
        await tx.businessAccess.deleteMany({
          where: { userId: id },
        })

        // 新しいアクセス権を作成
        if (businessAccess && businessAccess.length > 0) {
          await tx.businessAccess.createMany({
            data: businessAccess.map((access: { businessId: string; role: 'ADMIN' | 'WORKER' }) => ({
              userId: id,
              businessId: access.businessId,
              role: access.role,
            })),
          })
        }
      })
    }

    // 更新後のユーザー情報を取得して返す
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        isActive: true,
        fontSize: true,
        createdAt: true,
        businessAccess: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                displayNameLine1: true,
                displayNameLine2: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedUser)
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
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'ユーザーを削除しました' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    )
  }
}
