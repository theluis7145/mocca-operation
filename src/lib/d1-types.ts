// D1 Database Type Definitions
// D1/SQLiteはスネークケースのカラム名を使用

// ========================================
// Enums (SQLiteでは文字列として保存)
// ========================================
export type D1FontSize = 'SMALL' | 'MEDIUM' | 'LARGE'
export type D1Role = 'ADMIN' | 'WORKER'
export type D1ManualStatus = 'DRAFT' | 'PUBLISHED'
export type D1BlockType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'WARNING' | 'CHECKPOINT' | 'PHOTO_RECORD'
export type D1MemoVisibility = 'PRIVATE' | 'PUBLIC'
export type D1NotificationType = 'NEW_PUBLIC_MEMO' | 'WORK_SESSION_COMPLETED'
export type D1WorkSessionStatus = 'IN_PROGRESS' | 'COMPLETED'

// ========================================
// Base Models (D1カラム名)
// ========================================

export interface D1User {
  id: string
  email: string
  password_hash: string
  name: string
  is_super_admin: number // SQLite boolean
  is_active: number // SQLite boolean
  avatar_url: string | null
  font_size: D1FontSize
  created_at: string
  updated_at: string
}

export interface D1Business {
  id: string
  name: string
  display_name_line1: string
  display_name_line2: string
  description: string | null
  icon: string | null
  color: string | null
  theme_colors: string | null // JSON文字列
  sort_order: number
  is_active: number // SQLite boolean
  created_at: string
  updated_at: string
}

export interface D1BusinessAccess {
  id: string
  user_id: string
  business_id: string
  role: D1Role
  created_at: string
  updated_at: string
}

export interface D1Manual {
  id: string
  business_id: string
  title: string
  description: string | null
  status: D1ManualStatus
  admin_only: number // SQLite boolean
  sort_order: number
  is_archived: number // SQLite boolean
  archived_at: string | null
  version: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface D1ManualVersion {
  id: string
  manual_id: string
  version: number
  title: string
  description: string | null
  blocks: string // JSON文字列
  created_by: string
  created_at: string
  comment: string | null
}

export interface D1Block {
  id: string
  manual_id: string
  type: D1BlockType
  content: string // JSON文字列
  sort_order: number
  created_at: string
  updated_at: string
}

export interface D1BlockMemo {
  id: string
  block_id: string
  user_id: string
  content: string
  visibility: D1MemoVisibility
  created_at: string
  updated_at: string
}

export interface D1Notification {
  id: string
  user_id: string
  type: D1NotificationType
  title: string
  message: string
  link_url: string | null
  related_memo_id: string | null
  related_work_session_id: string | null
  is_read: number // SQLite boolean
  created_at: string
}

export interface D1WorkSession {
  id: string
  manual_id: string
  user_id: string
  status: D1WorkSessionStatus
  started_at: string
  completed_at: string | null
}

export interface D1WorkSessionNote {
  id: string
  work_session_id: string
  block_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface D1WorkSessionNotePhoto {
  id: string
  note_id: string
  image_data: string // Base64
  created_at: string
}

export interface D1PhotoRecord {
  id: string
  work_session_id: string
  block_id: string
  image_data: string // Base64
  created_at: string
}

// ========================================
// Extended Types (JOINした結果用)
// ========================================

export interface D1UserWithAccess extends D1User {
  business_access?: (D1BusinessAccess & { business?: D1Business })[]
}

export interface D1BusinessAccessWithBusiness extends D1BusinessAccess {
  business: D1Business
}

export interface D1BusinessAccessWithUser extends D1BusinessAccess {
  user: D1User
}

export interface D1ManualWithRelations extends D1Manual {
  business?: D1Business
  creator?: Pick<D1User, 'id' | 'name'>
  updater?: Pick<D1User, 'id' | 'name'>
  blocks?: D1Block[]
}

export interface D1BlockWithMemos extends D1Block {
  memos?: (D1BlockMemo & { user?: Pick<D1User, 'id' | 'name'> })[]
}

export interface D1WorkSessionWithRelations extends D1WorkSession {
  manual?: D1Manual
  user?: D1User
  notes?: D1WorkSessionNote[]
  photo_records?: D1PhotoRecord[]
}

// ========================================
// Input Types (作成/更新用)
// ========================================

export interface CreateUserInput {
  email: string
  password_hash: string
  name: string
  is_super_admin?: boolean
  is_active?: boolean
  avatar_url?: string | null
  font_size?: D1FontSize
}

export interface UpdateUserInput {
  email?: string
  password_hash?: string
  name?: string
  is_super_admin?: boolean
  is_active?: boolean
  avatar_url?: string | null
  font_size?: D1FontSize
}

export interface CreateBusinessInput {
  name: string
  display_name_line1: string
  display_name_line2: string
  description?: string | null
  icon?: string | null
  color?: string | null
  theme_colors?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface UpdateBusinessInput {
  name?: string
  display_name_line1?: string
  display_name_line2?: string
  description?: string | null
  icon?: string | null
  color?: string | null
  theme_colors?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface CreateBusinessAccessInput {
  user_id: string
  business_id: string
  role: D1Role
}

export interface CreateManualInput {
  business_id: string
  title: string
  description?: string | null
  status?: D1ManualStatus
  admin_only?: boolean
  sort_order?: number
  created_by: string
  updated_by: string
}

export interface UpdateManualInput {
  title?: string
  description?: string | null
  status?: D1ManualStatus
  admin_only?: boolean
  sort_order?: number
  is_archived?: boolean
  archived_at?: string | null
  version?: number
  updated_by?: string
}

export interface CreateBlockInput {
  manual_id: string
  type: D1BlockType
  content: string // JSON文字列
  sort_order?: number
}

export interface UpdateBlockInput {
  type?: D1BlockType
  content?: string
  sort_order?: number
}

export interface CreateBlockMemoInput {
  block_id: string
  user_id: string
  content: string
  visibility?: D1MemoVisibility
}

export interface CreateNotificationInput {
  user_id: string
  type: D1NotificationType
  title: string
  message: string
  link_url?: string | null
  related_memo_id?: string | null
  related_work_session_id?: string | null
}

export interface CreateWorkSessionInput {
  manual_id: string
  user_id: string
}

export interface CreateWorkSessionNoteInput {
  work_session_id: string
  block_id: string
  content: string
}

export interface CreatePhotoRecordInput {
  work_session_id: string
  block_id: string
  image_data: string
}

export interface CreateManualVersionInput {
  manual_id: string
  version: number
  title: string
  description?: string | null
  blocks: string // JSON文字列
  created_by: string
  comment?: string | null
}
