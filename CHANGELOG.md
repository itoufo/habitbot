# HabitLine Changelog

プロジェクトの変更履歴。

## [Unreleased] - 2025-11-10

### 追加
- 初期プロジェクト構造の作成
- Supabase データベーススキーマ（8テーブル + RLS + トリガー）
- Edge Functions（5つ）
  - `habit_handle_webhook` - LINE Webhook受信
  - `habit_send_reminder` - リマインド送信
  - `habit_analyze_feedback` - AIフィードバック生成
  - `habit_generate_report` - 週次レポート生成
  - `habit_upgrade_plan` - Stripe Webhook
- 共通ライブラリ（types, supabase, line）
- Next.js管理画面の骨組み
  - ダッシュボードページ（統計表示）
  - Supabaseクライアント設定
  - TypeScript型定義
- ドキュメント
  - README.md - プロジェクト概要
  - docs/SETUP.md - セットアップガイド
  - docs/API.md - API仕様書
  - PROJECT_STRUCTURE.md - プロジェクト構造
- スクリプト
  - deploy.sh - デプロイ自動化
  - setup-secrets.sh - 環境変数設定
  - generate-mock-data.ts - テストデータ生成
- データベースシードファイル
- 各Edge Functionに deno.json 追加
- .gitignore, .env.example

### 主要機能
- ✅ LINE完結の習慣管理
- ✅ 時刻指定リマインド
- ✅ 連続日数カウント（streak）
- ✅ AIパーソナライズ（4キャラクター）
- ✅ 週次レポート生成
- ✅ Stripe課金連携準備
- ✅ Row Level Security（RLS）
- ✅ リトライキュー

### 技術仕様
- Backend: Supabase (Postgres + Edge Functions)
- Language: TypeScript (Deno runtime)
- Frontend: Next.js 14 + React 18
- Styling: Tailwind CSS
- AI: OpenAI GPT-4o-mini
- Messaging: LINE Messaging API
- Payment: Stripe Subscriptions

### 次のステップ
- [ ] 管理画面の完全実装（ユーザー詳細、習慣分析、通知管理）
- [ ] チーム機能の完全実装
- [ ] バッジ・称号システム
- [ ] テストコード
- [ ] CI/CD パイプライン
- [ ] 外部連携（Notion, Fitbit等）
- [ ] 公開API

## バージョニング

このプロジェクトは [Semantic Versioning](https://semver.org/) に従います。

- MAJOR: 破壊的変更
- MINOR: 後方互換性のある新機能
- PATCH: 後方互換性のあるバグ修正
