import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getUserSearchAccess,
  getActiveBusinessIds,
  searchManualsMultipleBusinesses,
  searchBlocks,
} from '@/lib/d1'

// GET /api/search - マニュアルとブロックを検索
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const businessId = searchParams.get('businessId')
    const statusFilter = searchParams.get('status') // 'PUBLISHED' or 'DRAFT' or null (all)

    if (!query || query.length < 2) {
      return NextResponse.json({ error: '検索キーワードは2文字以上で入力してください' }, { status: 400 })
    }

    // ユーザーがアクセス可能な事業IDを取得
    const user = await getUserSearchAccess(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // アクセス可能な事業IDのリスト
    let accessibleBusinessIds: string[] = []
    let isAdmin = !!user.is_super_admin

    if (user.is_super_admin) {
      // スーパー管理者は全事業にアクセス可能
      if (businessId) {
        accessibleBusinessIds = [businessId]
      } else {
        accessibleBusinessIds = await getActiveBusinessIds()
      }
    } else {
      // 通常ユーザーはアクセス権のある事業のみ
      accessibleBusinessIds = user.business_accesses.map((a) => a.business_id)
      if (businessId && accessibleBusinessIds.includes(businessId)) {
        accessibleBusinessIds = [businessId]
        isAdmin = user.business_accesses.find((a) => a.business_id === businessId)?.role === 'ADMIN'
      }
    }

    if (accessibleBusinessIds.length === 0) {
      return NextResponse.json({ manuals: [], blocks: [] })
    }

    // ステータスフィルターの設定（WORKERは公開マニュアルのみ）
    const effectiveStatusFilter = isAdmin ? statusFilter : 'PUBLISHED'

    // マニュアルを検索（タイトルと説明）
    const manuals = await searchManualsMultipleBusinesses(
      accessibleBusinessIds,
      query,
      effectiveStatusFilter,
      10
    )

    // ブロックを検索（テキストコンテンツ）
    const allBlocks = await searchBlocks(accessibleBusinessIds, effectiveStatusFilter, 100)

    // テキスト内容でフィルタリング（全ブロックタイプを検索対象に）
    const queryLower = query.toLowerCase()
    const filteredBlocks = allBlocks.filter((block) => {
      try {
        const content = JSON.parse(block.content) as Record<string, unknown>
        switch (block.type) {
          case 'TEXT':
          case 'WARNING': {
            const text = (content.text as string) || ''
            return text.toLowerCase().includes(queryLower)
          }
          case 'CHECKPOINT': {
            const title = (content.title as string) || ''
            const items = (content.items as Array<string | { text: string }>) || []
            const itemTexts = items.map((item) =>
              typeof item === 'string' ? item : item.text || ''
            ).join(' ')
            return title.toLowerCase().includes(queryLower) ||
                   itemTexts.toLowerCase().includes(queryLower)
          }
          case 'IMAGE': {
            const alt = (content.alt as string) || ''
            const caption = (content.caption as string) || ''
            return alt.toLowerCase().includes(queryLower) ||
                   caption.toLowerCase().includes(queryLower)
          }
          case 'VIDEO': {
            const title = (content.title as string) || ''
            return title.toLowerCase().includes(queryLower)
          }
          case 'PHOTO_RECORD': {
            const title = (content.title as string) || ''
            const description = (content.description as string) || ''
            return title.toLowerCase().includes(queryLower) ||
                   description.toLowerCase().includes(queryLower)
          }
          default:
            return false
        }
      } catch {
        return false
      }
    }).slice(0, 10) // 最大10件

    // ブロックの検索結果を整形
    const formattedBlocks = filteredBlocks.map((block) => {
      let content: Record<string, unknown> = {}
      try {
        content = JSON.parse(block.content) as Record<string, unknown>
      } catch {
        content = {}
      }
      let excerpt = ''

      switch (block.type) {
        case 'TEXT':
        case 'WARNING': {
          const text = (content.text as string) || ''
          const index = text.toLowerCase().indexOf(queryLower)
          if (index >= 0) {
            const start = Math.max(0, index - 30)
            const end = Math.min(text.length, index + query.length + 30)
            excerpt = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
          } else {
            excerpt = text.slice(0, 60) + (text.length > 60 ? '...' : '')
          }
          break
        }
        case 'CHECKPOINT': {
          const title = (content.title as string) || ''
          const items = (content.items as Array<string | { text: string }>) || []
          const itemTexts = items.map((item) =>
            typeof item === 'string' ? item : item.text || ''
          ).join(', ')
          excerpt = title || itemTexts.slice(0, 60) + (itemTexts.length > 60 ? '...' : '')
          break
        }
        case 'IMAGE': {
          const alt = (content.alt as string) || ''
          const caption = (content.caption as string) || ''
          excerpt = `[画像] ${alt || caption || '(説明なし)'}`
          break
        }
        case 'VIDEO': {
          const title = (content.title as string) || ''
          excerpt = `[動画] ${title || '(タイトルなし)'}`
          break
        }
        case 'PHOTO_RECORD': {
          const title = (content.title as string) || ''
          const description = (content.description as string) || ''
          excerpt = `[写真撮影] ${title}${description ? `: ${description}` : ''}`
          break
        }
      }

      return {
        id: block.id,
        type: block.type,
        excerpt,
        manual: {
          id: block.manual_id,
          title: block.manual_title,
          business: {
            id: block.manual_business_id,
            displayNameLine1: block.business_display_name_line1,
            displayNameLine2: block.business_display_name_line2,
          },
        },
      }
    })

    return NextResponse.json({
      manuals: manuals.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        status: m.status,
        business: {
          id: m.business_id,
          displayNameLine1: m.business_display_name_line1,
          displayNameLine2: m.business_display_name_line2,
        },
        blockCount: m.block_count,
      })),
      blocks: formattedBlocks,
    })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { error: '検索に失敗しました' },
      { status: 500 }
    )
  }
}
