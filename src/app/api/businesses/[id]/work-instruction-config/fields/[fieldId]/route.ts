import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findWIMFieldById,
  updateWIMField,
  deleteWIMField,
  hardDeleteWIMField,
} from '@/lib/d1'
import type { WIMFieldType } from '@/lib/d1-types'

// レスポンス変換
function toFieldResponse(field: {
  id: string
  config_id: string
  field_key: string
  field_type: string
  label: string
  is_required: number
  is_visible: number
  sort_order: number
  options: string | null
  created_at: string
  updated_at: string
}) {
  return {
    id: field.id,
    configId: field.config_id,
    fieldKey: field.field_key,
    fieldType: field.field_type,
    label: field.label,
    isRequired: Boolean(field.is_required),
    isVisible: Boolean(field.is_visible),
    sortOrder: field.sort_order,
    options: field.options ? JSON.parse(field.options) : null,
    createdAt: field.created_at,
    updatedAt: field.updated_at,
  }
}

const VALID_FIELD_TYPES: WIMFieldType[] = ['text', 'number', 'date', 'select', 'textarea']

// GET: フィールドを取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fieldId } = await params

    const field = await findWIMFieldById(fieldId)
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    return NextResponse.json(toFieldResponse(field))
  } catch (error) {
    console.error('Failed to get WIM field:', error)
    return NextResponse.json(
      { error: 'Failed to get field' },
      { status: 500 }
    )
  }
}

// PATCH: フィールドを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { fieldId } = await params
    const body = await request.json()
    const { fieldKey, fieldType, label, isRequired, isVisible, sortOrder, options } = body

    // フィールドが存在するか確認
    const existing = await findWIMFieldById(fieldId)
    if (!existing) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    // バリデーション
    if (fieldType !== undefined && !VALID_FIELD_TYPES.includes(fieldType)) {
      return NextResponse.json({ error: 'Invalid fieldType' }, { status: 400 })
    }

    // 更新データを構築
    const updateData: {
      field_key?: string
      field_type?: WIMFieldType
      label?: string
      is_required?: boolean
      is_visible?: boolean
      sort_order?: number
      options?: string | null
    } = {}

    if (fieldKey !== undefined) updateData.field_key = fieldKey
    if (fieldType !== undefined) updateData.field_type = fieldType
    if (label !== undefined) updateData.label = label
    if (isRequired !== undefined) updateData.is_required = isRequired
    if (isVisible !== undefined) updateData.is_visible = isVisible
    if (sortOrder !== undefined) updateData.sort_order = sortOrder
    if (options !== undefined) updateData.options = options ? JSON.stringify(options) : null

    const field = await updateWIMField(fieldId, updateData)
    if (!field) {
      return NextResponse.json({ error: 'Failed to update field' }, { status: 500 })
    }

    return NextResponse.json(toFieldResponse(field))
  } catch (error) {
    console.error('Failed to update WIM field:', error)
    return NextResponse.json(
      { error: 'Failed to update field' },
      { status: 500 }
    )
  }
}

// DELETE: フィールドを削除（非表示に設定、またはクエリパラメータで完全削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { fieldId } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // フィールドが存在するか確認
    const existing = await findWIMFieldById(fieldId)
    if (!existing) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    let success: boolean
    if (hardDelete) {
      success = await hardDeleteWIMField(fieldId)
    } else {
      success = await deleteWIMField(fieldId)
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete field' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete WIM field:', error)
    return NextResponse.json(
      { error: 'Failed to delete field' },
      { status: 500 }
    )
  }
}
