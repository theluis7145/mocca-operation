import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'
import type { BlockType, Prisma } from '@prisma/client'

type RouteContext = {
  params: Promise<{ id: string; versionId: string }>
}

// GET /api/manuals/:id/versions/:versionId - 特定のバージョンを取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id, versionId } = await context.params

    // マニュアルを取得
    const manual = await prisma.manual.findUnique({
      where: { id },
      select: { businessId: true },
    })

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.businessId)
    if (level === 'none') {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // バージョンを取得
    const version = await prisma.manualVersion.findUnique({
      where: { id: versionId },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    if (!version || version.manualId !== id) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
    }

    return NextResponse.json(version)
  } catch (error) {
    console.error('Failed to fetch version:', error)
    return NextResponse.json(
      { error: 'バージョンの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/manuals/:id/versions/:versionId/restore - バージョンを復元
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id, versionId } = await context.params

    // マニュアルを取得
    const manual = await prisma.manual.findUnique({
      where: { id },
      include: {
        blocks: true,
      },
    })

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.businessId)
    if (!canEditManual(level)) {
      return NextResponse.json({ error: 'バージョン復元権限がありません' }, { status: 403 })
    }

    // バージョンを取得
    const version = await prisma.manualVersion.findUnique({
      where: { id: versionId },
    })

    if (!version || version.manualId !== id) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
    }

    // トランザクションで復元
    const restoredManual = await prisma.$transaction(async (tx) => {
      // 現在のバージョンをスナップショットとして保存
      const currentBlocks = manual.blocks.map((block) => ({
        type: block.type,
        content: block.content,
        sortOrder: block.sortOrder,
      }))

      await tx.manualVersion.create({
        data: {
          manualId: id,
          version: manual.version,
          title: manual.title,
          description: manual.description,
          blocks: currentBlocks,
          createdBy: session.user.id,
          comment: `バージョン ${version.version} への復元前のバックアップ`,
        },
      })

      // 既存のブロックを削除
      await tx.block.deleteMany({
        where: { manualId: id },
      })

      // バージョンからブロックを復元
      const versionBlocks = version.blocks as Array<{
        type: BlockType
        content: Prisma.InputJsonValue
        sortOrder: number
      }>

      if (versionBlocks.length > 0) {
        await tx.block.createMany({
          data: versionBlocks.map((block) => ({
            manualId: id,
            type: block.type,
            content: block.content,
            sortOrder: block.sortOrder,
          })),
        })
      }

      // マニュアルを更新
      return tx.manual.update({
        where: { id },
        data: {
          title: version.title,
          description: version.description,
          version: manual.version + 1,
          updatedBy: session.user.id,
        },
        include: {
          blocks: {
            orderBy: { sortOrder: 'asc' },
          },
          business: true,
          creator: { select: { id: true, name: true } },
          updater: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json(restoredManual)
  } catch (error) {
    console.error('Failed to restore version:', error)
    return NextResponse.json(
      { error: 'バージョンの復元に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/manuals/:id/versions/:versionId - バージョンを削除
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id, versionId } = await context.params

    // マニュアルを取得
    const manual = await prisma.manual.findUnique({
      where: { id },
      select: { businessId: true },
    })

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.businessId)
    if (!canEditManual(level)) {
      return NextResponse.json({ error: 'バージョン削除権限がありません' }, { status: 403 })
    }

    // バージョンを取得
    const version = await prisma.manualVersion.findUnique({
      where: { id: versionId },
    })

    if (!version || version.manualId !== id) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
    }

    // バージョンを削除
    await prisma.manualVersion.delete({
      where: { id: versionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete version:', error)
    return NextResponse.json(
      { error: 'バージョンの削除に失敗しました' },
      { status: 500 }
    )
  }
}
