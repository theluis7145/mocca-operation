import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// POST /api/users/[id]/reset-password - パスワードをリセット（スーパー管理者のみ）
export async function POST(
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
        { error: 'パスワードリセットの権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword) {
      return NextResponse.json(
        { error: '新しいパスワードを入力してください' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      )
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // パスワードをハッシュ化して更新
    const passwordHash = await hash(newPassword, 12)

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    })

    return NextResponse.json({
      message: 'パスワードをリセットしました',
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('Failed to reset password:', error)
    return NextResponse.json(
      { error: 'パスワードのリセットに失敗しました' },
      { status: 500 }
    )
  }
}
