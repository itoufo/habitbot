# 🚀 Netlifyデプロイ クイックスタート

HabitLine管理画面をNetlifyにデプロイする最速ガイド。

## ⚡ 3ステップでデプロイ

### Step 1: GitHubにプッシュ

```bash
# Git初期化（まだの場合）
git init
git add .
git commit -m "Initial HabitLine commit"

# GitHubリポジトリに接続
git remote add origin https://github.com/yourusername/habitline.git
git push -u origin main
```

### Step 2: Netlifyに接続

1. **Netlifyにログイン**: https://app.netlify.com/
2. **"Add new site"** をクリック
3. **"Import an existing project"** を選択
4. **GitHub** を選択してリポジトリを接続
5. リポジトリ選択: `yourusername/habitline`

### Step 3: 環境変数を設定

**Site settings** → **Environment variables** → **Add a variable**

必須の環境変数:

| 変数名 | 値 | 取得方法 |
|-------|---|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhb...` | Supabase Dashboard → Settings → API |

**"Deploy site"** をクリック！

---

## ✅ 自動設定される内容

`netlify.toml` により以下が自動設定されます:

- ✅ **Base directory**: `admin`
- ✅ **Build command**: `npm run build`
- ✅ **Publish directory**: `admin/.next`
- ✅ **Node version**: 18

設定の変更は不要です。

---

## 🔗 デプロイ後

デプロイが完了すると:

1. URLが発行されます: `https://your-site.netlify.app`
2. ダッシュボードにアクセス可能
3. 以降、`git push`で自動デプロイ

---

## 🎨 カスタムドメイン設定（オプション）

1. **Domain settings** に移動
2. **"Add custom domain"** をクリック
3. ドメイン入力（例: `admin.habitline.com`）
4. DNS設定:
   ```
   CNAME: your-site.netlify.app
   ```
5. SSL自動発行（Let's Encrypt）

---

## 🛠️ トラブルシューティング

### ビルドが失敗する

```bash
# ローカルでビルド確認
cd admin
npm install
npm run build
```

エラーがなければ、Netlifyで再デプロイ。

### データが表示されない

1. **環境変数を確認**: Site settings → Environment variables
2. **ブラウザコンソール**でエラー確認
3. **値が正しいか**再確認

### 環境変数を変更した

変更後、**"Trigger deploy"** → **"Deploy site"** で再デプロイが必要。

---

## 📊 ビルドステータス

ビルドの進捗は **Deploys** タブで確認:

- 🟢 **Published**: デプロイ成功
- 🟡 **Building**: ビルド中
- 🔴 **Failed**: ビルド失敗

---

## 💡 Tips

### プレビューデプロイ

ブランチをプッシュすると自動でプレビュー環境が作成されます:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

→ `https://feature-new-feature--your-site.netlify.app`

### ロールバック

過去のデプロイに戻す:

1. **Deploys** タブ
2. 戻したいデプロイを選択
3. **"Publish deploy"** をクリック

---

## 📚 詳細ドキュメント

- **完全ガイド**: [docs/DEPLOY.md](./docs/DEPLOY.md)
- **セットアップ**: [docs/SETUP.md](./docs/SETUP.md)
- **README**: [README.md](./README.md)

---

## ✨ これで完了！

あとは開発に集中するだけ。`git push`で自動デプロイされます。

**Happy deploying! 🚀**
