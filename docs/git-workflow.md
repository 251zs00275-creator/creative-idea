# Git運用ルール (Creative Sense Archive)

このドキュメントは、本プロジェクトにおけるブランチ運用・コミット・プルリクエスト(PR)の
ルールを定めたものです。実務でよく使われる **GitHub Flow** と **Conventional Commits**
をベースに、本プロジェクトの規模（個人〜小規模チーム開発）に合わせて調整しています。

参考:
- [A successful Git branching model (nvie.com)](https://nvie.com/posts/a-successful-git-branching-model/)
- [Feature Branch Workflow (Atlassian)](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow)
- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- [Creating a pull request template (GitHub Docs)](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)

---

## 1. ブランチ戦略

### 1.1 基本方針: GitHub Flow（mainブランチ + 短命なトピックブランチ）

- `main` ブランチは **常にデプロイ可能な状態** を維持する（直接コミットしない）
- 新機能の開発・バグ修正・リファクタリングなど、作業は必ず **専用のブランチを切ってから行う**
- ブランチは **独立したタスク単位（Issue 1件 = ブランチ1本が理想）** で作成し、
  他の作業と混在させない → コンフリクトの抑制とレビューのしやすさにつながる
- ブランチは **数日以内にマージできる規模** に保つ（長期間放置しない）
  - 大きな機能は「タスクを分割 → 複数の小さいPRに分けてマージ」を優先する
- 作業が終わったら `main` を取り込んで（`git fetch && git rebase origin/main` または
  マージ）コンフリクトを早期に解消してからPRを出す

### 1.2 ブランチ命名規則

```
<type>/<短い説明（ケバブケース・英語）>
```

| type | 用途 | 例 |
|---|---|---|
| `feature/` | 新機能の追加 | `feature/archive-list-filter` |
| `fix/` | バグ修正 | `fix/login-redirect-loop` |
| `hotfix/` | 本番環境の緊急修正 | `hotfix/supabase-auth-crash` |
| `refactor/` | 挙動を変えないリファクタリング | `refactor/extract-worksheet-hooks` |
| `chore/` | 雑務（依存更新・設定変更など） | `chore/upgrade-next-16` |
| `docs/` | ドキュメントのみの変更 | `docs/update-git-workflow` |
| `test/` | テストの追加・修正のみ | `test/worksheet-form-coverage` |

**ルール:**
- 1ブランチ = 1タスク（1Issue）。複数の目的を1ブランチに混ぜない
- 説明部分は「何をするか」が一目で分かる名前にする（`feature/fix2` のような曖昧な名前は禁止）
- 日本語ではなく英語・ケバブケースで統一する

### 1.3 タスク分割の指針（コンフリクト防止）

- 着手前に「このタスクは他の進行中タスクとファイルが重複しないか」を確認する
- 同じファイル・同じ関数を複数人/複数ブランチで同時に触る場合は、
  - 作業順序を決めて直列化する、または
  - 先にインターフェース（型・関数シグネチャ）だけ決めて分担する
- 共通基盤（`lib/`, `types/`, `supabase/schema.sql` など）の変更は
  小さく・早くマージし、他ブランチへの影響を最小化する

---

## 2. コミットメッセージのフォーマット

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に準拠します。

```
<type>(<scope>): <概要（命令形・現在形・50文字以内目安）>

<本文（任意・「なぜ」を中心に説明する）>

<フッター（任意・Breaking Change や Issue 参照など）>
```

### 2.1 type 一覧

| type | 説明 |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `refactor` | 挙動を変えないコードの整理・改善 |
| `perf` | パフォーマンス改善 |
| `docs` | ドキュメントのみの変更 |
| `style` | フォーマット・空白など、ロジックに影響しない変更 |
| `test` | テストの追加・修正 |
| `build` | ビルドシステムや依存関係の変更 |
| `ci` | CI設定の変更 |
| `chore` | 上記に当てはまらない雑務（設定ファイル更新など） |
| `revert` | 以前のコミットの取り消し |

### 2.2 scope（任意）

変更の影響範囲を括弧内に書く。本プロジェクトでは概ね以下を使用:

`archive` / `analysis` / `auth` / `worksheet` / `slack` / `api` / `supabase` / `ui` / `ai` など

例: `feat(archive): 作品一覧にカテゴリフィルタを追加`

### 2.3 ルール

- 概要は **命令形・体言止め** で簡潔に（「〜を追加した」ではなく「〜を追加」）
- 本文では **「何を」よりも「なぜ」変更したのか** を書く
- 関連するIssueやタスクがあれば、フッターに `Refs: #12` のように記載する
- 破壊的変更がある場合は、本文またはフッターの先頭に `BREAKING CHANGE: <説明>` を書く
- 1コミット = 1つの論理的な変更にする（無関係な変更を1コミットに混ぜない）

### 2.4 コミット例

```
feat(worksheet): VTSフレームワークにヒント表示機能を追加

観察ステップで何を書けばよいか迷うユーザーが多かったため、
各質問にヒント候補を表示できるようにした。

Refs: #18
```

```
fix(auth): ログイン後のリダイレクト先が誤っていた問題を修正

/login にアクセス済みユーザーが訪問した際、archiveではなく
トップページに飛ばされてしまっていたバグを修正。
```

---

## 3. プルリクエスト(PR)のフォーマット

### 3.1 タイトル

コミットメッセージと同様に Conventional Commits 形式に寄せる:

```
<type>(<scope>): <変更内容の要約>
```

例: `feat(analysis): AI自己分析の結果表示画面を実装`

### 3.2 本文テンプレート

`.github/PULL_REQUEST_TEMPLATE.md` に用意したテンプレートを使用する
（PR作成時に自動で挿入される）。主な構成:

- **概要 (Summary)**: 何を・なぜ変更したか
- **変更内容 (Changes)**: 主な変更点を箇条書きで
- **関連Issue/タスク**: `Closes #12` などで紐付け
- **動作確認 (Test Plan)**: どう確認したか／確認すべきことのチェックリスト
- **スクリーンショット**: UI変更がある場合に添付
- **チェックリスト**: lint・型チェック・セルフレビュー等の完了確認

### 3.3 テスト環境での確認（Vercel Preview Deployments）

本プロジェクトでは「常設のstagingブランチ」は採用せず、
**Vercelのプレビューデプロイ（PRごとに自動発行されるプレビュー環境）を
テスト環境として利用する**方針とする。

理由:
- `staging` のような常設ブランチを増やすと、`main` との差分が開きやすく
  マージコンフリクトの温床になりやすい
- Vercelはブランチへのpush/PR作成のたびに、そのブランチ専用の独立した
  プレビューURLを自動生成してくれるため、**ブランチ単位で「本番相当の環境」を
  都度用意できる**（追加の運用コストがほぼゼロ）
- 個人〜小規模開発では、複数機能をまとめて統合テストする場面が少なく、
  PR単位の確認で十分要件を満たせる

**運用フロー:**

1. ブランチをpush / PRを作成すると、Vercelが自動でプレビューURLを発行する
2. レビュアー（または自分自身）が **そのプレビューURL上で実際に動作確認** する
3. PRテンプレートの「動作確認 (Test Plan)」欄に、確認した内容と結果を記録する
4. 問題がなければレビュー承認 → `main` にマージする

> 補足: 将来的にチームが拡大し、複数機能の統合テストが必要になった場合は、
> 専用の `staging` ブランチ + 専用Supabaseプロジェクトの導入を改めて検討する
> （[Vercel: How do I set up a staging environment?](https://vercel.com/kb/guide/set-up-a-staging-environment-on-vercel)）。

### 3.4 レビュー・マージのルール

- **`main` への直接マージ・直接pushは禁止**。必ずPR経由でマージする
- 最低1名のレビュー承認を得てからマージする（個人開発の場合はセルフレビュー＋
  プレビュー環境での動作確認を必須条件とする）
- マージ方法は **Squash and merge** を基本とする
  （トピックブランチ内の細かいコミットを1つにまとめ、`main` の履歴をクリーンに保つ）
  - Squash後のコミットメッセージはPRタイトル（Conventional Commits形式）を使う
- マージ後は不要になったブランチを削除する

---

## 4. チェックリスト（PR作成前のセルフチェック）

- [ ] ブランチ名が命名規則に従っている
- [ ] 1ブランチ・1PRが1つのタスクに対応している
- [ ] コミットメッセージが Conventional Commits 形式になっている
- [ ] `main` の最新を取り込み、コンフリクトを解消済みである
- [ ] Lint / 型チェック / テストがすべてパスしている
- [ ] 機密情報（APIキー・トークンなど）がコミットに含まれていない
- [ ] PRの説明欄に概要・変更内容・確認方法が書かれている
