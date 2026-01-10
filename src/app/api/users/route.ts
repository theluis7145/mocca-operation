import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findAllUsers,
  findUserByEmail,
  createUser,
  createBusinessAccess,
  findBusinessAccessesByUser,
} from '@/lib/d1'
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

    const users = await findAllUsers()

    // 各ユーザーのbusinessAccessを取得
    const usersWithAccess = await Promise.all(
      users.map(async (user) => {
        const accesses = await findBusinessAccessesByUser(user.id)
        return {
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
        }
      })
    )

    return NextResponse.json(usersWithAccess)
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
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)

    const user = await createUser({
      email,
      password_hash: passwordHash,
      name,
      is_super_admin: isSuperAdmin || false,
    })

    // businessAccessを作成
    if (businessAccess && businessAccess.length > 0) {
      for (const access of businessAccess) {
        await createBusinessAccess({
          user_id: user.id,
          business_id: access.businessId,
          role: access.role,
        })
      }
    }

    // 作成後のbusinessAccessを取得
    const accesses = await findBusinessAccessesByUser(user.id)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: Boolean(user.is_super_admin),
      isActive: Boolean(user.is_active),
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
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    )
  }
}
