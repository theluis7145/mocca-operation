import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findWorkInstructionMemoById,
  updateWorkInstructionMemo,
  deleteWorkInstructionMemo,
  type D1WorkInstructionMemo,
} from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

// レスポンス変換
function toMemoResponse(memo: D1WorkInstructionMemo) {
  return {
    id: memo.id,
    customerName: memo.customer_name,
    stayStartDate: memo.stay_start_date,
    stayEndDate: memo.stay_end_date,
    adultCount: memo.adult_count,
    childCount: memo.child_count,
    adultFutonCount: memo.adult_futon_count,
    childFutonCount: memo.child_futon_count,
    mealPlan: memo.meal_plan,
    mealPlanDetail: memo.meal_plan_detail,
    notes: memo.notes,
    isArchived: memo.is_archived === 1,
    archivedAt: memo.archived_at,
    createdBy: memo.created_by,
    createdAt: memo.created_at,
    updatedAt: memo.updated_at,
  }
}

// GET /api/work-instruction-memos/:id - メモ詳細取得
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
    const memo = await findWorkInstructionMemoById(id)

    if (!memo) {
      return NextResponse.json(
        { error: '作業指示メモが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(toMemoResponse(memo))
  } catch (error) {
    console.error('Failed to fetch work instruction memo:', error)
    return NextResponse.json(
      { error: '作業指示メモの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH /api/work-instruction-memos/:id - メモ更新（スーパー管理者のみ）
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: '作業指示メモの更新権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()

    const memo = await updateWorkInstructionMemo(id, {
      customer_name: body.customerName,
      stay_start_date: body.stayStartDate,
      stay_end_date: body.stayEndDate,
      adult_count: body.adultCount,
      child_count: body.childCount,
      adult_futon_count: body.adultFutonCount,
      child_futon_count: body.childFutonCount,
      meal_plan: body.mealPlan,
      meal_plan_detail: body.mealPlanDetail,
      notes: body.notes,
    })

    if (!memo) {
      return NextResponse.json(
        { error: '作業指示メモが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(toMemoResponse(memo))
  } catch (error) {
    console.error('Failed to update work instruction memo:', error)
    return NextResponse.json(
      { error: '作業指示メモの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-instruction-memos/:id - メモ削除（スーパー管理者のみ）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: '作業指示メモの削除権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const deleted = await deleteWorkInstructionMemo(id)

    if (!deleted) {
      return NextResponse.json(
        { error: '作業指示メモが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete work instruction memo:', error)
    return NextResponse.json(
      { error: '作業指示メモの削除に失敗しました' },
      { status: 500 }
    )
  }
}
