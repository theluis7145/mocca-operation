import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getOrCreateWIMConfig,
  findWIMFieldsByConfig,
  createWIMField,
  reorderWIMFields,
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

// POST: 新しいフィールドを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: businessId } = await params
    const body = await request.json()
    const { fieldKey, fieldType, label, isRequired, options } = body

    // バリデーション
    if (!fieldKey || typeof fieldKey !== 'string') {
      return NextResponse.json({ error: 'fieldKey is required' }, { status: 400 })
    }
    if (!fieldType || !VALID_FIELD_TYPES.includes(fieldType)) {
      return NextResponse.json({ error: 'Invalid fieldType' }, { status: 400 })
    }
    if (!label || typeof label !== 'string') {
      return NextResponse.json({ error: 'label is required' }, { status: 400 })
    }

    // 設定を取得
    const config = await getOrCreateWIMConfig(businessId)

    // 既存フィールドの最大sort_orderを取得
    const existingFields = await findWIMFieldsByConfig(config.id)
    const maxSortOrder = existingFields.reduce((max, f) => Math.max(max, f.sort_order), -1)

    // フィールドを作成
    const field = await createWIMField({
      config_id: config.id,
      field_key: fieldKey,
      field_type: fieldType,
      label,
      is_required: isRequired ?? false,
      is_visible: true,
      sort_order: maxSortOrder + 1,
      options: options ? JSON.stringify(options) : null,
    })

    return NextResponse.json(toFieldResponse(field), { status: 201 })
  } catch (error) {
    console.error('Failed to create WIM field:', error)
    return NextResponse.json(
      { error: 'Failed to create field' },
      { status: 500 }
    )
  }
}

// PUT: フィールドの並び順を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: businessId } = await params
    const body = await request.json()
    const { fieldIds } = body

    if (!Array.isArray(fieldIds)) {
      return NextResponse.json({ error: 'fieldIds array is required' }, { status: 400 })
    }

    // 設定を取得
    const config = await getOrCreateWIMConfig(businessId)

    // 並び順を更新
    await reorderWIMFields(config.id, fieldIds)

    // 更新後のフィールド一覧を返す
    const fields = await findWIMFieldsByConfig(config.id)

    return NextResponse.json(fields.map(toFieldResponse))
  } catch (error) {
    console.error('Failed to reorder WIM fields:', error)
    return NextResponse.json(
      { error: 'Failed to reorder fields' },
      { status: 500 }
    )
  }
}
