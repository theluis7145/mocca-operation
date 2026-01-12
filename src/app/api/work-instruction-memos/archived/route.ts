import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findArchivedWorkInstructionMemos,
  findArchivedWorkInstructionMemosByBusiness,
  type D1WorkInstructionMemo,
} from '@/lib/d1'

// レスポンス変換
function toMemoResponse(memo: D1WorkInstructionMemo) {
  return {
    id: memo.id,
    businessId: memo.business_id,
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
    fieldValues: memo.field_values ? JSON.parse(memo.field_values) : null,
    isArchived: memo.is_archived === 1,
    archivedAt: memo.archived_at,
    createdBy: memo.created_by,
    createdAt: memo.created_at,
    updatedAt: memo.updated_at,
  }
}

// GET /api/work-instruction-memos/archived - アーカイブ済みメモ一覧取得
// クエリパラメータ: businessId（指定時は事業でフィルタ）
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    let memos: D1WorkInstructionMemo[]
    if (businessId) {
      memos = await findArchivedWorkInstructionMemosByBusiness(businessId)
    } else {
      memos = await findArchivedWorkInstructionMemos()
    }

    return NextResponse.json(memos.map(toMemoResponse))
  } catch (error) {
    console.error('Failed to fetch archived work instruction memos:', error)
    return NextResponse.json(
      { error: 'アーカイブ済み作業指示メモの取得に失敗しました' },
      { status: 500 }
    )
  }
}
