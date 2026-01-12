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
  genre: string | null  // ジャンル（カテゴリ）
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
  genre?: string | null
  status?: D1ManualStatus
  admin_only?: boolean
  sort_order?: number
  created_by: string
  updated_by: string
}

export interface UpdateManualInput {
  title?: string
  description?: string | null
  genre?: string | null
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

// ========================================
// 作業指示メモ (Work Instruction Memo)
// ========================================

export type D1MealPlan = '2食付き' | 'アラカルト' | 'カスタム'

export interface D1WorkInstructionMemo {
  id: string
  business_id: string | null  // 事業ID（新規追加）
  customer_name: string
  stay_start_date: string // YYYY-MM-DD
  stay_end_date: string   // YYYY-MM-DD
  adult_count: number
  child_count: number
  adult_futon_count: number
  child_futon_count: number
  meal_plan: D1MealPlan
  meal_plan_detail: string | null
  notes: string | null
  field_values: string | null  // 動的フィールド値（JSON）
  is_archived: number // SQLite boolean
  archived_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateWorkInstructionMemoInput {
  business_id: string
  customer_name?: string
  stay_start_date?: string
  stay_end_date?: string
  adult_count?: number
  child_count?: number
  adult_futon_count?: number
  child_futon_count?: number
  meal_plan?: D1MealPlan
  meal_plan_detail?: string | null
  notes?: string | null
  field_values?: string | null
  created_by: string
}

export interface UpdateWorkInstructionMemoInput {
  customer_name?: string
  stay_start_date?: string
  stay_end_date?: string
  adult_count?: number
  child_count?: number
  adult_futon_count?: number
  child_futon_count?: number
  meal_plan?: D1MealPlan
  meal_plan_detail?: string | null
  notes?: string | null
  field_values?: string | null
}

// ========================================
// 作業指示メモ設定 (Work Instruction Memo Config)
// ========================================

export type WIMFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea'

// 設定テーブル型
export interface D1WIMConfig {
  id: string
  business_id: string
  is_enabled: number  // SQLite boolean
  created_at: string
  updated_at: string
}

// フィールド定義型
export interface D1WIMField {
  id: string
  config_id: string
  field_key: string
  field_type: WIMFieldType
  label: string
  is_required: number  // SQLite boolean
  is_visible: number   // SQLite boolean
  sort_order: number
  options: string | null  // JSON
  created_at: string
  updated_at: string
}

// フィールドオプション型
export interface TextFieldOptions {
  maxLength?: number
  placeholder?: string
}

export interface NumberFieldOptions {
  min: number
  max: number
  step?: number
  unit?: string
}

export interface DateFieldOptions {
  minDate?: string
  maxDate?: string
}

export interface SelectFieldOptions {
  options: Array<{ value: string; label: string }>
  allowMultiple?: boolean
}

export interface TextareaFieldOptions {
  maxLength?: number
  rows?: number
  placeholder?: string
}

export type WIMFieldOptions =
  | TextFieldOptions
  | NumberFieldOptions
  | DateFieldOptions
  | SelectFieldOptions
  | TextareaFieldOptions

// 入力型
export interface CreateWIMFieldInput {
  config_id: string
  field_key: string
  field_type: WIMFieldType
  label: string
  is_required?: boolean
  is_visible?: boolean
  sort_order?: number
  options?: string | null
}

export interface UpdateWIMFieldInput {
  field_key?: string
  field_type?: WIMFieldType
  label?: string
  is_required?: boolean
  is_visible?: boolean
  sort_order?: number
  options?: string | null
}
