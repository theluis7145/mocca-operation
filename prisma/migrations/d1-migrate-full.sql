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

-- マニュアル: 開店準備の手順
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'manual-opening-procedure',
    'business-restaurant',
    '開店準備の手順',
    '毎日の開店準備の基本的な流れ',
    'PUBLISHED',
    0,
    0,
    0,
    2,
    'cmk6i2dct0000ycavfdfm2e1i',
    'cmk6i2dct0000ycavfdfm2e1i',
    datetime('now'),
    datetime('now')
);

-- マニュアル: 基本の調理手順
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'manual-cooking-basics',
    'business-restaurant',
    '基本の調理手順',
    '基本的な調理の流れとポイント',
    'DRAFT',
    0,
    1,
    0,
    1,
    'cmk6i2dct0000ycavfdfm2e1i',
    'cmk6i2dct0000ycavfdfm2e1i',
    datetime('now'),
    datetime('now')
);

-- マニュアル: 閉店作業の手順
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'manual-closing-procedure',
    'business-restaurant',
    '閉店作業の手順',
    '閉店後の清掃と施錠の手順',
    'PUBLISHED',
    0,
    2,
    0,
    1,
    'cmk6i2dct0000ycavfdfm2e1i',
    'cmk6i2dct0000ycavfdfm2e1i',
    datetime('now'),
    datetime('now')
);

-- マニュアル: チェックイン前
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'manual-checkin-prep',
    'business-cottage',
    'チェックイン前',
    'お客様をお迎えする前の準備作業',
    'PUBLISHED',
    0,
    0,
    0,
    1,
    'cmk6i2dct0000ycavfdfm2e1i',
    'cmk6i2dct0000ycavfdfm2e1i',
    datetime('now'),
    datetime('now')
);

-- マニュアル: 管理者向けシステム使用マニュアル
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'manual-admin-usage',
    'business-restaurant',
    '【管理者向け】システム使用マニュアル',
    'Mocca Operationシステムの管理者向け操作ガイド',
    'PUBLISHED',
    0,
    3,
    0,
    1,
    'cmk6i2dct0000ycavfdfm2e1i',
    'cmk6i2dct0000ycavfdfm2e1i',
    datetime('now'),
    datetime('now')
);

-- マニュアル: 作業者向けシステム使用マニュアル
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'manual-worker-usage',
    'business-restaurant',
    '【作業者向け】システム使用マニュアル',
    'Mocca Operationシステムの作業者向け操作ガイド',
    'PUBLISHED',
    0,
    4,
    0,
    1,
    'cmk6i2dct0000ycavfdfm2e1i',
    'cmk6i2dct0000ycavfdfm2e1i',
    datetime('now'),
    datetime('now')
);

-- マニュアル: チェックアウト後
INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "version", "created_by", "updated_by", "created_at", "updated_at")
VALUES (
    'manual-checkout',
    'business-cottage',
    'チェックアウト後',
    'お客様チェックアウト後の清掃・点検・補充作業の手順',
    'PUBLISHED',
    0,
    1,
    0,
    1,
    'cmk6i2dct0000ycavfdfm2e1i',
    'cmk6i2dct0000ycavfdfm2e1i',
    datetime('now'),
    datetime('now')
);

-- ブロック: 開店準備の手順
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('block-1', 'manual-opening-procedure', 'TEXT', '{"type":"text","text":"店舗に到着したら、まず入口の鍵を開けます。鍵は右に2回回して解錠します。","format":"plain"}', 1, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('block-2', 'manual-opening-procedure', 'WARNING', '{"type":"warning","level":"warning","title":"注意","text":"セキュリティシステムが作動している場合は、30秒以内に暗証番号を入力してください。"}', 2, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('block-3', 'manual-opening-procedure', 'TEXT', '{"type":"text","text":"店内の照明をつけ、空調を稼働させます。夏季は冷房25度、冬季は暖房22度に設定します。","format":"plain"}', 3, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('block-4', 'manual-opening-procedure', 'CHECKPOINT', '{"type":"checkpoint","title":"開店前チェックリスト","items":["トイレの清掃状態を確認","テーブルの配置を確認","食器の補充を確認","メニューの配置を確認"]}', 4, datetime('now'), datetime('now'));

-- ブロック: チェックイン前
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-1', 'manual-checkin-prep', 'TEXT', '{"type":"text","text":"コテージに到着したら、まず鍵を開けて入室します。入口のドアは右に回して開錠し、中に入ったら靴を脱いで備え付けのスリッパに履き替えてください。","format":"plain"}', 1, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-2', 'manual-checkin-prep', 'WARNING', '{"type":"warning","level":"danger","title":"重要：ガスの確認","text":"入室後、必ずガスの元栓が閉まっていることを確認してください。ガス漏れの臭いがする場合は、窓を開けて換気し、すぐに管理者に連絡してください。火気の使用は厳禁です。"}', 2, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-3', 'manual-checkin-prep', 'IMAGE', '{"type":"image","url":"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800","alt":"コテージリビングルーム","caption":"リビングルームの正しい配置例"}', 3, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-4', 'manual-checkin-prep', 'TEXT', '{"type":"text","text":"全ての窓を開けて換気を行います。15分以上の換気を推奨します。その間に他の準備作業を進めましょう。\n\n換気中は網戸を閉めて、虫が入らないように注意してください。","format":"plain"}', 4, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-5', 'manual-checkin-prep', 'CHECKPOINT', '{"type":"checkpoint","title":"リビングルームチェックリスト","items":[{"text":"ソファのクッションを整える","imageUrl":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600","videoUrl":"https://www.youtube.com/watch?v=jNQXAC9IVRw"},{"text":"テーブルを拭く","imageUrl":"https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600"},{"text":"リモコンを所定の位置に配置","videoUrl":"https://www.youtube.com/watch?v=9bZkp7q19f0"},{"text":"ゴミ箱が空であることを確認"}]}', 5, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-6', 'manual-checkin-prep', 'WARNING', '{"type":"warning","level":"warning","title":"エアコン設定について","text":"夏季は26度、冬季は20度を目安に設定してください。チェックイン1時間前にはエアコンを稼働させ、快適な室温でお客様をお迎えしましょう。"}', 6, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-7', 'manual-checkin-prep', 'VIDEO', '{"type":"video","provider":"youtube","videoId":"dQw4w9WgXcQ","title":"ベッドメイキングの手順動画"}', 7, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-8', 'manual-checkin-prep', 'CHECKPOINT', '{"type":"checkpoint","title":"ベッドルームチェックリスト","items":[{"text":"シーツの交換・シワを伸ばす","imageUrl":"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600","videoUrl":"https://www.youtube.com/watch?v=kJQP7kiw5Fk"},{"text":"枕を2つずつ配置","imageUrl":"https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600"},{"text":"ブランケットを足元に畳んで配置","videoUrl":"https://www.youtube.com/watch?v=fJ9rUzIMcZQ"},{"text":"ナイトテーブルの清掃"},{"text":"照明の動作確認","videoUrl":"https://www.youtube.com/watch?v=RgKAFK5djSk"}]}', 8, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-9', 'manual-checkin-prep', 'WARNING', '{"type":"warning","level":"info","title":"アメニティの補充について","text":"バスルームのアメニティ（シャンプー、コンディショナー、ボディソープ）は残量が半分以下の場合、新しいものに交換してください。タオルは人数分×2セットを用意します。"}', 9, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkin-block-10', 'manual-checkin-prep', 'CHECKPOINT', '{"type":"checkpoint","title":"最終チェックリスト","items":[{"text":"全ての照明が点灯するか確認","videoUrl":"https://www.youtube.com/watch?v=OPf0YbXqDm0"},{"text":"テレビ・エアコンのリモコン動作確認","videoUrl":"https://www.youtube.com/watch?v=JGwWNGJdvx8"},{"text":"Wi-Fiパスワードカードを設置","imageUrl":"https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600"},{"text":"ウェルカムカードと案内を配置","imageUrl":"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600","videoUrl":"https://www.youtube.com/watch?v=hT_nvWreIhg"},{"text":"玄関の靴箱を整頓"},{"text":"窓を閉めて施錠","videoUrl":"https://www.youtube.com/watch?v=CevxZvSJLk8"}]}', 10, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('cmk6ikuf40001ycepad1tj1ou', 'manual-checkin-prep', 'TEXT', '{"type":"text","text":"あいうえお","format":"plain"}', 11, datetime('now'), datetime('now'));

-- ブロック: チェックアウト後
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-1', 'manual-checkout', 'TEXT', '{"type":"text","text":"チェックアウト後は、次のお客様を迎えるための準備を行います。清掃・点検・補充の順番で作業を進めましょう。\n\n【所要時間目安】\n・1LDKタイプ: 約2時間\n・2LDKタイプ: 約3時間\n\n作業は必ず2名以上で行ってください。","format":"plain"}', 1, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-2', 'manual-checkout', 'WARNING', '{"type":"warning","level":"warning","title":"忘れ物の確認","text":"清掃前に必ず全ての部屋を確認し、忘れ物がないかチェックしてください。忘れ物があった場合は、すぐに管理者に報告してください。"}', 2, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-3', 'manual-checkout', 'CHECKPOINT', '{"type":"checkpoint","title":"リビング・ダイニング清掃チェックリスト","items":[{"text":"ソファ・クッションの清掃と配置","imageUrl":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"},{"text":"テーブル・椅子の拭き掃除"},{"text":"床の掃除機がけとモップがけ"},{"text":"ゴミ箱の中身を回収・新しい袋をセット"},{"text":"リモコン類の消毒と配置"},{"text":"エアコンフィルターの確認"}]}', 3, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-4', 'manual-checkout', 'CHECKPOINT', '{"type":"checkpoint","title":"キッチン清掃チェックリスト","items":[{"text":"シンクの清掃と消毒"},{"text":"コンロ周りの油汚れ除去"},{"text":"冷蔵庫内の確認・清掃"},{"text":"電子レンジ・トースターの清掃"},{"text":"食器類の洗浄・収納"},{"text":"調味料・消耗品の補充確認"}]}', 4, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-5', 'manual-checkout', 'CHECKPOINT', '{"type":"checkpoint","title":"ベッドルーム清掃チェックリスト","items":[{"text":"シーツ・枕カバーの交換","imageUrl":"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600"},{"text":"布団カバーの交換（汚れがある場合）"},{"text":"マットレスの点検"},{"text":"床の清掃"},{"text":"クローゼット内の確認"},{"text":"ハンガーの数の確認（10本）"}]}', 5, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-6', 'manual-checkout', 'CHECKPOINT', '{"type":"checkpoint","title":"バスルーム・トイレ清掃チェックリスト","items":[{"text":"浴槽の清掃・消毒"},{"text":"鏡・蛇口の水垢除去"},{"text":"排水口の髪の毛除去"},{"text":"トイレの清掃・消毒"},{"text":"タオル類の交換"},{"text":"アメニティの補充"},{"text":"換気扇の動作確認"}]}', 6, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-7', 'manual-checkout', 'WARNING', '{"type":"warning","level":"danger","title":"設備破損・異常の報告","text":"清掃中に設備の破損や異常を発見した場合は、作業を中断し、直ちに管理者に報告してください。修理が必要な場合は次の予約に影響する可能性があります。"}', 7, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-8', 'manual-checkout', 'CHECKPOINT', '{"type":"checkpoint","title":"消耗品・備品補充チェックリスト","items":[{"text":"トイレットペーパー（予備含め3ロール）"},{"text":"ティッシュペーパー（各部屋1箱）"},{"text":"シャンプー・コンディショナー・ボディソープ"},{"text":"歯ブラシセット（人数分＋2）"},{"text":"コーヒー・紅茶・お茶パック"},{"text":"ゴミ袋（各サイズ5枚ずつ）"}]}', 8, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-9', 'manual-checkout', 'CHECKPOINT', '{"type":"checkpoint","title":"最終確認チェックリスト","items":[{"text":"全ての窓の施錠確認"},{"text":"全ての照明の動作確認"},{"text":"エアコンの動作確認"},{"text":"Wi-Fiの接続確認"},{"text":"テレビの動作確認"},{"text":"玄関の清掃と靴箱の確認"},{"text":"外回りの確認（テラス・駐車場）"}]}', 9, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('checkout-block-10', 'manual-checkout', 'TEXT', '{"type":"text","text":"全ての作業が完了したら、管理システムから作業完了報告を行ってください。\n\n【報告内容】\n・作業完了時刻\n・特記事項（汚れがひどかった箇所、修理が必要な箇所など）\n・使用した消耗品の数\n\n報告後、次のお客様のチェックイン時間まで待機となります。","format":"plain"}', 10, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('cmk6lde900003yc7esh0cl4su', 'manual-checkout', 'PHOTO_RECORD', '{"type":"photo_record","title":"いたのま","description":"","required":true}', 11, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('cmk7o7fgq00018o36q2gpm55s', 'manual-checkout', 'PHOTO_RECORD', '{"type":"photo_record","title":"バスルーム清掃完了","description":"浴槽、洗面台、トイレがすべて清掃済みであることを確認して撮影してください。","required":true,"referenceImageUrl":"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"}', 12, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('cmk7o7fgs00038o36c5r4muj2', 'manual-checkout', 'PHOTO_RECORD', '{"type":"photo_record","title":"ベッドメイキング完了","description":"シーツ、枕カバーが新しいものに交換され、きれいに整えられていることを撮影してください。","required":true,"referenceImageUrl":"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"}', 13, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('cmk7o7fgt00058o36jmagdo3f', 'manual-checkout', 'PHOTO_RECORD', '{"type":"photo_record","title":"キッチン清掃完了","description":"シンク、コンロ、冷蔵庫内が清掃済みであることを撮影してください。","required":false,"referenceImageUrl":"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"}', 14, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('cmk7o7fgt00078o366cx7wola', 'manual-checkout', 'PHOTO_RECORD', '{"type":"photo_record","title":"リビング全体","description":"リビング全体が整頓されていることを撮影してください。","required":true,"referenceImageUrl":"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"}', 15, datetime('now'), datetime('now'));
