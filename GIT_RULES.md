# Git運用ルール

## 権限

- ファイル編集・git add・commit・pushは自動実行してよい
- merge・PRマージ・mainへの直接操作は禁止（人間が行う）

## ブランチ

- 構成: main ← develop ← 作業ブランチ
- main: 本番コード。直接push禁止。PRのみ
- develop: 統合ブランチ。直接push禁止。PRのみ
- 作業ブランチ: developから分岐（hotfixのみmainから）
- 種別: feature（機能追加）, fix（バグ修正）, hotfix（本番緊急修正）, docs（文書のみ）, refactor（リファクタ）, chore（設定・依存関係）

## ブランチ名

- 形式: `{種別}/{issue番号}-{ケバブケース}`
- 例: `feature/42-user-authentication`, `fix/87-login-redirect-error`
- 小文字・ハイフン区切り。日本語・スペース・アンダースコア禁止
- issueがない場合は番号省略可

## コミットメッセージ

- 形式: `{種別}: {日本語で要約}`
- 種別: feat, fix, docs, style, refactor, test, chore, revert
- 要約50文字以内。末尾に句点をつけない
- 本文は任意。72文字折り返し
- issue参照はフッターに `Closes #番号` または `Refs #番号`

## commit

- 1コミット1目的。機能追加とバグ修正を混ぜない
- 意図が完結した単位でcommit（ファイル保存のたびではない）
- 作業中断時はWIPコミットしてよい。PR前にrebase -iで整理
- git commit --amendは未pushのコミットのみ

## push

- commitのたびに都度push
- main・developへの直接push禁止
- push前に `git pull --rebase` を実行
- force push禁止（--force-with-leaseは可）

## merge

- feature→develop: Squash merge
- develop→main: Merge commit
- hotfix→main: Merge commit後、developにも反映
- マージはセルフレビュー・動作確認・CI通過後に人間が実行

## 作業フロー

1. Issue作成（作業開始前に必ず。1issue=1目的）
2. developからブランチを切る
3. 作業→commit→push（都度）
4. 完了条件を満たしたらPR作成（1PR=1issue）
5. セルフレビュー・動作確認
6. developへマージ（人間が実行）
7. リリース時にdevelop→mainへマージ
8. mainにタグを打つ（セマンティックバージョニング: vMAJOR.MINOR.PATCH）

## Issueテンプレート

```
## 概要
## 背景・目的
## 対応内容（タスク）
- [ ]
## 完了条件
## 関連情報
```

## PRテンプレート

```
## 概要
## 関連Issue
Closes #
## 変更内容
-
## 動作確認
- [ ] ローカルで動作確認済み
- [ ] 既存機能への影響を確認済み
- [ ] テストを追加・更新済み（該当する場合）
## スクリーンショット（任意）
## レビュアーへの連絡事項（任意）
```

## タグ

- 形式: v{MAJOR}.{MINOR}.{PATCH}
- MAJOR: 後方互換性のない変更 / MINOR: 機能追加 / PATCH: バグ修正
- mainのマージコミットに対して打つ
