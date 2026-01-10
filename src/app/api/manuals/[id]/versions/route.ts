import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findManualWithRelations,
  findManualVersionsByManual,
  createManualVersion,
  findUserById,
  type D1ManualVersion,
} from '@/lib/d1'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// D1のバージョンをcamelCaseに変換
function toVersionResponse(version: D1ManualVersion & { creator?: { id: string; name: string } }) {
  return {
    id: version.id,
    manualId: version.manual_id,
    version: version.version,
    title: version.title,
    description: version.description,
    blocks: typeof version.blocks === 'string' ? JSON.parse(version.blocks) : version.blocks,
    createdBy: version.created_by,
    createdAt: version.created_at,
    comment: version.comment,
    creator: version.creator,
  }
}

// GET /api/manuals/:id/versions - バージョン履歴を取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    // マニュアルを取得
    const manual = await findManualById(id)

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック（閲覧はWORKER以上）
    const level = await getPermissionLevel(session.user.id, manual.business_id)
    if (level === 'none') {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // バージョン履歴を取得
    const versions = await findManualVersionsByManual(id)

    // creatorの情報を追加
    const versionsWithCreator = await Promise.all(
      versions.map(async (version) => {
        const user = await findUserById(version.created_by)
        return {
          ...version,
          creator: user ? { id: user.id, name: user.name } : undefined,
        }
      })
    )

    return NextResponse.json(versionsWithCreator.map(toVersionResponse))
  } catch (error) {
    console.error('Failed to fetch versions:', error)
    return NextResponse.json(
      { error: 'バージョン履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/manuals/:id/versions - 新しいバージョンを作成（スナップショット）
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
    const body = await request.json()
    const { comment } = body

    // マニュアルを取得（ブロック含む）
    const manual = await findManualWithRelations(id)

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.business_id)
    if (!canEditManual(level)) {
      return NextResponse.json({ error: 'バージョン作成権限がありません' }, { status: 403 })
    }

    // ブロックのスナップショットを作成
    const blocksSnapshot = (manual.blocks || []).map((block) => ({
      type: block.type,
      content: typeof block.content === 'string' ? JSON.parse(block.content) : block.content,
      sortOrder: block.sort_order,
    }))

    // 新しいバージョンを作成
    const version = await createManualVersion({
      manual_id: id,
      version: manual.version,
      title: manual.title,
      description: manual.description,
      blocks: JSON.stringify(blocksSnapshot),
      created_by: session.user.id,
      comment,
    })

    // creatorの情報を追加
    const user = await findUserById(version.created_by)
    const versionWithCreator = {
      ...version,
      creator: user ? { id: user.id, name: user.name } : undefined,
    }

    return NextResponse.json(toVersionResponse(versionWithCreator), { status: 201 })
  } catch (error) {
    console.error('Failed to create version:', error)
    return NextResponse.json(
      { error: 'バージョンの作成に失敗しました' },
      { status: 500 }
    )
  }
}
