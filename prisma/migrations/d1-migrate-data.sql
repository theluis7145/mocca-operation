-- Mocca Operation データ移行
-- テスト環境から本番環境へのデータ移行

-- 事業データ
INSERT INTO "businesses" ("id", "name", "display_name_line1", "display_name_line2", "description", "icon", "color", "theme_colors", "sort_order", "is_active", "created_at", "updated_at")
VALUES (
    'business-restaurant',
    'restaurant',
    'お食事処',
    'もっか',
    'お食事処 もっかのオペレーションマニュアル',
    NULL,
    '#8B4513',
    '["#8B4513","#D2691E","#CD853F"]',
    1,
    1,
    datetime('now'),
    datetime('now')
);

INSERT INTO "businesses" ("id", "name", "display_name_line1", "display_name_line2", "description", "icon", "color", "theme_colors", "sort_order", "is_active", "created_at", "updated_at")
VALUES (
    'business-cottage',
    'cottage',
    'Holiday Cottage',
    'BANSHIRO',
    'Holiday Cottage BANSHIROのオペレーションマニュアル',
    NULL,
    '#2E8B57',
    '["#1e5631","#2E8B57","#3CB371"]',
    2,
    1,
    datetime('now'),
    datetime('now')
);

-- ユーザーデータ
INSERT INTO "users" ("id", "email", "password_hash", "name", "is_super_admin", "is_active", "avatar_url", "font_size", "created_at", "updated_at")
VALUES (
    'cmk6i2dct0000ycavfdfm2e1i',
    'admin@mocca.co.jp',
    '$2b$12$q8peyE5Z5CXfZGhpvc3gPOe4CCMKQRRn7bMw/ybHFnO95l84bHFhG',
    '管理者',
    1,
    1,
    NULL,
    'MEDIUM',
    datetime('now'),
    datetime('now')
);

INSERT INTO "users" ("id", "email", "password_hash", "name", "is_super_admin", "is_active", "avatar_url", "font_size", "created_at", "updated_at")
VALUES (
    'cmk6i2dic0001ycavd504e42r',
    'test@mocca.co.jp',
    '$2b$12$mxcASjjcuaBfg43WER11Cuq00lCpYFyZdeftlmgw.f0luG25xPa8y',
    'テストユーザー',
    0,
    1,
    NULL,
    'MEDIUM',
    datetime('now'),
    datetime('now')
);

-- アクセス権限
INSERT INTO "business_access" ("id", "user_id", "business_id", "role", "created_at", "updated_at")
VALUES (
    'cmk6i2did0003ycav9ctn0v9r',
    'cmk6i2dic0001ycavd504e42r',
    'business-restaurant',
    'WORKER',
    datetime('now'),
    datetime('now')
);

