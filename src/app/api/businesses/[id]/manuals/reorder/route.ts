import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findBusinessAccessByUserAndBusiness, reorderManuals } from '@/lib/d1'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: businessId } = await params
    const { manualIds } = await request.json()

    if (!Array.isArray(manualIds) || manualIds.length === 0) {
      return NextResponse.json(
        { error: 'manualIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // 管理者権限を確認
    const access = await findBusinessAccessByUserAndBusiness(session.user.id, businessId)

    if ((!access || access.role !== 'ADMIN') && !session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // 順序を更新
    await reorderManuals(businessId, manualIds)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder manuals:', error)
    return NextResponse.json(
      { error: 'Failed to reorder manuals' },
      { status: 500 }
    )
  }
}
