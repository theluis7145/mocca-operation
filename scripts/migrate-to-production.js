#!/usr/bin/env node
/**
 * テスト環境から本番環境へのデータ移行スクリプト
 * 使用方法: node scripts/migrate-to-production.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

// テスト環境のデータ
const businesses = [
  {
    id: 'business-restaurant',
    name: 'restaurant',
    display_name_line1: 'お食事処',
    display_name_line2: 'もっか',
    description: 'お食事処 もっかのオペレーションマニュアル',
    icon: null,
    color: '#8B4513',
    theme_colors: '["#8B4513","#D2691E","#CD853F"]',
    sort_order: 1,
    is_active: 1
  },
  {
    id: 'business-cottage',
    name: 'cottage',
    display_name_line1: 'Holiday Cottage',
    display_name_line2: 'BANSHIRO',
    description: 'Holiday Cottage BANSHIROのオペレーションマニュアル',
    icon: null,
    color: '#2E8B57',
    theme_colors: '["#1e5631","#2E8B57","#3CB371"]',
    sort_order: 2,
    is_active: 1
  }
];

const users = [
  {
    id: 'cmk6i2dct0000ycavfdfm2e1i',
    email: 'admin@mocca.co.jp',
    password_hash: '$2b$12$q8peyE5Z5CXfZGhpvc3gPOe4CCMKQRRn7bMw/ybHFnO95l84bHFhG',
    name: '管理者',
    is_super_admin: 1,
    is_active: 1,
    avatar_url: null,
    font_size: 'MEDIUM'
  },
  {
    id: 'cmk6i2dic0001ycavd504e42r',
    email: 'test@mocca.co.jp',
    password_hash: '$2b$12$mxcASjjcuaBfg43WER11Cuq00lCpYFyZdeftlmgw.f0luG25xPa8y',
    name: 'テストユーザー',
    is_super_admin: 0,
    is_active: 1,
    avatar_url: null,
    font_size: 'MEDIUM'
  }
];

const businessAccess = [
  {
    id: 'cmk6i2did0003ycav9ctn0v9r',
    user_id: 'cmk6i2dic0001ycavd504e42r',
    business_id: 'business-restaurant',
    role: 'WORKER'
  }
];

const manuals = [
  {
    id: 'manual-opening-procedure',
    business_id: 'business-restaurant',
    title: '開店準備の手順',
    description: '毎日の開店準備の基本的な流れ',
    status: 'PUBLISHED',
    admin_only: 0,
    sort_order: 0,
    is_archived: 0,
    archived_at: null,
    version: 2,
    created_by: 'cmk6i2dct0000ycavfdfm2e1i',
    updated_by: 'cmk6i2dct0000ycavfdfm2e1i'
  },
  {
    id: 'manual-cooking-basics',
    business_id: 'business-restaurant',
    title: '基本の調理手順',
    description: '基本的な調理の流れとポイント',
    status: 'DRAFT',
    admin_only: 0,
    sort_order: 1,
    is_archived: 0,
    archived_at: null,
    version: 1,
    created_by: 'cmk6i2dct0000ycavfdfm2e1i',
    updated_by: 'cmk6i2dct0000ycavfdfm2e1i'
  },
  {
    id: 'manual-closing-procedure',
    business_id: 'business-restaurant',
    title: '閉店作業の手順',
    description: '閉店後の清掃と施錠の手順',
    status: 'PUBLISHED',
    admin_only: 0,
    sort_order: 2,
    is_archived: 0,
    archived_at: null,
    version: 1,
    created_by: 'cmk6i2dct0000ycavfdfm2e1i',
    updated_by: 'cmk6i2dct0000ycavfdfm2e1i'
  },
  {
    id: 'manual-checkin-prep',
    business_id: 'business-cottage',
    title: 'チェックイン前',
    description: 'お客様をお迎えする前の準備作業',
    status: 'PUBLISHED',
    admin_only: 0,
    sort_order: 0,
    is_archived: 0,
    archived_at: null,
    version: 1,
    created_by: 'cmk6i2dct0000ycavfdfm2e1i',
    updated_by: 'cmk6i2dct0000ycavfdfm2e1i'
  },
  {
    id: 'manual-admin-usage',
    business_id: 'business-restaurant',
    title: '【管理者向け】システム使用マニュアル',
    description: 'Mocca Operationシステムの管理者向け操作ガイド',
    status: 'PUBLISHED',
    admin_only: 0,
    sort_order: 3,
    is_archived: 0,
    archived_at: null,
    version: 1,
    created_by: 'cmk6i2dct0000ycavfdfm2e1i',
    updated_by: 'cmk6i2dct0000ycavfdfm2e1i'
  },
  {
    id: 'manual-worker-usage',
    business_id: 'business-restaurant',
    title: '【作業者向け】システム使用マニュアル',
    description: 'Mocca Operationシステムの作業者向け操作ガイド',
    status: 'PUBLISHED',
    admin_only: 0,
    sort_order: 4,
    is_archived: 0,
    archived_at: null,
    version: 1,
    created_by: 'cmk6i2dct0000ycavfdfm2e1i',
    updated_by: 'cmk6i2dct0000ycavfdfm2e1i'
  },
  {
    id: 'manual-checkout',
    business_id: 'business-cottage',
    title: 'チェックアウト後',
    description: 'お客様チェックアウト後の清掃・点検・補充作業の手順',
    status: 'PUBLISHED',
    admin_only: 0,
    sort_order: 1,
    is_archived: 0,
    archived_at: null,
    version: 1,
    created_by: 'cmk6i2dct0000ycavfdfm2e1i',
    updated_by: 'cmk6i2dct0000ycavfdfm2e1i'
  }
];

const blocks = [
  // manual-opening-procedure blocks
  { id: 'block-1', manual_id: 'manual-opening-procedure', type: 'TEXT', content: '{"type":"text","text":"店舗に到着したら、まず入口の鍵を開けます。鍵は右に2回回して解錠します。","format":"plain"}', sort_order: 1 },
  { id: 'block-2', manual_id: 'manual-opening-procedure', type: 'WARNING', content: '{"type":"warning","level":"warning","title":"注意","text":"セキュリティシステムが作動している場合は、30秒以内に暗証番号を入力してください。"}', sort_order: 2 },
  { id: 'block-3', manual_id: 'manual-opening-procedure', type: 'TEXT', content: '{"type":"text","text":"店内の照明をつけ、空調を稼働させます。夏季は冷房25度、冬季は暖房22度に設定します。","format":"plain"}', sort_order: 3 },
  { id: 'block-4', manual_id: 'manual-opening-procedure', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"開店前チェックリスト","items":["トイレの清掃状態を確認","テーブルの配置を確認","食器の補充を確認","メニューの配置を確認"]}', sort_order: 4 },

  // manual-checkin-prep blocks
  { id: 'checkin-block-1', manual_id: 'manual-checkin-prep', type: 'TEXT', content: '{"type":"text","text":"コテージに到着したら、まず鍵を開けて入室します。入口のドアは右に回して開錠し、中に入ったら靴を脱いで備え付けのスリッパに履き替えてください。","format":"plain"}', sort_order: 1 },
  { id: 'checkin-block-2', manual_id: 'manual-checkin-prep', type: 'WARNING', content: '{"type":"warning","level":"danger","title":"重要：ガスの確認","text":"入室後、必ずガスの元栓が閉まっていることを確認してください。ガス漏れの臭いがする場合は、窓を開けて換気し、すぐに管理者に連絡してください。火気の使用は厳禁です。"}', sort_order: 2 },
  { id: 'checkin-block-3', manual_id: 'manual-checkin-prep', type: 'IMAGE', content: '{"type":"image","url":"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800","alt":"コテージリビングルーム","caption":"リビングルームの正しい配置例"}', sort_order: 3 },
  { id: 'checkin-block-4', manual_id: 'manual-checkin-prep', type: 'TEXT', content: '{"type":"text","text":"全ての窓を開けて換気を行います。15分以上の換気を推奨します。その間に他の準備作業を進めましょう。\\n\\n換気中は網戸を閉めて、虫が入らないように注意してください。","format":"plain"}', sort_order: 4 },
  { id: 'checkin-block-5', manual_id: 'manual-checkin-prep', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"リビングルームチェックリスト","items":[{"text":"ソファのクッションを整える","imageUrl":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600","videoUrl":"https://www.youtube.com/watch?v=jNQXAC9IVRw"},{"text":"テーブルを拭く","imageUrl":"https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600"},{"text":"リモコンを所定の位置に配置","videoUrl":"https://www.youtube.com/watch?v=9bZkp7q19f0"},{"text":"ゴミ箱が空であることを確認"}]}', sort_order: 5 },
  { id: 'checkin-block-6', manual_id: 'manual-checkin-prep', type: 'WARNING', content: '{"type":"warning","level":"warning","title":"エアコン設定について","text":"夏季は26度、冬季は20度を目安に設定してください。チェックイン1時間前にはエアコンを稼働させ、快適な室温でお客様をお迎えしましょう。"}', sort_order: 6 },
  { id: 'checkin-block-7', manual_id: 'manual-checkin-prep', type: 'VIDEO', content: '{"type":"video","provider":"youtube","videoId":"dQw4w9WgXcQ","title":"ベッドメイキングの手順動画"}', sort_order: 7 },
  { id: 'checkin-block-8', manual_id: 'manual-checkin-prep', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"ベッドルームチェックリスト","items":[{"text":"シーツの交換・シワを伸ばす","imageUrl":"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600","videoUrl":"https://www.youtube.com/watch?v=kJQP7kiw5Fk"},{"text":"枕を2つずつ配置","imageUrl":"https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600"},{"text":"ブランケットを足元に畳んで配置","videoUrl":"https://www.youtube.com/watch?v=fJ9rUzIMcZQ"},{"text":"ナイトテーブルの清掃"},{"text":"照明の動作確認","videoUrl":"https://www.youtube.com/watch?v=RgKAFK5djSk"}]}', sort_order: 8 },
  { id: 'checkin-block-9', manual_id: 'manual-checkin-prep', type: 'WARNING', content: '{"type":"warning","level":"info","title":"アメニティの補充について","text":"バスルームのアメニティ（シャンプー、コンディショナー、ボディソープ）は残量が半分以下の場合、新しいものに交換してください。タオルは人数分×2セットを用意します。"}', sort_order: 9 },
  { id: 'checkin-block-10', manual_id: 'manual-checkin-prep', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"最終チェックリスト","items":[{"text":"全ての照明が点灯するか確認","videoUrl":"https://www.youtube.com/watch?v=OPf0YbXqDm0"},{"text":"テレビ・エアコンのリモコン動作確認","videoUrl":"https://www.youtube.com/watch?v=JGwWNGJdvx8"},{"text":"Wi-Fiパスワードカードを設置","imageUrl":"https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600"},{"text":"ウェルカムカードと案内を配置","imageUrl":"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600","videoUrl":"https://www.youtube.com/watch?v=hT_nvWreIhg"},{"text":"玄関の靴箱を整頓"},{"text":"窓を閉めて施錠","videoUrl":"https://www.youtube.com/watch?v=CevxZvSJLk8"}]}', sort_order: 10 },
  { id: 'cmk6ikuf40001ycepad1tj1ou', manual_id: 'manual-checkin-prep', type: 'TEXT', content: '{"type":"text","text":"あいうえお","format":"plain"}', sort_order: 11 },

  // manual-checkout blocks
  { id: 'checkout-block-1', manual_id: 'manual-checkout', type: 'TEXT', content: '{"type":"text","text":"チェックアウト後は、次のお客様を迎えるための準備を行います。清掃・点検・補充の順番で作業を進めましょう。\\n\\n【所要時間目安】\\n・1LDKタイプ: 約2時間\\n・2LDKタイプ: 約3時間\\n\\n作業は必ず2名以上で行ってください。","format":"plain"}', sort_order: 1 },
  { id: 'checkout-block-2', manual_id: 'manual-checkout', type: 'WARNING', content: '{"type":"warning","level":"warning","title":"忘れ物の確認","text":"清掃前に必ず全ての部屋を確認し、忘れ物がないかチェックしてください。忘れ物があった場合は、すぐに管理者に報告してください。"}', sort_order: 2 },
  { id: 'checkout-block-3', manual_id: 'manual-checkout', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"リビング・ダイニング清掃チェックリスト","items":[{"text":"ソファ・クッションの清掃と配置","imageUrl":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"},{"text":"テーブル・椅子の拭き掃除"},{"text":"床の掃除機がけとモップがけ"},{"text":"ゴミ箱の中身を回収・新しい袋をセット"},{"text":"リモコン類の消毒と配置"},{"text":"エアコンフィルターの確認"}]}', sort_order: 3 },
  { id: 'checkout-block-4', manual_id: 'manual-checkout', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"キッチン清掃チェックリスト","items":[{"text":"シンクの清掃と消毒"},{"text":"コンロ周りの油汚れ除去"},{"text":"冷蔵庫内の確認・清掃"},{"text":"電子レンジ・トースターの清掃"},{"text":"食器類の洗浄・収納"},{"text":"調味料・消耗品の補充確認"}]}', sort_order: 4 },
  { id: 'checkout-block-5', manual_id: 'manual-checkout', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"ベッドルーム清掃チェックリスト","items":[{"text":"シーツ・枕カバーの交換","imageUrl":"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600"},{"text":"布団カバーの交換（汚れがある場合）"},{"text":"マットレスの点検"},{"text":"床の清掃"},{"text":"クローゼット内の確認"},{"text":"ハンガーの数の確認（10本）"}]}', sort_order: 5 },
  { id: 'checkout-block-6', manual_id: 'manual-checkout', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"バスルーム・トイレ清掃チェックリスト","items":[{"text":"浴槽の清掃・消毒"},{"text":"鏡・蛇口の水垢除去"},{"text":"排水口の髪の毛除去"},{"text":"トイレの清掃・消毒"},{"text":"タオル類の交換"},{"text":"アメニティの補充"},{"text":"換気扇の動作確認"}]}', sort_order: 6 },
  { id: 'checkout-block-7', manual_id: 'manual-checkout', type: 'WARNING', content: '{"type":"warning","level":"danger","title":"設備破損・異常の報告","text":"清掃中に設備の破損や異常を発見した場合は、作業を中断し、直ちに管理者に報告してください。修理が必要な場合は次の予約に影響する可能性があります。"}', sort_order: 7 },
  { id: 'checkout-block-8', manual_id: 'manual-checkout', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"消耗品・備品補充チェックリスト","items":[{"text":"トイレットペーパー（予備含め3ロール）"},{"text":"ティッシュペーパー（各部屋1箱）"},{"text":"シャンプー・コンディショナー・ボディソープ"},{"text":"歯ブラシセット（人数分＋2）"},{"text":"コーヒー・紅茶・お茶パック"},{"text":"ゴミ袋（各サイズ5枚ずつ）"}]}', sort_order: 8 },
  { id: 'checkout-block-9', manual_id: 'manual-checkout', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"最終確認チェックリスト","items":[{"text":"全ての窓の施錠確認"},{"text":"全ての照明の動作確認"},{"text":"エアコンの動作確認"},{"text":"Wi-Fiの接続確認"},{"text":"テレビの動作確認"},{"text":"玄関の清掃と靴箱の確認"},{"text":"外回りの確認（テラス・駐車場）"}]}', sort_order: 9 },
  { id: 'checkout-block-10', manual_id: 'manual-checkout', type: 'TEXT', content: '{"type":"text","text":"全ての作業が完了したら、管理システムから作業完了報告を行ってください。\\n\\n【報告内容】\\n・作業完了時刻\\n・特記事項（汚れがひどかった箇所、修理が必要な箇所など）\\n・使用した消耗品の数\\n\\n報告後、次のお客様のチェックイン時間まで待機となります。","format":"plain"}', sort_order: 10 },
  { id: 'cmk6lde900003yc7esh0cl4su', manual_id: 'manual-checkout', type: 'PHOTO_RECORD', content: '{"type":"photo_record","title":"いたのま","description":"","required":true}', sort_order: 11 },
  { id: 'cmk7o7fgq00018o36q2gpm55s', manual_id: 'manual-checkout', type: 'PHOTO_RECORD', content: '{"type":"photo_record","title":"バスルーム清掃完了","description":"浴槽、洗面台、トイレがすべて清掃済みであることを確認して撮影してください。","required":true,"referenceImageUrl":"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"}', sort_order: 12 },
  { id: 'cmk7o7fgs00038o36c5r4muj2', manual_id: 'manual-checkout', type: 'PHOTO_RECORD', content: '{"type":"photo_record","title":"ベッドメイキング完了","description":"シーツ、枕カバーが新しいものに交換され、きれいに整えられていることを撮影してください。","required":true,"referenceImageUrl":"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"}', sort_order: 13 },
  { id: 'cmk7o7fgt00058o36jmagdo3f', manual_id: 'manual-checkout', type: 'PHOTO_RECORD', content: '{"type":"photo_record","title":"キッチン清掃完了","description":"シンク、コンロ、冷蔵庫内が清掃済みであることを撮影してください。","required":false,"referenceImageUrl":"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"}', sort_order: 14 },
  { id: 'cmk7o7fgt00078o366cx7wola', manual_id: 'manual-checkout', type: 'PHOTO_RECORD', content: '{"type":"photo_record","title":"リビング全体","description":"リビング全体が整頓されていることを撮影してください。","required":true,"referenceImageUrl":"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"}', sort_order: 15 },

  // manual-admin-usage blocks
  { id: 'admin-usage-block-1', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"ログインページにアクセスし、登録されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\\n\\nログインに成功すると、ダッシュボード（マニュアル一覧画面）が表示されます。","format":"plain"}', sort_order: 1 },
  { id: 'admin-usage-block-2', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"画面は以下の要素で構成されています：\\n\\n【ヘッダー（上部）】\\n• 事業切り替え：事業名をクリックして切り替え\\n• 検索ボタン：マニュアル・ステップを検索\\n• 通知ベル：新しいメモの通知を確認\\n• メニュー（三本線アイコン）：設定やログアウト\\n\\n【サイドバー（左側・PC表示時）】\\n• 「トップに戻る」：マニュアル一覧へ戻る\\n• カテゴリ一覧：クリックで展開しマニュアルを表示","format":"plain"}', sort_order: 2 },
  { id: 'admin-usage-block-3', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"右上のメニュー（三本線アイコン）を開き、「カテゴリ管理」をクリックすると、カテゴリ管理画面が開きます。\\n\\n【できること】\\n• カテゴリの新規作成：「カテゴリを追加」ボタンをクリック\\n• カテゴリ名・説明の編集：鉛筆アイコンをクリック\\n• カテゴリの削除：ゴミ箱アイコンをクリック（マニュアルがある場合は削除不可）\\n• 並び順の変更：ドラッグ＆ドロップで移動","format":"plain"}', sort_order: 3 },
  { id: 'admin-usage-block-4', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"新しいマニュアルを作成するには：\\n\\n1. マニュアル一覧画面（トップページ）で「新規マニュアル」ボタンをクリック\\n2. カテゴリを選択\\n3. タイトルと説明を入力\\n4. 「作成」ボタンをクリック\\n\\n作成後、編集画面が開きます。\\n\\n※「新規マニュアル」ボタンはスーパー管理者のみ表示されます。","format":"plain"}', sort_order: 4 },
  { id: 'admin-usage-block-5', manual_id: 'manual-admin-usage', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"追加できるブロック（ステップ）の種類","items":[{"text":"テキスト：説明文や手順を記載"},{"text":"画像：ドラッグ＆ドロップまたはファイル選択でアップロード（JPEG/PNG/GIF/WebP、最大10MB）"},{"text":"YouTube動画：YouTubeのURLを貼り付けて埋め込み"},{"text":"注意事項：情報（青）・注意（黄）・危険（赤）の3段階で表示"},{"text":"チェックポイント：確認項目をリスト形式で表示（作業時にチェック可能）"}]}', sort_order: 5 },
  { id: 'admin-usage-block-6', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"編集画面で「ステップを追加」ボタンをクリックし、追加したいブロックの種類を選択します。\\n\\n各ブロックは以下の操作が可能です：\\n• ドラッグ＆ドロップで並び替え（左端のハンドルを掴む）\\n• 鉛筆アイコンで編集\\n• ゴミ箱アイコンで削除\\n\\nタイトルと説明は直接クリックして編集でき、自動で保存されます。","format":"plain"}', sort_order: 6 },
  { id: 'admin-usage-block-7', manual_id: 'manual-admin-usage', type: 'WARNING', content: '{"type":"warning","level":"info","title":"公開設定について","text":"マニュアルは作成時は「下書き」状態です。\\n\\n編集画面のツールバーにある「公開する」ボタンをクリックすると、作業者にも表示されるようになります。公開中のマニュアルは「非公開にする」で再び下書きに戻せます。\\n\\n下書きのマニュアルは管理者にのみ表示されます。"}', sort_order: 7 },
  { id: 'admin-usage-block-8', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"重要な変更を加える前に、現在の状態を保存できます：\\n\\n1. 編集画面の「プレビュー版を保存」をクリック\\n2. コメントを入力して保存（任意）\\n3. 「バージョン履歴」で過去のバージョンを確認\\n\\n【バージョン履歴でできること】\\n• プレビュー：内容を確認（画像・動画含む）\\n• 復元：過去のバージョンに戻す（現在の内容は自動バックアップ）\\n• 削除：不要なバージョンを削除","format":"plain"}', sort_order: 8 },
  { id: 'admin-usage-block-9', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"編集画面のツールバーから以下の操作ができます：\\n\\n• プレビュー：閲覧モードで表示を確認\\n• 複製：同じ内容のマニュアルをコピーして新規作成\\n• 削除：マニュアルを完全に削除（この操作は取り消せません）\\n\\nPC表示ではボタンが並んで表示され、モバイル表示ではドロップダウンメニューにまとめられます。","format":"plain"}', sort_order: 9 },
  { id: 'admin-usage-block-10', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"ヘッダーの検索アイコン（虫めがね）をクリックすると、検索ダイアログが開きます。\\n\\n【検索機能】\\n• 2文字以上のキーワードで検索可能\\n• マニュアルのタイトル・説明・ステップ内容を横断検索\\n• 「現在の事業内」または「すべての事業」から検索範囲を選択可能\\n\\n検索結果をクリックすると、該当のマニュアル・ステップまで自動で移動し、ハイライト表示されます。\\n\\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。","format":"plain"}', sort_order: 10 },
  { id: 'admin-usage-block-11', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"マニュアル閲覧画面で「PDF」ボタンをクリックすると、現在のマニュアルをPDFファイルとしてダウンロードできます。\\n\\n【PDF出力の内容】\\n• マニュアルのタイトル・説明\\n• すべてのステップ（テキスト、画像、注意事項、チェックポイント）\\n• 日本語フォント対応\\n\\n印刷やオフラインでの閲覧に便利です。","format":"plain"}', sort_order: 11 },
  { id: 'admin-usage-block-12', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"各ステップにはメモを追加できます。ステップの右上にあるメモアイコン（吹き出し）をクリックして、「作業メモ」パネルを開きます。\\n\\n【メモの種類】\\n• 個人用（鍵アイコン）：自分だけに表示\\n• 全体向け（地球アイコン）：全員に表示され、通知が送信される\\n\\n【操作】\\n• 「メモを追加」で新規作成\\n• 自分のメモは編集・削除が可能\\n• スーパー管理者は他人のメモも削除可能","format":"plain"}', sort_order: 12 },
  { id: 'admin-usage-block-13', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\\n\\n【通知される内容】\\n• 全体向けメモが投稿された時\\n\\n【操作】\\n• クリックで該当マニュアルへ移動\\n• 「すべて既読にする」で一括既読\\n• 個別に削除も可能","format":"plain"}', sort_order: 13 },
  { id: 'admin-usage-block-14', manual_id: 'manual-admin-usage', type: 'TEXT', content: '{"type":"text","text":"右上のメニュー（三本線アイコン）から「設定」をクリックすると、アカウント設定画面が開きます。\\n\\n【設定できること】\\n• プロフィール：表示名の変更（メールアドレスは変更不可）\\n• パスワード変更：新しいパスワードは8文字以上","format":"plain"}', sort_order: 14 },
  { id: 'admin-usage-block-15', manual_id: 'manual-admin-usage', type: 'WARNING', content: '{"type":"warning","level":"info","title":"スーパー管理者のみの機能","text":"スーパー管理者は、右上のメニューに「管理者メニュー」が表示されます。\\n\\n• ユーザー管理：ユーザーの追加・編集・削除、事業へのアクセス権付与\\n• 事業管理：事業の追加・編集・削除、テーマカラー設定\\n\\n通常の管理者には表示されません。"}', sort_order: 15 },
  { id: 'admin-usage-block-16', manual_id: 'manual-admin-usage', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"管理者ができること まとめ","items":[{"text":"カテゴリの作成・編集・削除・並び替え"},{"text":"マニュアルの作成・編集・複製・削除"},{"text":"ブロック（ステップ）の追加・編集・削除・並び替え"},{"text":"マニュアルの公開/非公開の切り替え"},{"text":"バージョンの保存・復元・削除"},{"text":"PDF出力"},{"text":"メモの追加（個人用・全体向け）"},{"text":"通知の確認"},{"text":"文字サイズ・パスワードなどの設定変更"}]}', sort_order: 16 },

  // manual-worker-usage blocks
  { id: 'worker-usage-block-1', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"ログインページにアクセスし、管理者から共有されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\\n\\nログインに成功すると、マニュアル一覧画面が表示されます。","format":"plain"}', sort_order: 1 },
  { id: 'worker-usage-block-2', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"画面は以下の要素で構成されています：\\n\\n【ヘッダー（上部）】\\n• 事業名：クリックして事業を切り替え（複数事業へのアクセス権がある場合）\\n• 検索アイコン（虫めがね）：マニュアルやステップを検索\\n• 通知ベル：新しいメモの通知を確認\\n• メニュー（三本線）：設定やログアウト\\n\\n【サイドバー（左側・PC表示時）】\\n• カテゴリ一覧：クリックして展開するとマニュアルが表示されます","format":"plain"}', sort_order: 2 },
  { id: 'worker-usage-block-3', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"マニュアル一覧画面またはサイドバーから、閲覧したいマニュアルをクリックします。\\n\\n【マニュアル一覧画面】\\n• カテゴリボタンでフィルタリング\\n• 「公開済み」のマニュアルが表示されます\\n\\nマニュアルを開くと、ステップごとに内容が表示されます。画像や動画がある場合は、その場で確認できます。","format":"plain"}', sort_order: 3 },
  { id: 'worker-usage-block-4', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"探しているマニュアルやステップがすぐに見つからない場合は、ヘッダーの検索アイコン（虫めがね）をクリックして検索できます。\\n\\n【検索機能】\\n• 2文字以上のキーワードで検索可能\\n• 「現在の事業内」または「すべての事業」から検索範囲を選択\\n• マニュアルのタイトル・説明・ステップ内容を横断検索\\n\\n結果をクリックすると、該当箇所まで自動で移動し、ハイライト表示されます。\\n\\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。","format":"plain"}', sort_order: 4 },
  { id: 'worker-usage-block-5', manual_id: 'manual-worker-usage', type: 'WARNING', content: '{"type":"warning","level":"info","title":"チェックポイントの活用","text":"チェックポイントブロックでは、各項目をクリックしてチェックを入れることができます。\\n\\nチェック項目に画像や動画が添付されている場合は、右側のカメラアイコンや動画アイコンをクリックすると確認できます。\\n\\n※チェック状態はページを離れるとリセットされます。"}', sort_order: 5 },
  { id: 'worker-usage-block-6', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"【画像ブロック】\\nそのまま表示されます。キャプション（説明文）がある場合は画像の下に表示されます。\\n\\n【動画ブロック（YouTube）】\\n埋め込みプレーヤーで再生できます。\\n\\n【注意事項ブロック】\\n重要度に応じて色分けされています：\\n• 青（情報）：参考情報\\n• 黄（注意）：注意が必要な内容\\n• 赤（危険）：特に重要な警告","format":"plain"}', sort_order: 6 },
  { id: 'worker-usage-block-7', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"各ステップの右上にメモアイコン（吹き出し）があります。数字が表示されている場合は、メモが投稿されています。\\n\\nクリックすると「作業メモ」パネルが開きます。\\n\\n【メモの種類】\\n• 個人用（鍵アイコン）：自分だけに表示される覚書\\n• 全体向け（地球アイコン）：他のスタッフにも表示\\n\\n「メモを追加」ボタンからあなた自身もメモを投稿できます。","format":"plain"}', sort_order: 7 },
  { id: 'worker-usage-block-8', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\\n\\n【通知される内容】\\n• 誰かが「全体向け」メモを投稿した時\\n\\nクリックすると該当のマニュアルに移動できます。「すべて既読にする」で一括既読も可能です。","format":"plain"}', sort_order: 8 },
  { id: 'worker-usage-block-9', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"マニュアルをPDFとして保存したい場合は、マニュアル閲覧画面の「PDF」ボタンをクリックします。\\n\\nダウンロードしたPDFは、スマートフォンやタブレットに保存して、オフラインでも確認できます。\\n\\n※画像も含まれます。","format":"plain"}', sort_order: 9 },
  { id: 'worker-usage-block-10', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"画面右上のメニュー（三本線アイコン）を開くと、「文字サイズ」欄があります。\\n\\n4段階（小・中・大・特大）から選択でき、読みやすいサイズに調整してください。\\n\\n設定は次回ログイン時も保持されます。","format":"plain"}', sort_order: 10 },
  { id: 'worker-usage-block-11', manual_id: 'manual-worker-usage', type: 'TEXT', content: '{"type":"text","text":"右上のメニュー（三本線アイコン）からは以下の操作ができます：\\n\\n• お知らせ：通知一覧を表示\\n• 設定：プロフィール（名前）やパスワードの変更\\n• ログアウト：作業終了時にクリック\\n\\n共有端末を使用している場合は、必ずログアウトしてください。","format":"plain"}', sort_order: 11 },
  { id: 'worker-usage-block-12', manual_id: 'manual-worker-usage', type: 'WARNING', content: '{"type":"warning","level":"warning","title":"注意事項","text":"• パスワードは他人と共有しないでください\\n• マニュアルの内容に誤りを見つけた場合は、管理者に報告してください\\n• 不明な点があれば、管理者に質問してください"}', sort_order: 12 },
  { id: 'worker-usage-block-13', manual_id: 'manual-worker-usage', type: 'CHECKPOINT', content: '{"type":"checkpoint","title":"作業者ができること まとめ","items":[{"text":"マニュアルの閲覧（公開済みのみ）"},{"text":"マニュアル・ステップの検索（事業内/全事業）"},{"text":"チェックポイントのチェック"},{"text":"画像・動画の確認"},{"text":"メモの閲覧と追加（個人用/全体向け）"},{"text":"通知の確認"},{"text":"PDF出力"},{"text":"文字サイズ・パスワードなどの設定変更"}]}', sort_order: 13 }
];

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function executeSQL(sql) {
  try {
    execSync(`cd "/Users/t.tsubasa/Desktop/Mocca Operation/mocca-operation" && npx wrangler d1 execute mocca-operation-db --remote --command ${escapeSQL(sql)}`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    return true;
  } catch (error) {
    console.error('SQL Error:', sql.substring(0, 100));
    console.error(error.message);
    return false;
  }
}

async function migrate() {
  console.log('=== 本番環境へのデータ移行開始 ===\n');

  // 1. Insert businesses
  console.log('1. 事業データを挿入中...');
  for (const b of businesses) {
    const sql = `INSERT INTO "businesses" ("id", "name", "display_name_line1", "display_name_line2", "description", "icon", "color", "theme_colors", "sort_order", "is_active", "created_at", "updated_at") VALUES ('${b.id}', '${b.name}', '${b.display_name_line1}', '${b.display_name_line2}', '${b.description}', ${b.icon === null ? 'NULL' : `'${b.icon}'`}, '${b.color}', '${b.theme_colors}', ${b.sort_order}, ${b.is_active}, datetime('now'), datetime('now'))`;
    if (executeSQL(sql)) {
      console.log(`  ✓ ${b.display_name_line1} ${b.display_name_line2}`);
    }
  }

  // 2. Insert users
  console.log('\n2. ユーザーデータを挿入中...');
  for (const u of users) {
    const sql = `INSERT INTO "users" ("id", "email", "password_hash", "name", "is_super_admin", "is_active", "avatar_url", "font_size", "created_at", "updated_at") VALUES ('${u.id}', '${u.email}', '${u.password_hash}', '${u.name}', ${u.is_super_admin}, ${u.is_active}, ${u.avatar_url === null ? 'NULL' : `'${u.avatar_url}'`}, '${u.font_size}', datetime('now'), datetime('now'))`;
    if (executeSQL(sql)) {
      console.log(`  ✓ ${u.name} (${u.email})`);
    }
  }

  // 3. Insert business_access
  console.log('\n3. アクセス権限を挿入中...');
  for (const ba of businessAccess) {
    const sql = `INSERT INTO "business_access" ("id", "user_id", "business_id", "role", "created_at", "updated_at") VALUES ('${ba.id}', '${ba.user_id}', '${ba.business_id}', '${ba.role}', datetime('now'), datetime('now'))`;
    if (executeSQL(sql)) {
      console.log(`  ✓ ${ba.role} -> ${ba.business_id}`);
    }
  }

  // 4. Insert manuals
  console.log('\n4. マニュアルを挿入中...');
  for (const m of manuals) {
    const sql = `INSERT INTO "manuals" ("id", "business_id", "title", "description", "status", "admin_only", "sort_order", "is_archived", "archived_at", "version", "created_by", "updated_by", "created_at", "updated_at") VALUES ('${m.id}', '${m.business_id}', '${m.title.replace(/'/g, "''")}', '${m.description.replace(/'/g, "''")}', '${m.status}', ${m.admin_only}, ${m.sort_order}, ${m.is_archived}, ${m.archived_at === null ? 'NULL' : `'${m.archived_at}'`}, ${m.version}, '${m.created_by}', '${m.updated_by}', datetime('now'), datetime('now'))`;
    if (executeSQL(sql)) {
      console.log(`  ✓ ${m.title}`);
    }
  }

  // 5. Insert blocks
  console.log('\n5. ブロックを挿入中...');
  let blockCount = 0;
  for (const b of blocks) {
    const escapedContent = b.content.replace(/'/g, "''");
    const sql = `INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at") VALUES ('${b.id}', '${b.manual_id}', '${b.type}', '${escapedContent}', ${b.sort_order}, datetime('now'), datetime('now'))`;
    if (executeSQL(sql)) {
      blockCount++;
    }
  }
  console.log(`  ✓ ${blockCount}件のブロックを挿入しました`);

  console.log('\n=== データ移行完了 ===');
  console.log(`\n事業: ${businesses.length}件`);
  console.log(`ユーザー: ${users.length}件`);
  console.log(`マニュアル: ${manuals.length}件`);
  console.log(`ブロック: ${blocks.length}件`);
}

migrate().catch(console.error);
