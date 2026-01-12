import type {
  User,
  Business,
  BusinessAccess,
  Manual,
  Block,
  BlockMemo,
  Notification,
  FontSize,
  Role,
  ManualStatus,
  BlockType,
  MemoVisibility,
  NotificationType,
} from '@prisma/client'

// Re-export Prisma types
export type {
  User,
  Business,
  BusinessAccess,
  Manual,
  Block,
  BlockMemo,
  Notification,
  FontSize,
  Role,
  ManualStatus,
  BlockType,
  MemoVisibility,
  NotificationType,
}

// Extended types with relations
export type UserWithAccess = User & {
  businessAccess: (BusinessAccess & {
    business: Business
  })[]
}

export type BusinessWithManuals = Business & {
  manuals: Manual[]
}

export type ManualWithBlocks = Manual & {
  blocks: Block[]
  business: Business
  creator: Pick<User, 'id' | 'name'>
  updater: Pick<User, 'id' | 'name'>
  genre?: string | null
}

export type BlockWithMemos = Block & {
  memos: (BlockMemo & {
    user: Pick<User, 'id' | 'name'>
  })[]
}

// Block content types
export interface TextBlockContent {
  type: 'text'
  text: string
  format?: 'plain' | 'markdown'
}

export interface ImageBlockContent {
  type: 'image'
  url: string
  alt?: string
  caption?: string
}

export interface VideoBlockContent {
  type: 'video'
  provider: 'youtube'
  videoId: string
  title?: string
}

export interface WarningBlockContent {
  type: 'warning'
  level: 'info' | 'warning' | 'danger'
  title?: string
  text: string
}

// チェックリスト項目（画像・動画付き対応）
export interface CheckItem {
  text: string
  imageUrl?: string
  videoUrl?: string  // YouTube URL または動画ID
}

export interface CheckpointBlockContent {
  type: 'checkpoint'
  title?: string
  items: (string | CheckItem)[]  // 後方互換性のため string も許可
}

export interface PhotoRecordBlockContent {
  type: 'photo_record'
  title: string  // 撮影対象の説明（例: 「清掃後の洗面台」）
  description?: string  // 追加の説明
  required?: boolean  // 必須かどうか
  referenceImageUrl?: string  // 撮影の参考になる画像URL
}

export type BlockContent =
  | TextBlockContent
  | ImageBlockContent
  | VideoBlockContent
  | WarningBlockContent
  | CheckpointBlockContent
  | PhotoRecordBlockContent

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Auth types
export interface SessionUser {
  id: string
  email: string
  name: string
  isSuperAdmin: boolean
  fontSize: FontSize
}

// Permission check helpers
export type PermissionLevel = 'none' | 'worker' | 'admin' | 'superadmin'

export interface UserPermission {
  businessId: string
  level: PermissionLevel
}
