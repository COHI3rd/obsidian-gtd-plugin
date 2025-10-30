# GTD Task Manager for Obsidian

Notion風のドラッグ&ドロップUIで快適なGTD（Getting Things Done）タスク管理を実現するObsidianプラグインです。

![GTD Plugin](https://img.shields.io/badge/version-0.1.0-blue)
![Obsidian](https://img.shields.io/badge/obsidian-v1.0.0+-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特徴

- 📥 **Inbox システム** - 思いついたことを即座に記録
- 🎯 **GTDワークフロー** - Inbox → 次に取るべき行動 → Today の流れを完全サポート
- 🖱️ **ドラッグ&ドロップ** - 直感的なタスク移動
- 📅 **日付自動入力** - Todayにドラッグすると自動で今日の日付を設定
- 📊 **プロジェクト管理** - 進捗率の自動計算
- 🇯🇵 **完全日本語対応** - すべてのUIが日本語
- 📝 **Markdown完全対応** - データはすべてMarkdownファイル
- 🔗 **バックリンク連携** - Obsidianの機能と完全統合

## 🚀 インストール

### コミュニティプラグインから（推奨）

1. Obsidianの設定を開く
2. 「コミュニティプラグイン」→「閲覧」
3. 「GTD Task Manager」を検索
4. 「インストール」→「有効化」

### 手動インストール

1. [最新リリース](https://github.com/yourusername/obsidian-gtd-plugin/releases)から`main.js`、`manifest.json`、`styles.css`をダウンロード
2. Vaultの`.obsidian/plugins/obsidian-gtd-plugin/`フォルダに配置
3. Obsidianを再起動してプラグインを有効化

### 開発版

```bash
cd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/yourusername/obsidian-gtd-plugin.git
cd obsidian-gtd-plugin
npm install
npm run dev
```

## 📖 使い方

### 基本的なワークフロー

1. **タスクを追加**
   - リボンアイコンまたはコマンドパレット（`Ctrl/Cmd + P`）から「GTDビューを開く」
   - 「+ タスクを追加」ボタンまたは`Ctrl/Cmd + Shift + A`でクイック追加

2. **Inboxを整理**
   - Inboxに追加されたタスクを確認
   - ドラッグ&ドロップで「次に取るべき行動」に移動

3. **今日のタスクを決める**
   - 「次に取るべき行動」から今日やるタスクを選択
   - 「Today」エリアにドラッグ&ドロップ
   - 日付が自動で今日に設定される

4. **タスクを実行**
   - Todayのタスクを上から順に実行
   - 完了したらチェックボックスをオン

### プロジェクト管理

1. **プロジェクトを作成**
   - `GTD/Projects`フォルダに新しいMarkdownファイルを作成
   - フロントマターに以下を記述:

```yaml
---
type: project
title: プロジェクト名
importance: 3  # 1-5
deadline: 2025-12-31
status: not-started
action-plan: |
  - ステップ1
  - ステップ2
progress: 0
---
```

2. **タスクをプロジェクトに関連付け**
   - タスクファイルのフロントマターに`project: [[プロジェクト名]]`を追加
   - 進捗率が自動で計算される

### 週次レビュー

1. コマンドパレットから「週次レビューを作成」を実行
2. 「いつかやる/多分やる」リストを確認
3. 進行中のプロジェクトをレビュー
4. 必要に応じてタスクを「次に取るべき行動」に移動

## ⚙️ 設定

設定画面（`設定` → `GTD Task Manager`）で以下をカスタマイズできます:

- **タスクフォルダ**: タスクファイルの保存場所（デフォルト: `GTD/Tasks`）
- **プロジェクトフォルダ**: プロジェクトファイルの保存場所（デフォルト: `GTD/Projects`）
- **週次レビューフォルダ**: レビューファイルの保存場所（デフォルト: `GTD/Reviews`）
- **日付フォーマット**: 日付の表示形式（デフォルト: `yyyy-MM-dd`）
- **自動日付入力**: Todayへのドラッグ時に自動で日付設定（デフォルト: ON）
- **デフォルト優先度**: 新規タスクの優先度（デフォルト: 中）

## 🎨 データ構造

### タスクファイル

```yaml
---
title: タスク名
status: inbox  # inbox | next-action | today | waiting | someday
project: [[プロジェクト名]]
date: 2025-10-30
completed: false
priority: medium  # low | medium | high
tags: [タグ1, タグ2]
notes: メモ
---

ここに詳細な内容を記述
```

### プロジェクトファイル

```yaml
---
type: project
title: プロジェクト名
importance: 3
deadline: 2025-12-31
status: in-progress
action-plan: |
  - アクションプラン
progress: 0
---
```

## 🔧 開発

### 必要要件

- Node.js 18.x以上
- npm 9.x以上

### セットアップ

```bash
git clone https://github.com/yourusername/obsidian-gtd-plugin.git
cd obsidian-gtd-plugin
npm install
```

### 開発モード

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### テスト

```bash
npm test
npm run test:coverage
```

## 📝 設計思想

このプラグインは以下の設計原則に基づいています:

1. **タスクが親プロジェクトを持つ（B案）**
   - プロジェクトは子タスクのリストを持たない
   - タスクが`project: [[プロジェクト名]]`でプロジェクトを参照
   - 編集が1ファイルで完結し、データの整合性が保たれる

2. **statusとcompletedの役割分担**
   - `status`: GTDワークフロー上の位置（inbox/next-action/today/waiting/someday）
   - `completed`: タスクの完了状態（true/false）
   - 進捗率計算は`completed`のみを使用

3. **Obsidianの哲学に沿った設計**
   - Markdown First
   - リンク駆動
   - バックリンク活用
   - プレーンテキスト

詳細は[要件定義書](../要件定義書.md)と[実装計画](../実装計画.md)を参照してください。

## 🤝 コントリビューション

貢献は大歓迎です！以下の手順でお願いします:

1. このリポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'feat: Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを作成

コミットメッセージは[Conventional Commits](https://www.conventionalcommits.org/)に従ってください。

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)を参照してください。

## 🙏 謝辞

- [Obsidian](https://obsidian.md/) - 素晴らしいノートアプリ
- [GTD（Getting Things Done）](https://gettingthingsdone.com/) - デビッド・アレン氏の生産性手法
- [Notion](https://www.notion.so/) - UIインスピレーション
- [円谷氏のGTD動画](https://www.youtube.com/watch?v=G82JLeUs4NM) - 実装の参考

## 📧 サポート

- 🐛 バグ報告: [Issues](https://github.com/yourusername/obsidian-gtd-plugin/issues)
- 💡 機能リクエスト: [Discussions](https://github.com/yourusername/obsidian-gtd-plugin/discussions)
- 📖 ドキュメント: [Wiki](https://github.com/yourusername/obsidian-gtd-plugin/wiki)

---

**Made with ❤️ for the Obsidian community**
