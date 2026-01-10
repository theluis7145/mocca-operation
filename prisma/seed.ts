import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

// URLはschema.prismaに直接指定しているので、アダプターなしで使用
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 事業の作成
  const restaurant = await prisma.business.upsert({
    where: { id: 'business-restaurant' },
    update: {
      themeColors: JSON.stringify(['#8B4513', '#D2691E', '#CD853F']), // 茶色系グラデーション
    },
    create: {
      id: 'business-restaurant',
      name: 'restaurant',
      displayNameLine1: 'お食事処',
      displayNameLine2: 'もっか',
      description: 'お食事処 もっかのオペレーションマニュアル',
      color: '#8B4513',
      themeColors: JSON.stringify(['#8B4513', '#D2691E', '#CD853F']), // 茶色系グラデーション
      sortOrder: 1,
    },
  })
  console.log('Created business:', restaurant.name)

  const cottage = await prisma.business.upsert({
    where: { id: 'business-cottage' },
    update: {
      themeColors: JSON.stringify(['#1e5631', '#2E8B57', '#3CB371']), // 緑系グラデーション
    },
    create: {
      id: 'business-cottage',
      name: 'cottage',
      displayNameLine1: 'Holiday Cottage',
      displayNameLine2: 'BANSHIRO',
      description: 'Holiday Cottage BANSHIROのオペレーションマニュアル',
      color: '#2E8B57',
      themeColors: JSON.stringify(['#1e5631', '#2E8B57', '#3CB371']), // 緑系グラデーション
      sortOrder: 2,
    },
  })
  console.log('Created business:', cottage.name)

  // スーパー管理者ユーザーの作成
  const passwordHash = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mocca.co.jp' },
    update: {},
    create: {
      email: 'admin@mocca.co.jp',
      passwordHash,
      name: '管理者',
      isSuperAdmin: true,
    },
  })
  console.log('Created super admin user:', admin.email)

  // テストユーザーの作成
  const testPasswordHash = await hash('test123', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@mocca.co.jp' },
    update: {},
    create: {
      email: 'test@mocca.co.jp',
      passwordHash: testPasswordHash,
      name: 'テストユーザー',
      isSuperAdmin: false,
    },
  })
  console.log('Created test user:', testUser.email)

  // テストユーザーに事業アクセス権を付与
  await prisma.businessAccess.upsert({
    where: {
      userId_businessId: {
        userId: testUser.id,
        businessId: restaurant.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      businessId: restaurant.id,
      role: 'WORKER',
    },
  })
  console.log('Granted test user access to restaurant as WORKER')

  // 注: カテゴリレイヤーは削除済み。マニュアルは事業に直接紐付く。
  console.log('Category layer removed - manuals directly linked to businesses')

  // サンプルマニュアルの作成
  const sampleManual = await prisma.manual.upsert({
    where: { id: 'manual-opening-procedure' },
    update: {},
    create: {
      id: 'manual-opening-procedure',
      businessId: restaurant.id,
      title: '開店準備の手順',
      description: '毎日の開店準備の基本的な流れ',
      status: 'PUBLISHED',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })
  console.log('Created sample manual:', sampleManual.title)

  // サンプルブロックの作成
  await prisma.block.upsert({
    where: { id: 'block-1' },
    update: {},
    create: {
      id: 'block-1',
      manualId: sampleManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '店舗に到着したら、まず入口の鍵を開けます。鍵は右に2回回して解錠します。',
        format: 'plain',
      },
      sortOrder: 1,
    },
  })

  await prisma.block.upsert({
    where: { id: 'block-2' },
    update: {},
    create: {
      id: 'block-2',
      manualId: sampleManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'warning',
        title: '注意',
        text: 'セキュリティシステムが作動している場合は、30秒以内に暗証番号を入力してください。',
      },
      sortOrder: 2,
    },
  })

  await prisma.block.upsert({
    where: { id: 'block-3' },
    update: {},
    create: {
      id: 'block-3',
      manualId: sampleManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '店内の照明をつけ、空調を稼働させます。夏季は冷房25度、冬季は暖房22度に設定します。',
        format: 'plain',
      },
      sortOrder: 3,
    },
  })

  await prisma.block.upsert({
    where: { id: 'block-4' },
    update: {},
    create: {
      id: 'block-4',
      manualId: sampleManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: '開店前チェックリスト',
        items: [
          'トイレの清掃状態を確認',
          'テーブルの配置を確認',
          '食器の補充を確認',
          'メニューの配置を確認',
        ],
      },
      sortOrder: 4,
    },
  })
  console.log('Created sample blocks')

  // 調理マニュアルのサンプル
  await prisma.manual.upsert({
    where: { id: 'manual-cooking-basics' },
    update: {},
    create: {
      id: 'manual-cooking-basics',
      businessId: restaurant.id,
      title: '基本の調理手順',
      description: '基本的な調理の流れとポイント',
      status: 'DRAFT',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })

  await prisma.manual.upsert({
    where: { id: 'manual-closing-procedure' },
    update: {},
    create: {
      id: 'manual-closing-procedure',
      businessId: restaurant.id,
      title: '閉店作業の手順',
      description: '閉店後の清掃と施錠の手順',
      status: 'PUBLISHED',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })
  console.log('Created additional manuals')

  // BANSHIROチェックイン前作業テストマニュアル
  const checkinManual = await prisma.manual.upsert({
    where: { id: 'manual-checkin-prep' },
    update: {
      title: 'チェックイン前作業マニュアル',
      description: 'お客様をお迎えする前の準備作業（全10手順）',
      status: 'PUBLISHED',
    },
    create: {
      id: 'manual-checkin-prep',
      businessId: cottage.id,
      title: 'チェックイン前作業マニュアル',
      description: 'お客様をお迎えする前の準備作業（全10手順）',
      status: 'PUBLISHED',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })
  console.log('Created BANSHIRO checkin manual:', checkinManual.title)

  // 手順1: テキストブロック
  await prisma.block.upsert({
    where: { id: 'checkin-block-1' },
    update: {
      content: {
        type: 'text',
        text: 'コテージに到着したら、まず鍵を開けて入室します。入口のドアは右に回して開錠し、中に入ったら靴を脱いで備え付けのスリッパに履き替えてください。',
        format: 'plain',
      },
    },
    create: {
      id: 'checkin-block-1',
      manualId: checkinManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'コテージに到着したら、まず鍵を開けて入室します。入口のドアは右に回して開錠し、中に入ったら靴を脱いで備え付けのスリッパに履き替えてください。',
        format: 'plain',
      },
      sortOrder: 1,
    },
  })

  // 手順2: 警告ブロック（危険）
  await prisma.block.upsert({
    where: { id: 'checkin-block-2' },
    update: {
      content: {
        type: 'warning',
        level: 'danger',
        title: '重要：ガスの確認',
        text: '入室後、必ずガスの元栓が閉まっていることを確認してください。ガス漏れの臭いがする場合は、窓を開けて換気し、すぐに管理者に連絡してください。火気の使用は厳禁です。',
      },
    },
    create: {
      id: 'checkin-block-2',
      manualId: checkinManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'danger',
        title: '重要：ガスの確認',
        text: '入室後、必ずガスの元栓が閉まっていることを確認してください。ガス漏れの臭いがする場合は、窓を開けて換気し、すぐに管理者に連絡してください。火気の使用は厳禁です。',
      },
      sortOrder: 2,
    },
  })

  // 手順3: 画像ブロック
  await prisma.block.upsert({
    where: { id: 'checkin-block-3' },
    update: {
      content: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        alt: 'コテージリビングルーム',
        caption: 'リビングルームの正しい配置例',
      },
    },
    create: {
      id: 'checkin-block-3',
      manualId: checkinManual.id,
      type: 'IMAGE',
      content: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        alt: 'コテージリビングルーム',
        caption: 'リビングルームの正しい配置例',
      },
      sortOrder: 3,
    },
  })

  // 手順4: テキストブロック
  await prisma.block.upsert({
    where: { id: 'checkin-block-4' },
    update: {
      content: {
        type: 'text',
        text: '全ての窓を開けて換気を行います。15分以上の換気を推奨します。その間に他の準備作業を進めましょう。\n\n換気中は網戸を閉めて、虫が入らないように注意してください。',
        format: 'plain',
      },
    },
    create: {
      id: 'checkin-block-4',
      manualId: checkinManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '全ての窓を開けて換気を行います。15分以上の換気を推奨します。その間に他の準備作業を進めましょう。\n\n換気中は網戸を閉めて、虫が入らないように注意してください。',
        format: 'plain',
      },
      sortOrder: 4,
    },
  })

  // 手順5: チェックポイントブロック（画像・動画付き）
  await prisma.block.upsert({
    where: { id: 'checkin-block-5' },
    update: {
      content: {
        type: 'checkpoint',
        title: 'リビングルームチェックリスト',
        items: [
          { text: 'ソファのクッションを整える', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
          { text: 'テーブルを拭く', imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600' },
          { text: 'リモコンを所定の位置に配置', videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0' },
          { text: 'ゴミ箱が空であることを確認' },
        ],
      },
    },
    create: {
      id: 'checkin-block-5',
      manualId: checkinManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: 'リビングルームチェックリスト',
        items: [
          { text: 'ソファのクッションを整える', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
          { text: 'テーブルを拭く', imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600' },
          { text: 'リモコンを所定の位置に配置', videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0' },
          { text: 'ゴミ箱が空であることを確認' },
        ],
      },
      sortOrder: 5,
    },
  })

  // 手順6: 警告ブロック（注意）
  await prisma.block.upsert({
    where: { id: 'checkin-block-6' },
    update: {
      content: {
        type: 'warning',
        level: 'warning',
        title: 'エアコン設定について',
        text: '夏季は26度、冬季は20度を目安に設定してください。チェックイン1時間前にはエアコンを稼働させ、快適な室温でお客様をお迎えしましょう。',
      },
    },
    create: {
      id: 'checkin-block-6',
      manualId: checkinManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'warning',
        title: 'エアコン設定について',
        text: '夏季は26度、冬季は20度を目安に設定してください。チェックイン1時間前にはエアコンを稼働させ、快適な室温でお客様をお迎えしましょう。',
      },
      sortOrder: 6,
    },
  })

  // 手順7: 動画ブロック
  await prisma.block.upsert({
    where: { id: 'checkin-block-7' },
    update: {
      content: {
        type: 'video',
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        title: 'ベッドメイキングの手順動画',
      },
    },
    create: {
      id: 'checkin-block-7',
      manualId: checkinManual.id,
      type: 'VIDEO',
      content: {
        type: 'video',
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        title: 'ベッドメイキングの手順動画',
      },
      sortOrder: 7,
    },
  })

  // 手順8: チェックポイントブロック（画像・動画付き）
  await prisma.block.upsert({
    where: { id: 'checkin-block-8' },
    update: {
      content: {
        type: 'checkpoint',
        title: 'ベッドルームチェックリスト',
        items: [
          { text: 'シーツの交換・シワを伸ばす', imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600', videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' },
          { text: '枕を2つずつ配置', imageUrl: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600' },
          { text: 'ブランケットを足元に畳んで配置', videoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
          { text: 'ナイトテーブルの清掃' },
          { text: '照明の動作確認', videoUrl: 'https://www.youtube.com/watch?v=RgKAFK5djSk' },
        ],
      },
    },
    create: {
      id: 'checkin-block-8',
      manualId: checkinManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: 'ベッドルームチェックリスト',
        items: [
          { text: 'シーツの交換・シワを伸ばす', imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600', videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' },
          { text: '枕を2つずつ配置', imageUrl: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600' },
          { text: 'ブランケットを足元に畳んで配置', videoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
          { text: 'ナイトテーブルの清掃' },
          { text: '照明の動作確認', videoUrl: 'https://www.youtube.com/watch?v=RgKAFK5djSk' },
        ],
      },
      sortOrder: 8,
    },
  })

  // 手順9: 警告ブロック（情報）
  await prisma.block.upsert({
    where: { id: 'checkin-block-9' },
    update: {
      content: {
        type: 'warning',
        level: 'info',
        title: 'アメニティの補充について',
        text: 'バスルームのアメニティ（シャンプー、コンディショナー、ボディソープ）は残量が半分以下の場合、新しいものに交換してください。タオルは人数分×2セットを用意します。',
      },
    },
    create: {
      id: 'checkin-block-9',
      manualId: checkinManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'info',
        title: 'アメニティの補充について',
        text: 'バスルームのアメニティ（シャンプー、コンディショナー、ボディソープ）は残量が半分以下の場合、新しいものに交換してください。タオルは人数分×2セットを用意します。',
      },
      sortOrder: 9,
    },
  })

  // 手順10: チェックポイントブロック（最終確認・画像・動画付き）
  await prisma.block.upsert({
    where: { id: 'checkin-block-10' },
    update: {
      content: {
        type: 'checkpoint',
        title: '最終チェックリスト',
        items: [
          { text: '全ての照明が点灯するか確認', videoUrl: 'https://www.youtube.com/watch?v=OPf0YbXqDm0' },
          { text: 'テレビ・エアコンのリモコン動作確認', videoUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' },
          { text: 'Wi-Fiパスワードカードを設置', imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600' },
          { text: 'ウェルカムカードと案内を配置', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600', videoUrl: 'https://www.youtube.com/watch?v=hT_nvWreIhg' },
          { text: '玄関の靴箱を整頓' },
          { text: '窓を閉めて施錠', videoUrl: 'https://www.youtube.com/watch?v=CevxZvSJLk8' },
        ],
      },
    },
    create: {
      id: 'checkin-block-10',
      manualId: checkinManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: '最終チェックリスト',
        items: [
          { text: '全ての照明が点灯するか確認', videoUrl: 'https://www.youtube.com/watch?v=OPf0YbXqDm0' },
          { text: 'テレビ・エアコンのリモコン動作確認', videoUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' },
          { text: 'Wi-Fiパスワードカードを設置', imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600' },
          { text: 'ウェルカムカードと案内を配置', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600', videoUrl: 'https://www.youtube.com/watch?v=hT_nvWreIhg' },
          { text: '玄関の靴箱を整頓' },
          { text: '窓を閉めて施錠', videoUrl: 'https://www.youtube.com/watch?v=CevxZvSJLk8' },
        ],
      },
      sortOrder: 10,
    },
  })
  console.log('Created BANSHIRO checkin manual blocks (10 steps)')

  // ========================================
  // BANSHIROチェックアウト後作業マニュアル
  // ========================================
  const checkoutManual = await prisma.manual.upsert({
    where: { id: 'manual-checkout' },
    update: {},
    create: {
      id: 'manual-checkout',
      businessId: cottage.id,
      title: 'チェックアウト後作業マニュアル',
      description: 'お客様チェックアウト後の清掃・点検・補充作業の手順',
      status: 'PUBLISHED',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })
  console.log('Created BANSHIRO checkout manual:', checkoutManual.title)

  // チェックアウトマニュアル - 手順1: テキストブロック（概要）
  await prisma.block.upsert({
    where: { id: 'checkout-block-1' },
    update: {},
    create: {
      id: 'checkout-block-1',
      manualId: checkoutManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'チェックアウト後は、次のお客様を迎えるための準備を行います。清掃・点検・補充の順番で作業を進めましょう。\n\n【所要時間目安】\n・1LDKタイプ: 約2時間\n・2LDKタイプ: 約3時間\n\n作業は必ず2名以上で行ってください。',
        format: 'plain',
      },
      sortOrder: 1,
    },
  })

  // チェックアウトマニュアル - 手順2: 警告ブロック
  await prisma.block.upsert({
    where: { id: 'checkout-block-2' },
    update: {},
    create: {
      id: 'checkout-block-2',
      manualId: checkoutManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'warning',
        title: '忘れ物の確認',
        text: '清掃前に必ず全ての部屋を確認し、忘れ物がないかチェックしてください。忘れ物があった場合は、すぐに管理者に報告してください。',
      },
      sortOrder: 2,
    },
  })

  // チェックアウトマニュアル - 手順3: チェックポイント（リビング清掃）
  await prisma.block.upsert({
    where: { id: 'checkout-block-3' },
    update: {},
    create: {
      id: 'checkout-block-3',
      manualId: checkoutManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: 'リビング・ダイニング清掃チェックリスト',
        items: [
          { text: 'ソファ・クッションの清掃と配置', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600' },
          { text: 'テーブル・椅子の拭き掃除' },
          { text: '床の掃除機がけとモップがけ' },
          { text: 'ゴミ箱の中身を回収・新しい袋をセット' },
          { text: 'リモコン類の消毒と配置' },
          { text: 'エアコンフィルターの確認' },
        ],
      },
      sortOrder: 3,
    },
  })

  // チェックアウトマニュアル - 手順4: チェックポイント（キッチン清掃）
  await prisma.block.upsert({
    where: { id: 'checkout-block-4' },
    update: {},
    create: {
      id: 'checkout-block-4',
      manualId: checkoutManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: 'キッチン清掃チェックリスト',
        items: [
          { text: 'シンクの清掃と消毒' },
          { text: 'コンロ周りの油汚れ除去' },
          { text: '冷蔵庫内の確認・清掃' },
          { text: '電子レンジ・トースターの清掃' },
          { text: '食器類の洗浄・収納' },
          { text: '調味料・消耗品の補充確認' },
        ],
      },
      sortOrder: 4,
    },
  })

  // チェックアウトマニュアル - 手順5: チェックポイント（ベッドルーム）
  await prisma.block.upsert({
    where: { id: 'checkout-block-5' },
    update: {},
    create: {
      id: 'checkout-block-5',
      manualId: checkoutManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: 'ベッドルーム清掃チェックリスト',
        items: [
          { text: 'シーツ・枕カバーの交換', imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600' },
          { text: '布団カバーの交換（汚れがある場合）' },
          { text: 'マットレスの点検' },
          { text: '床の清掃' },
          { text: 'クローゼット内の確認' },
          { text: 'ハンガーの数の確認（10本）' },
        ],
      },
      sortOrder: 5,
    },
  })

  // チェックアウトマニュアル - 手順6: チェックポイント（バスルーム）
  await prisma.block.upsert({
    where: { id: 'checkout-block-6' },
    update: {},
    create: {
      id: 'checkout-block-6',
      manualId: checkoutManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: 'バスルーム・トイレ清掃チェックリスト',
        items: [
          { text: '浴槽の清掃・消毒' },
          { text: '鏡・蛇口の水垢除去' },
          { text: '排水口の髪の毛除去' },
          { text: 'トイレの清掃・消毒' },
          { text: 'タオル類の交換' },
          { text: 'アメニティの補充' },
          { text: '換気扇の動作確認' },
        ],
      },
      sortOrder: 6,
    },
  })

  // チェックアウトマニュアル - 手順7: 警告ブロック（危険）
  await prisma.block.upsert({
    where: { id: 'checkout-block-7' },
    update: {},
    create: {
      id: 'checkout-block-7',
      manualId: checkoutManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'danger',
        title: '設備破損・異常の報告',
        text: '清掃中に設備の破損や異常を発見した場合は、作業を中断し、直ちに管理者に報告してください。修理が必要な場合は次の予約に影響する可能性があります。',
      },
      sortOrder: 7,
    },
  })

  // チェックアウトマニュアル - 手順8: チェックポイント（補充品）
  await prisma.block.upsert({
    where: { id: 'checkout-block-8' },
    update: {},
    create: {
      id: 'checkout-block-8',
      manualId: checkoutManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: '消耗品・備品補充チェックリスト',
        items: [
          { text: 'トイレットペーパー（予備含め3ロール）' },
          { text: 'ティッシュペーパー（各部屋1箱）' },
          { text: 'シャンプー・コンディショナー・ボディソープ' },
          { text: '歯ブラシセット（人数分＋2）' },
          { text: 'コーヒー・紅茶・お茶パック' },
          { text: 'ゴミ袋（各サイズ5枚ずつ）' },
        ],
      },
      sortOrder: 8,
    },
  })

  // チェックアウトマニュアル - 手順9: チェックポイント（最終確認）
  await prisma.block.upsert({
    where: { id: 'checkout-block-9' },
    update: {},
    create: {
      id: 'checkout-block-9',
      manualId: checkoutManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: '最終確認チェックリスト',
        items: [
          { text: '全ての窓の施錠確認' },
          { text: '全ての照明の動作確認' },
          { text: 'エアコンの動作確認' },
          { text: 'Wi-Fiの接続確認' },
          { text: 'テレビの動作確認' },
          { text: '玄関の清掃と靴箱の確認' },
          { text: '外回りの確認（テラス・駐車場）' },
        ],
      },
      sortOrder: 9,
    },
  })

  // チェックアウトマニュアル - 手順10: テキストブロック（報告）
  await prisma.block.upsert({
    where: { id: 'checkout-block-10' },
    update: {},
    create: {
      id: 'checkout-block-10',
      manualId: checkoutManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '全ての作業が完了したら、管理システムから作業完了報告を行ってください。\n\n【報告内容】\n・作業完了時刻\n・特記事項（汚れがひどかった箇所、修理が必要な箇所など）\n・使用した消耗品の数\n\n報告後、次のお客様のチェックイン時間まで待機となります。',
        format: 'plain',
      },
      sortOrder: 10,
    },
  })
  console.log('Created BANSHIRO checkout manual blocks (10 steps)')

  // 作業メモの作成（個人用と全体公開用）
  // 手順1へのメモ
  await prisma.blockMemo.upsert({
    where: { id: 'memo-1' },
    update: {
      content: '鍵が固い時は、少し持ち上げながら回すとスムーズに開きます。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-1',
      blockId: 'checkin-block-1',
      userId: admin.id,
      content: '鍵が固い時は、少し持ち上げながら回すとスムーズに開きます。',
      visibility: 'PUBLIC',
    },
  })

  await prisma.blockMemo.upsert({
    where: { id: 'memo-2' },
    update: {
      content: '冬場はドアが結露で凍ることがあるので注意。',
      visibility: 'PRIVATE',
    },
    create: {
      id: 'memo-2',
      blockId: 'checkin-block-1',
      userId: admin.id,
      content: '冬場はドアが結露で凍ることがあるので注意。',
      visibility: 'PRIVATE',
    },
  })

  // 手順2（ガス確認）へのメモ
  await prisma.blockMemo.upsert({
    where: { id: 'memo-3' },
    update: {
      content: 'ガスメーターは建物の裏側にあります。緊急時はそこで元栓を閉めてください。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-3',
      blockId: 'checkin-block-2',
      userId: admin.id,
      content: 'ガスメーターは建物の裏側にあります。緊急時はそこで元栓を閉めてください。',
      visibility: 'PUBLIC',
    },
  })

  // 手順5（リビングチェックリスト）へのメモ
  await prisma.blockMemo.upsert({
    where: { id: 'memo-4' },
    update: {
      content: 'ソファカバーは月1回クリーニングに出しています。汚れがひどい場合は交換用が倉庫にあります。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-4',
      blockId: 'checkin-block-5',
      userId: admin.id,
      content: 'ソファカバーは月1回クリーニングに出しています。汚れがひどい場合は交換用が倉庫にあります。',
      visibility: 'PUBLIC',
    },
  })

  await prisma.blockMemo.upsert({
    where: { id: 'memo-5' },
    update: {
      content: '先週リモコンの電池を交換したばかり。',
      visibility: 'PRIVATE',
    },
    create: {
      id: 'memo-5',
      blockId: 'checkin-block-5',
      userId: admin.id,
      content: '先週リモコンの電池を交換したばかり。',
      visibility: 'PRIVATE',
    },
  })

  await prisma.blockMemo.upsert({
    where: { id: 'memo-6' },
    update: {
      content: 'テーブルは木目に沿って拭くと綺麗になります。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-6',
      blockId: 'checkin-block-5',
      userId: testUser.id,
      content: 'テーブルは木目に沿って拭くと綺麗になります。',
      visibility: 'PUBLIC',
    },
  })

  // 手順7（ベッドメイキング動画）へのメモ
  await prisma.blockMemo.upsert({
    where: { id: 'memo-7' },
    update: {
      content: 'この動画の2:30あたりからのシーツの角の折り方が参考になります。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-7',
      blockId: 'checkin-block-7',
      userId: admin.id,
      content: 'この動画の2:30あたりからのシーツの角の折り方が参考になります。',
      visibility: 'PUBLIC',
    },
  })

  // 手順8（ベッドルームチェックリスト）へのメモ
  await prisma.blockMemo.upsert({
    where: { id: 'memo-8' },
    update: {
      content: '枕カバーは予備が押入れの上段にあります。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-8',
      blockId: 'checkin-block-8',
      userId: admin.id,
      content: '枕カバーは予備が押入れの上段にあります。',
      visibility: 'PUBLIC',
    },
  })

  await prisma.blockMemo.upsert({
    where: { id: 'memo-9' },
    update: {
      content: 'ベッドサイドのランプが時々つかないことがある。電球交換予定。',
      visibility: 'PRIVATE',
    },
    create: {
      id: 'memo-9',
      blockId: 'checkin-block-8',
      userId: admin.id,
      content: 'ベッドサイドのランプが時々つかないことがある。電球交換予定。',
      visibility: 'PRIVATE',
    },
  })

  // 手順9（アメニティ）へのメモ
  await prisma.blockMemo.upsert({
    where: { id: 'memo-10' },
    update: {
      content: 'シャンプー類は地元の○○商店から仕入れています。在庫が少なくなったら発注してください。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-10',
      blockId: 'checkin-block-9',
      userId: admin.id,
      content: 'シャンプー類は地元の○○商店から仕入れています。在庫が少なくなったら発注してください。',
      visibility: 'PUBLIC',
    },
  })

  await prisma.blockMemo.upsert({
    where: { id: 'memo-11' },
    update: {
      content: '次回の発注は来週の予定。',
      visibility: 'PRIVATE',
    },
    create: {
      id: 'memo-11',
      blockId: 'checkin-block-9',
      userId: testUser.id,
      content: '次回の発注は来週の予定。',
      visibility: 'PRIVATE',
    },
  })

  // 手順10（最終チェックリスト）へのメモ
  await prisma.blockMemo.upsert({
    where: { id: 'memo-12' },
    update: {
      content: 'Wi-Fiパスワードは毎月変更しています。最新のパスワードは管理システムで確認してください。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-12',
      blockId: 'checkin-block-10',
      userId: admin.id,
      content: 'Wi-Fiパスワードは毎月変更しています。最新のパスワードは管理システムで確認してください。',
      visibility: 'PUBLIC',
    },
  })

  await prisma.blockMemo.upsert({
    where: { id: 'memo-13' },
    update: {
      content: '窓の施錠は必ず2回確認すること。以前施錠忘れがあった。',
      visibility: 'PUBLIC',
    },
    create: {
      id: 'memo-13',
      blockId: 'checkin-block-10',
      userId: admin.id,
      content: '窓の施錠は必ず2回確認すること。以前施錠忘れがあった。',
      visibility: 'PUBLIC',
    },
  })

  await prisma.blockMemo.upsert({
    where: { id: 'memo-14' },
    update: {
      content: '個人的なチェックポイント：玄関マットも綺麗にしておく。',
      visibility: 'PRIVATE',
    },
    create: {
      id: 'memo-14',
      blockId: 'checkin-block-10',
      userId: testUser.id,
      content: '個人的なチェックポイント：玄関マットも綺麗にしておく。',
      visibility: 'PRIVATE',
    },
  })

  console.log('Created block memos (14 memos: 9 public, 5 private)')

  // ========================================
  // システム使用マニュアルの作成
  // ========================================

  // ----------------------------------------
  // 管理者向け使用マニュアル
  // ----------------------------------------
  const adminUsageManual = await prisma.manual.upsert({
    where: { id: 'manual-admin-usage' },
    update: {
      title: '【管理者向け】システム使用マニュアル',
      description: 'Mocca Operationシステムの管理者向け操作ガイド',
      status: 'PUBLISHED',
    },
    create: {
      id: 'manual-admin-usage',
      businessId: restaurant.id,
      title: '【管理者向け】システム使用マニュアル',
      description: 'Mocca Operationシステムの管理者向け操作ガイド',
      status: 'PUBLISHED',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })
  console.log('Created admin usage manual:', adminUsageManual.title)

  // 管理者マニュアル - ステップ1: ログイン
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-1' },
    update: {
      content: {
        type: 'text',
        text: 'ログインページにアクセスし、登録されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\n\nログインに成功すると、ダッシュボード（マニュアル一覧画面）が表示されます。',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-1',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'ログインページにアクセスし、登録されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\n\nログインに成功すると、ダッシュボード（マニュアル一覧画面）が表示されます。',
        format: 'plain',
      },
      sortOrder: 1,
    },
  })

  // 管理者マニュアル - ステップ2: 画面構成
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-2' },
    update: {
      content: {
        type: 'text',
        text: '画面は以下の要素で構成されています：\n\n【ヘッダー（上部）】\n• 事業切り替え：事業名をクリックして切り替え\n• 検索ボタン：マニュアル・ステップを検索\n• 通知ベル：新しいメモの通知を確認\n• メニュー（三本線アイコン）：設定やログアウト\n\n【サイドバー（左側・PC表示時）】\n• 「トップに戻る」：マニュアル一覧へ戻る\n• カテゴリ一覧：クリックで展開しマニュアルを表示',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-2',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '画面は以下の要素で構成されています：\n\n【ヘッダー（上部）】\n• 事業切り替え：事業名をクリックして切り替え\n• 検索ボタン：マニュアル・ステップを検索\n• 通知ベル：新しいメモの通知を確認\n• メニュー（三本線アイコン）：設定やログアウト\n\n【サイドバー（左側・PC表示時）】\n• 「トップに戻る」：マニュアル一覧へ戻る\n• カテゴリ一覧：クリックで展開しマニュアルを表示',
        format: 'plain',
      },
      sortOrder: 2,
    },
  })

  // 管理者マニュアル - ステップ3: カテゴリ管理
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-3' },
    update: {
      content: {
        type: 'text',
        text: '右上のメニュー（三本線アイコン）を開き、「カテゴリ管理」をクリックすると、カテゴリ管理画面が開きます。\n\n【できること】\n• カテゴリの新規作成：「カテゴリを追加」ボタンをクリック\n• カテゴリ名・説明の編集：鉛筆アイコンをクリック\n• カテゴリの削除：ゴミ箱アイコンをクリック（マニュアルがある場合は削除不可）\n• 並び順の変更：ドラッグ＆ドロップで移動',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-3',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '右上のメニュー（三本線アイコン）を開き、「カテゴリ管理」をクリックすると、カテゴリ管理画面が開きます。\n\n【できること】\n• カテゴリの新規作成：「カテゴリを追加」ボタンをクリック\n• カテゴリ名・説明の編集：鉛筆アイコンをクリック\n• カテゴリの削除：ゴミ箱アイコンをクリック（マニュアルがある場合は削除不可）\n• 並び順の変更：ドラッグ＆ドロップで移動',
        format: 'plain',
      },
      sortOrder: 3,
    },
  })

  // 管理者マニュアル - ステップ4: マニュアル作成
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-4' },
    update: {
      content: {
        type: 'text',
        text: '新しいマニュアルを作成するには：\n\n1. マニュアル一覧画面（トップページ）で「新規マニュアル」ボタンをクリック\n2. カテゴリを選択\n3. タイトルと説明を入力\n4. 「作成」ボタンをクリック\n\n作成後、編集画面が開きます。\n\n※「新規マニュアル」ボタンはスーパー管理者のみ表示されます。',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-4',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '新しいマニュアルを作成するには：\n\n1. マニュアル一覧画面（トップページ）で「新規マニュアル」ボタンをクリック\n2. カテゴリを選択\n3. タイトルと説明を入力\n4. 「作成」ボタンをクリック\n\n作成後、編集画面が開きます。\n\n※「新規マニュアル」ボタンはスーパー管理者のみ表示されます。',
        format: 'plain',
      },
      sortOrder: 4,
    },
  })

  // 管理者マニュアル - ステップ5: ブロック（ステップ）の種類
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-5' },
    update: {
      content: {
        type: 'checkpoint',
        title: '追加できるブロック（ステップ）の種類',
        items: [
          { text: 'テキスト：説明文や手順を記載' },
          { text: '画像：ドラッグ＆ドロップまたはファイル選択でアップロード（JPEG/PNG/GIF/WebP、最大10MB）' },
          { text: 'YouTube動画：YouTubeのURLを貼り付けて埋め込み' },
          { text: '注意事項：情報（青）・注意（黄）・危険（赤）の3段階で表示' },
          { text: 'チェックポイント：確認項目をリスト形式で表示（作業時にチェック可能）' },
        ],
      },
    },
    create: {
      id: 'admin-usage-block-5',
      manualId: adminUsageManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: '追加できるブロック（ステップ）の種類',
        items: [
          { text: 'テキスト：説明文や手順を記載' },
          { text: '画像：ドラッグ＆ドロップまたはファイル選択でアップロード（JPEG/PNG/GIF/WebP、最大10MB）' },
          { text: 'YouTube動画：YouTubeのURLを貼り付けて埋め込み' },
          { text: '注意事項：情報（青）・注意（黄）・危険（赤）の3段階で表示' },
          { text: 'チェックポイント：確認項目をリスト形式で表示（作業時にチェック可能）' },
        ],
      },
      sortOrder: 5,
    },
  })

  // 管理者マニュアル - ステップ6: ブロックの編集
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-6' },
    update: {
      content: {
        type: 'text',
        text: '編集画面で「ステップを追加」ボタンをクリックし、追加したいブロックの種類を選択します。\n\n各ブロックは以下の操作が可能です：\n• ドラッグ＆ドロップで並び替え（左端のハンドルを掴む）\n• 鉛筆アイコンで編集\n• ゴミ箱アイコンで削除\n\nタイトルと説明は直接クリックして編集でき、自動で保存されます。',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-6',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '編集画面で「ステップを追加」ボタンをクリックし、追加したいブロックの種類を選択します。\n\n各ブロックは以下の操作が可能です：\n• ドラッグ＆ドロップで並び替え（左端のハンドルを掴む）\n• 鉛筆アイコンで編集\n• ゴミ箱アイコンで削除\n\nタイトルと説明は直接クリックして編集でき、自動で保存されます。',
        format: 'plain',
      },
      sortOrder: 6,
    },
  })

  // 管理者マニュアル - ステップ7: 公開/非公開
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-7' },
    update: {
      content: {
        type: 'warning',
        level: 'info',
        title: '公開設定について',
        text: 'マニュアルは作成時は「下書き」状態です。\n\n編集画面のツールバーにある「公開する」ボタンをクリックすると、作業者にも表示されるようになります。公開中のマニュアルは「非公開にする」で再び下書きに戻せます。\n\n下書きのマニュアルは管理者にのみ表示されます。',
      },
    },
    create: {
      id: 'admin-usage-block-7',
      manualId: adminUsageManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'info',
        title: '公開設定について',
        text: 'マニュアルは作成時は「下書き」状態です。\n\n編集画面のツールバーにある「公開する」ボタンをクリックすると、作業者にも表示されるようになります。公開中のマニュアルは「非公開にする」で再び下書きに戻せます。\n\n下書きのマニュアルは管理者にのみ表示されます。',
      },
      sortOrder: 7,
    },
  })

  // 管理者マニュアル - ステップ8: バージョン管理
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-8' },
    update: {
      content: {
        type: 'text',
        text: '重要な変更を加える前に、現在の状態を保存できます：\n\n1. 編集画面の「プレビュー版を保存」をクリック\n2. コメントを入力して保存（任意）\n3. 「バージョン履歴」で過去のバージョンを確認\n\n【バージョン履歴でできること】\n• プレビュー：内容を確認（画像・動画含む）\n• 復元：過去のバージョンに戻す（現在の内容は自動バックアップ）\n• 削除：不要なバージョンを削除',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-8',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '重要な変更を加える前に、現在の状態を保存できます：\n\n1. 編集画面の「プレビュー版を保存」をクリック\n2. コメントを入力して保存（任意）\n3. 「バージョン履歴」で過去のバージョンを確認\n\n【バージョン履歴でできること】\n• プレビュー：内容を確認（画像・動画含む）\n• 復元：過去のバージョンに戻す（現在の内容は自動バックアップ）\n• 削除：不要なバージョンを削除',
        format: 'plain',
      },
      sortOrder: 8,
    },
  })

  // 管理者マニュアル - ステップ9: マニュアルの複製と削除
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-9' },
    update: {
      content: {
        type: 'text',
        text: '編集画面のツールバーから以下の操作ができます：\n\n• プレビュー：閲覧モードで表示を確認\n• 複製：同じ内容のマニュアルをコピーして新規作成\n• 削除：マニュアルを完全に削除（この操作は取り消せません）\n\nPC表示ではボタンが並んで表示され、モバイル表示ではドロップダウンメニューにまとめられます。',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-9',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '編集画面のツールバーから以下の操作ができます：\n\n• プレビュー：閲覧モードで表示を確認\n• 複製：同じ内容のマニュアルをコピーして新規作成\n• 削除：マニュアルを完全に削除（この操作は取り消せません）\n\nPC表示ではボタンが並んで表示され、モバイル表示ではドロップダウンメニューにまとめられます。',
        format: 'plain',
      },
      sortOrder: 9,
    },
  })

  // 管理者マニュアル - ステップ10: 検索機能
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-10' },
    update: {
      content: {
        type: 'text',
        text: 'ヘッダーの検索アイコン（虫めがね）をクリックすると、検索ダイアログが開きます。\n\n【検索機能】\n• 2文字以上のキーワードで検索可能\n• マニュアルのタイトル・説明・ステップ内容を横断検索\n• 「現在の事業内」または「すべての事業」から検索範囲を選択可能\n\n検索結果をクリックすると、該当のマニュアル・ステップまで自動で移動し、ハイライト表示されます。\n\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-10',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'ヘッダーの検索アイコン（虫めがね）をクリックすると、検索ダイアログが開きます。\n\n【検索機能】\n• 2文字以上のキーワードで検索可能\n• マニュアルのタイトル・説明・ステップ内容を横断検索\n• 「現在の事業内」または「すべての事業」から検索範囲を選択可能\n\n検索結果をクリックすると、該当のマニュアル・ステップまで自動で移動し、ハイライト表示されます。\n\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。',
        format: 'plain',
      },
      sortOrder: 10,
    },
  })

  // 管理者マニュアル - ステップ11: PDF出力
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-11' },
    update: {
      content: {
        type: 'text',
        text: 'マニュアル閲覧画面で「PDF」ボタンをクリックすると、現在のマニュアルをPDFファイルとしてダウンロードできます。\n\n【PDF出力の内容】\n• マニュアルのタイトル・説明\n• すべてのステップ（テキスト、画像、注意事項、チェックポイント）\n• 日本語フォント対応\n\n印刷やオフラインでの閲覧に便利です。',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-11',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'マニュアル閲覧画面で「PDF」ボタンをクリックすると、現在のマニュアルをPDFファイルとしてダウンロードできます。\n\n【PDF出力の内容】\n• マニュアルのタイトル・説明\n• すべてのステップ（テキスト、画像、注意事項、チェックポイント）\n• 日本語フォント対応\n\n印刷やオフラインでの閲覧に便利です。',
        format: 'plain',
      },
      sortOrder: 11,
    },
  })

  // 管理者マニュアル - ステップ12: メモ機能
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-12' },
    update: {
      content: {
        type: 'text',
        text: '各ステップにはメモを追加できます。ステップの右上にあるメモアイコン（吹き出し）をクリックして、「作業メモ」パネルを開きます。\n\n【メモの種類】\n• 個人用（鍵アイコン）：自分だけに表示\n• 全体向け（地球アイコン）：全員に表示され、通知が送信される\n\n【操作】\n• 「メモを追加」で新規作成\n• 自分のメモは編集・削除が可能\n• スーパー管理者は他人のメモも削除可能',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-12',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '各ステップにはメモを追加できます。ステップの右上にあるメモアイコン（吹き出し）をクリックして、「作業メモ」パネルを開きます。\n\n【メモの種類】\n• 個人用（鍵アイコン）：自分だけに表示\n• 全体向け（地球アイコン）：全員に表示され、通知が送信される\n\n【操作】\n• 「メモを追加」で新規作成\n• 自分のメモは編集・削除が可能\n• スーパー管理者は他人のメモも削除可能',
        format: 'plain',
      },
      sortOrder: 12,
    },
  })

  // 管理者マニュアル - ステップ13: 通知機能
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-13' },
    update: {
      content: {
        type: 'text',
        text: 'ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\n\n【通知される内容】\n• 全体向けメモが投稿された時\n\n【操作】\n• クリックで該当マニュアルへ移動\n• 「すべて既読にする」で一括既読\n• 個別に削除も可能',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-13',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\n\n【通知される内容】\n• 全体向けメモが投稿された時\n\n【操作】\n• クリックで該当マニュアルへ移動\n• 「すべて既読にする」で一括既読\n• 個別に削除も可能',
        format: 'plain',
      },
      sortOrder: 13,
    },
  })

  // 管理者マニュアル - ステップ14: 設定画面
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-14' },
    update: {
      content: {
        type: 'text',
        text: '右上のメニュー（三本線アイコン）から「設定」をクリックすると、アカウント設定画面が開きます。\n\n【設定できること】\n• プロフィール：表示名の変更（メールアドレスは変更不可）\n• パスワード変更：新しいパスワードは8文字以上',
        format: 'plain',
      },
    },
    create: {
      id: 'admin-usage-block-14',
      manualId: adminUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '右上のメニュー（三本線アイコン）から「設定」をクリックすると、アカウント設定画面が開きます。\n\n【設定できること】\n• プロフィール：表示名の変更（メールアドレスは変更不可）\n• パスワード変更：新しいパスワードは8文字以上',
        format: 'plain',
      },
      sortOrder: 14,
    },
  })

  // 管理者マニュアル - ステップ15: スーパー管理者機能
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-15' },
    update: {
      content: {
        type: 'warning',
        level: 'info',
        title: 'スーパー管理者のみの機能',
        text: 'スーパー管理者は、右上のメニューに「管理者メニュー」が表示されます。\n\n• ユーザー管理：ユーザーの追加・編集・削除、事業へのアクセス権付与\n• 事業管理：事業の追加・編集・削除、テーマカラー設定\n\n通常の管理者には表示されません。',
      },
    },
    create: {
      id: 'admin-usage-block-15',
      manualId: adminUsageManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'info',
        title: 'スーパー管理者のみの機能',
        text: 'スーパー管理者は、右上のメニューに「管理者メニュー」が表示されます。\n\n• ユーザー管理：ユーザーの追加・編集・削除、事業へのアクセス権付与\n• 事業管理：事業の追加・編集・削除、テーマカラー設定\n\n通常の管理者には表示されません。',
      },
      sortOrder: 15,
    },
  })

  // 管理者マニュアル - ステップ16: まとめ
  await prisma.block.upsert({
    where: { id: 'admin-usage-block-16' },
    update: {
      content: {
        type: 'checkpoint',
        title: '管理者ができること まとめ',
        items: [
          { text: 'カテゴリの作成・編集・削除・並び替え' },
          { text: 'マニュアルの作成・編集・複製・削除' },
          { text: 'ブロック（ステップ）の追加・編集・削除・並び替え' },
          { text: 'マニュアルの公開/非公開の切り替え' },
          { text: 'バージョンの保存・復元・削除' },
          { text: 'PDF出力' },
          { text: 'メモの追加（個人用・全体向け）' },
          { text: '通知の確認' },
          { text: '文字サイズ・パスワードなどの設定変更' },
        ],
      },
    },
    create: {
      id: 'admin-usage-block-16',
      manualId: adminUsageManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: '管理者ができること まとめ',
        items: [
          { text: 'カテゴリの作成・編集・削除・並び替え' },
          { text: 'マニュアルの作成・編集・複製・削除' },
          { text: 'ブロック（ステップ）の追加・編集・削除・並び替え' },
          { text: 'マニュアルの公開/非公開の切り替え' },
          { text: 'バージョンの保存・復元・削除' },
          { text: 'PDF出力' },
          { text: 'メモの追加（個人用・全体向け）' },
          { text: '通知の確認' },
          { text: '文字サイズ・パスワードなどの設定変更' },
        ],
      },
      sortOrder: 16,
    },
  })

  console.log('Created admin usage manual blocks (16 steps)')

  // ----------------------------------------
  // 作業者向け使用マニュアル
  // ----------------------------------------
  const workerUsageManual = await prisma.manual.upsert({
    where: { id: 'manual-worker-usage' },
    update: {
      title: '【作業者向け】システム使用マニュアル',
      description: 'Mocca Operationシステムの作業者向け操作ガイド',
      status: 'PUBLISHED',
    },
    create: {
      id: 'manual-worker-usage',
      businessId: restaurant.id,
      title: '【作業者向け】システム使用マニュアル',
      description: 'Mocca Operationシステムの作業者向け操作ガイド',
      status: 'PUBLISHED',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })
  console.log('Created worker usage manual:', workerUsageManual.title)

  // 作業者マニュアル - ステップ1: ログイン
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-1' },
    update: {
      content: {
        type: 'text',
        text: 'ログインページにアクセスし、管理者から共有されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\n\nログインに成功すると、マニュアル一覧画面が表示されます。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-1',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'ログインページにアクセスし、管理者から共有されたメールアドレスとパスワードを入力して「ログイン」ボタンをクリックします。\n\nログインに成功すると、マニュアル一覧画面が表示されます。',
        format: 'plain',
      },
      sortOrder: 1,
    },
  })

  // 作業者マニュアル - ステップ2: 画面構成
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-2' },
    update: {
      content: {
        type: 'text',
        text: '画面は以下の要素で構成されています：\n\n【ヘッダー（上部）】\n• 事業名：クリックして事業を切り替え（複数事業へのアクセス権がある場合）\n• 検索アイコン（虫めがね）：マニュアルやステップを検索\n• 通知ベル：新しいメモの通知を確認\n• メニュー（三本線）：設定やログアウト\n\n【サイドバー（左側・PC表示時）】\n• カテゴリ一覧：クリックして展開するとマニュアルが表示されます',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-2',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '画面は以下の要素で構成されています：\n\n【ヘッダー（上部）】\n• 事業名：クリックして事業を切り替え（複数事業へのアクセス権がある場合）\n• 検索アイコン（虫めがね）：マニュアルやステップを検索\n• 通知ベル：新しいメモの通知を確認\n• メニュー（三本線）：設定やログアウト\n\n【サイドバー（左側・PC表示時）】\n• カテゴリ一覧：クリックして展開するとマニュアルが表示されます',
        format: 'plain',
      },
      sortOrder: 2,
    },
  })

  // 作業者マニュアル - ステップ3: マニュアルの閲覧
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-3' },
    update: {
      content: {
        type: 'text',
        text: 'マニュアル一覧画面またはサイドバーから、閲覧したいマニュアルをクリックします。\n\n【マニュアル一覧画面】\n• カテゴリボタンでフィルタリング\n• 「公開済み」のマニュアルが表示されます\n\nマニュアルを開くと、ステップごとに内容が表示されます。画像や動画がある場合は、その場で確認できます。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-3',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'マニュアル一覧画面またはサイドバーから、閲覧したいマニュアルをクリックします。\n\n【マニュアル一覧画面】\n• カテゴリボタンでフィルタリング\n• 「公開済み」のマニュアルが表示されます\n\nマニュアルを開くと、ステップごとに内容が表示されます。画像や動画がある場合は、その場で確認できます。',
        format: 'plain',
      },
      sortOrder: 3,
    },
  })

  // 作業者マニュアル - ステップ4: 検索機能
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-4' },
    update: {
      content: {
        type: 'text',
        text: '探しているマニュアルやステップがすぐに見つからない場合は、ヘッダーの検索アイコン（虫めがね）をクリックして検索できます。\n\n【検索機能】\n• 2文字以上のキーワードで検索可能\n• 「現在の事業内」または「すべての事業」から検索範囲を選択\n• マニュアルのタイトル・説明・ステップ内容を横断検索\n\n結果をクリックすると、該当箇所まで自動で移動し、ハイライト表示されます。\n\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-4',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '探しているマニュアルやステップがすぐに見つからない場合は、ヘッダーの検索アイコン（虫めがね）をクリックして検索できます。\n\n【検索機能】\n• 2文字以上のキーワードで検索可能\n• 「現在の事業内」または「すべての事業」から検索範囲を選択\n• マニュアルのタイトル・説明・ステップ内容を横断検索\n\n結果をクリックすると、該当箇所まで自動で移動し、ハイライト表示されます。\n\nショートカット：Ctrl+K（Mac: Cmd+K）で検索ダイアログを開けます。',
        format: 'plain',
      },
      sortOrder: 4,
    },
  })

  // 作業者マニュアル - ステップ5: チェックポイントの使い方
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-5' },
    update: {
      content: {
        type: 'warning',
        level: 'info',
        title: 'チェックポイントの活用',
        text: 'チェックポイントブロックでは、各項目をクリックしてチェックを入れることができます。\n\nチェック項目に画像や動画が添付されている場合は、右側のカメラアイコンや動画アイコンをクリックすると確認できます。\n\n※チェック状態はページを離れるとリセットされます。',
      },
    },
    create: {
      id: 'worker-usage-block-5',
      manualId: workerUsageManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'info',
        title: 'チェックポイントの活用',
        text: 'チェックポイントブロックでは、各項目をクリックしてチェックを入れることができます。\n\nチェック項目に画像や動画が添付されている場合は、右側のカメラアイコンや動画アイコンをクリックすると確認できます。\n\n※チェック状態はページを離れるとリセットされます。',
      },
      sortOrder: 5,
    },
  })

  // 作業者マニュアル - ステップ6: 画像・動画の確認
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-6' },
    update: {
      content: {
        type: 'text',
        text: '【画像ブロック】\nそのまま表示されます。キャプション（説明文）がある場合は画像の下に表示されます。\n\n【動画ブロック（YouTube）】\n埋め込みプレーヤーで再生できます。\n\n【注意事項ブロック】\n重要度に応じて色分けされています：\n• 青（情報）：参考情報\n• 黄（注意）：注意が必要な内容\n• 赤（危険）：特に重要な警告',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-6',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '【画像ブロック】\nそのまま表示されます。キャプション（説明文）がある場合は画像の下に表示されます。\n\n【動画ブロック（YouTube）】\n埋め込みプレーヤーで再生できます。\n\n【注意事項ブロック】\n重要度に応じて色分けされています：\n• 青（情報）：参考情報\n• 黄（注意）：注意が必要な内容\n• 赤（危険）：特に重要な警告',
        format: 'plain',
      },
      sortOrder: 6,
    },
  })

  // 作業者マニュアル - ステップ7: メモの確認と追加
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-7' },
    update: {
      content: {
        type: 'text',
        text: '各ステップの右上にメモアイコン（吹き出し）があります。数字が表示されている場合は、メモが投稿されています。\n\nクリックすると「作業メモ」パネルが開きます。\n\n【メモの種類】\n• 個人用（鍵アイコン）：自分だけに表示される覚書\n• 全体向け（地球アイコン）：他のスタッフにも表示\n\n「メモを追加」ボタンからあなた自身もメモを投稿できます。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-7',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '各ステップの右上にメモアイコン（吹き出し）があります。数字が表示されている場合は、メモが投稿されています。\n\nクリックすると「作業メモ」パネルが開きます。\n\n【メモの種類】\n• 個人用（鍵アイコン）：自分だけに表示される覚書\n• 全体向け（地球アイコン）：他のスタッフにも表示\n\n「メモを追加」ボタンからあなた自身もメモを投稿できます。',
        format: 'plain',
      },
      sortOrder: 7,
    },
  })

  // 作業者マニュアル - ステップ8: 通知機能
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-8' },
    update: {
      content: {
        type: 'text',
        text: 'ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\n\n【通知される内容】\n• 誰かが「全体向け」メモを投稿した時\n\nクリックすると該当のマニュアルに移動できます。「すべて既読にする」で一括既読も可能です。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-8',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'ヘッダーの通知ベル（未読があれば数字バッジ表示）をクリックすると、お知らせ一覧ページに移動します。\n\n【通知される内容】\n• 誰かが「全体向け」メモを投稿した時\n\nクリックすると該当のマニュアルに移動できます。「すべて既読にする」で一括既読も可能です。',
        format: 'plain',
      },
      sortOrder: 8,
    },
  })

  // 作業者マニュアル - ステップ9: PDF出力
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-9' },
    update: {
      content: {
        type: 'text',
        text: 'マニュアルをPDFとして保存したい場合は、マニュアル閲覧画面の「PDF」ボタンをクリックします。\n\nダウンロードしたPDFは、スマートフォンやタブレットに保存して、オフラインでも確認できます。\n\n※画像も含まれます。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-9',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: 'マニュアルをPDFとして保存したい場合は、マニュアル閲覧画面の「PDF」ボタンをクリックします。\n\nダウンロードしたPDFは、スマートフォンやタブレットに保存して、オフラインでも確認できます。\n\n※画像も含まれます。',
        format: 'plain',
      },
      sortOrder: 9,
    },
  })

  // 作業者マニュアル - ステップ10: 文字サイズの変更
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-10' },
    update: {
      content: {
        type: 'text',
        text: '画面右上のメニュー（三本線アイコン）を開くと、「文字サイズ」欄があります。\n\n4段階（小・中・大・特大）から選択でき、読みやすいサイズに調整してください。\n\n設定は次回ログイン時も保持されます。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-10',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '画面右上のメニュー（三本線アイコン）を開くと、「文字サイズ」欄があります。\n\n4段階（小・中・大・特大）から選択でき、読みやすいサイズに調整してください。\n\n設定は次回ログイン時も保持されます。',
        format: 'plain',
      },
      sortOrder: 10,
    },
  })

  // 作業者マニュアル - ステップ11: 設定とログアウト
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-11' },
    update: {
      content: {
        type: 'text',
        text: '右上のメニュー（三本線アイコン）からは以下の操作ができます：\n\n• お知らせ：通知一覧を表示\n• 設定：プロフィール（名前）やパスワードの変更\n• ログアウト：作業終了時にクリック\n\n共有端末を使用している場合は、必ずログアウトしてください。',
        format: 'plain',
      },
    },
    create: {
      id: 'worker-usage-block-11',
      manualId: workerUsageManual.id,
      type: 'TEXT',
      content: {
        type: 'text',
        text: '右上のメニュー（三本線アイコン）からは以下の操作ができます：\n\n• お知らせ：通知一覧を表示\n• 設定：プロフィール（名前）やパスワードの変更\n• ログアウト：作業終了時にクリック\n\n共有端末を使用している場合は、必ずログアウトしてください。',
        format: 'plain',
      },
      sortOrder: 11,
    },
  })

  // 作業者マニュアル - ステップ12: 注意事項
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-12' },
    update: {
      content: {
        type: 'warning',
        level: 'warning',
        title: '注意事項',
        text: '• パスワードは他人と共有しないでください\n• マニュアルの内容に誤りを見つけた場合は、管理者に報告してください\n• 不明な点があれば、管理者に質問してください',
      },
    },
    create: {
      id: 'worker-usage-block-12',
      manualId: workerUsageManual.id,
      type: 'WARNING',
      content: {
        type: 'warning',
        level: 'warning',
        title: '注意事項',
        text: '• パスワードは他人と共有しないでください\n• マニュアルの内容に誤りを見つけた場合は、管理者に報告してください\n• 不明な点があれば、管理者に質問してください',
      },
      sortOrder: 12,
    },
  })

  // 作業者マニュアル - ステップ13: まとめ
  await prisma.block.upsert({
    where: { id: 'worker-usage-block-13' },
    update: {
      content: {
        type: 'checkpoint',
        title: '作業者ができること まとめ',
        items: [
          { text: 'マニュアルの閲覧（公開済みのみ）' },
          { text: 'マニュアル・ステップの検索（事業内/全事業）' },
          { text: 'チェックポイントのチェック' },
          { text: '画像・動画の確認' },
          { text: 'メモの閲覧と追加（個人用/全体向け）' },
          { text: '通知の確認' },
          { text: 'PDF出力' },
          { text: '文字サイズ・パスワードなどの設定変更' },
        ],
      },
    },
    create: {
      id: 'worker-usage-block-13',
      manualId: workerUsageManual.id,
      type: 'CHECKPOINT',
      content: {
        type: 'checkpoint',
        title: '作業者ができること まとめ',
        items: [
          { text: 'マニュアルの閲覧（公開済みのみ）' },
          { text: 'マニュアル・ステップの検索（事業内/全事業）' },
          { text: 'チェックポイントのチェック' },
          { text: '画像・動画の確認' },
          { text: 'メモの閲覧と追加（個人用/全体向け）' },
          { text: '通知の確認' },
          { text: 'PDF出力' },
          { text: '文字サイズ・パスワードなどの設定変更' },
        ],
      },
      sortOrder: 13,
    },
  })

  console.log('Created worker usage manual blocks (13 steps)')

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
