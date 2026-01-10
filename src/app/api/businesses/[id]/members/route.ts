import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/businesses/:id/members - メンバー一覧を取得
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
    const level = await getPermissionLevel(session.user.id, businessId)

    // 管理者以上のみメンバー一覧を表示
    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      )
    }

    // スーパー管理者を含むすべてのメンバーを取得
    const businessAccesses = await prisma.businessAccess.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isSuperAdmin: true,
          },
        },
      },
    })

    // スーパー管理者も含める
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
      },
    })

    // メンバーリストを作成（重複を除去）
    const memberMap = new Map()

    // スーパー管理者を追加
    for (const admin of superAdmins) {
      memberMap.set(admin.id, {
        ...admin,
        businessAccess: [],
      })
    }

    // 事業アクセス権を持つユーザーを追加
    for (const access of businessAccesses) {
      const existing = memberMap.get(access.user.id)
      if (existing) {
        existing.businessAccess.push({
          id: access.id,
          role: access.role,
        })
      } else {
        memberMap.set(access.user.id, {
          ...access.user,
          businessAccess: [{
            id: access.id,
            role: access.role,
          }],
        })
      }
    }

    const members = Array.from(memberMap.values())

    return NextResponse.json(members)
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json(
      { error: 'メンバーの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/businesses/:id/members - メンバーを追加
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // スーパー管理者のみメンバー追加可能
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

    const { id: businessId } = await context.params
    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'ユーザーIDと権限は必須です' },
        { status: 400 }
      )
    }

    // すでにアクセス権があるか確認
    const existingAccess = await prisma.businessAccess.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    })

    if (existingAccess) {
      return NextResponse.json(
        { error: 'このユーザーはすでにメンバーです' },
        { status: 400 }
      )
    }

    const access = await prisma.businessAccess.create({
      data: {
        userId,
        businessId,
        role,
      },
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

    return NextResponse.json(access, { status: 201 })
  } catch (error) {
    console.error('Failed to add member:', error)
    return NextResponse.json(
      { error: 'メンバーの追加に失敗しました' },
      { status: 500 }
    )
  }
}
