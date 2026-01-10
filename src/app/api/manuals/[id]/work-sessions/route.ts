import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findActiveWorkSession,
  findWorkSessionsByManual,
  createWorkSession,
  findWorkSessionNotesBySession,
  findUserById,
  type D1WorkSession,
  type D1WorkSessionNote,
} from '@/lib/d1'
import { getPermissionLevel, canViewManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// D1のノートをcamelCaseに変換
function toNoteResponse(note: D1WorkSessionNote) {
  return {
    id: note.id,
    workSessionId: note.work_session_id,
    blockId: note.block_id,
    content: note.content,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  }
}

// D1のWorkSessionをcamelCaseに変換
function toWorkSessionResponse(
  session: D1WorkSession,
  options?: { user?: { id: string; name: string }; notes?: D1WorkSessionNote[] }
) {
  return {
    id: session.id,
    manualId: session.manual_id,
    userId: session.user_id,
    status: session.status,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    user: options?.user,
    notes: options?.notes?.map(toNoteResponse) || [],
  }
}

// POST /api/manuals/:id/work-sessions - 作業セッション開始
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: manualId } = await context.params

    // マニュアルを取得
    const manual = await findManualById(manualId)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, manual.business_id)

    if (!canViewManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルへのアクセス権がありません' },
        { status: 403 }
      )
    }

    // 既存の進行中セッションがあるか確認
    const existingSession = await findActiveWorkSession(manualId, session.user.id)

    if (existingSession) {
      const user = await findUserById(existingSession.user_id)
      return NextResponse.json(
        {
          error: '既に進行中の作業セッションがあります',
          workSession: toWorkSessionResponse(existingSession, {
            user: user ? { id: user.id, name: user.name } : undefined,
          }),
        },
        { status: 409 }
      )
    }

    // 新しい作業セッションを作成
    const workSession = await createWorkSession({
      manual_id: manualId,
      user_id: session.user.id,
    })

    // ユーザー情報を取得
    const user = await findUserById(workSession.user_id)

    return NextResponse.json(
      toWorkSessionResponse(workSession, {
        user: user ? { id: user.id, name: user.name } : undefined,
        notes: [],
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create work session:', error)
    return NextResponse.json(
      { error: '作業セッションの開始に失敗しました' },
      { status: 500 }
    )
  }
}

// GET /api/manuals/:id/work-sessions - マニュアルの作業セッション一覧
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: manualId } = await context.params

    // マニュアルを取得
    const manual = await findManualById(manualId)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, manual.business_id)

    if (!canViewManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルへのアクセス権がありません' },
        { status: 403 }
      )
    }

    // 管理者は全セッション、一般ユーザーは自分のセッションのみ
    const isAdmin = level === 'admin' || level === 'superadmin'

    const workSessions = await findWorkSessionsByManual(manualId)

    // 権限に応じてフィルタリング
    const filteredSessions = isAdmin
      ? workSessions
      : workSessions.filter(ws => ws.user_id === session.user.id)

    // 各セッションにユーザー情報とノートを追加
    const sessionsWithRelations = await Promise.all(
      filteredSessions.map(async (ws) => {
        const user = await findUserById(ws.user_id)
        const notes = await findWorkSessionNotesBySession(ws.id)
        return toWorkSessionResponse(ws, {
          user: user ? { id: user.id, name: user.name } : undefined,
          notes,
        })
      })
    )

    return NextResponse.json(sessionsWithRelations)
  } catch (error) {
    console.error('Failed to fetch work sessions:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
