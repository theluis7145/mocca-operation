-- マニュアルにジャンルカラムを追加
ALTER TABLE manuals ADD COLUMN genre TEXT DEFAULT NULL;

-- ジャンルでの検索を高速化するためのインデックス
CREATE INDEX IF NOT EXISTS idx_manuals_genre ON manuals(genre);
CREATE INDEX IF NOT EXISTS idx_manuals_business_genre ON manuals(business_id, genre);
