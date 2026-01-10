'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Lock, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()

  // プロフィール編集
  const [name, setName] = useState(session?.user?.name || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // パスワード変更
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('名前を入力してください')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'プロフィールの更新に失敗しました')
      }

      // セッションを更新
      await updateSession({ name: name.trim() })
      toast.success('プロフィールを更新しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('すべての項目を入力してください')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません')
      return
    }

    if (newPassword.length < 8) {
      toast.error('パスワードは8文字以上で入力してください')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'パスワードの変更に失敗しました')
      }

      toast.success('パスワードを変更しました')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'パスワードの変更に失敗しました')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">戻る</span>
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">設定</h1>
          <p className="text-muted-foreground mt-1">アカウント設定を管理します</p>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
          {/* プロフィール編集 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                プロフィール
              </CardTitle>
              <CardDescription>
                表示名を変更できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    メールアドレスは変更できません
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="名前を入力"
                  />
                </div>
                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* パスワード変更 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                パスワード変更
              </CardTitle>
              <CardDescription>
                ログインパスワードを変更できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">現在のパスワード</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="現在のパスワード"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新しいパスワード</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新しいパスワード（8文字以上）"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="新しいパスワード（確認）"
                  />
                </div>
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      変更中...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      パスワードを変更
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
