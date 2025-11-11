# HabitLine プロジェクト構造

最終更新: 2025-11-10

## ディレクトリ構造

```
habit/
├── README.md                           # プロジェクト概要
├── PROJECT_STRUCTURE.md               # このファイル
├── .env.example                       # 環境変数テンプレート
├── .gitignore                         # Git除外設定
│
├── supabase/                          # Supabaseプロジェクト
│   ├── config.toml                    # Supabase設定
│   │
│   ├── migrations/                    # データベースマイグレーション
│   │   └── 00001_initial_schema.sql   # 初期スキーマ
│   │
│   ├── functions/                     # Edge Functions
│   │   ├── _shared/                   # 共通ライブラリ
│   │   │   ├── types.ts              # TypeScript型定義
│   │   │   ├── supabase.ts           # Supabaseクライアント
│   │   │   └── line.ts               # LINE APIユーティリティ
│   │   │
│   │   ├── habit_handle_webhook/     # LINE Webhook受信
│   │   │   └── index.ts
│   │   │
│   │   ├── habit_send_reminder/      # リマインド送信
│   │   │   └── index.ts
│   │   │
│   │   ├── habit_analyze_feedback/   # AIフィードバック生成
│   │   │   └── index.ts
│   │   │
│   │   ├── habit_generate_report/    # 週次レポート生成
│   │   │   └── index.ts
│   │   │
│   │   └── habit_upgrade_plan/       # Stripe Webhook
│   │       └── index.ts
│   │
│   └── seed/                          # シードデータ（今後）
│
├── admin/                             # Next.js管理画面
│   ├── README.md                      # 管理画面のREADME
│   ├── package.json                   # 依存関係
│   ├── tsconfig.json                  # TypeScript設定
│   ├── next.config.js                 # Next.js設定
│   ├── tailwind.config.js             # Tailwind CSS設定
│   ├── postcss.config.js              # PostCSS設定
│   ├── .env.local.example             # 環境変数テンプレート
│   │
│   └── src/
│       └── app/
│           ├── layout.tsx             # ルートレイアウト
│           ├── page.tsx               # トップページ
│           └── globals.css            # グローバルスタイル
│
├── docs/                              # ドキュメント
│   ├── SETUP.md                       # セットアップガイド
│   └── API.md                         # API仕様
│
└── scripts/                           # ユーティリティスクリプト
    ├── deploy.sh                      # デプロイスクリプト
    └── setup-secrets.sh               # 環境変数設定スクリプト
```

## 主要ファイルの説明

### ルート

| ファイル | 説明 |
|---------|------|
| `README.md` | プロジェクト全体の概要、セットアップ手順、使い方 |
| `.env.example` | 環境変数のテンプレート |
| `.gitignore` | Git管理から除外するファイル |

### Supabase

#### データベース
| ファイル | 説明 |
|---------|------|
| `migrations/00001_initial_schema.sql` | 初期DB スキーマ（テーブル、インデックス、RLS、トリガー） |

#### Edge Functions - 共有
| ファイル | 説明 |
|---------|------|
| `_shared/types.ts` | TypeScript型定義（User, Habit, Log等） |
| `_shared/supabase.ts` | Supabaseクライアントのユーティリティ |
| `_shared/line.ts` | LINE Messaging API ユーティリティ |

#### Edge Functions - エンドポイント
| ファイル | 説明 | トリガー |
|---------|------|---------|
| `habit_handle_webhook/index.ts` | LINE Webhook受信・コマンド処理 | LINE Webhook |
| `habit_send_reminder/index.ts` | リマインド通知送信 | Cron (7:00, 22:00) |
| `habit_analyze_feedback/index.ts` | AIフィードバック生成 | Cron (23:00) |
| `habit_generate_report/index.ts` | 週次レポート生成 | Cron (日曜 20:00) |
| `habit_upgrade_plan/index.ts` | Stripe Webhook処理 | Stripe Webhook |

### 管理画面（admin/）

| ファイル | 説明 |
|---------|------|
| `package.json` | 依存関係とスクリプト |
| `src/app/layout.tsx` | Next.js App Routerのレイアウト |
| `src/app/page.tsx` | トップページ |
| `src/app/globals.css` | グローバルスタイル（Tailwind） |

### ドキュメント

| ファイル | 説明 |
|---------|------|
| `docs/SETUP.md` | 詳細なセットアップ手順 |
| `docs/API.md` | API仕様書 |

### スクリプト

| ファイル | 説明 |
|---------|------|
| `scripts/deploy.sh` | 全Edge Functionsとマイグレーションをデプロイ |
| `scripts/setup-secrets.sh` | 環境変数をSupabaseに設定 |

## データベーステーブル

| テーブル名 | 説明 |
|-----------|------|
| `habit_users` | ユーザー情報（LINE ID、プラン、AI性格タイプ） |
| `habit_habits` | 習慣マスタ（タイトル、リマインド時刻、連続日数） |
| `habit_logs` | 日次実行ログ（日付、達成状態、メモ） |
| `habit_ai_feedback` | AIフィードバック履歴 |
| `habit_schedules` | カスタムリマインドスケジュール |
| `habit_teams` | チーム（B2B向け） |
| `habit_team_members` | チームメンバー |
| `habit_retry_queue` | 失敗時のリトライキュー |

## 環境変数

設定が必要な環境変数:

### Supabase
- `HABIT_SUPABASE_URL`
- `HABIT_SUPABASE_SERVICE_ROLE_KEY`
- `HABIT_SUPABASE_ANON_KEY`

### LINE
- `HABIT_LINE_CHANNEL_SECRET`
- `HABIT_LINE_ACCESS_TOKEN`

### OpenAI
- `HABIT_OPENAI_API_KEY`

### Stripe（オプション）
- `HABIT_STRIPE_WEBHOOK_SECRET`
- `HABIT_STRIPE_SECRET_KEY`
- `HABIT_STRIPE_PUBLISHABLE_KEY`

## 実装済み機能

- ✅ データベーススキーマ（8テーブル）
- ✅ RLS（Row Level Security）
- ✅ Edge Functions（5つ）
  - LINE Webhook ハンドラー
  - リマインド送信
  - AIフィードバック生成
  - 週次レポート生成
  - Stripe Webhook
- ✅ LINE コマンド処理
  - 習慣登録
  - 達成記録
  - 進捗確認
- ✅ AIパーソナライズ（4キャラクター）
- ✅ デプロイスクリプト
- ✅ 管理画面の骨組み（Next.js）

## 未実装・今後の予定

- [ ] 管理画面の実装（ダッシュボード、ユーザー管理）
- [ ] チーム機能の完全実装
- [ ] バッジ・称号システム
- [ ] 外部連携（Notion, Fitbit等）
- [ ] テストコード
- [ ] CI/CD パイプライン
- [ ] モニタリング・アラート設定

## 技術スタック

- **Backend**: Supabase (Postgres + Edge Functions + Auth + Storage)
- **Language**: TypeScript (Deno runtime)
- **Frontend**: Next.js 14 + React 18
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini
- **Messaging**: LINE Messaging API
- **Payment**: Stripe Subscriptions
- **Deployment**: Supabase (Backend), Vercel (Frontend)

## 開発フロー

1. ローカルで開発: `supabase start` + `supabase functions serve`
2. マイグレーション作成: `supabase migration new <name>`
3. Edge Function作成: `supabase functions new <name>`
4. テスト: ローカルでLINE Webhook をngrokでトンネリング
5. デプロイ: `./scripts/deploy.sh`
6. 環境変数設定: `./scripts/setup-secrets.sh`
7. Cron設定: Supabase Dashboard で手動設定

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [OpenAI API](https://platform.openai.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe API](https://stripe.com/docs/api)

---

**HabitLine** - 続ける力を、設計で支える。
