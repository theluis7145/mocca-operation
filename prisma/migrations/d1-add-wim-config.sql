-- 作業指示メモ設定テーブル（事業ごとの設定）
CREATE TABLE IF NOT EXISTS work_instruction_memo_configs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL UNIQUE,
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wimconfig_business ON work_instruction_memo_configs(business_id);

-- 作業指示メモフィールド定義テーブル
CREATE TABLE IF NOT EXISTS work_instruction_memo_fields (
  id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL,
  label TEXT NOT NULL,
  is_required INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  options TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (config_id) REFERENCES work_instruction_memo_configs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wimfield_config ON work_instruction_memo_fields(config_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wimfield_config_key ON work_instruction_memo_fields(config_id, field_key);

-- 既存の work_instruction_memos テーブルに business_id と field_values カラムを追加
ALTER TABLE work_instruction_memos ADD COLUMN business_id TEXT;
ALTER TABLE work_instruction_memos ADD COLUMN field_values TEXT;
CREATE INDEX IF NOT EXISTS idx_wim_business ON work_instruction_memos(business_id);
