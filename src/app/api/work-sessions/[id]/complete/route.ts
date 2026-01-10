import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/work-sessions/:id/complete - 作業完了
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

    const workSession = await prisma.workSession.findUnique({
      where: { id },
      include: {
        user: true,
        manual: {
          include: {
            blocks: {
              where: { type: 'PHOTO_RECORD' },
              select: { id: true, sortOrder: true, content: true },
            },
          },
        },
        notes: true,
        photoRecords: {
          select: { blockId: true },
        },
      },
    })

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ完了可能
    if (workSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーの作業セッションは完了できません' },
        { status: 403 }
      )
    }

    if (workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'この作業セッションは既に完了しています' },
        { status: 400 }
      )
    }

    const businessId = workSession.manual.businessId

    // 未撮影の写真ブロックをチェック
    const capturedPhotoBlockIds = new Set(
      workSession.photoRecords.map((photo) => photo.blockId)
    )
    const missingPhotoBlocks = workSession.manual.blocks.filter(
      (block) => !capturedPhotoBlockIds.has(block.id)
    )
    const hasMissingPhotos = missingPhotoBlocks.length > 0

    // 管理者を取得（事業のADMIN + スーパー管理者）
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { isSuperAdmin: true },
          {
            businessAccess: {
              some: {
                businessId,
                role: 'ADMIN',
              },
            },
          },
        ],
      },
      select: { id: true },
    })

    // 作業セッションを完了に更新し、通知を作成
    const [updatedSession] = await prisma.$transaction([
      prisma.workSession.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          notes: true,
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      // 各管理者に通知を作成
      prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'WORK_SESSION_COMPLETED' as const,
          title: '作業完了報告',
          message: `${workSession.user.name}さんが「${workSession.manual.title}」の作業を完了しました`,
          linkUrl: `/work-sessions/${id}`,
          relatedWorkSessionId: id,
        })),
      }),
    ])

    return NextResponse.json({
      ...updatedSession,
      hasMissingPhotos,
      missingPhotoBlocks: missingPhotoBlocks.map((block) => ({
        id: block.id,
        sortOrder: block.sortOrder,
        content: block.content,
      })),
    })
  } catch (error) {
    console.error('Failed to complete work session:', error)
    return NextResponse.json(
      { error: '作業セッションの完了に失敗しました' },
      { status: 500 }
    )
  }
}
