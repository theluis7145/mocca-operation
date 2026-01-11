-- ブロック: 管理者向けシステム使用マニュアル
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-1', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"ログインページにアクセスし、登録されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\n\nログインに成功すると、ダッシュボード（マニュアル一覧画面）が表示されます。","format":"plain"}', 1, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-2', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"画面は以下の要素で構成されています：\n\n【ヘッダー（上部）】\n• 事業切り替え：事業名をクリックして切り替え\n• 検索ボタン：マニュアル・ステップを検索\n• 通知ベル：新しいメモの通知を確認\n• メニュー（三本線アイコン）：設定やログアウト\n\n【サイドバー（左側・PC表示時）】\n• 「トップに戻る」：マニュアル一覧へ戻る\n• カテゴリ一覧：クリックで展開しマニュアルを表示","format":"plain"}', 2, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-3', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"右上のメニュー（三本線アイコン）を開き、「カテゴリ管理」をクリックすると、カテゴリ管理画面が開きます。\n\n【できること】\n• カテゴリの新規作成：「カテゴリを追加」ボタンをクリック\n• カテゴリ名・説明の編集：鉛筆アイコンをクリック\n• カテゴリの削除：ゴミ箱アイコンをクリック（マニュアルがある場合は削除不可）\n• 並び順の変更：ドラッグ＆ドロップで移動","format":"plain"}', 3, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-4', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"新しいマニュアルを作成するには：\n\n1. マニュアル一覧画面（トップページ）で「新規マニュアル」ボタンをクリック\n2. カテゴリを選択\n3. タイトルと説明を入力\n4. 「作成」ボタンをクリック\n\n作成後、編集画面が開きます。\n\n※「新規マニュアル」ボタンはスーパー管理者のみ表示されます。","format":"plain"}', 4, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-5', 'manual-admin-usage', 'CHECKPOINT', '{"type":"checkpoint","title":"追加できるブロック（ステップ）の種類","items":[{"text":"テキスト：説明文や手順を記載"},{"text":"画像：ドラッグ＆ドロップまたはファイル選択でアップロード（JPEG/PNG/GIF/WebP、最大10MB）"},{"text":"YouTube動画：YouTubeのURLを貼り付けて埋め込み"},{"text":"注意事項：情報（青）・注意（黄）・危険（赤）の3段階で表示"},{"text":"チェックポイント：確認項目をリスト形式で表示（作業時にチェック可能）"}]}', 5, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-6', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"編集画面で「ステップを追加」ボタンをクリックし、追加したいブロックの種類を選択します。\n\n各ブロックは以下の操作が可能です：\n• ドラッグ＆ドロップで並び替え（左端のハンドルを掴む）\n• 鉛筆アイコンで編集\n• ゴミ箱アイコンで削除\n\nタイトルと説明は直接クリックして編集でき、自動で保存されます。","format":"plain"}', 6, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-7', 'manual-admin-usage', 'WARNING', '{"type":"warning","level":"info","title":"公開設定について","text":"マニュアルは作成時は「下書き」状態です。\n\n編集画面のツールバーにある「公開する」ボタンをクリックすると、作業者にも表示されるようになります。公開中のマニュアルは「非公開にする」で再び下書きに戻せます。\n\n下書きのマニュアルは管理者にのみ表示されます。"}', 7, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-8', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"重要な変更を加える前に、現在の状態を保存できます：\n\n1. 編集画面の「プレビュー版を保存」をクリック\n2. コメントを入力して保存（任意）\n3. 「バージョン履歴」で過去のバージョンを確認\n\n【バージョン履歴でできること】\n• プレビュー：内容を確認（画像・動画含む）\n• 復元：過去のバージョンに戻す（現在の内容は自動バックアップ）\n• 削除：不要なバージョンを削除","format":"plain"}', 8, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-9', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"編集画面のツールバーから以下の操作ができます：\n\n• プレビュー：閲覧モードで表示を確認\n• 複製：同じ内容のマニュアルをコピーして新規作成\n• 削除：マニュアルを完全に削除（この操作は取り消せません）\n\nPC表示ではボタンが並んで表示され、モバイル表示ではドロップダウンメニューにまとめられます。","format":"plain"}', 9, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-10', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"ヘッダーの検索アイコン（虫めがね）をクリックすると、検索ダイアログが開きます。\n\n【検索機能】\n• 2文字以上のキーワードで検索可能\n• マニュアルのタイトル・説明・ステップ内容を横断検索\n• 「現在の事業内」または「すべての事業」から検索範囲を選択可能\n\n検索結果をクリックすると、該当のマニュアル・ステップまで自動で移動し、ハイライト表示されます。\n\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。","format":"plain"}', 10, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-11', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"マニュアル閲覧画面で「PDF」ボタンをクリックすると、現在のマニュアルをPDFファイルとしてダウンロードできます。\n\n【PDF出力の内容】\n• マニュアルのタイトル・説明\n• すべてのステップ（テキスト、画像、注意事項、チェックポイント）\n• 日本語フォント対応\n\n印刷やオフラインでの閲覧に便利です。","format":"plain"}', 11, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-12', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"各ステップにはメモを追加できます。ステップの右上にあるメモアイコン（吹き出し）をクリックして、「作業メモ」パネルを開きます。\n\n【メモの種類】\n• 個人用（鍵アイコン）：自分だけに表示\n• 全体向け（地球アイコン）：全員に表示され、通知が送信される\n\n【操作】\n• 「メモを追加」で新規作成\n• 自分のメモは編集・削除が可能\n• スーパー管理者は他人のメモも削除可能","format":"plain"}', 12, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-13', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\n\n【通知される内容】\n• 全体向けメモが投稿された時\n\n【操作】\n• クリックで該当マニュアルへ移動\n• 「すべて既読にする」で一括既読\n• 個別に削除も可能","format":"plain"}', 13, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-14', 'manual-admin-usage', 'TEXT', '{"type":"text","text":"右上のメニュー（三本線アイコン）から「設定」をクリックすると、アカウント設定画面が開きます。\n\n【設定できること】\n• プロフィール：表示名の変更（メールアドレスは変更不可）\n• パスワード変更：新しいパスワードは8文字以上","format":"plain"}', 14, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-15', 'manual-admin-usage', 'WARNING', '{"type":"warning","level":"info","title":"スーパー管理者のみの機能","text":"スーパー管理者は、右上のメニューに「管理者メニュー」が表示されます。\n\n• ユーザー管理：ユーザーの追加・編集・削除、事業へのアクセス権付与\n• 事業管理：事業の追加・編集・削除、テーマカラー設定\n\n通常の管理者には表示されません。"}', 15, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('admin-usage-block-16', 'manual-admin-usage', 'CHECKPOINT', '{"type":"checkpoint","title":"管理者ができること まとめ","items":[{"text":"カテゴリの作成・編集・削除・並び替え"},{"text":"マニュアルの作成・編集・複製・削除"},{"text":"ブロック（ステップ）の追加・編集・削除・並び替え"},{"text":"マニュアルの公開/非公開の切り替え"},{"text":"バージョンの保存・復元・削除"},{"text":"PDF出力"},{"text":"メモの追加（個人用・全体向け）"},{"text":"通知の確認"},{"text":"文字サイズ・パスワードなどの設定変更"}]}', 16, datetime('now'), datetime('now'));

-- ブロック: 作業者向けシステム使用マニュアル
INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-1', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"ログインページにアクセスし、管理者から共有されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\n\nログインに成功すると、マニュアル一覧画面が表示されます。","format":"plain"}', 1, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-2', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"画面は以下の要素で構成されています：\n\n【ヘッダー（上部）】\n• 事業名：クリックして事業を切り替え（複数事業へのアクセス権がある場合）\n• 検索アイコン（虫めがね）：マニュアルやステップを検索\n• 通知ベル：新しいメモの通知を確認\n• メニュー（三本線）：設定やログアウト\n\n【サイドバー（左側・PC表示時）】\n• カテゴリ一覧：クリックして展開するとマニュアルが表示されます","format":"plain"}', 2, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-3', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"マニュアル一覧画面またはサイドバーから、閲覧したいマニュアルをクリックします。\n\n【マニュアル一覧画面】\n• カテゴリボタンでフィルタリング\n• 「公開済み」のマニュアルが表示されます\n\nマニュアルを開くと、ステップごとに内容が表示されます。画像や動画がある場合は、その場で確認できます。","format":"plain"}', 3, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-4', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"探しているマニュアルやステップがすぐに見つからない場合は、ヘッダーの検索アイコン（虫めがね）をクリックして検索できます。\n\n【検索機能】\n• 2文字以上のキーワードで検索可能\n• 「現在の事業内」または「すべての事業」から検索範囲を選択\n• マニュアルのタイトル・説明・ステップ内容を横断検索\n\n結果をクリックすると、該当箇所まで自動で移動し、ハイライト表示されます。\n\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。","format":"plain"}', 4, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-5', 'manual-worker-usage', 'WARNING', '{"type":"warning","level":"info","title":"チェックポイントの活用","text":"チェックポイントブロックでは、各項目をクリックしてチェックを入れることができます。\n\nチェック項目に画像や動画が添付されている場合は、右側のカメラアイコンや動画アイコンをクリックすると確認できます。\n\n※チェック状態はページを離れるとリセットされます。"}', 5, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-6', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"【画像ブロック】\nそのまま表示されます。キャプション（説明文）がある場合は画像の下に表示されます。\n\n【動画ブロック（YouTube）】\n埋め込みプレーヤーで再生できます。\n\n【注意事項ブロック】\n重要度に応じて色分けされています：\n• 青（情報）：参考情報\n• 黄（注意）：注意が必要な内容\n• 赤（危険）：特に重要な警告","format":"plain"}', 6, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-7', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"各ステップの右上にメモアイコン（吹き出し）があります。数字が表示されている場合は、メモが投稿されています。\n\nクリックすると「作業メモ」パネルが開きます。\n\n【メモの種類】\n• 個人用（鍵アイコン）：自分だけに表示される覚書\n• 全体向け（地球アイコン）：他のスタッフにも表示\n\n「メモを追加」ボタンからあなた自身もメモを投稿できます。","format":"plain"}', 7, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-8', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\n\n【通知される内容】\n• 誰かが「全体向け」メモを投稿した時\n\nクリックすると該当のマニュアルに移動できます。「すべて既読にする」で一括既読も可能です。","format":"plain"}', 8, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-9', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"マニュアルをPDFとして保存したい場合は、マニュアル閲覧画面の「PDF」ボタンをクリックします。\n\nダウンロードしたPDFは、スマートフォンやタブレットに保存して、オフラインでも確認できます。\n\n※画像も含まれます。","format":"plain"}', 9, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-10', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"画面右上のメニュー（三本線アイコン）を開くと、「文字サイズ」欄があります。\n\n4段階（小・中・大・特大）から選択でき、読みやすいサイズに調整してください。\n\n設定は次回ログイン時も保持されます。","format":"plain"}', 10, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-11', 'manual-worker-usage', 'TEXT', '{"type":"text","text":"右上のメニュー（三本線アイコン）からは以下の操作ができます：\n\n• お知らせ：通知一覧を表示\n• 設定：プロフィール（名前）やパスワードの変更\n• ログアウト：作業終了時にクリック\n\n共有端末を使用している場合は、必ずログアウトしてください。","format":"plain"}', 11, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-12', 'manual-worker-usage', 'WARNING', '{"type":"warning","level":"warning","title":"注意事項","text":"• パスワードは他人と共有しないでください\n• マニュアルの内容に誤りを見つけた場合は、管理者に報告してください\n• 不明な点があれば、管理者に質問してください"}', 12, datetime('now'), datetime('now'));

INSERT INTO "blocks" ("id", "manual_id", "type", "content", "sort_order", "created_at", "updated_at")
VALUES ('worker-usage-block-13', 'manual-worker-usage', 'CHECKPOINT', '{"type":"checkpoint","title":"作業者ができること まとめ","items":[{"text":"マニュアルの閲覧（公開済みのみ）"},{"text":"マニュアル・ステップの検索（事業内/全事業）"},{"text":"チェックポイントのチェック"},{"text":"画像・動画の確認"},{"text":"メモの閲覧と追加（個人用/全体向け）"},{"text":"通知の確認"},{"text":"PDF出力"},{"text":"文字サイズ・パスワードなどの設定変更"}]}', 13, datetime('now'), datetime('now'));
