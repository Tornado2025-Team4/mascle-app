# Mascle App プロジェクト構造解説

## プロジェクト概要

**Mascle App** は、筋トレとソーシャル機能を組み合わせたフィットネスアプリケーションです。Next.js 15をベースとし、Supabaseをバックエンドとして使用するモダンなWebアプリケーションです。

### 技術スタック

- **フロントエンド**: Next.js 15 (App Router)、React 19、TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: Radix UI、shadcn/ui
- **バックエンド**: Hono.js（API）、Supabase（データベース・認証）
- **デプロイ**: Vercel対応（standalone出力）

---

## フォルダ構造詳細解説

### 1. ルートディレクトリ

```
mascle-app/
├── package.json          # 依存関係とスクリプト定義
├── next.config.ts        # Next.js設定（セキュリティ強化、画像最適化など）
├── tsconfig.json         # TypeScript設定
├── middleware.ts         # 認証・プロフィール完了チェック
├── components.json       # shadcn/ui設定
├── eslint.config.mjs     # ESLint設定
├── postcss.config.mjs    # PostCSS設定
└── README.md            # プロジェクト説明
```

### 2. アプリケーション構造 (/app)

Next.js 15のApp Routerを使用した構造：

```
app/
├── layout.tsx           # ルートレイアウト（メタデータ、フォント設定）
├── globals.css          # グローバルスタイル
├── favicon.ico          # ファビコン
├── (auth)/             # 認証関連ページグループ
│   ├── layout.tsx      # 認証ページ専用レイアウト
│   ├── signin/         # サインインページ
│   └── signup/         # サインアップページ
├── (main)/             # メインアプリケーションページグループ
│   ├── layout.tsx      # メインレイアウト（フッター含む）
│   ├── page.tsx        # ホームページ
│   ├── _components/    # ページ専用コンポーネント
│   │   ├── header.tsx
│   │   ├── post.tsx
│   │   └── postlist.tsx
│   ├── [userId]/       # 動的ユーザープロフィールページ
│   ├── create_post/    # 投稿作成ページ
│   ├── dm/            # ダイレクトメッセージページ
│   ├── explore/       # 探索・検索ページ
│   ├── notification/  # 通知ページ
│   ├── post/          # 投稿詳細ページ
│   └── setup/         # 初期設定ページ
└── api/               # API Routes
    └── [[...route]]/  # Catch-all API route（Hono.js統合）
```

### 3. API構造 (/src/api)

Hono.jsベースのAPI実装：

```
src/api/
├── index.ts            # APIルーターのメインエントリーポイント
├── _cmn/              # 共通機能
│   ├── create_supaclient.ts  # Supabaseクライアント作成
│   ├── error.ts       # エラーハンドリング
│   └── get_env.ts     # 環境変数取得
├── auth/              # 認証関連API
├── users/             # ユーザー関連API
├── posts/             # 投稿関連API
├── dm/                # ダイレクトメッセージAPI
├── gyms/              # ジム情報API
├── gymchains/         # ジムチェーン情報API
├── bodyparts/         # 身体部位API
├── tags/              # タグAPI
├── intents/           # トレーニング目的API
├── setup/             # 初期設定API
└── hello/             # テスト用API
```

### 4. データベース構造 (/database)

Supabase用のSQL定義ファイル群（番号順で実行）：

```
database/
├── 0-readme.md              # データベース説明
├── 1-extensions.sql         # 拡張機能
├── 2-enums.sql             # 列挙型定義
├── 3-1-tables-masters.sql  # マスターテーブル
├── 3-2-tables-user-profile.sql    # ユーザープロフィール
├── 3-3-tables-user-config.sql     # ユーザー設定
├── 3-4-tables-user-rel.sql        # ユーザー関係（フォロー等）
├── 3-5-tables-posts.sql           # 投稿テーブル
├── 3-6-tables-notices.sql         # 通知テーブル
├── 3-7-tables-dm-pair.sql         # 1対1 DM
├── 3-8-tables-dm-group.sql        # グループDM
├── 3-9-tables-reports.sql         # 報告・通報
├── 4-1-update-triggers.sql        # 更新トリガー
├── 4-2-signup-trigger.sql         # サインアップトリガー
├── 5-rls-enable.sql               # RLS有効化
├── 6-rls-helper.sql               # RLSヘルパー関数
├── 7-*-rls-*.sql                  # 各テーブルのRLSポリシー
├── 8-rls-objstore.sql             # オブジェクトストレージRLS
└── 9-*-views-*.sql                # ビュー定義
```

### 5. 再利用可能コンポーネント (/components)

```
components/
├── footer.tsx          # フッターナビゲーション
└── ui/                # shadcn/uiベースのUIコンポーネント
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── form.tsx
    └── ...（その他多数のUIコンポーネント）
```

### 6. 型定義 (/types)

```
types/
├── userData.type.ts      # ユーザーデータ型
├── dm.type.ts           # ダイレクトメッセージ型
└── notification.type.ts # 通知型
```

### 7. ユーティリティ関数 (/lib, /utils, /hooks)

```
lib/
├── fonts.ts            # フォント設定（Geist、Noto Sans JP）
├── date.ts             # 日付処理
├── dm.ts               # DM関連ユーティリティ
├── notification.ts     # 通知処理
└── utils.ts            # 汎用ユーティリティ

utils/supabase/
├── client.ts           # ブラウザ用Supabaseクライアント
├── server.ts           # サーバー用Supabaseクライアント
└── middleware.ts       # ミドルウェア用Supabase処理

hooks/
└── use-mobile.ts       # モバイル判定フック
```

### 8. 静的ファイル (/public)

```
public/
├── file.svg、globe.svg # アイコン類
├── fonts/              # カスタムフォント
└── images/             # 画像ファイル
    └── titlelogo.svg   # アプリロゴ
```

---

## 主要機能とアーキテクチャ

### 1. 認証システム

- **Supabase Auth**を使用したJWT認証
- **middleware.ts**でルート保護とプロフィール完了チェック
- 未認証ユーザーは`/signin`へリダイレクト
- プロフィール未設定ユーザーは`/setup`へリダイレクト

### 2. ルーティング戦略

- **Route Groups**を使用した論理的なページ分割
  - `(auth)`: 認証ページ（サインイン・サインアップ）
  - `(main)`: メインアプリケーション（ホーム・投稿・プロフィール等）
- **Dynamic Routes**でユーザープロフィール表示（`[userId]`）

### 3. API設計

- **Hono.js**による高性能APIサーバー
- **Catch-all Routes**（`[[...route]]`）でSPAライクなAPI構造
- RESTful設計でリソースベースのエンドポイント
- 共通のエラーハンドリングとミドルウェア

### 4. データベース設計

- **Row Level Security (RLS)**による堅牢なセキュリティ
- **トリガー**による自動化処理
- **ビュー**による複雑なクエリの抽象化
- **オブジェクトストレージ**による画像管理

### 5. UI/UXデザイン

- **Tailwind CSS**によるユーティリティファーストのスタイリング
- **Radix UI**による アクセシブルなプリミティブコンポーネント
- **shadcn/ui**による統一されたデザインシステム
- **レスポンシブデザイン**対応

### 6. 型安全性

- **TypeScript**による厳密な型チェック
- **Zod**によるランタイム型検証
- API、データベース、UIコンポーネント全てで型安全性を確保

---

## 開発フロー

### 1. 開発環境起動
```bash
npm run dev  # Turbopack使用で高速開発
```

### 2. ビルド・デプロイ
```bash
npm run build  # Standalone出力でVercel最適化
npm start      # 本番環境起動
```

### 3. リンティング
```bash
npm run lint   # ESLint実行
```

---

## セキュリティ対策

### 1. Next.js設定
- **X-Frame-Options**: clickjacking対策
- **X-Content-Type-Options**: MIME sniffing対策
- **Referrer-Policy**: リファラー情報制御
- **Permissions-Policy**: ブラウザ機能制限

### 2. 認証・認可
- JWT トークンベース認証
- Row Level Security (RLS)
- ミドルウェアによるルート保護

### 3. データ検証
- Zodによる入力値検証
- TypeScriptによる型安全性

---

## パフォーマンス最適化

### 1. 画像最適化
- WebP、AVIF形式対応
- 適切なキャッシュ設定
- Next.js Image コンポーネント使用

### 2. フォント最適化
- `next/font`による自動最適化
- ディスプレイスワップ設定

### 3. バンドル最適化
- パッケージインポート最適化
- Turbopack使用による高速開発

---

## 今後の拡張可能性

1. **リアルタイム機能**: Supabase Realtimeでライブメッセージング
2. **PWA化**: サービスワーカーによるオフライン対応
3. **モバイルアプリ**: React Nativeでのネイティブアプリ展開
4. **AI機能**: トレーニングレコメンデーション
5. **決済機能**: Stripeintegration for premium features

---

このプロジェクトは、モダンなWeb開発のベストプラクティスを取り入れた、スケーラブルで保守性の高いアーキテクチャとなっています。
