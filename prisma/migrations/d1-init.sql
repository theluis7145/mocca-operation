-- Mocca Operation D1 Database Schema
-- SQLite compatible format for Cloudflare D1

-- CreateTable: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_super_admin" INTEGER NOT NULL DEFAULT 0,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "avatar_url" TEXT,
    "font_size" TEXT NOT NULL DEFAULT 'MEDIUM',
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- CreateTable: businesses
CREATE TABLE IF NOT EXISTS "businesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_name_line1" TEXT NOT NULL,
    "display_name_line2" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "theme_colors" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- CreateTable: business_access
CREATE TABLE IF NOT EXISTS "business_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("business_id") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: manuals
CREATE TABLE IF NOT EXISTS "manuals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "admin_only" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_archived" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("business_id") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: manual_versions
CREATE TABLE IF NOT EXISTS "manual_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manual_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "blocks" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "comment" TEXT,
    FOREIGN KEY ("manual_id") REFERENCES "manuals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: blocks
CREATE TABLE IF NOT EXISTS "blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manual_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("manual_id") REFERENCES "manuals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: block_memos
CREATE TABLE IF NOT EXISTS "block_memos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "block_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: work_sessions (must be before notifications)
CREATE TABLE IF NOT EXISTS "work_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manual_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "completed_at" TEXT,
    FOREIGN KEY ("manual_id") REFERENCES "manuals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: notifications (references work_sessions)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" TEXT,
    "related_memo_id" TEXT,
    "related_work_session_id" TEXT,
    "is_read" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("related_memo_id") REFERENCES "block_memos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("related_work_session_id") REFERENCES "work_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: work_session_notes
CREATE TABLE IF NOT EXISTS "work_session_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_session_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("work_session_id") REFERENCES "work_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: work_session_note_photos
CREATE TABLE IF NOT EXISTS "work_session_note_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "note_id" TEXT NOT NULL,
    "image_data" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("note_id") REFERENCES "work_session_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: photo_records
CREATE TABLE IF NOT EXISTS "photo_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_session_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "image_data" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("work_session_id") REFERENCES "work_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "business_access_user_id_business_id_key" ON "business_access"("user_id", "business_id");

-- CreateIndex: performance indexes
CREATE INDEX IF NOT EXISTS "manuals_business_id_sort_order_idx" ON "manuals"("business_id", "sort_order");
CREATE INDEX IF NOT EXISTS "manuals_business_id_is_archived_idx" ON "manuals"("business_id", "is_archived");
CREATE INDEX IF NOT EXISTS "blocks_manual_id_sort_order_idx" ON "blocks"("manual_id", "sort_order");
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "work_sessions_manual_id_started_at_idx" ON "work_sessions"("manual_id", "started_at");
CREATE INDEX IF NOT EXISTS "work_sessions_user_id_started_at_idx" ON "work_sessions"("user_id", "started_at");
CREATE INDEX IF NOT EXISTS "work_sessions_status_started_at_idx" ON "work_sessions"("status", "started_at");
