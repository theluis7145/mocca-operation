import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// GET /api/users - ユーザー一覧を取得（スーパー管理者のみ）
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'ユーザー一覧の取得権限がありません' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'ユーザーの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/users - ユーザーを作成（スーパー管理者のみ）
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'ユーザーの作成権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name, isSuperAdmin, businessAccess } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'メールアドレス、パスワード、名前は必須です' },
        { status: 400 }
      )
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        isSuperAdmin: isSuperAdmin || false,
        businessAccess: businessAccess
          ? {
              create: businessAccess.map((access: { businessId: string; role: 'ADMIN' | 'WORKER' }) => ({
                businessId: access.businessId,
                role: access.role,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        isActive: true,
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

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    )
  }
}
