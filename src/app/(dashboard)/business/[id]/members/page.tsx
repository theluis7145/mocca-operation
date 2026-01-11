'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, User, Shield, UserPlus, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Role } from '@prisma/client'

interface Member {
  id: string
  email: string
  name: string
  isSuperAdmin: boolean
  businessAccess: {
    id: string
    role: Role
  }[]
}

interface AvailableUser {
  id: string
  email: string
  name: string
  isSuperAdmin: boolean
}

export default function MembersPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const businessId = params.id as string

  const [members, setMembers] = useState<Member[]>([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [businessName, setBusinessName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>('WORKER')
  const [isSaving, setIsSaving] = useState(false)

  const isSuperAdmin = session?.user?.isSuperAdmin

  const fetchData = useCallback(async () => {
    try {
      // 事業情報を取得
      const businessRes = await fetch(`/api/businesses/${businessId}`)
      if (!businessRes.ok) throw new Error('Failed to fetch business')
      const businessData = await businessRes.json()
      setBusinessName(`${businessData.displayNameLine1} ${businessData.displayNameLine2}`)

      // メンバー一覧を取得
      const membersRes = await fetch(`/api/businesses/${businessId}/members`)
      if (!membersRes.ok) throw new Error('Failed to fetch members')
      const membersData = await membersRes.json()
      setMembers(membersData)

      // スーパー管理者のみ：追加可能なユーザー一覧を取得
      if (isSuperAdmin) {
        const usersRes = await fetch('/api/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          // すでにメンバーになっているユーザーを除外
          const memberIds = new Set(membersData.map((m: Member) => m.id))
          const available = usersData.filter(
            (u: AvailableUser) => !memberIds.has(u.id) && !u.isSuperAdmin
          )
          setAvailableUsers(available)
        }
      }
    } catch {
      toast.error('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [businessId, isSuperAdmin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('ユーザーを選択してください')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'メンバーの追加に失敗しました')
      }

      toast.success('メンバーを追加しました')
      setIsDialogOpen(false)
      setSelectedUserId('')
      setSelectedRole('WORKER')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'メンバーの追加に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMember = async (member: Member) => {
    if (!confirm(`${member.name}さんをこの事業から削除しますか？`)) return

    try {
      const accessId = member.businessAccess[0]?.id
      if (!accessId) return

      const response = await fetch(`/api/businesses/${businessId}/members/${accessId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'メンバーの削除に失敗しました')
      }

      toast.success('メンバーを削除しました')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'メンバーの削除に失敗しました')
    }
  }

  const handleRoleChange = async (member: Member, newRole: Role) => {
    try {
      const accessId = member.businessAccess[0]?.id
      if (!accessId) return

      const response = await fetch(`/api/businesses/${businessId}/members/${accessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '権限の更新に失敗しました')
      }

      toast.success('権限を更新しました')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '権限の更新に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">戻る</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">メンバー管理</h1>
              <p className="text-sm text-muted-foreground truncate">{businessName}</p>
            </div>
          </div>
          {isSuperAdmin && availableUsers.length > 0 && (
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shrink-0">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">メンバー追加</span>
              <span className="sm:hidden">追加</span>
            </Button>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.isSuperAdmin ? (
                          <Shield className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                      </div>
                    </div>
                    {!member.isSuperAdmin && isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {member.isSuperAdmin ? (
                    <Badge variant="default">スーパー管理者</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isSuperAdmin ? (
                        <Select
                          value={member.businessAccess[0]?.role || 'WORKER'}
                          onValueChange={(value) => handleRoleChange(member, value as Role)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">管理者</SelectItem>
                            <SelectItem value="WORKER">作業者</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">
                          {member.businessAccess[0]?.role === 'ADMIN' ? '管理者' : '作業者'}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {members.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">メンバーがいません</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    この事業にアクセスできるメンバーを追加しましょう
                  </p>
                  {isSuperAdmin && availableUsers.length > 0 && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      メンバーを追加
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {!isSuperAdmin && (
            <p className="text-sm text-muted-foreground text-center mt-6">
              メンバーの追加・削除はスーパー管理者のみ可能です
            </p>
          )}
        </div>
      </div>

      {/* ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを追加</DialogTitle>
            <DialogDescription>
              この事業にアクセスできるユーザーを追加します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>ユーザー *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="ユーザーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>権限</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">管理者（マニュアル編集可能）</SelectItem>
                  <SelectItem value="WORKER">作業者（閲覧のみ）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                キャンセル
              </Button>
              <Button onClick={handleAddMember} disabled={isSaving || !selectedUserId}>
                {isSaving ? '追加中...' : '追加'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
