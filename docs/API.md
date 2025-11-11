# HabitLine API ドキュメント

HabitLineの内部APIとエンドポイントの仕様。

## Edge Functions エンドポイント

ベースURL: `https://your-project-ref.supabase.co/functions/v1`

---

## 1. habit_handle_webhook

LINE Messaging API からの Webhook を受信。

### エンドポイント
```
POST /habit_handle_webhook
```

### 認証
LINE 署名検証（`x-line-signature` ヘッダー）

### リクエスト
LINE Webhook 形式（JSON）

```json
{
  "destination": "U...",
  "events": [
    {
      "type": "message",
      "timestamp": 1234567890,
      "source": {
        "type": "user",
        "userId": "U..."
      },
      "replyToken": "...",
      "message": {
        "type": "text",
        "id": "...",
        "text": "やった"
      }
    }
  ]
}
```

### レスポンス
```json
{
  "success": true
}
```

### サポートされるコマンド
- `開始` / `help` - ヘルプ表示
- `習慣 追加 <タイトル>` - 習慣登録
- `やった` - 達成記録
- `進捗` - 進捗確認
- `一覧` - 習慣一覧

---

## 2. habit_send_reminder

定期実行でリマインドを送信。

### エンドポイント
```
POST /habit_send_reminder
```

### 認証
Supabase Service Role Key（Authorization ヘッダー）

### リクエスト
```json
{}
```

パラメータ不要（現在時刻に基づいて自動判定）

### レスポンス
```json
{
  "success": true,
  "message": "Sent 42 reminders, 1 failed",
  "total": 43,
  "successful": 42,
  "failed": 1
}
```

### Cron設定例
```sql
-- 毎日 7:00 JST (22:00 UTC 前日)
SELECT cron.schedule(
  'habit-reminder-morning',
  '0 22 * * *',
  $$ ... $$
);
```

---

## 3. habit_analyze_feedback

ユーザーの1日の活動を分析してAIフィードバックを生成。

### エンドポイント
```
POST /habit_analyze_feedback
```

### 認証
Supabase Service Role Key

### リクエスト
```json
{
  "date": "2025-11-10"  // オプション、デフォルトは今日
}
```

### レスポンス
```json
{
  "success": true,
  "message": "Generated feedback for 15 users, 0 failed",
  "total": 15,
  "successful": 15,
  "failed": 0
}
```

### 生成されるフィードバック例
```
今日も頑張りましたね!✨ 3つの習慣を達成できました。
特に「読書10分」が5日連続です。
明日は朝起きてすぐに習慣をこなすと、より確実に続けられます。
続けることが一番大切です💫
```

---

## 4. habit_generate_report

週次レポートを生成してLINEで送信。

### エンドポイント
```
POST /habit_generate_report
```

### 認証
Supabase Service Role Key

### リクエスト
```json
{}
```

### レスポンス
```json
{
  "success": true,
  "message": "Sent 120 reports, 2 failed",
  "total": 122,
  "successful": 120,
  "failed": 2
}
```

### レポート例
```
📊 週間レポート 🎉

こんにちは、田中さん！
今週の習慣の記録をお知らせします。

【全体の達成率】
18/21回 (86%)

【習慣別の実績】
• 読書10分
  ██████████ 7/7回 (100%)
  🔥 12日連続！

• ジョギング
  ████████░░ 6/7回 (86%)
  🔥 3日連続！

素晴らしい一週間でした!✨
```

---

## 5. habit_upgrade_plan

Stripe Webhook を受信してプラン更新。

### エンドポイント
```
POST /habit_upgrade_plan
```

### 認証
Stripe 署名検証（`stripe-signature` ヘッダー）

### リクエスト
Stripe Webhook 形式（JSON）

```json
{
  "id": "evt_...",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "customer": "cus_...",
      "status": "active",
      "items": {
        "data": [
          {
            "price": {
              "id": "price_standard_monthly"
            }
          }
        ]
      }
    }
  }
}
```

### レスポンス
```json
{
  "received": true
}
```

### サポートされるイベント
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## データベース API（Supabase Client）

### ユーザー取得

```typescript
const { data, error } = await supabase
  .from('habit_users')
  .select('*')
  .eq('line_id', lineUserId)
  .single()
```

### 習慣登録

```typescript
const { data, error } = await supabase
  .from('habit_habits')
  .insert({
    user_id: userId,
    title: '読書10分',
    reminder_time: '07:00:00',
    is_active: true
  })
  .select()
  .single()
```

### ログ記録（Upsert）

```typescript
const { data, error } = await supabase
  .from('habit_logs')
  .upsert({
    habit_id: habitId,
    date: '2025-11-10',
    status: true
  }, {
    onConflict: 'habit_id,date'
  })
```

### 進捗取得

```typescript
const { data, error } = await supabase
  .from('habit_habits')
  .select('title, streak_count, is_active')
  .eq('user_id', userId)
  .eq('is_active', true)
```

---

## エラーハンドリング

### 共通エラーレスポンス

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTPステータスコード

- `200` - 成功
- `400` - リクエストエラー
- `401` - 認証エラー
- `405` - メソッド不許可
- `500` - サーバーエラー

---

## レート制限

現時点では制限なし。将来的に実装予定:

- LINE API: 月間メッセージ数制限（プランによる）
- OpenAI API: リクエスト/分の制限（アカウント設定による）

---

## セキュリティ

### 署名検証

#### LINE
```typescript
const signature = req.headers.get('x-line-signature')
const isValid = await verifyLINESignature(body, signature, channelSecret)
```

#### Stripe
```typescript
const signature = req.headers.get('stripe-signature')
const isValid = await verifyStripeSignature(body, signature, webhookSecret)
```

### Row Level Security (RLS)

すべてのテーブルでRLSが有効。ユーザーは自分のデータのみアクセス可能。

```sql
-- 例: habit_habits
create policy habit_habits_select_owner on habit_habits
  for select
  using (
    exists (
      select 1 from habit_users
      where habit_users.id = habit_habits.user_id
      and habit_users.id = auth.uid()
    )
  );
```

---

## 監視・ログ

### Supabase Dashboard

Logs → Edge Functions で確認:

- リクエスト/レスポンス
- エラースタックトレース
- 実行時間
- メモリ使用量

### 構造化ログ例

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  function: 'habit_send_reminder',
  userId: user.id,
  habitId: habit.id,
  status: 'success',
  duration: 123
}))
```

---

## 今後の拡張

### 計画中のエンドポイント

- `POST /habit_batch_import` - CSV一括登録
- `GET /habit_export_data` - データエクスポート
- `POST /habit_team_invite` - チーム招待
- `GET /habit_analytics` - 分析API

### 公開API（将来）

OAuth 2.0 認証で外部サービス連携を実現予定。
