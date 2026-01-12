-- 作業指示メモテーブル
CREATE TABLE IF NOT EXISTS work_instruction_memos (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  stay_start_date TEXT NOT NULL,
  stay_end_date TEXT NOT NULL,
  adult_count INTEGER NOT NULL DEFAULT 0,
  child_count INTEGER NOT NULL DEFAULT 0,
  adult_futon_count INTEGER NOT NULL DEFAULT 0,
  child_futon_count INTEGER NOT NULL DEFAULT 0,
  meal_plan TEXT NOT NULL,
  meal_plan_detail TEXT,
  notes TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_work_instruction_memos_dates ON work_instruction_memos(stay_end_date, is_archived);
CREATE INDEX IF NOT EXISTS idx_work_instruction_memos_archived ON work_instruction_memos(is_archived, archived_at);
