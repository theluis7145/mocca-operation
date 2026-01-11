'use client'

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'

// 日本語フォントを登録（Noto Sans JP）
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-700-normal.woff',
      fontWeight: 'bold',
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    padding: 40,
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  meta: {
    fontSize: 10,
    color: '#888',
    marginTop: 10,
  },
  stepContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 10,
  },
  stepType: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  textContent: {
    fontSize: 11,
    lineHeight: 1.8,
  },
  warningContent: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    fontSize: 11,
    color: '#856404',
    lineHeight: 1.8,
  },
  checkpointContent: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  checkpointTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  checkpointItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  checkpointBullet: {
    width: 15,
    fontSize: 11,
    color: '#4caf50',
  },
  checkpointText: {
    flex: 1,
    fontSize: 11,
    color: '#2e7d32',
  },
  imageBlock: {
    marginBottom: 8,
  },
  image: {
    maxWidth: '100%',
    maxHeight: 400,
    objectFit: 'contain',
  },
  imageCaption: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 11,
    color: '#666',
  },
  videoBlock: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  videoPlaceholder: {
    fontSize: 11,
    color: '#1976d2',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#999',
  },
})

interface BlockContent {
  text?: string
  title?: string
  items?: Array<string | { text: string }>
  alt?: string
  url?: string
}

interface Block {
  type: string
  content: BlockContent
  sortOrder: number
}

interface ManualPdfDocumentProps {
  title: string
  description: string | null
  businessName: string
  blocks: Block[]
  version: number
  updatedAt: string
}

const getBlockTypeName = (type: string): string => {
  switch (type) {
    case 'TEXT': return 'テキスト'
    case 'IMAGE': return '画像'
    case 'VIDEO': return '動画'
    case 'WARNING': return '注意事項'
    case 'CHECKPOINT': return 'チェックポイント'
    default: return type
  }
}

const BlockRenderer = ({ block, index }: { block: Block; index: number }) => {
  const content = block.content

  return (
    <View style={styles.stepContainer} wrap={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>ステップ {index + 1}</Text>
        <Text style={styles.stepType}>{getBlockTypeName(block.type)}</Text>
      </View>

      {block.type === 'TEXT' && (
        <Text style={styles.textContent}>{content.text || ''}</Text>
      )}

      {block.type === 'WARNING' && (
        <View style={styles.warningContent}>
          <Text style={styles.warningText}>{content.text || ''}</Text>
        </View>
      )}

      {block.type === 'CHECKPOINT' && (
        <View style={styles.checkpointContent}>
          {content.title && (
            <Text style={styles.checkpointTitle}>{content.title}</Text>
          )}
          {(content.items || []).map((item, i) => (
            <View key={i} style={styles.checkpointItem}>
              <Text style={styles.checkpointBullet}>•</Text>
              <Text style={styles.checkpointText}>
                {typeof item === 'string' ? item : item.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {block.type === 'IMAGE' && (
        <View style={styles.imageBlock}>
          {content.url ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image doesn't support alt prop */}
              <Image src={content.url} style={styles.image} />
              {content.alt && (
                <Text style={styles.imageCaption}>{content.alt}</Text>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                [画像: {content.alt || '説明なし'}]
              </Text>
            </View>
          )}
        </View>
      )}

      {block.type === 'VIDEO' && (
        <View style={styles.videoBlock}>
          <Text style={styles.videoPlaceholder}>
            [動画: {content.title || 'タイトルなし'}]
          </Text>
        </View>
      )}
    </View>
  )
}

export function ManualPdfDocument({
  title,
  description,
  businessName,
  blocks,
  version,
  updatedAt,
}: ManualPdfDocumentProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder)
  const formattedDate = new Date(updatedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          <Text style={styles.meta}>
            {businessName} | バージョン {version} | 最終更新: {formattedDate}
          </Text>
        </View>

        {sortedBlocks.map((block, index) => (
          <BlockRenderer key={index} block={block} index={index} />
        ))}

        <View style={styles.footer} fixed>
          <Text>{title}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
