'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, ImageOff } from 'lucide-react'

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
  containerClassName?: string
  showLoader?: boolean
}

export function LazyImage({
  src,
  alt,
  fallbackSrc,
  className,
  containerClassName,
  showLoader = true,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '100px', // 100px手前から読み込み開始
        threshold: 0.01,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        containerClassName
      )}
    >
      {/* ローディング状態 */}
      {showLoader && !isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* エラー状態 */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-xs">画像を読み込めません</span>
        </div>
      )}

      {/* 画像 */}
      {isInView && (
        <img
          src={hasError && fallbackSrc ? fallbackSrc : src}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded && !hasError ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  )
}
