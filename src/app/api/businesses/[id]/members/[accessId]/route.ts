import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    })

    if (!currentUser?.isSuperAdmin) {
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
    const existingAccess = await prisma.businessAccess.findUnique({
      where: { id: accessId },
    })

    if (!existingAccess || existingAccess.businessId !== businessId) {
      return NextResponse.json(
        { error: 'アクセス権が見つかりません' },
        { status: 404 }
      )
    }

    const access = await prisma.businessAccess.update({
      where: { id: accessId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(access)
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
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    })

    if (!currentUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      )
    }

    const { id: businessId, accessId } = await context.params

    // アクセス権が存在し、正しい事業に属しているか確認
    const existingAccess = await prisma.businessAccess.findUnique({
      where: { id: accessId },
    })

    if (!existingAccess || existingAccess.businessId !== businessId) {
      return NextResponse.json(
        { error: 'アクセス権が見つかりません' },
        { status: 404 }
      )
    }

    await prisma.businessAccess.delete({
      where: { id: accessId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete member:', error)
    return NextResponse.json(
      { error: 'メンバーの削除に失敗しました' },
      { status: 500 }
    )
  }
}
