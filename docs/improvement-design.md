# Creative Sense Archive — 問題分析と改善設計書

- 作成日: 2026-07-03
- 対象: `creative-sense-archive`(コード全量精査済み・約2,600行)
- 関連: [requirements.md](./requirements.md)

---

## 0. サマリー

コードベースは小規模でよく整理されているが、**認証ガードの不全(CRITICAL)** と **SSRF(CRITICAL)** という重大なセキュリティ問題、ビルドを壊す **依存欠落(HIGH)**、そして **テスト・CI が皆無** という品質基盤の欠如がある。以下に重大度順で問題を整理し、それぞれの改善方針・担当モデル・サブエージェント割り当てを定義する。

割り当て方針(ユーザー指定):
- **実装タスク → Sonnet 5**
- **調査・軽量タスク → Haiku 4.5**
- 設計・アーキ判断・セキュリティ最終判断 → Opus(最重要のみ)

---

## 1. 問題一覧(重大度順)

### CRITICAL

#### SEC-01: 認証ミドルウェアが機能していない可能性が高い
- **場所**: [proxy.ts](../proxy.ts)
- **内容**: Next.js のミドルウェアは慣例としてファイル名が `middleware.ts` である必要がある。本ファイルは `proxy.ts` かつエクスポート関数名が `proxy`。Next.js 16 で `proxy.ts` がミドルウェアとして採用される仕様かは要確認だが、少なくとも `matcher` config を持つミドルウェアとして**実際にリクエストごとに実行されているかの検証が取れていない**。もし実行されていなければ、未ログインでも `/archive` 等の**ページ**にアクセスできる(データは各 API の認証で守られるが、画面遷移のガードが無効)。
- **影響**: 認証境界の骨格が意図通り動いていない。要件 3.1 未達。
- **確認方法**: `node_modules/next/dist/docs/` でミドルウェアの正式なファイル名/規約を確認し、ローカルで未ログインアクセスを実測。
- **改善**: 正式名(`middleware.ts` 等)へリネーム、または Next.js 16 の規約に合わせる。加えて各ページ/レイアウトでのサーバー側 `getUser()` ガードを併用(多層防御)。

#### SEC-02: OGP 取得 API が SSRF に対して無防備
- **場所**: [app/api/ogp/route.ts](../app/api/ogp/route.ts) → [lib/ogp.ts](../lib/ogp.ts)
- **内容**: 認証不要のエンドポイントが、ユーザー指定の任意 URL に対してサーバーからリクエストを送る。`http://169.254.169.254/`(クラウドメタデータ)、`http://localhost`、内部ネットワーク、`file://` 相当への到達が防がれていない。リダイレクト追従も無制限。
- **影響**: 内部サービス探索・クラウド認証情報の窃取につながりうる。
- **改善**:
  1. スキームを `https`(必要なら `http`)に限定
  2. 名前解決後の IP がプライベート/ループバック/リンクローカルでないことを検証
  3. リダイレクト回数制限、レスポンスサイズ上限
  4. エンドポイントに認証を必須化(ログインユーザーのみ)

### HIGH

#### BUG-01: `@react-pdf/renderer` が未インストールでビルド不能
- **場所**: [package.json](../package.json) に依存記載あるが `node_modules` に不在。`npx tsc --noEmit` で以下のエラー:
  - `app/api/works/[id]/export/route.tsx`: `Cannot find module '@react-pdf/renderer'`
  - `lib/pdf-document.tsx`: 同上
- **影響**: PDF エクスポート(F-08)が動かない/本番ビルドが失敗する。
- **改善**: `npm install` の再実行で解決するか確認。ロックファイルとの整合、`@react-pdf/renderer` のバージョン互換(React 19 / Next 16)を検証。

#### BUG-02: 型チェックが Slack ページを参照(削除漏れ)
- **場所**: `tsc` 出力 `.next/types/validator.ts` が `app/settings/slack/page.js` を要求。Slack 連携は中止決定済みだが生成型に痕跡が残る。
- **影響**: 型エラー、混乱の元。
- **改善**: `.next` を消して再ビルドし解消するか確認。残存する参照元があれば除去。

#### PERF-01: 作品一覧が無制限クエリ(ページネーション無し)
- **場所**: [app/api/works/route.ts](../app/api/works/route.ts) の GET(`select('*')` に LIMIT 無し)
- **内容**: ユーザーの作品が増えると全件取得。UI 側もページングなし。
- **改善**: `range()` によるページネーション/無限スクロール、`LIMIT` 既定値の導入。非機能要件(性能)に対応。

#### SEC-03: works POST/PATCH の入力バリデーションが弱い
- **場所**: [app/api/works/route.ts](../app/api/works/route.ts)、[app/api/works/[id]/route.ts](../app/api/works/[id]/route.ts)
- **内容**: `category` / `framework` の値が列挙値かをアプリ側で検証していない(DB の CHECK 制約頼み)。`title` 等の長さ上限なし。`ws_answers` の形状未検証。エラーは DB メッセージをそのまま返しており情報漏洩の懸念。
- **改善**: スキーマバリデーション(zod 等)を境界に導入。列挙値・長さ・JSON 形状を検証し、DB エラーは汎用メッセージに変換。

### MEDIUM

#### QUAL-01: テストが 0 件
- **内容**: ユニット/統合/E2E いずれも無し。ユーザー標準ルールはカバレッジ 80% を要求。純粋関数(`lib/export.ts`, `lib/ogp.ts` のパース、`lib/frameworks.ts`)は特にテスト容易。
- **改善**: Vitest 導入 → `lib/` の純粋関数から着手 → API のルートハンドラ統合テスト → 主要フローの E2E(Playwright)。

#### QUAL-02: CI が存在しない
- **場所**: `.github` に PR テンプレートのみ、`workflows/` なし。
- **内容**: lint / type-check / test の自動実行がない。BUG-01/02 のようなビルド破壊を検知できていない。
- **改善**: GitHub Actions で `lint` + `tsc --noEmit` + `test` + `build` を PR ごとに実行。

#### PERF-02: 画像最適化を全面的に無効化
- **場所**: [app/archive/new/page.tsx:106](../app/archive/new/page.tsx)(生 `<img>`、ESLint 警告)、[WorkCard.tsx](../components/ui/WorkCard.tsx) と [archive/[id]/page.tsx](../app/archive/[id]/page.tsx) は `<Image unoptimized>`。
- **改善**: `next.config.ts` の `images.remotePatterns` に Supabase/OGP ドメインを登録し最適化を有効化。少なくとも登録画面の `<img>` は方針統一。

#### BUG-03: OGP のタイトルフォールバックが機能しない
- **場所**: [lib/ogp.ts:31-34](../lib/ogp.ts)
- **内容**: `getMeta('og:title') ?? $('title').first().text().trim() ?? null`。cheerio の `.text()` は常に文字列を返すため、`og:title` が無い場合でも空文字 `''` が返り、`??` を素通りする(空文字は null ではない)。結果、`title` が空文字になりうる。
- **改善**: 空文字を null 扱いに正規化(`|| null` あるいは trim 後に空判定)。

#### QUAL-03: クライアント Supabase のプレースホルダ フォールバック
- **場所**: [lib/supabase-client.ts](../lib/supabase-client.ts)
- **内容**: env 未設定時に `placeholder.supabase.co` へフォールバック。ビルド/テスト用途だが、本番で env 設定漏れが起きても無言で誤動作する危険。
- **改善**: 本番ビルド時は env 必須チェック。フォールバックは開発/テスト限定に。

### LOW

- **LOW-01**: 作品詳細のワークシートが読み取り専用で**編集(PATCH)導線が UI に無い**(サムネイル以外)。要件上「記録の更新」が必要なら UI 追加。API は対応済み。
- **LOW-02**: `/api/works/[id]` の PATCH で更新可能フィールドに空更新(全フィールド未指定)を許容。空 updates 時のガードを追加すると堅牢。
- **LOW-03**: README が create-next-app の初期テンプレのまま(プロジェクト説明・セットアップ手順が薄い)。
- **LOW-04**: `.env.example` の中身を確認できずドキュメント未整備の可能性。必要な環境変数(SUPABASE, AI_*)の一覧を明記。

---

## 2. 改善ロードマップ(推奨順)

| フェーズ | 対応項目 | ゴール |
|---|---|---|
| P0(緊急) | SEC-01, SEC-02, BUG-01, BUG-02 | セキュリティ穴を塞ぎ、ビルドを通す |
| P1(基盤) | QUAL-01, QUAL-02 | テスト+CI で回帰を防ぐ土台 |
| P2(堅牢化) | SEC-03, PERF-01, BUG-03, QUAL-03 | 入力検証・性能・データ整合 |
| P3(仕上げ) | PERF-02, LOW-01〜04 | UX と運用性の改善 |
| P4(Phase 2) | F-20〜F-22 の AI 機能 | 設計は codex app server 側主導、Claude Code 側は後続 |

---

## 3. サブエージェント / モデル選定設計

> 原則: **実装は Sonnet 5**、**調査・軽量作業は Haiku 4.5**、**設計・セキュリティ最終判断など最重要のみ Opus**。既存の `~/.claude/agents/` の役割を流用する。

### 3.1 タスク別 割り当て表

| タスク | フェーズ | 推奨エージェント | モデル | 理由 |
|---|---|---|---|---|
| Next.js 16 のミドルウェア規約を `node_modules/next/dist/docs/` で調査 | P0 | Explore | **Haiku** | 定型的な調査・読み取り中心 |
| SEC-01 認証ガード修正(リネーム+多層防御) | P0 | (直接実装) | **Sonnet 5** | 認証境界の実装。影響範囲の判断込み |
| SEC-01/02 のセキュリティ最終レビュー | P0 | security-reviewer | **Opus** | 認証・SSRF は最重要、判断ミスの代償が大きい |
| SEC-02 SSRF 対策実装(URL/IP 検証) | P0 | (直接実装) | **Sonnet 5** | ネットワーク検証ロジックの実装 |
| BUG-01/02 依存インストール・ビルド修復 | P0 | build-error-resolver | **Sonnet 5** | ビルドエラーの原因追跡と修正 |
| 既存純粋関数の仕様調査(テスト対象洗い出し) | P1 | Explore | **Haiku** | コード読解・列挙タスク |
| Vitest 導入・ユニット/統合テスト実装 | P1 | tdd-guide | **Sonnet 5** | テスト設計と実装 |
| GitHub Actions CI 作成 | P1 | (直接実装) | **Sonnet 5** | ワークフロー設計・実装 |
| SEC-03 入力バリデーション(zod)実装 | P2 | (直接実装) | **Sonnet 5** | 境界バリデーションの実装 |
| PERF-01 ページネーション実装 | P2 | (直接実装) | **Sonnet 5** | API+UI 実装 |
| BUG-03 OGP パース修正 | P2 | (直接実装) | **Sonnet 5** | ロジック修正(小) |
| PERF-02 画像最適化設定 | P3 | (直接実装) | **Sonnet 5** | 設定+置換 |
| ライブラリ/ベストプラクティスの下調べ全般 | 全般 | Explore / 直接 | **Haiku** | Web/docs 検索など軽量 |
| 実装後の一般コードレビュー | 各P | code-reviewer | **Sonnet 5** | 品質・パターン確認 |
| アーキ判断(Phase 2 AI 設計の分担整理等) | P4 | architect | **Opus** | 設計上の重要判断 |

### 3.2 並列実行できるまとまり

依存の無い作業は並列化(`dispatching-parallel-agents` の方針)。

- **並列グループ A(P0 調査)**: Next.js ミドルウェア規約調査(Haiku)/ `@react-pdf` 依存状況調査(Haiku)を同時に。
- **並列グループ B(P1)**: `lib/` 純粋関数テスト(Sonnet)と CI ワークフロー作成(Sonnet)は独立して並列可。
- 直列必須: SEC-01/02 の実装 → security-reviewer(Opus)レビュー → 修正、の順は守る。

### 3.3 運用ルール

1. コード変更後は必ず code-reviewer(Sonnet)を通す。認証・入力・外部通信・DB を触ったら security-reviewer(Opus)も。
2. 実装は TDD(RED→GREEN→REFACTOR)。まず失敗するテストを書く。
3. 調査系は Haiku に投げてコストを抑え、結論だけ受け取る。
4. Opus は SEC-01/02 のレビューと Phase 2 のアーキ判断など、判断の重さに見合う場面に限定。

---

## 4. 次アクション(P0 の具体手順)

1. `node_modules/next/dist/docs/` でミドルウェアの正式規約を確認(Haiku / Explore)
2. `npm install` を再実行し `@react-pdf/renderer` を復旧、`.next` 削除で BUG-02 の型痕跡を除去(Sonnet / build-error-resolver)
3. `middleware` の正式化 + ページ側サーバーガードの多層防御を実装(Sonnet)
4. `/api/ogp` に認証必須化 + SSRF 検証を実装(Sonnet)
5. security-reviewer(Opus)で 3・4 を最終確認
6. `tsc --noEmit` と `eslint` がクリーンになることを確認して P1 へ
