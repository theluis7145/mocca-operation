'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, User, Shield, Building2, KeyRound, Pencil, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Business, Role } from '@prisma/client'

interface UserWithAccess {
  id: string
  email: string
  name: string
  isSuperAdmin: boolean
  isActive: boolean
  createdAt: string
  businessAccess: {
    id: string
    role: Role
    business: {
      id: string
      name: string
      displayNameLine1: string
      displayNameLine2: string
    }
  }[]
}

type FilterType = 'all' | 'active' | 'inactive'

interface BusinessAccessInput {
  businessId: string
  role: Role
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserWithAccess[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isEditPermissionsDialogOpen, setIsEditPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithAccess | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [editingBusinessAccess, setEditingBusinessAccess] = useState<BusinessAccessInput[]>([])
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)

  // フォーム状態
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [businessAccess, setBusinessAccess] = useState<BusinessAccessInput[]>([])

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.isSuperAdmin) {
      router.push('/')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [usersRes, businessesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/businesses'),
      ])

      if (!usersRes.ok || !businessesRes.ok) {
        throw new Error('Failed to fetch')
      }

      const [usersData, businessesData] = await Promise.all([
        usersRes.json(),
        businessesRes.json(),
      ])

      setUsers(usersData)
      setBusinesses(businessesData)
    } catch {
      toast.error('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setIsSuperAdmin(false)
    setBusinessAccess([])
  }

  const handleAddBusinessAccess = () => {
    if (businesses.length === 0) return

    const availableBusinesses = businesses.filter(
      (b) => !businessAccess.some((a) => a.businessId === b.id)
    )

    if (availableBusinesses.length === 0) {
      toast.error('全ての事業にアクセス権を付与済みです')
      return
    }

    setBusinessAccess([
      ...businessAccess,
      { businessId: availableBusinesses[0].id, role: 'WORKER' },
    ])
  }

  const handleRemoveBusinessAccess = (index: number) => {
    setBusinessAccess(businessAccess.filter((_, i) => i !== index))
  }

  const handleUpdateBusinessAccess = (
    index: number,
    field: 'businessId' | 'role',
    value: string
  ) => {
    const updated = [...businessAccess]
    if (field === 'role') {
      updated[index].role = value as Role
    } else {
      updated[index].businessId = value
    }
    setBusinessAccess(updated)
  }

  const handleSubmit = async () => {
    if (!email || !password || !name) {
      toast.error('必須項目を入力してください')
      return
    }

    if (!isSuperAdmin && businessAccess.length === 0) {
      toast.error('少なくとも1つの事業へのアクセス権が必要です')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          isSuperAdmin,
          businessAccess: isSuperAdmin ? [] : businessAccess,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user')
      }

      toast.success('ユーザーを作成しました')
      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '作成に失敗しました')
    }
  }

  const handleOpenResetPassword = (user: UserWithAccess) => {
    setSelectedUser(user)
    setNewPassword('')
    setIsResetPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('新しいパスワードを入力してください')
      return
    }

    if (newPassword.length < 6) {
      toast.error('パスワードは6文字以上で入力してください')
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'パスワードリセットに失敗しました')
      }

      toast.success(`${selectedUser.name}さんのパスワードをリセットしました`)
      setIsResetPasswordDialogOpen(false)
      setSelectedUser(null)
      setNewPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'パスワードリセットに失敗しました')
    } finally {
      setIsResetting(false)
    }
  }

  const handleOpenEditPermissions = (user: UserWithAccess) => {
    setSelectedUser(user)
    // 既存のアクセス権を編集用の形式に変換
    setEditingBusinessAccess(
      user.businessAccess.map((access) => ({
        businessId: access.business.id,
        role: access.role,
      }))
    )
    setIsEditPermissionsDialogOpen(true)
  }

  const handleAddEditBusinessAccess = () => {
    if (businesses.length === 0) return

    const availableBusinesses = businesses.filter(
      (b) => !editingBusinessAccess.some((a) => a.businessId === b.id)
    )

    if (availableBusinesses.length === 0) {
      toast.error('全ての事業にアクセス権を付与済みです')
      return
    }

    setEditingBusinessAccess([
      ...editingBusinessAccess,
      { businessId: availableBusinesses[0].id, role: 'WORKER' },
    ])
  }

  const handleRemoveEditBusinessAccess = (index: number) => {
    setEditingBusinessAccess(editingBusinessAccess.filter((_, i) => i !== index))
  }

  const handleUpdateEditBusinessAccess = (
    index: number,
    field: 'businessId' | 'role',
    value: string
  ) => {
    const updated = [...editingBusinessAccess]
    if (field === 'role') {
      updated[index].role = value as Role
    } else {
      updated[index].businessId = value
    }
    setEditingBusinessAccess(updated)
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    setIsSavingPermissions(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessAccess: editingBusinessAccess }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '権限の更新に失敗しました')
      }

      toast.success(`${selectedUser.name}さんの権限を更新しました`)
      setIsEditPermissionsDialogOpen(false)
      setSelectedUser(null)
      setEditingBusinessAccess([])
      fetchData() // ユーザー一覧を再取得
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '権限の更新に失敗しました')
    } finally {
      setIsSavingPermissions(false)
    }
  }

  const handleToggleActive = async (user: UserWithAccess) => {
    const newIsActive = !user.isActive
    const action = newIsActive ? 'アクティブ' : '非アクティブ'

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newIsActive }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `${action}への変更に失敗しました`)
      }

      toast.success(`${user.name}さんを${action}にしました`)
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${action}への変更に失敗しました`)
    }
  }

  // フィルター適用
  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true
    if (filter === 'active') return user.isActive
    if (filter === 'inactive') return !user.isActive
    return true
  })

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
          <p className="text-muted-foreground text-sm">ユーザーの追加・権限設定</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのユーザー</SelectItem>
              <SelectItem value="active">アクティブのみ</SelectItem>
              <SelectItem value="inactive">非アクティブのみ</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              新規ユーザー
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規ユーザー</DialogTitle>
              <DialogDescription>
                ユーザー情報と権限を設定してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>メールアドレス *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label>パスワード *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8文字以上"
                />
              </div>
              <div>
                <Label>ユーザー名 *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="山田太郎"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSuperAdmin"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isSuperAdmin" className="cursor-pointer">
                  スーパー管理者権限を付与
                </Label>
              </div>

              {!isSuperAdmin && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>事業別権限</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddBusinessAccess}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>

                  {businessAccess.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      事業へのアクセス権を追加してください
                    </p>
                  )}

                  {businessAccess.map((access, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">アクセス権 {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveBusinessAccess(index)}
                        >
                          ×
                        </Button>
                      </div>
                      <Select
                        value={access.businessId}
                        onValueChange={(value) =>
                          handleUpdateBusinessAccess(index, 'businessId', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="事業を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {businesses.map((business) => (
                            <SelectItem key={business.id} value={business.id}>
                              {business.displayNameLine1} {business.displayNameLine2}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={access.role}
                        onValueChange={(value) =>
                          handleUpdateBusinessAccess(index, 'role', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">管理者</SelectItem>
                          <SelectItem value="WORKER">作業者</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSubmit}>作成</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* パスワードリセットダイアログ */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>パスワードをリセット</DialogTitle>
              <DialogDescription>
                {selectedUser?.name}さん（{selectedUser?.email}）の新しいパスワードを設定します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>新しいパスワード *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6文字以上"
                  disabled={isResetting}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsResetPasswordDialogOpen(false)}
                  disabled={isResetting}
                >
                  キャンセル
                </Button>
                <Button onClick={handleResetPassword} disabled={isResetting}>
                  {isResetting ? 'リセット中...' : 'リセット'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 権限編集ダイアログ */}
        <Dialog open={isEditPermissionsDialogOpen} onOpenChange={setIsEditPermissionsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>事業権限を編集</DialogTitle>
              <DialogDescription>
                {selectedUser?.name}さん（{selectedUser?.email}）の事業別権限を設定します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>事業別権限</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEditBusinessAccess}
                    disabled={isSavingPermissions}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    追加
                  </Button>
                </div>

                {editingBusinessAccess.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                    事業へのアクセス権がありません
                  </p>
                )}

                {editingBusinessAccess.map((access, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select
                      value={access.businessId}
                      onValueChange={(value) =>
                        handleUpdateEditBusinessAccess(index, 'businessId', value)
                      }
                      disabled={isSavingPermissions}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="事業を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.displayNameLine1} {business.displayNameLine2}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={access.role}
                      onValueChange={(value) =>
                        handleUpdateEditBusinessAccess(index, 'role', value)
                      }
                      disabled={isSavingPermissions}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">管理者</SelectItem>
                        <SelectItem value="WORKER">作業者</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEditBusinessAccess(index)}
                      disabled={isSavingPermissions}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditPermissionsDialogOpen(false)}
                  disabled={isSavingPermissions}
                >
                  キャンセル
                </Button>
                <Button onClick={handleSavePermissions} disabled={isSavingPermissions}>
                  {isSavingPermissions ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                    {user.isSuperAdmin ? (
                      <Shield className={`h-5 w-5 ${user.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    ) : (
                      <User className={`h-5 w-5 ${user.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {user.name}
                      {!user.isActive && (
                        <Badge variant="secondary" className="text-xs">非アクティブ</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!user.isSuperAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(user)}
                        title={user.isActive ? '非アクティブにする' : 'アクティブにする'}
                      >
                        {user.isActive ? (
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditPermissions(user)}
                        title="権限を編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenResetPassword(user)}
                    title="パスワードをリセット"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.isSuperAdmin ? (
                  <Badge variant="default">スーパー管理者</Badge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.businessAccess.map((access) => (
                      <Badge key={access.id} variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {access.business.displayNameLine2}
                        {access.role === 'ADMIN' ? '(管理者)' : '(作業者)'}
                      </Badge>
                    ))}
                    {user.businessAccess.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        権限なし
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'all' && 'ユーザーがまだ登録されていません'}
              {filter === 'active' && 'アクティブなユーザーがいません'}
              {filter === 'inactive' && '非アクティブなユーザーがいません'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
