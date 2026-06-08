# Git運用マニュアル — 日々の作業手順

このマニュアルは [`docs/git-workflow.md`](./git-workflow.md)（運用ルールの定義）を
**実際の作業の流れに沿って実践するための手順書** です。
新しいタスクに着手するたびに、このマニュアルの順番通りに進めてください。

---

## 全体の流れ（概要図）

```
1. タスクを決める
        ↓
2. mainを最新化してブランチを作成
        ↓
3. 実装する（こまめにコミット）
        ↓
4. pushしてPRを作成
        ↓
5. Vercelプレビュー環境で動作確認
        ↓
6. レビュー → 問題なければ main にマージ
        ↓
7. ブランチを削除して完了
```

---

## STEP 1: タスクを決める（着手前チェック）

- [ ] 取り組むタスクが **1つの独立した作業単位** になっているか確認する
  - 大きすぎる場合は、小さいタスクに分割してから着手する
- [ ] 他に進行中のブランチ・タスクと **触るファイルが重複しないか** を確認する
  - 重複する場合は着手順序を決める、またはインターフェースだけ先に決めて分担する
- [ ] 可能であればGitHub Issueを立て、タスク内容を明文化しておく

---

## STEP 2: mainを最新化してブランチを作成

```bash
# mainブランチに切り替えて最新化
git switch main
git pull origin main

# 命名規則に沿って新しいブランチを作成
# <type>/<短い説明>  例: feature/archive-list-filter, fix/login-redirect-loop
git switch -c feature/<短い説明>
```

**ブランチ命名 type 一覧**（詳細は `git-workflow.md` 2.2節）:
`feature` / `fix` / `hotfix` / `refactor` / `chore` / `docs` / `test`

---

## STEP 3: 実装する（こまめにコミット）

- 1つの論理的な変更ごとに、**小さくコミットする**（無関係な変更を混ぜない）
- コミットメッセージは Conventional Commits 形式で書く

```bash
git add <変更したファイル>
git commit -m "<type>(<scope>): <概要>"
```

例:
```bash
git commit -m "feat(archive): 作品一覧にカテゴリフィルタを追加"
git commit -m "fix(auth): ログイン後のリダイレクト先を修正"
```

> 詳しい type / scope の一覧、本文・フッターの書き方は
> `git-workflow.md` の「2. コミットメッセージのフォーマット」を参照。

**作業中、定期的に main の変更を取り込む**（コンフリクトを早期発見するため）:

```bash
git fetch origin
git rebase origin/main
```

---

## STEP 4: pushしてPRを作成

```bash
git push -u origin feature/<短い説明>
```

GitHub上で「Compare & pull request」からPRを作成する。

- **PRタイトル**: Conventional Commits形式で記載
  例: `feat(archive): 作品一覧にカテゴリフィルタを追加`
- **PR本文**: テンプレート（`.github/PULL_REQUEST_TEMPLATE.md`）が自動挿入されるので、
  各項目を埋める（概要・変更内容・関連Issue・動作確認・チェックリスト）

---

## STEP 5: Vercelプレビュー環境で動作確認

PRを作成・更新すると、Vercelが自動でそのブランチ専用の **プレビューURL** を発行します
（PRのチェック欄やコメントに表示されます）。

- [ ] プレビューURLを開き、変更内容が意図通りに動作するか確認する
- [ ] 関連する画面・機能に副作用が出ていないか確認する
- [ ] 確認したプレビューURLと結果を、PR本文の「動作確認 (Test Plan)」欄に記録する

> **常設のstagingブランチは使いません。** PRごとに発行されるプレビュー環境を
> 「テスト環境」として活用することで、追加のブランチ運用コストをかけずに
> 本番相当の確認ができます（理由の詳細は `git-workflow.md` 3.3節）。

---

## STEP 6: レビュー → mainにマージ

- [ ] セルフレビュー（diffを見直し、不要なコード・デバッグ出力がないか確認）
- [ ] レビュアーがいる場合は承認を得る
- [ ] Lint / 型チェックが通っていることを確認する

```bash
npm run lint
```

- [ ] `main` の最新を取り込み済み・コンフリクトが解消済みであることを確認する

問題がなければ、GitHub上で **Squash and merge** を選択してマージする
（細かいコミットを1つにまとめ、コミットメッセージはPRタイトルをそのまま使う）。

---

## STEP 7: ブランチを削除して完了

マージ後、不要になったブランチを削除する（GitHub上の「Delete branch」ボタン、
またはローカルで以下を実行）:

```bash
git switch main
git pull origin main
git branch -d feature/<短い説明>
git push origin --delete feature/<短い説明>
```

---

## トラブル時の対応

### コンフリクトが発生した場合
```bash
git fetch origin
git rebase origin/main
# コンフリクト箇所を解消 → git add → git rebase --continue
git push --force-with-lease
```
- `--force` ではなく **必ず `--force-with-lease`** を使う（他者の変更を誤って
  上書きしないため）

### 緊急の本番修正（hotfix）が必要な場合
1. `main` から `hotfix/<内容>` ブランチを作成
2. 最小限の変更で修正 → 通常通りPRを作成しプレビューで確認
3. 確認できたら優先的にレビュー・マージする

---

## 参照

- 運用ルールの定義: [`docs/git-workflow.md`](./git-workflow.md)
- PRテンプレート: [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md)
