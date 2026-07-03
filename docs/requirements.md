# Creative Sense Archive — 要件定義書

- 作成日: 2026-07-03
- 版: 1.0
- 対象リポジトリ: `creative-sense-archive`(Next.js 16 / Supabase / Vercel 想定)
- 根拠: 実装済みコード・`supabase/schema.sql`・既存ドキュメントの精査結果に基づく(逆算定義+Phase 2 計画)

---

## 1. プロダクト概要

### 1.1 目的

クリエイティブ作品(映像・イラスト・音楽など)に触れた瞬間の感性を、言語化フレームワークを使って記録・蓄積し、将来的に AI 分析によって自己の美的センス(審美眼・価値観・パターン)を可視化するパーソナルアーカイブアプリ。

### 1.2 ターゲットユーザー

- 自分の「好き」を言語化して創作・仕事に活かしたい個人クリエイター
- 感性のインプットを習慣化したい人(通知リマインダー機能が対応)

### 1.3 提供価値

1. **記録**: 作品との出会いを最短ステップでアーカイブ(URL から OGP 自動取得)
2. **言語化**: 4種のフレームワーク(VTS / ORID / 要素分解 / 自己照合)による構造化された内省
3. **分析**(Phase 2): 蓄積データから AI が美的傾向・価値観・パターンを抽出
4. **共有・持ち出し**: Markdown / PDF エクスポート、SNS 用テキスト生成

---

## 2. スコープ

### 2.1 Phase 1(実装済み)

| # | 機能 | 状態 |
|---|------|------|
| F-01 | メール+パスワード / Google OAuth 認証 | 実装済み |
| F-02 | 作品登録(タイトル・カテゴリ・URL・メモ・サムネイル) | 実装済み |
| F-03 | URL からの OGP 自動取得(タイトル・画像) | 実装済み |
| F-04 | サムネイル画像アップロード(Supabase Storage) | 実装済み |
| F-05 | 言語化ワークシート(4フレームワーク・ヒント付き) | 実装済み |
| F-06 | アーカイブ一覧(カテゴリ / フレームワーク / キーワード検索) | 実装済み |
| F-07 | 作品詳細表示・削除・サムネイル差し替え | 実装済み |
| F-08 | Markdown / PDF エクスポート | 実装済み |
| F-09 | SNS 用要約テキスト生成(280字)・クリップボードコピー | 実装済み |
| F-10 | 未登録期間リマインド通知(アプリ内バナー・しきい値設定) | 実装済み |
| F-11 | プロフィール設定(表示名) | 実装済み |

### 2.2 Phase 2(計画・未実装)

| # | 機能 | 備考 |
|---|------|------|
| F-20 | AI 対話による言語化深掘りチャット(作品ごと) | `lib/ai.ts`・`ai_chat_logs` テーブルは準備済み。AI 実装の設計は codex app server 側で行う方針 |
| F-21 | AI 自己分析(審美眼・価値観・パターン・キーワード抽出) | `analyses` テーブル準備済み。`/analysis` はプレースホルダ |
| F-22 | 分析結果の可視化(キーワードクラウド等) | 未着手 |

### 2.3 スコープ外(中止決定)

- Slack 連携(2026-06-14 に中止決定)

---

## 3. 機能要件詳細

### 3.1 認証(F-01)

- Supabase Auth を利用。メール+パスワード(サインアップ時は確認メール)、Google OAuth に対応
- サインアップ時、DB トリガー `handle_new_user` が `public.users` に行を自動作成
- 未ログインユーザーは `/archive` `/settings` `/analysis` にアクセス不可(→ `/login` にリダイレクト)
  - **注**: 現状この要件は proxy.ts の不具合により満たされていない(改善設計書 SEC-01 参照)
- ログイン済みユーザーが `/login` にアクセスした場合は `/archive` にリダイレクト

### 3.2 作品登録(F-02〜F-05)

- 必須項目: タイトル、カテゴリ、言語化フレームワーク
- 任意項目: URL、サムネイル、一言メモ、ワークシート回答
- カテゴリ: `movie / anime / illustration / photo / music / design / other`
- フレームワーク: `vts / orid / element / self`(それぞれ 3〜4 ステップの設問+ヒント)
- URL 入力の blur 時に `/api/ogp` を呼び、タイトル・サムネイルを自動補完(未入力の場合のみ)
- サムネイル: JPEG/PNG/WebP/GIF、5MB 以下。`thumbnails/<user_id>/<uuid>.<ext>` に保存し公開 URL を利用

### 3.3 アーカイブ(F-06〜F-07)

- 一覧はログインユーザー自身の作品のみ、登録日降順
- フィルタ: カテゴリ、フレームワーク(それぞれ単一選択)
- 検索: タイトル・メモの部分一致(pg_trgm GIN インデックスで高速化)
- フィルタ・検索状態は URL クエリに同期(共有・リロード耐性)
- 詳細画面: メタ情報、メモ、ワークシート回答(読み取り専用)、エクスポート、削除

### 3.4 エクスポート(F-08〜F-09)

- Markdown: タイトル・メタ情報・メモ・ワークシート回答を整形して出力
- PDF: `@react-pdf/renderer` によるサーバーサイド生成
- ファイル名: `YYYY-MM-DD_<サニタイズ済みタイトル>.md|pdf`
- SNS テキスト: タイトル+URL+要点(メモ優先)+ハッシュタグを 280 字以内に収める

### 3.5 通知(F-10)

- 「最終作品登録日からの経過日数 ≥ しきい値」でアプリ内バナー表示
- しきい値: 1〜365 日(デフォルト 7 日)。通知の有効/無効を設定可能
- 作品が 0 件のときは通知しない

### 3.6 AI 機能(F-20〜F-22、Phase 2)

- AI クライアントは OpenAI 互換 API(`AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` 環境変数)で抽象化済み。ローカル Ollama からクラウド API まで差し替え可能
- チャット: リトライ(最大3回・指数バックオフ)と ストリーミングの基盤実装あり
- 分析結果は `analyses` テーブル(aesthetic / values / pattern / keywords / works_count)に保存する設計

---

## 4. 非機能要件

| 分類 | 要件 | 現状 |
|------|------|------|
| セキュリティ | 全テーブル・Storage に RLS を適用し、ユーザーは自分のデータのみ操作可能 | 適用済み(サムネイル閲覧のみ public) |
| セキュリティ | API は全エンドポイントでサーバー側認証チェック | `/api/ogp` を除き実施(要改善) |
| セキュリティ | 外部 URL への サーバーサイドアクセスは SSRF 対策を行う | **未対応(要改善)** |
| 性能 | 一覧取得はページネーションを行い、無制限クエリを発行しない | **未対応(要改善)** |
| 性能 | 検索はインデックスを利用(pg_trgm) | 対応済み |
| 可用性 | AI 呼び出しはリトライ・タイムアウトを備える | 基盤あり(未使用) |
| 品質 | テストカバレッジ 80% 以上(ユーザー標準ルール) | **テスト 0 件(要改善)** |
| 品質 | CI で lint / type-check / test を自動実行 | **CI 未設定(要改善)** |
| 運用 | ブランチ戦略: main / develop / feature、PR プレビューをテスト環境として利用 | docs/git-workflow.md で定義済み |
| 秘密情報 | シークレットは環境変数管理、リポジトリにコミットしない | `.env.local` はgitignore済み |

---

## 5. データモデル

```
auth.users 1──1 public.users(プロフィール・通知設定)
public.users 1──* public.works(作品)
public.works 1──* public.ai_chat_logs(AIチャット履歴、Phase 2)
public.users 1──* public.analyses(AI分析結果、Phase 2)
storage: thumbnails バケット(public、<user_id>/ 配下に所有権)
```

主要制約:
- `works.category` / `works.framework` は CHECK 制約で列挙値を強制
- `notification_threshold_days > 0`
- 削除は FK の `on delete cascade` で連鎖

## 6. API 一覧

| メソッド | パス | 認証 | 用途 |
|---|---|---|---|
| GET | /api/works | 要 | 一覧(category / framework / q フィルタ) |
| POST | /api/works | 要 | 作品登録 |
| GET/PATCH/DELETE | /api/works/[id] | 要 | 詳細・更新・削除 |
| GET | /api/works/[id]/export?format=md\|pdf | 要 | エクスポート |
| GET | /api/ogp?url= | **不要(要改善)** | OGP 取得 |
| GET/PATCH | /api/settings/profile | 要 | プロフィール |
| GET/PATCH | /api/settings/notifications | 要 | 通知設定 |
| GET | /api/notifications/status | 要 | 通知判定 |

## 7. 画面一覧

| パス | 内容 |
|---|---|
| / | ランディング |
| /login | ログイン / サインアップ |
| /archive | 一覧+フィルタ+検索 |
| /archive/new | 作品登録(OGP 取得・ワークシート) |
| /archive/[id] | 詳細・エクスポート・削除 |
| /analysis | AI 自己分析(Phase 2 プレースホルダ) |
| /settings | プロフィール・通知設定 |

## 8. 制約・前提

- Next.js 16(App Router、middleware は `proxy.ts` 命名)。API・規約が学習データと異なる可能性があるため `node_modules/next/dist/docs/` を参照して実装すること(AGENTS.md)
- DB スキーマは `supabase/schema.sql` を Supabase SQL Editor で適用する運用(マイグレーションツール未導入)
- デプロイは Vercel、テストは PR プレビュー環境で実施する運用

## 9. 既知の課題

現状の実装には認証ガード不全・SSRF などの重要な問題がある。詳細と改善計画は [improvement-design.md](./improvement-design.md) を参照。
