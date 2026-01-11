-- Mocca Operation D1 Seed Data
-- Initial data for production

-- スーパー管理者ユーザー (password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO "users" ("id", "email", "password_hash", "name", "is_super_admin", "is_active", "font_size", "created_at", "updated_at")
VALUES (
    'clu1admin000001',
    'admin@mocca.jp',
    '$2b$12$/9dIGIBxW14SSwE6640YXelhJf2vKQ71GvoAK/XNrSO3sj/43lvAG',
    'システム管理者',
    1,
    1,
    'MEDIUM',
    datetime('now'),
    datetime('now')
);

-- 事業1: お食事処 もっか
INSERT INTO "businesses" ("id", "name", "display_name_line1", "display_name_line2", "description", "color", "sort_order", "is_active", "created_at", "updated_at")
VALUES (
    'clb1mocka000001',
    'mocka-restaurant',
    'お食事処',
    'もっか',
    '飲食店の業務マニュアル',
    '#8B4513',
    1,
    1,
    datetime('now'),
    datetime('now')
);

-- 事業2: Holiday Cottage BANSHIRO
INSERT INTO "businesses" ("id", "name", "display_name_line1", "display_name_line2", "description", "color", "sort_order", "is_active", "created_at", "updated_at")
VALUES (
    'clb2banshiro001',
    'banshiro-cottage',
    'Holiday Cottage',
    'BANSHIRO',
    'コテージの業務マニュアル',
    '#2E8B57',
    2,
    1,
    datetime('now'),
    datetime('now')
);

-- サンプルワーカーユーザー (password: worker123)
INSERT INTO "users" ("id", "email", "password_hash", "name", "is_super_admin", "is_active", "font_size", "created_at", "updated_at")
VALUES (
    'clu2worker00001',
    'worker@mocca.jp',
    '$2b$12$ZEjN9h1lDT00wyaLAWtqeOe1AYn3EaOnUTxKCRmAB65DNgmEEBahO',
    'サンプル作業者',
    0,
    1,
    'MEDIUM',
    datetime('now'),
    datetime('now')
);

-- ワーカーに事業1へのアクセス権を付与
INSERT INTO "business_access" ("id", "user_id", "business_id", "role", "created_at", "updated_at")
VALUES (
    'clba1access0001',
    'clu2worker00001',
    'clb1mocka000001',
    'WORKER',
    datetime('now'),
    datetime('now')
);

-- サンプルマニュアル: 開店準備
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'clm1manual00001',
    'clb1mocka000001',
    '開店準備マニュアル',
    '毎日の開店時に行う準備作業の手順',
    'PUBLISHED',
    0,
    1,
    0,
    1,
    'clu1admin000001',
    'clu1admin000001',
    datetime('now'),
    datetime('now')
);

-- サンプルブロック1: テキスト
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES (
    'clbk1block00001',
    'clm1manual00001',
    'TEXT',
    '{"text": "開店30分前に出勤し、以下の準備を行います。"}',
    0,
    datetime('now'),
    datetime('now')
);

-- サンプルブロック2: チェックポイント
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES (
    'clbk2block00002',
    'clm1manual00001',
    'CHECKPOINT',
    '{"items": ["照明をつける", "エアコンを適温に設定", "BGMを流す", "のれんを出す"]}',
    1,
    datetime('now'),
    datetime('now')
);

-- サンプルブロック3: 警告
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES (
    'clbk3block00003',
    'clm1manual00001',
    'WARNING',
    '{"text": "ガスの元栓が開いていることを必ず確認してください。"}',
    2,
    datetime('now'),
    datetime('now')
);
