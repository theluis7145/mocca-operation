import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { FontSize } from '@prisma/client'

// GET /api/auth/me - 現在のユーザー情報を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        avatarUrl: true,
        fontSize: true,
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
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json(user)
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
      const validFontSizes: FontSize[] = ['SMALL', 'MEDIUM', 'LARGE']
      if (!validFontSizes.includes(fontSize)) {
        return NextResponse.json(
          { error: '無効な文字サイズです' },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(fontSize !== undefined && { fontSize }),
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        avatarUrl: true,
        fontSize: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'ユーザー設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
