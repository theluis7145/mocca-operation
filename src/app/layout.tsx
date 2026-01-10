import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { FontSizeProvider } from '@/components/providers/FontSizeProvider'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'Mocca Operation Manual System',
  description: '株式会社Mocca Groupのオペレーションマニュアル管理システム',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mocca Operation',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased font-medium`}>
        <SessionProvider>
          <FontSizeProvider>
            {children}
          </FontSizeProvider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
