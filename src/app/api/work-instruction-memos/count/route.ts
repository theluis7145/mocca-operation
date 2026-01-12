import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  countActiveWorkInstructionMemos,
  countActiveWorkInstructionMemosByBusiness,
} from '@/lib/d1'

// GET /api/work-instruction-memos/count - アクティブなメモ件数取得
// クエリパラメータ: businessId（指定時は事業でフィルタ）
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    let count: number
    if (businessId) {
      count = await countActiveWorkInstructionMemosByBusiness(businessId)
    } else {
      count = await countActiveWorkInstructionMemos()
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Failed to count work instruction memos:', error)
    return NextResponse.json(
      { error: '作業指示メモ件数の取得に失敗しました' },
      { status: 500 }
    )
  }
}
