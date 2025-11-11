# HabitLine 📱

> 続ける力を、設計で支える。LINEで完結するAI習慣コーチSaaS。

HabitLineは、LINE Messaging APIを活用した習慣化支援SaaSです。日々の小さな行動を継続・定着できる仕組みを、AI とデータで最適化します。

## 🌟 特徴

- **LINE完結**: アプリ不要。普段使いのLINEで習慣管理
- **AIパーソナライズ**: 4つのキャラクター（天使・鬼教官・フレンド・分析）から選択
- **行動科学ベース**: リマインド→実行→記録→称賛→振り返りの最適化ループ
- **B2C⇄B2B展開容易**: 個人からチーム利用まで対応

## 📋 主要機能

### MVP機能
- ✅ 習慣の登録・管理
- ⏰ 時刻指定リマインド通知
- 📊 実行記録と連続日数カウント
- 🤖 AI による即時称賛・フィードバック
- 📈 週次レポート生成

### 今後の機能
- 👥 チーム機能（B2B向け）
- 🏆 バッジ・称号システム
- 📱 外部連携（Notion, Fitbit等）
- 📊 高度な分析ダッシュボード

## 🏗️ アーキテクチャ

```
LINE User
   │
   ▼
[Supabase Edge Functions]
   │
   ├─ habit_handle_webhook (LINE Webhook受信)
   ├─ habit_send_reminder (リマインド送信)
   ├─ habit_analyze_feedback (AI フィードバック)
   ├─ habit_generate_report (週次レポート)
   └─ habit_upgrade_plan (Stripe Webhook)
   │
   ▼
[Supabase (Postgres + Auth + Storage)]
   │
   ▼
[Next.js Admin Dashboard]
```

### 技術スタック

- **Backend**: Supabase (Postgres, Auth, Edge Functions, RLS)
- **AI**: OpenAI GPT-4o-mini
- **Messaging**: LINE Messaging API
- **Payment**: Stripe Subscriptions
- **Admin**: Next.js + Tailwind CSS + TypeScript

## 🚀 セットアップ

### 前提条件

- Node.js 18+
- Supabase CLI
- LINE Developers アカウント
- OpenAI API キー
- (オプション) Stripe アカウント

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd habit
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集し、以下の値を設定:

```env
# Supabase
HABIT_SUPABASE_URL=https://your-project.supabase.co
HABIT_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HABIT_SUPABASE_ANON_KEY=your-anon-key

# LINE
HABIT_LINE_CHANNEL_SECRET=your-channel-secret
HABIT_LINE_ACCESS_TOKEN=your-access-token

# OpenAI
HABIT_OPENAI_API_KEY=sk-your-api-key

# Stripe (オプション)
HABIT_STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 3. Supabase プロジェクトの初期化

```bash
# Supabase CLI のインストール
npm install -g supabase

# Supabase にログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push

# または、ローカル開発の場合
supabase start
supabase db reset
```

### 4. Edge Functions のデプロイ

```bash
# すべての Functions をデプロイ
supabase functions deploy habit_handle_webhook
supabase functions deploy habit_send_reminder
supabase functions deploy habit_analyze_feedback
supabase functions deploy habit_generate_report
supabase functions deploy habit_upgrade_plan

# 環境変数の設定
supabase secrets set HABIT_LINE_CHANNEL_SECRET=your-secret
supabase secrets set HABIT_LINE_ACCESS_TOKEN=your-token
supabase secrets set HABIT_OPENAI_API_KEY=your-key
```

### 5. LINE Webhook URL の設定

LINE Developers コンソールで Webhook URL を設定:

```
https://your-project-ref.supabase.co/functions/v1/habit_handle_webhook
```

### 6. スケジュール設定（Cron）

Supabase Dashboard の "Database" → "Cron Jobs" で設定:

**朝のリマインド（7:00）**
```sql
SELECT cron.schedule(
  'habit-reminder-morning',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_send_reminder',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

**夜のリマインド（22:00）**
```sql
SELECT cron.schedule(
  'habit-reminder-night',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_send_reminder',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

**毎晩のフィードバック（23:00）**
```sql
SELECT cron.schedule(
  'habit-analyze-feedback',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_analyze_feedback',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

**週次レポート（日曜 20:00）**
```sql
SELECT cron.schedule(
  'habit-weekly-report',
  '0 20 * * 0',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_generate_report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

### 7. 管理画面のデプロイ

#### Netlify へのデプロイ（推奨）

1. **GitHubにプッシュ**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Netlifyに接続**
   - [Netlify](https://app.netlify.com/) にログイン
   - "Add new site" → "Import an existing project"
   - GitHubリポジトリを選択
   - 設定は自動検出されます（`netlify.toml`）

3. **環境変数を設定**
   - Site settings → Environment variables
   - 以下を追加:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **デプロイ**
   - "Deploy site" をクリック
   - 自動ビルド & デプロイ

#### ローカル開発

```bash
# ルートから
npm run dev

# または admin ディレクトリから
cd admin
npm install
npm run dev
```

http://localhost:3000 でアクセス

## 📱 使い方

### ユーザー向け

1. LINE で HabitLine 公式アカウントを友だち追加
2. 「開始」または「help」と入力して使い方を確認
3. 「習慣 追加 読書10分」のように習慣を登録
4. 「リマインド 07:00」で通知時刻を設定
5. 毎日通知が届いたら「やった」ボタンをタップ
6. 連続日数を伸ばして習慣を定着！

### LINE コマンド一覧

| コマンド | 説明 |
|---------|------|
| `開始` / `help` | ヘルプメッセージを表示 |
| `習慣 追加 <タイトル>` | 新しい習慣を登録 |
| `リマインド <HH:MM>` | 通知時刻を設定（24時間表記） |
| `やった` | 今日の習慣を達成として記録 |
| `あとで` | 後で実行（リマインド延期） |
| `進捗` | 連続日数と達成率を表示 |
| `一覧` | 登録中の習慣一覧を表示 |

## 🗂️ プロジェクト構造

```
habit/
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── _shared/            # 共通ライブラリ
│   │   │   ├── types.ts        # TypeScript型定義
│   │   │   ├── supabase.ts     # Supabase クライアント
│   │   │   └── line.ts         # LINE API ユーティリティ
│   │   ├── habit_handle_webhook/
│   │   ├── habit_send_reminder/
│   │   ├── habit_analyze_feedback/
│   │   ├── habit_generate_report/
│   │   └── habit_upgrade_plan/
│   ├── migrations/             # DB マイグレーション
│   │   └── 00001_initial_schema.sql
│   └── config.toml             # Supabase 設定
├── admin/                      # Next.js 管理画面（今後実装）
├── docs/                       # ドキュメント
├── scripts/                    # ユーティリティスクリプト
├── .env.example                # 環境変数テンプレート
└── README.md
```

## 🗄️ データベーススキーマ

主要テーブル:

- `habit_users` - ユーザー情報
- `habit_habits` - 習慣マスタ
- `habit_logs` - 日次実行ログ
- `habit_ai_feedback` - AIフィードバック履歴
- `habit_schedules` - 通知スケジュール
- `habit_teams` - チーム（B2B）
- `habit_team_members` - チームメンバー
- `habit_retry_queue` - 失敗時のリトライキュー

詳細は `supabase/migrations/00001_initial_schema.sql` を参照。

## 💳 プラン・課金

| プラン | 価格 | 機能 |
|-------|------|------|
| Free | ¥0 | 基本機能、習慣3つまで |
| Standard | ¥980/月 | 習慣無制限、AI称賛 |
| Premium | ¥1,980/月 | 全機能、詳細分析 |
| Team | ¥9,800~/月 | チーム機能、管理ダッシュボード |

Stripe Subscriptions で管理。

## 🧪 テスト

```bash
# ユニットテスト（今後実装）
npm test

# Edge Functions のローカルテスト
supabase functions serve habit_handle_webhook
curl -X POST http://localhost:54321/functions/v1/habit_handle_webhook \
  -H "Content-Type: application/json" \
  -d '{"events": []}'
```

## 📊 監視・ログ

Supabase Dashboard の "Logs" セクションで Edge Functions のログを確認:
- リクエスト/レスポンス
- エラーログ
- パフォーマンス指標

## 🔒 セキュリティ

- ✅ Row Level Security (RLS) 有効化
- ✅ LINE Webhook 署名検証
- ✅ Stripe Webhook 署名検証
- ✅ 環境変数による秘密鍵管理
- ✅ 最小権限の原則

## 🛣️ ロードマップ

### P1 (1ヶ月)
- [x] MVP（通知/記録/称賛）
- [ ] 管理UI最小実装
- [ ] 本番環境デプロイ

### P2 (3ヶ月)
- [ ] 週次レポート機能
- [ ] プラン課金実装
- [ ] 可視化グラフ

### P3 (6ヶ月)
- [ ] チーム機能
- [ ] AI人格選択UI
- [ ] ランキング機能

### P4 (12ヶ月)
- [ ] 外部連携（Notion/Health/Fitbit）
- [ ] 公開API
- [ ] モバイルアプリ（オプション）

## 📝 ライセンス

[ライセンスを指定]

## 🤝 コントリビューション

コントリビューションは歓迎します！

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 お問い合わせ

- Issues: GitHub Issues
- Email: [連絡先を記載]
- LINE公式アカウント: [@habitline]

---

**HabitLine** - 続ける力を、設計で支える。
