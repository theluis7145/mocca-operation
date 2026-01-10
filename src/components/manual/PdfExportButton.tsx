'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { ManualPdfDocument } from './ManualPdfDocument'

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

interface PdfExportButtonProps {
  title: string
  description: string | null
  businessName: string
  blocks: Block[]
  version: number
  updatedAt: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function PdfExportButton({
  title,
  description,
  businessName,
  blocks,
  version,
  updatedAt,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  className,
}: PdfExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    if (blocks.length === 0) {
      toast.error('出力するステップがありません')
      return
    }

    setIsGenerating(true)
    try {
      const doc = (
        <ManualPdfDocument
          title={title}
          description={description}
          businessName={businessName}
          blocks={blocks}
          version={version}
          updatedAt={updatedAt}
        />
      )

      const blob = await pdf(doc).toBlob()

      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDFをダウンロードしました')
    } catch (error) {
      console.error('PDF generation failed:', error)
      toast.error('PDF生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && <span className="ml-2">生成中...</span>}
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          {showLabel && <span className="ml-2">PDF</span>}
        </>
      )}
    </Button>
  )
}
