# HabitLine Scripts

開発・運用に便利なスクリプト集。

## デプロイスクリプト

### deploy.sh

すべてのEdge FunctionsとDBマイグレーションをデプロイします。

```bash
./scripts/deploy.sh
```

## 環境変数設定

### setup-secrets.sh

`.env`ファイルから環境変数を読み込んで、Supabaseにsecretsとして設定します。

```bash
# 事前に .env ファイルを作成
cp .env.example .env
# .env を編集

# Secretsを設定
./scripts/setup-secrets.sh
```

## モックデータ生成

### generate-mock-data.ts

開発・テスト用のモックデータを生成します。

**前提条件:**
- Deno がインストールされていること
- 環境変数が設定されていること

```bash
# 環境変数を設定
export HABIT_SUPABASE_URL="https://your-project.supabase.co"
export HABIT_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 10ユーザー分のデータを生成（デフォルト）
./scripts/generate-mock-data.ts

# 50ユーザー分のデータを生成
./scripts/generate-mock-data.ts 50

# 既存データを削除してから生成
./scripts/generate-mock-data.ts 20 --clean
```

**生成されるデータ:**
- ユーザー（指定数）
- 各ユーザーに2〜5個の習慣
- 過去30日分のログ（リアルな達成パターン）
- 過去7日分のAIフィードバック

**注意:**
`--clean` オプションを使うと、既存のすべてのデータが削除されます。本番環境では使用しないでください！

## その他の便利スクリプト

今後追加予定:
- `backup-db.sh` - データベースバックアップ
- `restore-db.sh` - データベースリストア
- `health-check.sh` - ヘルスチェック
- `analyze-performance.sh` - パフォーマンス分析
