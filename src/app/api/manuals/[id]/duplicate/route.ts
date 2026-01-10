import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/manuals/:id/duplicate - マニュアルを複製
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    // 元のマニュアルを取得
    const originalManual = await prisma.manual.findUnique({
      where: { id },
      include: {
        business: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!originalManual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, originalManual.businessId)
    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの複製権限がありません' },
        { status: 403 }
      )
    }

    // 新しいマニュアルを作成（トランザクション使用）
    const newManual = await prisma.$transaction(async (tx) => {
      // マニュアルを作成
      const manual = await tx.manual.create({
        data: {
          businessId: originalManual.businessId,
          title: `${originalManual.title}（コピー）`,
          description: originalManual.description,
          status: 'DRAFT',
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      })

      // ブロックを複製
      if (originalManual.blocks.length > 0) {
        await tx.block.createMany({
          data: originalManual.blocks.map((block, index) => ({
            manualId: manual.id,
            type: block.type,
            content: block.content ?? {},  // nullの場合は空オブジェクト
            sortOrder: index,
          })),
        })
      }

      // 作成したマニュアルをブロック付きで取得
      return tx.manual.findUnique({
        where: { id: manual.id },
        include: {
          business: true,
          blocks: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
    })

    return NextResponse.json(newManual, { status: 201 })
  } catch (error) {
    console.error('Failed to duplicate manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの複製に失敗しました' },
      { status: 500 }
    )
  }
}
