import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findActiveWorkInstructionMemos,
  findActiveWorkInstructionMemosByBusiness,
  createWorkInstructionMemo,
  type D1WorkInstructionMemo,
} from '@/lib/d1'

// レスポンス変換（snake_case → camelCase）
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

// GET /api/work-instruction-memos - アクティブなメモ一覧取得
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
      memos = await findActiveWorkInstructionMemosByBusiness(businessId)
    } else {
      memos = await findActiveWorkInstructionMemos()
    }

    return NextResponse.json(memos.map(toMemoResponse))
  } catch (error) {
    console.error('Failed to fetch work instruction memos:', error)
    return NextResponse.json(
      { error: '作業指示メモの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/work-instruction-memos - メモ作成（スーパー管理者のみ）
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: '作業指示メモの作成権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      businessId,
      customerName,
      stayStartDate,
      stayEndDate,
      adultCount,
      childCount,
      adultFutonCount,
      childFutonCount,
      mealPlan,
      mealPlanDetail,
      notes,
      fieldValues,
    } = body

    // バリデーション（businessIdは必須）
    if (!businessId) {
      return NextResponse.json(
        { error: '事業IDが必要です' },
        { status: 400 }
      )
    }

    // fieldValuesがある場合は動的フィールドモード
    // ない場合は従来の固定フィールドモード（後方互換性）
    const memo = await createWorkInstructionMemo({
      business_id: businessId,
      customer_name: customerName || '',
      stay_start_date: stayStartDate || '',
      stay_end_date: stayEndDate || '',
      adult_count: adultCount ?? 0,
      child_count: childCount ?? 0,
      adult_futon_count: adultFutonCount ?? 0,
      child_futon_count: childFutonCount ?? 0,
      meal_plan: mealPlan || '2食付き',
      meal_plan_detail: mealPlanDetail || null,
      notes: notes || null,
      field_values: fieldValues ? JSON.stringify(fieldValues) : null,
      created_by: session.user.id,
    })

    return NextResponse.json(toMemoResponse(memo), { status: 201 })
  } catch (error) {
    console.error('Failed to create work instruction memo:', error)
    return NextResponse.json(
      { error: '作業指示メモの作成に失敗しました' },
      { status: 500 }
    )
  }
}
