-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "font_size" TEXT NOT NULL DEFAULT 'MEDIUM',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_name_line1" TEXT NOT NULL,
    "display_name_line2" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "theme_colors" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "business_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "business_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "business_access_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manuals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "admin_only" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "manuals_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manuals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "manuals_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manual_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manual_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "blocks" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    CONSTRAINT "manual_versions_manual_id_fkey" FOREIGN KEY ("manual_id") REFERENCES "manuals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manual_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manual_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blocks_manual_id_fkey" FOREIGN KEY ("manual_id") REFERENCES "manuals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "block_memos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "block_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "block_memos_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "block_memos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" TEXT,
    "related_memo_id" TEXT,
    "related_work_session_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_related_memo_id_fkey" FOREIGN KEY ("related_memo_id") REFERENCES "block_memos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notifications_related_work_session_id_fkey" FOREIGN KEY ("related_work_session_id") REFERENCES "work_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manual_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "work_sessions_manual_id_fkey" FOREIGN KEY ("manual_id") REFERENCES "manuals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_session_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_session_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "work_session_notes_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "work_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_session_notes_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_session_note_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "note_id" TEXT NOT NULL,
    "image_data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_session_note_photos_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "work_session_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "photo_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_session_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "image_data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photo_records_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "work_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "photo_records_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_access_user_id_business_id_key" ON "business_access"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "manuals_business_id_sort_order_idx" ON "manuals"("business_id", "sort_order");

-- CreateIndex
CREATE INDEX "manuals_business_id_is_archived_idx" ON "manuals"("business_id", "is_archived");

-- CreateIndex
CREATE INDEX "blocks_manual_id_sort_order_idx" ON "blocks"("manual_id", "sort_order");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "work_sessions_manual_id_started_at_idx" ON "work_sessions"("manual_id", "started_at");

-- CreateIndex
CREATE INDEX "work_sessions_user_id_started_at_idx" ON "work_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "work_sessions_status_started_at_idx" ON "work_sessions"("status", "started_at");

