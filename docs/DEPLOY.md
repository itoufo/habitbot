# HabitLine デプロイガイド

このガイドでは、HabitLineの各コンポーネントをデプロイする方法を説明します。

## 📦 デプロイ対象

1. **Supabase Backend** - Edge Functions + Database
2. **Admin Dashboard** - Next.js管理画面（Netlify）

---

## 1. Supabase Backend のデプロイ

### 前提条件
- Supabase CLI インストール済み
- Supabaseプロジェクト作成済み

### 手順

```bash
# 1. Supabaseにログイン
supabase login

# 2. プロジェクトにリンク
supabase link --project-ref your-project-ref

# 3. デプロイスクリプトを実行
./scripts/deploy.sh

# 4. 環境変数を設定
./scripts/setup-secrets.sh
```

### 環境変数

`.env`ファイルに以下を設定:

```env
HABIT_SUPABASE_URL=https://your-project.supabase.co
HABIT_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HABIT_LINE_CHANNEL_SECRET=your-line-channel-secret
HABIT_LINE_ACCESS_TOKEN=your-line-access-token
HABIT_OPENAI_API_KEY=sk-your-openai-api-key
HABIT_STRIPE_WEBHOOK_SECRET=whsec_your-stripe-secret
```

### Cron Jobs の設定

Supabase Dashboard → Database → Cron Jobs で設定。
詳細は [SETUP.md](./SETUP.md) を参照。

---

## 2. Admin Dashboard のデプロイ (Netlify)

### 方法 1: Netlify UI（推奨）

#### Step 1: GitHubにプッシュ

```bash
# リポジトリ初期化（まだの場合）
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリに接続
git remote add origin https://github.com/yourusername/habitline.git
git push -u origin main
```

#### Step 2: Netlify にインポート

1. [Netlify](https://app.netlify.com/) にログイン
2. "Add new site" → "Import an existing project"
3. "GitHub" を選択
4. リポジトリを選択: `yourusername/habitline`
5. ビルド設定を確認:
   - **Base directory**: `admin`
   - **Build command**: `npm run build`
   - **Publish directory**: `admin/.next`

   ※ `netlify.toml` があるため自動設定されます

#### Step 3: 環境変数を設定

Netlify Dashboard → Site settings → Environment variables

以下を追加:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |

#### Step 4: デプロイ

"Deploy site" をクリック。自動的にビルド & デプロイされます。

デプロイ完了後、`https://your-site.netlify.app` でアクセス可能。

---

### 方法 2: Netlify CLI

```bash
# Netlify CLI インストール
npm install -g netlify-cli

# ログイン
netlify login

# 初回デプロイ
netlify init

# ビルド & デプロイ
netlify deploy --prod
```

---

## 3. カスタムドメインの設定

### Netlifyでのカスタムドメイン

1. Netlify Dashboard → Domain settings
2. "Add custom domain" をクリック
3. ドメインを入力（例: `admin.habitline.com`）
4. DNS設定:
   - CNAMEレコードを追加: `your-site.netlify.app`
5. SSL証明書は自動発行されます（Let's Encrypt）

---

## 4. 継続的デプロイ (CI/CD)

GitHubにプッシュすると自動デプロイされます:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Netlifyが自動的に:
1. 変更を検知
2. ビルド実行
3. デプロイ

---

## 5. デプロイ後の確認

### Supabase

```bash
# Edge Functions の確認
curl https://your-project-ref.supabase.co/functions/v1/habit_handle_webhook

# データベース接続確認
supabase db remote status
```

### Netlify

1. https://your-site.netlify.app にアクセス
2. ダッシュボードが表示されるか確認
3. Supabaseとの接続確認（データが表示されるか）

---

## 6. トラブルシューティング

### Netlify ビルドが失敗する

**症状**: Build failed エラー

**解決策**:
```bash
# ローカルでビルド確認
cd admin
npm install
npm run build

# エラーがあれば修正してコミット
```

### 環境変数が反映されない

**症状**: Supabaseに接続できない

**解決策**:
1. Netlify → Site settings → Environment variables を確認
2. 値が正しいか確認
3. サイトを再デプロイ: Deploys → Trigger deploy → Deploy site

### デプロイは成功するがデータが表示されない

**症状**: ダッシュボードが空

**原因**:
- Supabase URLまたはキーが間違っている
- RLSポリシーの問題

**解決策**:
1. ブラウザのコンソールでエラー確認
2. Supabase環境変数を再確認
3. Supabase Dashboard → Authentication → Policies を確認

---

## 7. ロールバック

### Netlify

1. Deploys → 過去のデプロイを選択
2. "Publish deploy" をクリック

### Supabase

```bash
# マイグレーションのロールバック
supabase migration repair <version> --status reverted

# Edge Functionsの再デプロイ
./scripts/deploy.sh
```

---

## 8. モニタリング

### Netlify

- Deploy logs: ビルドログの確認
- Functions logs: Edge Functionのログ（使用時）
- Analytics: トラフィック統計

### Supabase

- Dashboard → Logs → Edge Functions
- Database → Performance
- Auth → Users

---

## 9. バックアップ

### データベース

```bash
# バックアップ取得
supabase db dump -f backup.sql

# リストア
supabase db reset
psql -h your-db-host -U postgres -f backup.sql
```

---

## 10. コスト最適化

### Netlify

- **Free tier**: 月100GB bandwidth, 300 build minutes
- **Pro**: $19/月（推奨）

### Supabase

- **Free tier**: 500MB database, 2GB bandwidth
- **Pro**: $25/月（本番推奨）

### OpenAI

- GPT-4o-mini: 安価なモデル使用
- 使用量制限の設定を推奨

---

## まとめ

1. ✅ Supabaseをデプロイ（`./scripts/deploy.sh`）
2. ✅ NetlifyにGitHubリポジトリを接続
3. ✅ 環境変数を設定
4. ✅ 自動デプロイを確認
5. ✅ カスタムドメインを設定（オプション）

詳細は [SETUP.md](./SETUP.md) を参照してください。
