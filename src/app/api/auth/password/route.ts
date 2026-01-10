import { NextRequest, NextResponse } from 'next/server'
import { hash, compare } from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/auth/password - パスワード変更
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '現在のパスワードと新しいパスワードを入力してください' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      )
    }

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 現在のパスワードを検証
    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      )
    }

    // 新しいパスワードをハッシュ化して保存
    const newPasswordHash = await hash(newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({ message: 'パスワードを変更しました' })
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json(
      { error: 'パスワードの変更に失敗しました' },
      { status: 500 }
    )
  }
}
