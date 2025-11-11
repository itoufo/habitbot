# HabitLine セットアップガイド

このガイドでは、HabitLineを最初からセットアップする手順を詳しく説明します。

## 📋 目次

1. [必要なアカウント・ツール](#必要なアカウント・ツール)
2. [Supabaseプロジェクトのセットアップ](#supabaseプロジェクトのセットアップ)
3. [LINE Messaging APIのセットアップ](#line-messaging-apiのセットアップ)
4. [OpenAI APIのセットアップ](#openai-apiのセットアップ)
5. [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
6. [本番環境へのデプロイ](#本番環境へのデプロイ)
7. [Stripeのセットアップ（オプション）](#stripeのセットアップ)

---

## 必要なアカウント・ツール

### 必須
- ✅ **Node.js 18+** - [https://nodejs.org/](https://nodejs.org/)
- ✅ **Supabaseアカウント** - [https://supabase.com/](https://supabase.com/)
- ✅ **LINE Developersアカウント** - [https://developers.line.biz/](https://developers.line.biz/)
- ✅ **OpenAI APIキー** - [https://platform.openai.com/](https://platform.openai.com/)

### オプション
- 💳 **Stripeアカウント** - 課金機能を使う場合 [https://stripe.com/](https://stripe.com/)

---

## Supabaseプロジェクトのセットアップ

### 1. Supabase CLIのインストール

```bash
npm install -g supabase
```

### 2. Supabaseにログイン

```bash
supabase login
```

ブラウザが開くので、Supabaseアカウントでログインします。

### 3. 新しいプロジェクトを作成

[Supabase Dashboard](https://app.supabase.com/)で:

1. "New Project" をクリック
2. プロジェクト名: `habitline` (任意)
3. Database Password: 強力なパスワードを設定（保存しておく）
4. Region: `Northeast Asia (Tokyo)` を推奨
5. "Create new project" をクリック

### 4. プロジェクトにリンク

```bash
cd /path/to/habit
supabase link --project-ref your-project-ref
```

`your-project-ref` は Supabase Dashboard の URL から確認できます:
`https://app.supabase.com/project/【ここがproject-ref】`

### 5. 環境変数を取得

Supabase Dashboard → Settings → API で以下を取得:

- `Project URL` → `HABIT_SUPABASE_URL`
- `anon public` → `HABIT_SUPABASE_ANON_KEY`
- `service_role` → `HABIT_SUPABASE_SERVICE_ROLE_KEY` ⚠️ 秘密にする

---

## LINE Messaging APIのセットアップ

### 1. LINE Developersコンソールにアクセス

[LINE Developers Console](https://developers.line.biz/console/) にアクセス

### 2. プロバイダーを作成

1. "Create a new provider" をクリック
2. Provider name: `HabitLine` (任意)
3. "Create" をクリック

### 3. Messaging APIチャネルを作成

1. "Create a Messaging API channel" をクリック
2. 以下を入力:
   - Channel name: `HabitLine Bot`
   - Channel description: `習慣化支援ボット`
   - Category: `Productivity`
   - Subcategory: 適切なものを選択
3. 利用規約に同意して "Create" をクリック

### 4. チャネル設定

#### Messaging API設定タブ

1. **Channel access token** を発行
   - "Issue" ボタンをクリック
   - 発行されたトークンをコピー → `HABIT_LINE_ACCESS_TOKEN`

2. **Webhook URL** を設定（後で設定）
   ```
   https://your-project-ref.supabase.co/functions/v1/habit_handle_webhook
   ```

3. **Webhook** を有効化
   - "Use webhook" を ON にする

4. **Auto-reply messages** を無効化
   - "Auto-reply messages" → "Edit" → すべて無効化

5. **Greeting messages** を無効化
   - "Greeting messages" → "Edit" → 無効化

#### Basic settingsタブ

1. **Channel secret** をコピー → `HABIT_LINE_CHANNEL_SECRET`

### 5. QRコードで友だち追加

Messaging API設定タブの QR コードをスキャンして、テスト用に友だち追加しておきます。

---

## OpenAI APIのセットアップ

### 1. OpenAI Platform にアクセス

[https://platform.openai.com/](https://platform.openai.com/)

### 2. APIキーを作成

1. 右上のアカウントメニュー → "API keys" をクリック
2. "Create new secret key" をクリック
3. 名前を入力（例: `HabitLine`）
4. キーをコピー → `HABIT_OPENAI_API_KEY`
   ⚠️ 一度しか表示されないので必ず保存

### 3. 課金設定

1. Settings → Billing で支払い方法を登録
2. 使用量制限を設定（例: $10/月）

---

## ローカル開発環境のセットアップ

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd habit
```

### 2. 環境変数ファイルを作成

```bash
cp .env.example .env
```

`.env` ファイルを編集して、取得した値を設定:

```env
HABIT_SUPABASE_URL=https://xxxxx.supabase.co
HABIT_SUPABASE_SERVICE_ROLE_KEY=eyJhb...
HABIT_SUPABASE_ANON_KEY=eyJhb...

HABIT_LINE_CHANNEL_SECRET=xxxxx
HABIT_LINE_ACCESS_TOKEN=xxxxx

HABIT_OPENAI_API_KEY=sk-xxxxx
```

### 3. Supabaseをローカルで起動

```bash
supabase start
```

初回は Docker イメージのダウンロードに時間がかかります。

### 4. データベースマイグレーションを実行

```bash
supabase db reset
```

これで `supabase/migrations/` 内のSQLが実行されます。

### 5. Edge Functionsをローカルで起動

```bash
# 特定の関数を起動
supabase functions serve habit_handle_webhook

# または、別ターミナルで全関数を起動
supabase functions serve
```

### 6. ローカルでテスト

```bash
# Webhook のテスト
curl -X POST http://localhost:54321/functions/v1/habit_handle_webhook \
  -H "Content-Type: application/json" \
  -d '{"events": []}'
```

---

## 本番環境へのデプロイ

### 1. データベースマイグレーションをデプロイ

```bash
supabase db push
```

### 2. Edge Functionsをデプロイ

提供されているスクリプトを使用:

```bash
./scripts/deploy.sh
```

または手動で:

```bash
supabase functions deploy habit_handle_webhook --no-verify-jwt
supabase functions deploy habit_send_reminder --no-verify-jwt
supabase functions deploy habit_analyze_feedback --no-verify-jwt
supabase functions deploy habit_generate_report --no-verify-jwt
supabase functions deploy habit_upgrade_plan --no-verify-jwt
```

### 3. 環境変数（Secrets）を設定

スクリプトを使用:

```bash
./scripts/setup-secrets.sh
```

または手動で:

```bash
supabase secrets set HABIT_LINE_CHANNEL_SECRET="your-secret"
supabase secrets set HABIT_LINE_ACCESS_TOKEN="your-token"
supabase secrets set HABIT_OPENAI_API_KEY="your-key"
supabase secrets set HABIT_SUPABASE_URL="https://xxx.supabase.co"
supabase secrets set HABIT_SUPABASE_SERVICE_ROLE_KEY="your-key"
```

確認:

```bash
supabase secrets list
```

### 4. LINE Webhook URLを設定

LINE Developers Console に戻って:

1. Messaging API設定タブ
2. Webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/habit_handle_webhook
   ```
3. "Verify" ボタンをクリックして検証
4. "Use webhook" を ON にする

### 5. Cron Jobs（スケジュール）を設定

Supabase Dashboard → Database → Cron Jobs で設定:

#### 朝のリマインド（7:00 JST = 22:00 UTC前日）

```sql
SELECT cron.schedule(
  'habit-reminder-morning',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_send_reminder',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

#### 夜のリマインド（22:00 JST = 13:00 UTC）

```sql
SELECT cron.schedule(
  'habit-reminder-night',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_send_reminder',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

#### AIフィードバック（23:00 JST = 14:00 UTC）

```sql
SELECT cron.schedule(
  'habit-analyze-feedback',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_analyze_feedback',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

#### 週次レポート（日曜 20:00 JST = 日曜 11:00 UTC）

```sql
SELECT cron.schedule(
  'habit-weekly-report',
  '0 11 * * 0',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/habit_generate_report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

⚠️ `YOUR_SERVICE_ROLE_KEY` を実際のサービスロールキーに置き換えてください。

### 6. 動作確認

1. LINE で Bot を友だち追加
2. 「開始」と送信
3. ヘルプメッセージが返ってくることを確認
4. 「習慣 追加 テスト」と送信
5. 登録完了メッセージが返ってくることを確認

---

## Stripeのセットアップ（オプション）

課金機能を実装する場合:

### 1. Stripeアカウントを作成

[https://stripe.com/](https://stripe.com/)

### 2. 商品・価格を作成

Stripe Dashboard → Products で:

1. Standard プラン: ¥980/月
2. Premium プラン: ¥1,980/月
3. Team プラン: ¥9,800/月〜

各価格IDをメモ（`price_xxxxx`）

### 3. Webhook エンドポイントを追加

Stripe Dashboard → Developers → Webhooks:

1. "Add endpoint" をクリック
2. Endpoint URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/habit_upgrade_plan
   ```
3. イベントを選択:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. "Add endpoint" をクリック

### 4. Webhook シークレットを取得

作成したエンドポイントの詳細ページで "Signing secret" をコピー → `HABIT_STRIPE_WEBHOOK_SECRET`

### 5. Stripe Secretsを設定

```bash
supabase secrets set HABIT_STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

### 6. データベースに stripe_customer_id カラムを追加

```sql
ALTER TABLE habit_users ADD COLUMN stripe_customer_id TEXT UNIQUE;
```

---

## トラブルシューティング

### LINE Webhook が動作しない

1. Webhook URL が正しいか確認
2. Supabase Functions のログを確認:
   - Dashboard → Logs → Edge Functions
3. 署名検証エラーの場合、`HABIT_LINE_CHANNEL_SECRET` が正しいか確認

### リマインドが送信されない

1. Cron Jobs が正しく設定されているか確認
2. `habit_habits` テーブルに `reminder_time` が設定されているか確認
3. Edge Functions のログでエラーを確認

### AI フィードバックが生成されない

1. `HABIT_OPENAI_API_KEY` が正しく設定されているか確認
2. OpenAI の残高があるか確認
3. レート制限に達していないか確認

---

## 次のステップ

✅ セットアップ完了！

次は:
1. 管理画面の構築（`admin/` ディレクトリ）
2. より高度な機能の追加
3. 本番運用の監視設定

詳細は [README.md](../README.md) を参照してください。
