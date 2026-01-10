import { getCloudflareContext } from '@opennextjs/cloudflare'
import type {
  D1User,
  D1Business,
  D1BusinessAccess,
  D1Manual,
  D1ManualVersion,
  D1Block,
  D1BlockMemo,
  D1Notification,
  D1WorkSession,
  D1WorkSessionNote,
  D1WorkSessionNotePhoto,
  D1PhotoRecord,
  D1BusinessAccessWithBusiness,
  D1BusinessAccessWithUser,
  D1ManualWithRelations,
  D1WorkSessionWithRelations,
  CreateUserInput,
  UpdateUserInput,
  CreateBusinessInput,
  UpdateBusinessInput,
  CreateBusinessAccessInput,
  CreateManualInput,
  UpdateManualInput,
  CreateBlockInput,
  UpdateBlockInput,
  CreateBlockMemoInput,
  CreateNotificationInput,
  CreateWorkSessionInput,
  CreateWorkSessionNoteInput,
  CreatePhotoRecordInput,
  CreateManualVersionInput,
  D1Role,
} from './d1-types'

// Re-export types
export * from './d1-types'

// ========================================
// Database Connection
// ========================================

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<D1Result>
  all<T = unknown>(): Promise<D1Result<T>>
}

interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta?: {
    duration: number
    changes: number
    last_row_id: number
  }
}

interface D1ExecResult {
  count: number
  duration: number
}

// D1データベースインスタンスを取得
export async function getD1Database(): Promise<D1Database> {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (env as any).DB as D1Database
  if (!db) {
    throw new Error('D1 database binding not found')
  }
  return db
}

// CUID生成（簡易版）
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// 現在時刻のISO文字列
function now(): string {
  return new Date().toISOString()
}

// ========================================
// User CRUD
// ========================================

export async function findUserByEmail(email: string): Promise<D1User | null> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<D1User>()
  return result
}

export async function findUserById(id: string): Promise<D1User | null> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<D1User>()
  return result
}

export async function findAllUsers(): Promise<D1User[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM users ORDER BY created_at DESC')
    .all<D1User>()
  return result.results || []
}

export async function createUser(input: CreateUserInput): Promise<D1User> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO users (id, email, password_hash, name, is_super_admin, is_active, avatar_url, font_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.email,
      input.password_hash,
      input.name,
      input.is_super_admin ? 1 : 0,
      input.is_active !== false ? 1 : 0,
      input.avatar_url || null,
      input.font_size || 'MEDIUM',
      timestamp,
      timestamp
    )
    .run()

  return (await findUserById(id))!
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<D1User | null> {
  const db = await getD1Database()
  const existing = await findUserById(id)
  if (!existing) return null

  const updates: string[] = []
  const values: unknown[] = []

  if (input.email !== undefined) {
    updates.push('email = ?')
    values.push(input.email)
  }
  if (input.password_hash !== undefined) {
    updates.push('password_hash = ?')
    values.push(input.password_hash)
  }
  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }
  if (input.is_super_admin !== undefined) {
    updates.push('is_super_admin = ?')
    values.push(input.is_super_admin ? 1 : 0)
  }
  if (input.is_active !== undefined) {
    updates.push('is_active = ?')
    values.push(input.is_active ? 1 : 0)
  }
  if (input.avatar_url !== undefined) {
    updates.push('avatar_url = ?')
    values.push(input.avatar_url)
  }
  if (input.font_size !== undefined) {
    updates.push('font_size = ?')
    values.push(input.font_size)
  }

  if (updates.length === 0) return existing

  updates.push('updated_at = ?')
  values.push(now())
  values.push(id)

  await db
    .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return findUserById(id)
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// Business CRUD
// ========================================

export async function findBusinessById(id: string): Promise<D1Business | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM businesses WHERE id = ?')
    .bind(id)
    .first<D1Business>()
}

export async function findAllBusinesses(): Promise<D1Business[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM businesses WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC')
    .all<D1Business>()
  return result.results || []
}

export async function createBusiness(input: CreateBusinessInput): Promise<D1Business> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO businesses (id, name, display_name_line1, display_name_line2, description, icon, color, theme_colors, sort_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.name,
      input.display_name_line1,
      input.display_name_line2,
      input.description || null,
      input.icon || null,
      input.color || null,
      input.theme_colors || null,
      input.sort_order ?? 0,
      input.is_active !== false ? 1 : 0,
      timestamp,
      timestamp
    )
    .run()

  return (await findBusinessById(id))!
}

export async function updateBusiness(id: string, input: UpdateBusinessInput): Promise<D1Business | null> {
  const db = await getD1Database()
  const existing = await findBusinessById(id)
  if (!existing) return null

  const updates: string[] = []
  const values: unknown[] = []

  if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name) }
  if (input.display_name_line1 !== undefined) { updates.push('display_name_line1 = ?'); values.push(input.display_name_line1) }
  if (input.display_name_line2 !== undefined) { updates.push('display_name_line2 = ?'); values.push(input.display_name_line2) }
  if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description) }
  if (input.icon !== undefined) { updates.push('icon = ?'); values.push(input.icon) }
  if (input.color !== undefined) { updates.push('color = ?'); values.push(input.color) }
  if (input.theme_colors !== undefined) { updates.push('theme_colors = ?'); values.push(input.theme_colors) }
  if (input.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(input.sort_order) }
  if (input.is_active !== undefined) { updates.push('is_active = ?'); values.push(input.is_active ? 1 : 0) }

  if (updates.length === 0) return existing

  updates.push('updated_at = ?')
  values.push(now())
  values.push(id)

  await db
    .prepare(`UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return findBusinessById(id)
}

export async function deleteBusiness(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM businesses WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// BusinessAccess CRUD
// ========================================

export async function findBusinessAccessById(id: string): Promise<D1BusinessAccess | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM business_access WHERE id = ?')
    .bind(id)
    .first<D1BusinessAccess>()
}

export async function findBusinessAccessByUserAndBusiness(userId: string, businessId: string): Promise<D1BusinessAccess | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM business_access WHERE user_id = ? AND business_id = ?')
    .bind(userId, businessId)
    .first<D1BusinessAccess>()
}

export async function findBusinessAccessesByUser(userId: string): Promise<D1BusinessAccessWithBusiness[]> {
  const db = await getD1Database()
  const result = await db
    .prepare(`
      SELECT ba.*, b.id as b_id, b.name as b_name, b.display_name_line1, b.display_name_line2,
             b.description as b_description, b.icon, b.color, b.theme_colors, b.sort_order as b_sort_order,
             b.is_active as b_is_active, b.created_at as b_created_at, b.updated_at as b_updated_at
      FROM business_access ba
      JOIN businesses b ON ba.business_id = b.id
      WHERE ba.user_id = ? AND b.is_active = 1
      ORDER BY b.sort_order ASC
    `)
    .bind(userId)
    .all<D1BusinessAccess & {
      b_id: string; b_name: string; display_name_line1: string; display_name_line2: string;
      b_description: string | null; icon: string | null; color: string | null; theme_colors: string | null;
      b_sort_order: number; b_is_active: number; b_created_at: string; b_updated_at: string
    }>()

  return (result.results || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    business_id: row.business_id,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    business: {
      id: row.b_id,
      name: row.b_name,
      display_name_line1: row.display_name_line1,
      display_name_line2: row.display_name_line2,
      description: row.b_description,
      icon: row.icon,
      color: row.color,
      theme_colors: row.theme_colors,
      sort_order: row.b_sort_order,
      is_active: row.b_is_active,
      created_at: row.b_created_at,
      updated_at: row.b_updated_at,
    }
  }))
}

export async function findBusinessAccessesByBusiness(businessId: string): Promise<D1BusinessAccessWithUser[]> {
  const db = await getD1Database()
  const result = await db
    .prepare(`
      SELECT ba.*, u.id as u_id, u.email, u.name as u_name, u.is_super_admin, u.is_active as u_is_active,
             u.avatar_url, u.font_size, u.created_at as u_created_at, u.updated_at as u_updated_at
      FROM business_access ba
      JOIN users u ON ba.user_id = u.id
      WHERE ba.business_id = ? AND u.is_active = 1
      ORDER BY u.name ASC
    `)
    .bind(businessId)
    .all<D1BusinessAccess & {
      u_id: string; email: string; u_name: string; is_super_admin: number; u_is_active: number;
      avatar_url: string | null; font_size: string; u_created_at: string; u_updated_at: string
    }>()

  return (result.results || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    business_id: row.business_id,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      id: row.u_id,
      email: row.email,
      password_hash: '', // セキュリティのため非公開
      name: row.u_name,
      is_super_admin: row.is_super_admin,
      is_active: row.u_is_active,
      avatar_url: row.avatar_url,
      font_size: row.font_size as D1User['font_size'],
      created_at: row.u_created_at,
      updated_at: row.u_updated_at,
    }
  }))
}

export async function createBusinessAccess(input: CreateBusinessAccessInput): Promise<D1BusinessAccess> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO business_access (id, user_id, business_id, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(id, input.user_id, input.business_id, input.role, timestamp, timestamp)
    .run()

  return (await findBusinessAccessById(id))!
}

export async function updateBusinessAccessRole(id: string, role: D1Role): Promise<D1BusinessAccess | null> {
  const db = await getD1Database()
  await db
    .prepare('UPDATE business_access SET role = ?, updated_at = ? WHERE id = ?')
    .bind(role, now(), id)
    .run()
  return findBusinessAccessById(id)
}

export async function deleteBusinessAccess(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM business_access WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// Manual CRUD
// ========================================

export async function findManualById(id: string): Promise<D1Manual | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM manuals WHERE id = ?')
    .bind(id)
    .first<D1Manual>()
}

export async function findManualWithRelations(id: string): Promise<D1ManualWithRelations | null> {
  const db = await getD1Database()

  // マニュアル本体を取得
  const manual = await db
    .prepare(`
      SELECT m.*,
             b.id as b_id, b.name as b_name, b.display_name_line1, b.display_name_line2, b.color, b.theme_colors,
             c.id as c_id, c.name as c_name,
             u.id as u_id, u.name as u_name
      FROM manuals m
      JOIN businesses b ON m.business_id = b.id
      JOIN users c ON m.created_by = c.id
      JOIN users u ON m.updated_by = u.id
      WHERE m.id = ?
    `)
    .bind(id)
    .first<D1Manual & {
      b_id: string; b_name: string; display_name_line1: string; display_name_line2: string; color: string | null; theme_colors: string | null;
      c_id: string; c_name: string; u_id: string; u_name: string
    }>()

  if (!manual) return null

  // ブロックを取得
  const blocksResult = await db
    .prepare('SELECT * FROM blocks WHERE manual_id = ? ORDER BY sort_order ASC')
    .bind(id)
    .all<D1Block>()

  return {
    ...manual,
    business: {
      id: manual.b_id,
      name: manual.b_name,
      display_name_line1: manual.display_name_line1,
      display_name_line2: manual.display_name_line2,
      description: null,
      icon: null,
      color: manual.color,
      theme_colors: manual.theme_colors,
      sort_order: 0,
      is_active: 1,
      created_at: '',
      updated_at: '',
    },
    creator: { id: manual.c_id, name: manual.c_name },
    updater: { id: manual.u_id, name: manual.u_name },
    blocks: blocksResult.results || [],
  }
}

export async function findManualsByBusiness(businessId: string, includeArchived = false): Promise<D1Manual[]> {
  const db = await getD1Database()
  const query = includeArchived
    ? 'SELECT * FROM manuals WHERE business_id = ? ORDER BY sort_order ASC, created_at DESC'
    : 'SELECT * FROM manuals WHERE business_id = ? AND is_archived = 0 ORDER BY sort_order ASC, created_at DESC'

  const result = await db.prepare(query).bind(businessId).all<D1Manual>()
  return result.results || []
}

export async function findArchivedManualsByBusiness(businessId: string): Promise<D1Manual[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM manuals WHERE business_id = ? AND is_archived = 1 ORDER BY archived_at DESC')
    .bind(businessId)
    .all<D1Manual>()
  return result.results || []
}

export async function createManual(input: CreateManualInput): Promise<D1Manual> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO manuals (id, business_id, title, description, status, admin_only, sort_order, is_archived, version, created_by, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.business_id,
      input.title,
      input.description || null,
      input.status || 'DRAFT',
      input.admin_only ? 1 : 0,
      input.sort_order ?? 0,
      input.created_by,
      input.updated_by,
      timestamp,
      timestamp
    )
    .run()

  return (await findManualById(id))!
}

export async function updateManual(id: string, input: UpdateManualInput): Promise<D1Manual | null> {
  const db = await getD1Database()
  const existing = await findManualById(id)
  if (!existing) return null

  const updates: string[] = []
  const values: unknown[] = []

  if (input.title !== undefined) { updates.push('title = ?'); values.push(input.title) }
  if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description) }
  if (input.status !== undefined) { updates.push('status = ?'); values.push(input.status) }
  if (input.admin_only !== undefined) { updates.push('admin_only = ?'); values.push(input.admin_only ? 1 : 0) }
  if (input.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(input.sort_order) }
  if (input.is_archived !== undefined) { updates.push('is_archived = ?'); values.push(input.is_archived ? 1 : 0) }
  if (input.archived_at !== undefined) { updates.push('archived_at = ?'); values.push(input.archived_at) }
  if (input.version !== undefined) { updates.push('version = ?'); values.push(input.version) }
  if (input.updated_by !== undefined) { updates.push('updated_by = ?'); values.push(input.updated_by) }

  if (updates.length === 0) return existing

  updates.push('updated_at = ?')
  values.push(now())
  values.push(id)

  await db
    .prepare(`UPDATE manuals SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return findManualById(id)
}

export async function deleteManual(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM manuals WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

export async function reorderManuals(businessId: string, manualIds: string[]): Promise<void> {
  const db = await getD1Database()
  const statements = manualIds.map((id, index) =>
    db.prepare('UPDATE manuals SET sort_order = ?, updated_at = ? WHERE id = ? AND business_id = ?')
      .bind(index, now(), id, businessId)
  )
  await db.batch(statements)
}

// ========================================
// ManualVersion CRUD
// ========================================

export async function findManualVersionById(id: string): Promise<D1ManualVersion | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM manual_versions WHERE id = ?')
    .bind(id)
    .first<D1ManualVersion>()
}

export async function findManualVersionsByManual(manualId: string): Promise<D1ManualVersion[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM manual_versions WHERE manual_id = ? ORDER BY version DESC')
    .bind(manualId)
    .all<D1ManualVersion>()
  return result.results || []
}

export async function createManualVersion(input: CreateManualVersionInput): Promise<D1ManualVersion> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO manual_versions (id, manual_id, version, title, description, blocks, created_by, created_at, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.manual_id,
      input.version,
      input.title,
      input.description || null,
      input.blocks,
      input.created_by,
      timestamp,
      input.comment || null
    )
    .run()

  return (await findManualVersionById(id))!
}

// ========================================
// Block CRUD
// ========================================

export async function findBlockById(id: string): Promise<D1Block | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM blocks WHERE id = ?')
    .bind(id)
    .first<D1Block>()
}

export async function findBlocksByManual(manualId: string): Promise<D1Block[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM blocks WHERE manual_id = ? ORDER BY sort_order ASC')
    .bind(manualId)
    .all<D1Block>()
  return result.results || []
}

export async function createBlock(input: CreateBlockInput): Promise<D1Block> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO blocks (id, manual_id, type, content, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(id, input.manual_id, input.type, input.content, input.sort_order ?? 0, timestamp, timestamp)
    .run()

  return (await findBlockById(id))!
}

export async function updateBlock(id: string, input: UpdateBlockInput): Promise<D1Block | null> {
  const db = await getD1Database()
  const existing = await findBlockById(id)
  if (!existing) return null

  const updates: string[] = []
  const values: unknown[] = []

  if (input.type !== undefined) { updates.push('type = ?'); values.push(input.type) }
  if (input.content !== undefined) { updates.push('content = ?'); values.push(input.content) }
  if (input.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(input.sort_order) }

  if (updates.length === 0) return existing

  updates.push('updated_at = ?')
  values.push(now())
  values.push(id)

  await db
    .prepare(`UPDATE blocks SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return findBlockById(id)
}

export async function deleteBlock(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM blocks WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

export async function reorderBlocks(manualId: string, blockIds: string[]): Promise<void> {
  const db = await getD1Database()
  const timestamp = now()
  const statements = blockIds.map((id, index) =>
    db.prepare('UPDATE blocks SET sort_order = ?, updated_at = ? WHERE id = ? AND manual_id = ?')
      .bind(index, timestamp, id, manualId)
  )
  await db.batch(statements)
}

// ========================================
// BlockMemo CRUD
// ========================================

export async function findBlockMemoById(id: string): Promise<D1BlockMemo | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM block_memos WHERE id = ?')
    .bind(id)
    .first<D1BlockMemo>()
}

export async function findBlockMemosByBlock(blockId: string): Promise<(D1BlockMemo & { user: Pick<D1User, 'id' | 'name'> })[]> {
  const db = await getD1Database()
  const result = await db
    .prepare(`
      SELECT bm.*, u.id as u_id, u.name as u_name
      FROM block_memos bm
      JOIN users u ON bm.user_id = u.id
      WHERE bm.block_id = ?
      ORDER BY bm.created_at DESC
    `)
    .bind(blockId)
    .all<D1BlockMemo & { u_id: string; u_name: string }>()

  return (result.results || []).map(row => ({
    ...row,
    user: { id: row.u_id, name: row.u_name }
  }))
}

export async function countBlockMemos(blockId: string): Promise<number> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM block_memos WHERE block_id = ?')
    .bind(blockId)
    .first<{ count: number }>()
  return result?.count ?? 0
}

export async function createBlockMemo(input: CreateBlockMemoInput): Promise<D1BlockMemo> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO block_memos (id, block_id, user_id, content, visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(id, input.block_id, input.user_id, input.content, input.visibility || 'PRIVATE', timestamp, timestamp)
    .run()

  return (await findBlockMemoById(id))!
}

export async function updateBlockMemo(id: string, content: string): Promise<D1BlockMemo | null> {
  const db = await getD1Database()
  await db
    .prepare('UPDATE block_memos SET content = ?, updated_at = ? WHERE id = ?')
    .bind(content, now(), id)
    .run()
  return findBlockMemoById(id)
}

export async function deleteBlockMemo(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM block_memos WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// Notification CRUD
// ========================================

export async function findNotificationById(id: string): Promise<D1Notification | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM notifications WHERE id = ?')
    .bind(id)
    .first<D1Notification>()
}

export async function findNotificationsByUser(userId: string, limit = 50): Promise<D1Notification[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .bind(userId, limit)
    .all<D1Notification>()
  return result.results || []
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
    .bind(userId)
    .first<{ count: number }>()
  return result?.count ?? 0
}

export async function createNotification(input: CreateNotificationInput): Promise<D1Notification> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link_url, related_memo_id, related_work_session_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `)
    .bind(
      id,
      input.user_id,
      input.type,
      input.title,
      input.message,
      input.link_url || null,
      input.related_memo_id || null,
      input.related_work_session_id || null,
      timestamp
    )
    .run()

  return (await findNotificationById(id))!
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('UPDATE notifications SET is_read = 1 WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const db = await getD1Database()
  await db
    .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
    .bind(userId)
    .run()
}

export async function deleteNotification(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM notifications WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// WorkSession CRUD
// ========================================

export async function findWorkSessionById(id: string): Promise<D1WorkSession | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM work_sessions WHERE id = ?')
    .bind(id)
    .first<D1WorkSession>()
}

export async function findWorkSessionWithRelations(id: string): Promise<D1WorkSessionWithRelations | null> {
  const db = await getD1Database()

  const session = await db
    .prepare(`
      SELECT ws.*, m.title as m_title, m.business_id, u.id as u_id, u.name as u_name
      FROM work_sessions ws
      JOIN manuals m ON ws.manual_id = m.id
      JOIN users u ON ws.user_id = u.id
      WHERE ws.id = ?
    `)
    .bind(id)
    .first<D1WorkSession & { m_title: string; business_id: string; u_id: string; u_name: string }>()

  if (!session) return null

  const notesResult = await db
    .prepare('SELECT * FROM work_session_notes WHERE work_session_id = ? ORDER BY created_at ASC')
    .bind(id)
    .all<D1WorkSessionNote>()

  const photosResult = await db
    .prepare('SELECT * FROM photo_records WHERE work_session_id = ? ORDER BY created_at ASC')
    .bind(id)
    .all<D1PhotoRecord>()

  return {
    ...session,
    manual: {
      id: session.manual_id,
      business_id: session.business_id,
      title: session.m_title,
      description: null,
      status: 'PUBLISHED' as const,
      admin_only: 0,
      sort_order: 0,
      is_archived: 0,
      archived_at: null,
      version: 1,
      created_by: '',
      updated_by: '',
      created_at: '',
      updated_at: '',
    },
    user: {
      id: session.u_id,
      email: '',
      password_hash: '',
      name: session.u_name,
      is_super_admin: 0,
      is_active: 1,
      avatar_url: null,
      font_size: 'MEDIUM' as const,
      created_at: '',
      updated_at: '',
    },
    notes: notesResult.results || [],
    photo_records: photosResult.results || [],
  }
}

export async function findActiveWorkSession(manualId: string, userId: string): Promise<D1WorkSession | null> {
  const db = await getD1Database()
  return db
    .prepare(`
      SELECT * FROM work_sessions
      WHERE manual_id = ? AND user_id = ? AND status = 'IN_PROGRESS'
      ORDER BY started_at DESC LIMIT 1
    `)
    .bind(manualId, userId)
    .first<D1WorkSession>()
}

export async function findWorkSessionsByManual(manualId: string, limit = 20): Promise<D1WorkSession[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM work_sessions WHERE manual_id = ? ORDER BY started_at DESC LIMIT ?')
    .bind(manualId, limit)
    .all<D1WorkSession>()
  return result.results || []
}

export async function findWorkSessionsByUser(userId: string, limit = 20): Promise<D1WorkSession[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM work_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?')
    .bind(userId, limit)
    .all<D1WorkSession>()
  return result.results || []
}

export async function createWorkSession(input: CreateWorkSessionInput): Promise<D1WorkSession> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO work_sessions (id, manual_id, user_id, status, started_at)
      VALUES (?, ?, ?, 'IN_PROGRESS', ?)
    `)
    .bind(id, input.manual_id, input.user_id, timestamp)
    .run()

  return (await findWorkSessionById(id))!
}

export async function completeWorkSession(id: string): Promise<D1WorkSession | null> {
  const db = await getD1Database()
  const timestamp = now()

  await db
    .prepare(`UPDATE work_sessions SET status = 'COMPLETED', completed_at = ? WHERE id = ?`)
    .bind(timestamp, id)
    .run()

  return findWorkSessionById(id)
}

export async function deleteWorkSession(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM work_sessions WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// WorkSessionNote CRUD
// ========================================

export async function findWorkSessionNoteById(id: string): Promise<D1WorkSessionNote | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM work_session_notes WHERE id = ?')
    .bind(id)
    .first<D1WorkSessionNote>()
}

export async function findWorkSessionNotesBySession(workSessionId: string): Promise<D1WorkSessionNote[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM work_session_notes WHERE work_session_id = ? ORDER BY created_at ASC')
    .bind(workSessionId)
    .all<D1WorkSessionNote>()
  return result.results || []
}

export async function createWorkSessionNote(input: CreateWorkSessionNoteInput): Promise<D1WorkSessionNote> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO work_session_notes (id, work_session_id, block_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(id, input.work_session_id, input.block_id, input.content, timestamp, timestamp)
    .run()

  return (await findWorkSessionNoteById(id))!
}

export async function updateWorkSessionNote(id: string, content: string): Promise<D1WorkSessionNote | null> {
  const db = await getD1Database()
  await db
    .prepare('UPDATE work_session_notes SET content = ?, updated_at = ? WHERE id = ?')
    .bind(content, now(), id)
    .run()
  return findWorkSessionNoteById(id)
}

export async function deleteWorkSessionNote(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM work_session_notes WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// WorkSessionNotePhoto CRUD
// ========================================

export async function findWorkSessionNotePhotoById(id: string): Promise<D1WorkSessionNotePhoto | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM work_session_note_photos WHERE id = ?')
    .bind(id)
    .first<D1WorkSessionNotePhoto>()
}

export async function findWorkSessionNotePhotosByNote(noteId: string): Promise<D1WorkSessionNotePhoto[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM work_session_note_photos WHERE note_id = ? ORDER BY created_at ASC')
    .bind(noteId)
    .all<D1WorkSessionNotePhoto>()
  return result.results || []
}

export async function createWorkSessionNotePhoto(noteId: string, imageData: string): Promise<D1WorkSessionNotePhoto> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO work_session_note_photos (id, note_id, image_data, created_at)
      VALUES (?, ?, ?, ?)
    `)
    .bind(id, noteId, imageData, timestamp)
    .run()

  return (await findWorkSessionNotePhotoById(id))!
}

export async function deleteWorkSessionNotePhoto(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM work_session_note_photos WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// PhotoRecord CRUD
// ========================================

export async function findPhotoRecordById(id: string): Promise<D1PhotoRecord | null> {
  const db = await getD1Database()
  return db
    .prepare('SELECT * FROM photo_records WHERE id = ?')
    .bind(id)
    .first<D1PhotoRecord>()
}

export async function findPhotoRecordsBySession(workSessionId: string): Promise<D1PhotoRecord[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM photo_records WHERE work_session_id = ? ORDER BY created_at ASC')
    .bind(workSessionId)
    .all<D1PhotoRecord>()
  return result.results || []
}

export async function findPhotoRecordsByBlock(workSessionId: string, blockId: string): Promise<D1PhotoRecord[]> {
  const db = await getD1Database()
  const result = await db
    .prepare('SELECT * FROM photo_records WHERE work_session_id = ? AND block_id = ? ORDER BY created_at ASC')
    .bind(workSessionId, blockId)
    .all<D1PhotoRecord>()
  return result.results || []
}

export async function createPhotoRecord(input: CreatePhotoRecordInput): Promise<D1PhotoRecord> {
  const db = await getD1Database()
  const id = generateId()
  const timestamp = now()

  await db
    .prepare(`
      INSERT INTO photo_records (id, work_session_id, block_id, image_data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(id, input.work_session_id, input.block_id, input.image_data, timestamp)
    .run()

  return (await findPhotoRecordById(id))!
}

export async function deletePhotoRecord(id: string): Promise<boolean> {
  const db = await getD1Database()
  const result = await db
    .prepare('DELETE FROM photo_records WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

// ========================================
// Search
// ========================================

export async function searchManuals(businessId: string, query: string, limit = 20): Promise<D1Manual[]> {
  const db = await getD1Database()
  const searchPattern = `%${query}%`

  const result = await db
    .prepare(`
      SELECT * FROM manuals
      WHERE business_id = ? AND is_archived = 0
        AND (title LIKE ? OR description LIKE ?)
      ORDER BY sort_order ASC, created_at DESC
      LIMIT ?
    `)
    .bind(businessId, searchPattern, searchPattern, limit)
    .all<D1Manual>()

  return result.results || []
}

// ========================================
// Analytics
// ========================================

export async function getWorkSessionStats(businessId: string, startDate: string, endDate: string) {
  const db = await getD1Database()

  const result = await db
    .prepare(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(CASE WHEN ws.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_sessions,
        COUNT(DISTINCT ws.user_id) as unique_users,
        COUNT(DISTINCT ws.manual_id) as manuals_used
      FROM work_sessions ws
      JOIN manuals m ON ws.manual_id = m.id
      WHERE m.business_id = ?
        AND ws.started_at >= ?
        AND ws.started_at <= ?
    `)
    .bind(businessId, startDate, endDate)
    .first<{
      total_sessions: number
      completed_sessions: number
      unique_users: number
      manuals_used: number
    }>()

  return result || { total_sessions: 0, completed_sessions: 0, unique_users: 0, manuals_used: 0 }
}
