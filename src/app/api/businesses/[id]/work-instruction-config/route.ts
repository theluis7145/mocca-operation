import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getOrCreateWIMConfig,
  findWIMFieldsByConfig,
  updateWIMConfigEnabled,
} from '@/lib/d1'

// レスポンス変換
function toConfigResponse(config: { id: string; business_id: string; is_enabled: number; created_at: string; updated_at: string }) {
  return {
    id: config.id,
    businessId: config.business_id,
    isEnabled: Boolean(config.is_enabled),
    createdAt: config.created_at,
    updatedAt: config.updated_at,
  }
}

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

// GET: 事業のWIM設定とフィールド一覧を取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: businessId } = await params

    // 設定を取得（なければ作成）
    const config = await getOrCreateWIMConfig(businessId)

    // フィールド一覧を取得
    const fields = await findWIMFieldsByConfig(config.id)

    return NextResponse.json({
      ...toConfigResponse(config),
      fields: fields.map(toFieldResponse),
    })
  } catch (error) {
    console.error('Failed to get WIM config:', error)
    return NextResponse.json(
      { error: 'Failed to get work instruction memo config' },
      { status: 500 }
    )
  }
}

// PUT: WIM設定の有効/無効を更新
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
    const { isEnabled } = body

    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'isEnabled is required' }, { status: 400 })
    }

    // 設定を取得（なければ作成）
    const config = await getOrCreateWIMConfig(businessId)

    // 有効/無効を更新
    const updated = await updateWIMConfigEnabled(config.id, isEnabled)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
    }

    // フィールド一覧を取得
    const fields = await findWIMFieldsByConfig(updated.id)

    return NextResponse.json({
      ...toConfigResponse(updated),
      fields: fields.map(toFieldResponse),
    })
  } catch (error) {
    console.error('Failed to update WIM config:', error)
    return NextResponse.json(
      { error: 'Failed to update work instruction memo config' },
      { status: 500 }
    )
  }
}
