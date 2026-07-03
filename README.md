# Creative Sense Archive

クリエイティブ作品(映像・アニメ・イラスト・写真・音楽・デザインなど)に触れた瞬間の感性を、
言語化フレームワーク(VTS / ORID / 要素分解 / 自己照合)を使って記録・蓄積するパーソナルアーカイブアプリ。

詳細な要件定義は [docs/requirements.md](./docs/requirements.md)、
既知の課題と改善計画は [docs/improvement-design.md](./docs/improvement-design.md) を参照してください。

## 技術スタック

- [Next.js](https://nextjs.org) 16 (App Router)
- [Supabase](https://supabase.com)（Auth / Postgres / Storage）
- [Vitest](https://vitest.dev)（テスト）
- Tailwind CSS

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーし、値を設定してください。

```bash
cp .env.example .env.local
```

必要な環境変数:

| 変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのanonキー |
| `AI_BASE_URL` | AI機能(Phase 2)用。OpenAI互換APIのベースURL（未設定時はローカルOllama想定） |
| `AI_API_KEY` | 同上のAPIキー |
| `AI_MODEL` | 使用するモデル名 |

本番ビルド(`NODE_ENV=production`)では `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` が未設定の場合エラーになります
（開発・テスト時のみプレースホルダにフォールバックします）。

### 3. Supabaseスキーマの適用

`supabase/schema.sql` の内容をSupabaseプロジェクトのSQL Editorで実行してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint実行 |
| `npm test` | Vitestでテスト実行 |
| `npm run test:watch` | Vitestをwatchモードで実行 |
| `npm run test:coverage` | カバレッジ付きでテスト実行 |

## 開発に参加する前に

このプロジェクトでの開発（ブランチ運用・コミット・PRのルール）は以下を参照してください:

- [Git運用ルール (docs/git-workflow.md)](./docs/git-workflow.md) — ブランチ戦略・コミット規約・PRルールの定義
- [Git運用マニュアル (docs/git-workflow-manual.md)](./docs/git-workflow-manual.md) — 日々の作業手順（コマンド付き手順書）

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
