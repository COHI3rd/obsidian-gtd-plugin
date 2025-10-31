# インストールガイド

## 手動インストール（推奨）

### 1. 必要なファイルを取得

以下の3つのファイルが必要です：
- `main.js` - プラグインのメインファイル（必須）
- `manifest.json` - プラグインの設定ファイル（必須）
- `styles.css` - プラグインのスタイルシート（必須）

### 2. プラグインフォルダを作成

Obsidian Vaultのプラグインフォルダに移動します：

```
[あなたのVaultフォルダ]\.obsidian\plugins\obsidian-gtd\
```

例：
```
C:\Users\user000\Documents\MyVault\.obsidian\plugins\obsidian-gtd\
```

**フォルダが存在しない場合は作成してください。**

### 3. ファイルを配置

上記3つのファイルをプラグインフォルダにコピーします：

```
[Vault]\.obsidian\plugins\obsidian-gtd\
├── main.js
├── manifest.json
└── styles.css
```

### 4. Obsidianで有効化

1. **Obsidianを再起動**（Ctrl + R でリロード）
2. `設定` → `コミュニティプラグイン` → `インストール済みプラグイン`
3. 「GTD Task Manager」を有効化

## 開発環境でのセットアップ

### 1. 前提条件

- Node.js 18.x以上
- npm 9.x以上
- Obsidian v1.0.0以上

### 2. リポジトリのクローン

```bash
cd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/yourusername/obsidian-gtd-plugin.git
cd obsidian-gtd-plugin
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. ビルド

開発モード（ホットリロード）:
```bash
npm run dev
```

プロダクションビルド:
```bash
npm run build
```

**重要**: ビルド後、以下の3つのファイルが生成されます：
- `main.js`
- `styles.css`（自動生成）
- `manifest.json`

### 5. ファイルをVaultにコピー

開発フォルダで作業している場合、ビルド後に生成されたファイルを**実際のVaultのプラグインフォルダ**にコピーする必要があります：

```bash
# 例（Windowsの場合）
cp main.js "C:\Users\user000\Documents\MyVault\.obsidian\plugins\obsidian-gtd\"
cp styles.css "C:\Users\user000\Documents\MyVault\.obsidian\plugins\obsidian-gtd\"
cp manifest.json "C:\Users\user000\Documents\MyVault\.obsidian\plugins\obsidian-gtd\"
```

### 6. Obsidianで有効化

1. Obsidianを再起動（Ctrl + R）
2. `設定` → `コミュニティプラグイン` → `インストール済みプラグイン`
3. 「GTD Task Manager」を有効化

## テストVaultでの動作確認

### サンプルデータの作成

以下のフォルダ構造を作成してください:

```
YourVault/
├── GTD/
│   ├── Tasks/
│   │   ├── タスク1.md
│   │   ├── タスク2.md
│   │   └── タスク3.md
│   ├── Projects/
│   │   └── プロジェクト1.md
│   └── Reviews/
│       └── 2025-10-27_週次レビュー.md
```

### タスクファイルのサンプル

`GTD/Tasks/タスク1.md`:

```markdown
---
title: メールの返信
status: inbox
project: null
date: 2025-10-30
completed: false
priority: medium
tags: [仕事, メール]
notes: 午前中に返信する
order: 0
---

山田さんからのメールに返信する
```

**注意**:
- `order`フィールドは手動並び替えモードで使用されます
- 設定で自動並び替えモードに切り替えている場合は不要です
- 前日から残ったTodayタスク（未完了）は、翌日自動的に今日の日付に更新されます

### プロジェクトファイルのサンプル

`GTD/Projects/プロジェクト1.md`:

```markdown
---
type: project
title: 基本情報技術者試験の合格
importance: 4
deadline: 2025-12-31
status: in-progress
action-plan: |
  - 参考書を1冊読む
  - 過去問を5年分解く
  - 模試を受ける
progress: 0
---

# プロジェクト詳細

基本情報技術者試験に合格するためのプロジェクト

## 目標

2025年12月31日までに合格する

## アクションプラン

1. 参考書を購入する
2. 毎日2時間勉強する
3. 週末に模試を受ける
```

### 週次レビューファイルのサンプル

`GTD/Reviews/2025-10-27_週次レビュー.md`:

```markdown
---
type: weekly-review
date: 2025-10-27
review-type: weekly
---

# 週次レビュー - 2025年10月27日

## 今週の振り返り

### 完了したタスク
- タスク1
- タスク2

### 進行中のプロジェクト
- プロジェクト1（進捗率: 30%）

### いつかやる/多分やるの見直し
- [ ] タスク3 → 次に取るべき行動に移動
```

## トラブルシューティング

### ビルドエラーが出る

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Obsidianでプラグインが認識されない

1. `.obsidian/plugins/obsidian-gtd/` フォルダに以下の**3つのファイル全て**があるか確認:
   - ✅ `main.js` （346KB程度）
   - ✅ `manifest.json` （389B程度）
   - ✅ `styles.css` （11KB程度）

2. ファイルのタイムスタンプが最新か確認（古いファイルが残っている可能性）

3. Obsidianを完全に再起動（Ctrl + R）

4. それでも認識されない場合、開発者コンソール（Ctrl + Shift + I）でエラーを確認

### 変更が反映されない

開発中に変更が反映されない場合：

1. **ビルドを実行**:
   ```bash
   npm run build
   ```

2. **生成されたファイルをVaultにコピー**:
   ```bash
   # main.js, styles.css, manifest.json の3つを必ずコピー
   cp main.js styles.css manifest.json "[Vaultパス]\.obsidian\plugins\obsidian-gtd\"
   ```

3. **Obsidianでリロード**: Ctrl + R

4. **キャッシュクリア**:
   - Obsidianの設定 → コミュニティプラグイン → プラグインを無効化
   - 再度有効化

### ドラッグ&ドロップが動作しない

- ブラウザの開発者ツール（`Ctrl+Shift+I`）でエラーを確認
- `@hello-pangea/dnd` が正しくインストールされているか確認

```bash
npm list @hello-pangea/dnd
```

### タスクが読み込まれない

1. 設定画面でタスクフォルダのパスが正しいか確認
2. タスクファイルのフロントマターが正しい形式か確認
3. 開発者コンソールでエラーメッセージを確認

## アンインストール

```bash
cd /path/to/your/vault/.obsidian/plugins
rm -rf obsidian-gtd-plugin
```

その後、Obsidianを再起動してください。

## さらに詳しい情報

- [README.md](README.md) - 基本的な使い方
- [CLAUDE.md](.claude/CLAUDE.md) - 開発ガイドライン
- [要件定義書.md](../要件定義書.md) - 機能要件
- [実装計画.md](../実装計画.md) - 技術仕様
