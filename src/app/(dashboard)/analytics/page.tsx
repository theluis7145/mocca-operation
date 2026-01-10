'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { BarChart3, Clock, Users, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useBusinessStore } from '@/stores/useBusinessStore'

interface UserInfo {
  id: string
  name: string
  email: string
}

interface UserStat {
  user: UserInfo | null
  totalSessions: number
  averageDurationMinutes: number
}

interface ManualStat {
  manual: {
    id: string
    title: string
    businessId: string
  } | null
  totalSessions: number
  averageDurationMinutes: number
}

interface ManualInfo {
  id: string
  title: string
}

interface AnalyticsData {
  userStats: UserStat[]
  manualStats: ManualStat[]
  users: UserInfo[]
  manuals: ManualInfo[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { businesses } = useBusinessStore()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedManualId, setSelectedManualId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // フィルター用のユーザー・マニュアル一覧を取得
  const [filterOptions, setFilterOptions] = useState<{ users: UserInfo[]; manuals: ManualInfo[] }>({ users: [], manuals: [] })

  useEffect(() => {
    if (status === 'loading') return

    // フィルター用のオプションを取得（統計データなしで）
    const fetchFilterOptions = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedBusinessId) params.append('businessId', selectedBusinessId)
        const response = await fetch(`/api/analytics/work-sessions?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setFilterOptions({ users: data.users || [], manuals: data.manuals || [] })
        }
      } catch {
        // フィルターオプション取得失敗は無視
      }
    }

    fetchFilterOptions()
  }, [status, selectedBusinessId])

  const handleSearch = async () => {
    setIsLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (selectedBusinessId) params.append('businessId', selectedBusinessId)
      if (selectedUserId) params.append('userId', selectedUserId)
      if (selectedManualId) params.append('manualId', selectedManualId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/analytics/work-sessions?${params.toString()}`)
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('統計情報を閲覧する権限がありません')
          router.push('/')
          return
        }
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalytics(data)
      setFilterOptions({ users: data.users || [], manuals: data.manuals || [] })
    } catch {
      toast.error('統計情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const { users, manuals } = filterOptions
  const userStats = analytics?.userStats || []
  const manualStats = analytics?.manualStats || []

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* ヘッダー */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-7 w-7" />
          作業統計
        </h1>
        <p className="text-muted-foreground mt-1">
          作業セッションの統計情報を確認できます
        </p>
      </div>

      {/* フィルター */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="business" className="text-sm">事業</Label>
              <Select value={selectedBusinessId || 'all'} onValueChange={(v) => setSelectedBusinessId(v === 'all' ? '' : v)}>
                <SelectTrigger id="business">
                  <SelectValue placeholder="すべての事業" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての事業</SelectItem>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.displayNameLine1} {b.displayNameLine2}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="user" className="text-sm">ユーザー</Label>
              <Select value={selectedUserId || 'all'} onValueChange={(v) => setSelectedUserId(v === 'all' ? '' : v)}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="すべてのユーザー" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのユーザー</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manual" className="text-sm">マニュアル</Label>
              <Select value={selectedManualId || 'all'} onValueChange={(v) => setSelectedManualId(v === 'all' ? '' : v)}>
                <SelectTrigger id="manual">
                  <SelectValue placeholder="すべてのマニュアル" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのマニュアル</SelectItem>
                  {manuals.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate" className="text-sm">開始日</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm">終了日</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <Button
                className="w-full sm:w-auto"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    読み込み中...
                  </>
                ) : (
                  '表示'
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setSelectedBusinessId('')
                  setSelectedUserId('')
                  setSelectedManualId('')
                  setStartDate('')
                  setEndDate('')
                  setAnalytics(null)
                  setHasSearched(false)
                }}
              >
                リセット
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasSearched ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              フィルター条件を選択して「表示」ボタンを押してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-6 md:grid-cols-2 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* ユーザー別統計 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ユーザー別統計
              </CardTitle>
              <CardDescription>
                ユーザーごとの作業実績
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userStats.length > 0 ? (
              <div className="space-y-3">
                {userStats.slice(0, 10).map((stat) => (
                  <div key={stat.user?.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="font-medium truncate">{stat.user?.name || '不明'}</p>
                      <p className="text-xs text-muted-foreground truncate">{stat.user?.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium">{stat.totalSessions}件</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        平均 {stat.averageDurationMinutes}分
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                データがありません
              </p>
            )}
          </CardContent>
        </Card>

          {/* マニュアル別統計 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                マニュアル別統計
              </CardTitle>
            <CardDescription>
              マニュアルごとの利用状況
            </CardDescription>
          </CardHeader>
          <CardContent>
            {manualStats.length > 0 ? (
              <div className="space-y-3">
                {manualStats.slice(0, 10).map((stat) => (
                  <div key={stat.manual?.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="font-medium truncate">{stat.manual?.title || '不明'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium">{stat.totalSessions}件</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        平均 {stat.averageDurationMinutes}分
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                データがありません
              </p>
            )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}
