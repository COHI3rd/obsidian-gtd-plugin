# Obsidian GTDプラグイン開発ガイドライン

このドキュメントは、複数人・複数回にわたる開発で一貫性を保つための統一ルールを定めたものです。
開発に携わるすべての開発者（人間・AI問わず）は、このガイドラインに従ってください。

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [コアとなる設計思想](#コアとなる設計思想)
3. [コーディング規約](#コーディング規約)
4. [ファイル・フォルダ構成](#ファイルフォルダ構成)
5. [命名規則](#命名規則)
6. [データ構造の絶対ルール](#データ構造の絶対ルール)
7. [Git運用ルール](#git運用ルール)
8. [テスト方針](#テスト方針)
9. [ドキュメント更新ルール](#ドキュメント更新ルール)
10. [トラブルシューティング](#トラブルシューティング)

---

## 1. プロジェクト概要

### プロジェクト名
**Obsidian GTD Plugin**

### 目的
Notion × GTDのタスク管理体験をObsidian上で実現する日本語ネイティブなプラグイン

### 参照ドキュメント
- **要件定義書**: `要件定義書.md`
- **実装計画**: `実装計画.md`
- **計画書**: `計画書.md`

### 開発環境
- **言語**: TypeScript 5.x
- **フレームワーク**: React 18.x (または Preact)
- **ビルドツール**: esbuild / Rollup
- **パッケージマネージャー**: npm
- **テンプレート**: Obsidian Sample Plugin
- **対象Obsidianバージョン**: v1.0.0以上

---

## 2. コアとなる設計思想

### 2.1 データ構造の基本原則

#### 🔴 絶対に守るべきルール: タスク-プロジェクト関連付け（B案）

**タスクが親プロジェクトを持つ（プロジェクトは子タスクを持たない）**

```yaml
# ✅ 正しい設計（B案）
# タスクファイル
---
project: [[プロジェクト名]]  # タスク側が親を参照
---

# プロジェクトファイル
---
type: project
progress: 0  # 自動計算
# tasks: [] は持たない！
---
```

```yaml
# ❌ 間違った設計（A案）
# プロジェクトファイル
---
tasks: [[タスク1]], [[タスク2]]  # これは使わない！
---
```

**理由:**
1. **編集が1回で済む**: タスク追加時、タスクファイル1つを編集するだけで完結
2. **堅牢性**: Obsidianのバックリンク機能と完全に連動
3. **データの整合性**: 双方向の同期が不要でバグが減る

### 2.2 status と completed の役割分担

#### status: GTDワークフロー上の位置
```typescript
type TaskStatus = 'inbox' | 'next-action' | 'today' | 'waiting' | 'someday';
// 注意: 'done' は使わない！
```

#### completed: タスクの完了状態
```typescript
completed: boolean  // true = チェック済み, false = 未完了
```

**重要:** 進捗率計算は `completed: true` のタスク数で行う。`status` は使わない。

### 2.3 Obsidianの哲学に沿った設計

- **Markdown First**: すべてのデータはMarkdownファイルとして保存
- **リンク駆動**: `[[ファイル名]]` 形式のリンクを活用
- **バックリンク活用**: プロジェクトページからタスクへの逆引きはObsidianに任せる
- **プレーンテキスト**: 特殊なフォーマットを避け、他ツールとの互換性を保つ

---

## 3. コーディング規約

### 3.1 TypeScript

#### 型定義は厳格に
```typescript
// ✅ Good
interface Task {
  title: string;
  status: TaskStatus;
  project: string | null;  // [[プロジェクト名]] 形式
  date: Date | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  notes: string;
}

// ❌ Bad
interface Task {
  title: any;
  status: string;  // 型が曖昧
}
```

#### strictモードを使用
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 3.2 React / Preact

#### Functional Component + Hooks
```typescript
// ✅ Good
export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleComplete = useCallback(() => {
    // ...
  }, [task.id]);

  return <div>...</div>;
};

// ❌ Bad: Class Component は使わない
export class TaskCard extends React.Component { ... }
```

#### パフォーマンス最適化
```typescript
// 重いコンポーネントはメモ化
export const TaskCard = React.memo(({ task }) => { ... });

// 計算コストが高い処理はuseMemo
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => ...);
}, [tasks]);
```

### 3.3 命名規則（詳細は後述）

- **ファイル名**: PascalCase（例: `TaskService.ts`, `ProjectCalculator.ts`）
- **変数・関数**: camelCase（例: `calculateProgress`, `taskList`）
- **定数**: UPPER_SNAKE_CASE（例: `MAX_TASKS`, `DEFAULT_FOLDER`）
- **型・インターフェース**: PascalCase（例: `Task`, `ProjectStatus`）

### 3.4 コメント規約

#### JSDocを使用
```typescript
/**
 * プロジェクトの進捗率を計算
 * 子タスクの completed: true の割合を算出
 *
 * @param project - 対象プロジェクト
 * @param tasks - 全タスクリスト
 * @returns 進捗率（0-100）
 */
static calculateProgress(project: Project, tasks: Task[]): number {
  // ...
}
```

#### 設計思想を明記
```typescript
// 【重要な設計思想】
// タスクが project: [[プロジェクト名]] でプロジェクトを参照（B案）
// プロジェクトはタスクのリストを持たない
```

#### 日本語コメントOK
複雑なロジックやGTD特有の概念は日本語で説明してOK

---

## 4. ファイル・フォルダ構成

### 4.1 ディレクトリ構造（厳守）

```
obsidian-gtd-plugin/
├── .claude/
│   └── CLAUDE.md              # このファイル
├── src/
│   ├── main.ts                # プラグインエントリーポイント
│   ├── settings.ts            # 設定管理
│   ├── views/                 # ビューコンポーネント
│   │   ├── GTDMainView.tsx
│   │   ├── InboxView.tsx
│   │   ├── TodayView.tsx
│   │   ├── ProjectView.tsx
│   │   └── WeeklyReviewView.tsx
│   ├── components/            # 再利用可能コンポーネント
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── QuickAddModal.tsx
│   │   └── DragDropContext.tsx
│   ├── models/                # データモデル
│   │   ├── Task.ts
│   │   ├── Project.ts
│   │   └── WeeklyReview.ts
│   ├── services/              # ビジネスロジック
│   │   ├── TaskService.ts
│   │   ├── ProjectService.ts
│   │   ├── FileService.ts
│   │   └── SyncService.ts
│   ├── utils/                 # ユーティリティ
│   │   ├── TaskParser.ts      # フロントマター解析
│   │   ├── DateManager.ts
│   │   ├── ProjectCalculator.ts
│   │   └── Logger.ts
│   ├── styles/
│   │   └── main.css
│   └── types/
│       └── index.d.ts
├── manifest.json
├── versions.json
├── package.json
├── tsconfig.json
├── rollup.config.js
├── 要件定義書.md
├── 実装計画.md
└── README.md
```

### 4.2 ファイル配置ルール

#### views/: ページ全体のビュー
- 画面全体を表すコンポーネント
- Obsidian Leaf に登録するビュー
- 例: GTDメインビュー、プロジェクト一覧

#### components/: 再利用可能なUIコンポーネント
- 複数のビューで使われる部品
- 単一責任の原則を守る
- 例: タスクカード、モーダル、ボタン

#### services/: ビジネスロジック
- データの取得・更新・削除
- ファイルI/O
- 状態管理
- UIコンポーネントからロジックを分離

#### utils/: 汎用的なユーティリティ
- どこからでも使える純粋関数
- 副作用がない関数
- 例: 日付フォーマット、進捗率計算

---

## 5. 命名規則

### 5.1 TypeScript / JavaScript

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名 | PascalCase | `TaskService.ts`, `ProjectView.tsx` |
| 変数 | camelCase | `taskList`, `isCompleted` |
| 関数 | camelCase | `calculateProgress()`, `handleDragEnd()` |
| 定数 | UPPER_SNAKE_CASE | `MAX_TASKS`, `DEFAULT_STATUS` |
| 型/インターフェース | PascalCase | `Task`, `ProjectStatus` |
| Enum | PascalCase (値はUPPER_SNAKE_CASE) | `TaskStatus.NEXT_ACTION` |
| React Component | PascalCase | `TaskCard`, `InboxView` |

### 5.2 CSS

```css
/* BEM記法を推奨 */
.gtd-task-card { }
.gtd-task-card__title { }
.gtd-task-card__title--completed { }

/* プレフィックスは必ず gtd- */
.gtd-inbox-view { }
.gtd-today-view { }
```

### 5.3 コマンドID

```typescript
// 形式: gtd-<機能名>
'gtd-quick-add'
'gtd-weekly-review'
'gtd-open-main-view'
'gtd-move-to-today'
```

---

## 6. データ構造の絶対ルール

### 6.1 タスクのフロントマター（絶対に守る）

```yaml
---
title: タスク名
status: inbox  # inbox | next-action | today | waiting | someday
project: [[プロジェクト名]]  # 任意、プロジェクトがある場合のみ
date: 2025-10-30
completed: false  # true | false
priority: medium  # low | medium | high
tags: []
notes: 簡易メモ
---
```

**禁止事項:**
- `status: done` は使わない（`completed: true` を使う）
- `project` に複数のプロジェクトを指定しない（1タスク = 1プロジェクト）

### 6.2 プロジェクトのフロントマター（絶対に守る）

```yaml
---
type: project
title: プロジェクト名
importance: 3  # 1-5
deadline: 2025-12-31
status: in-progress  # not-started | in-progress | completed
action-plan: |
  - ステップ1
  - ステップ2
progress: 0  # 0-100、自動計算（手動編集禁止）
---
```

**禁止事項:**
- `tasks: []` フィールドは追加しない
- `progress` は自動計算のため手動で編集しない

### 6.3 週次レビューのフロントマター

```yaml
---
type: weekly-review
date: 2025-10-27
review-type: weekly
---
```

---

## 7. Git運用ルール

### 7.1 ブランチ戦略

```
main (保護ブランチ)
├── develop (開発ブランチ)
│   ├── feature/inbox-view
│   ├── feature/project-management
│   └── fix/drag-drop-bug
```

#### ブランチ命名規則
- `feature/<機能名>`: 新機能開発
- `fix/<バグ名>`: バグ修正
- `refactor/<対象>`: リファクタリング
- `docs/<ドキュメント名>`: ドキュメント更新

### 7.2 コミットメッセージ

#### 形式（Conventional Commits）
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 例
```
feat(inbox): Inboxビューのドラッグ&ドロップ実装

react-beautiful-dndを使用してInbox→Next Actionsへの
タスク移動を実装。ドロップ時にステータスが自動更新される。

Closes #12
```

#### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント更新
- `style`: コードスタイル修正
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

### 7.3 プルリクエスト

#### テンプレート
```markdown
## 概要
<!-- 何を実装したか -->

## 変更内容
- [ ] タスク1
- [ ] タスク2

## テスト
<!-- どのようにテストしたか -->

## スクリーンショット
<!-- UIの変更がある場合 -->

## 関連Issue
Closes #XX
```

---

## 8. テスト方針

### 8.1 テスト対象

#### 必須: ビジネスロジック
- `TaskParser`: フロントマター解析
- `ProjectCalculator`: 進捗率計算
- `DateManager`: 日付操作

#### 推奨: サービス層
- `TaskService`: タスクCRUD
- `ProjectService`: プロジェクトCRUD
- `FileService`: ファイルI/O

#### オプション: UIコンポーネント
- React Testing Libraryで重要なコンポーネントのみ

### 8.2 テストファイル配置

```
src/
├── utils/
│   ├── TaskParser.ts
│   └── TaskParser.test.ts  # 同じディレクトリに配置
```

### 8.3 テストコマンド

```bash
npm test                # 全テスト実行
npm test -- --watch     # ウォッチモード
npm run test:coverage   # カバレッジ計測
```

---

## 9. ドキュメント更新ルール

### 9.1 コード変更時に必ず更新すべきドキュメント

| コード変更内容 | 更新すべきドキュメント |
|----------------|------------------------|
| データ構造変更 | `要件定義書.md` (2.3節) |
| 新機能追加 | `要件定義書.md` (2.1節), `CHANGELOG.md` |
| 設定項目追加 | `README.md`, `settings.ts` |
| API変更 | JSDocコメント, `実装計画.md` |

### 9.2 CHANGELOG.md 形式

```markdown
# Changelog

## [Unreleased]

### Added
- 新機能の説明

### Changed
- 変更内容

### Fixed
- バグ修正内容

## [0.1.0] - 2025-11-01

### Added
- 初回リリース
```

---

## 10. トラブルシューティング

### 10.1 よくある問題と解決策

#### 問題: ドラッグ&ドロップが動作しない
**原因:** react-beautiful-dndのバージョン不一致
**解決:** `package.json` でバージョンを固定

#### 問題: フロントマターが破損する
**原因:** gray-matterのエスケープ処理不足
**解決:** `TaskParser.ts` でバリデーション追加

#### 問題: プロジェクトの進捗率が更新されない
**原因:** タスクの `project` フィールドが正しくリンクされていない
**解決:** `[[プロジェクト名]]` 形式を厳守、ファイル名とリンクの一致を確認

### 10.2 デバッグ方法

#### Obsidianコンソール
```
Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (Mac)
```

#### ログ出力
```typescript
// Logger.ts を使用
Logger.debug('Task loaded:', task);
Logger.error('Failed to parse:', error);
```

---

## 11. 開発フロー（推奨）

### Phase 1: MVP開発
1. 環境構築（Obsidian Sample Pluginクローン）
2. データモデル実装（Task, Project）
3. 基本UI構築（静的表示）
4. ドラッグ&ドロップ実装
5. テスト・デバッグ

### Phase 2: 中核機能
1. プロジェクト管理実装
2. 進捗率自動計算
3. 週次レビューテンプレート
4. 素早い追加機能

### Phase 3: 洗練
1. パフォーマンス最適化
2. モバイル対応
3. エラーハンドリング強化
4. ドキュメント整備

---

## 12. 連絡・相談

### 設計変更が必要な場合
1. このファイル（CLAUDE.md）を更新
2. `要件定義書.md` も同時に更新
3. プルリクエストで変更理由を説明

### 不明点がある場合
1. まず `要件定義書.md` と `実装計画.md` を参照
2. このファイルの該当セクションを確認
3. それでも不明な場合は、Issueを立てる

---

## 📌 最重要チェックリスト

開発を始める前に、必ず以下を確認してください。

- [ ] タスク-プロジェクト関連は**B案（タスクが親を持つ）**で実装する
- [ ] `status`と`completed`の役割分担を理解している
- [ ] プロジェクトファイルに`tasks: []`を追加しない
- [ ] 進捗率計算は`completed: true`のタスク数で行う
- [ ] ファイル・フォルダ構成を守る
- [ ] 命名規則に従う
- [ ] コミットメッセージはConventional Commitsに従う
- [ ] 変更内容に応じてドキュメントを更新する

---

## 13. リポジトリ管理とリリースフロー

### 13.1 リポジトリ構成

本プロジェクトは3つのリポジトリで管理されています：

| リポジトリ | URL | 用途 | 公開設定 |
|----------|-----|------|---------|
| **開発用** | https://github.com/COHI3rd/obsidian_gtd.git | 日常的な開発作業・実験的機能 | プライベート |
| **公開用** | https://github.com/COHI3rd/obsidian-gtd-plugin.git | 安定版の公開・一般ユーザー向け | パブリック |
| **公式申請** | https://github.com/COHI3rd/obsidian-releases.git | Obsidian公式へのプラグイン申請用（フォーク） | パブリック |

### 13.2 Git リモート設定

```bash
# リモートの確認
git remote -v

# 開発用リポジトリ (origin)
origin  https://ghp_TOKEN@github.com/COHI3rd/obsidian_gtd.git

# 公開用リポジトリ (public)
public  https://ghp_TOKEN@github.com/COHI3rd/obsidian-gtd-plugin.git
```

### 13.3 日常的な開発フロー

#### 1. 通常の開発作業
```bash
# コード変更後
git add .
git commit -m "feat: 新機能の説明"
git push origin master  # 開発用リポジトリにプッシュ
```

#### 2. 開発用リポジトリのみを使用
- バグ修正
- 実験的機能の追加
- リファクタリング
- ドキュメント更新

**重要**: 公開用リポジトリには、安定版のみをプッシュする

### 13.4 リリースフロー（開発 → 公開）

完成した機能を公開する際の手順：

#### Phase 1: リリース準備

1. **manifest.json の更新**
```json
{
  "id": "gtd-task-manager",
  "name": "GTD Task Manager",
  "version": "1.1.0",  // バージョンアップ
  "minAppVersion": "1.0.0",
  "description": "GTD (Getting Things Done) task management plugin with Notion-style drag & drop UI for seamless workflow.",
  "author": "COHI",
  "authorUrl": "https://github.com/COHI3rd",
  "isDesktopOnly": false
}
```

2. **versions.json の更新**
```json
{
  "1.0.0": "1.0.0",
  "1.1.0": "1.0.0"  // 新バージョン追加
}
```

3. **CHANGELOG.md の更新**
```markdown
## [1.1.0] - 2025-11-XX

### Added
- 新機能の説明

### Fixed
- バグ修正の説明
```

4. **ビルド**
```bash
npm run build
```

5. **動作確認**
- Obsidianで実際に動作確認
- 主要機能のテスト
- エラーがないか確認

#### Phase 2: コミット＆プッシュ

```bash
# 開発用リポジトリにコミット
git add .
git commit -m "Release: v1.1.0 - 機能概要

Added:
- 新機能1
- 新機能2

Fixed:
- バグ修正1

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 開発用にプッシュ
git push origin master

# 公開用にプッシュ
git push public master
```

#### Phase 3: GitHub Releaseの作成

1. **タグの作成とプッシュ**
```bash
# タグを作成
git tag -a 1.1.0 -m "Release v1.1.0"

# 公開用リポジトリにタグをプッシュ
git push public 1.1.0
```

2. **GitHub上でReleaseを作成**
   - https://github.com/COHI3rd/obsidian-gtd-plugin/releases にアクセス
   - **「Draft a new release」** をクリック
   - **Tag**: `1.1.0` を選択
   - **Release title**: `v1.1.0 - リリース概要`
   - **Description**: CHANGELOG.mdの内容をコピー

3. **必須ファイルをアップロード**
   以下の3ファイルを必ずアップロード：
   - `main.js` (ビルド済みプラグイン)
   - `manifest.json` (プラグイン情報)
   - `styles.css` (スタイルシート)

4. **「Publish release」** をクリック

#### Phase 4: Obsidian公式への申請（初回 or メジャーアップデート時）

**注意**: マイナーアップデートは申請不要。初回リリースまたはメジャーバージョンアップ時のみ。

### 13.5 Obsidian公式への申請手順

#### 1. obsidian-releasesリポジトリをフォーク

- https://github.com/obsidianmd/obsidian-releases
- 右上の **「Fork」** をクリック
- 自分のアカウントにフォークを作成

#### 2. community-plugins.json を編集

フォークしたリポジトリで：
- `community-plugins.json` ファイルを開く
- 最後尾に以下を追加（最後のエントリの後に**カンマを忘れずに**）

```json
  {
    "id": "gtd-task-manager",
    "name": "GTD Task Manager",
    "author": "COHI",
    "description": "GTD (Getting Things Done) task management plugin with Notion-style drag & drop UI for seamless workflow.",
    "repo": "COHI3rd/obsidian-gtd-plugin"
  }
```

**重要な注意点**:
- `id` は manifest.json と完全一致させる
- `description` の最後に `.` または `!` `?` などの句読点を付ける
- `id` に "obsidian" という単語を含めない

#### 3. Pull Request を作成

1. **方法1: リポジトリトップから**
   - フォークしたリポジトリのトップページ
   - **「Pull requests」** タブ → **「New pull request」**

2. **方法2: 公式リポジトリから**
   - https://github.com/obsidianmd/obsidian-releases/pulls
   - **「New pull request」** → **「compare across forks」**
   - head repository: `COHI3rd/obsidian-releases`

#### 4. PR の説明（テンプレートに厳密に従う）

**Title**:
```
Add GTD Task Manager plugin
```

**Description** (以下のテンプレートを**完全に**コピーして記入):

```markdown
# I am submitting a new Community Plugin

- [x] I attest that I have done my best to deliver a high-quality plugin, am proud of the code I have written, and would recommend it to others. I commit to maintaining the plugin and being responsive to bug reports. If I am no longer able to maintain it, I will make reasonable efforts to find a successor maintainer or withdraw the plugin from the directory.

## Repo URL

Link to my plugin: https://github.com/COHI3rd/obsidian-gtd-plugin

## Release Checklist
- [x] I have tested the plugin on
  - [x] Windows
  - [ ] macOS
  - [ ] Linux
  - [ ] Android _(if applicable)_
  - [ ] iOS _(if applicable)_
- [x] My GitHub release contains all required files (as individual files, not just in the source.zip / source.tar.gz)
  - [x] `main.js`
  - [x] `manifest.json`
  - [x] `styles.css` _(optional)_
- [x] GitHub release name matches the exact version number specified in my manifest.json (_**Note:** Use the exact version number, don't include a prefix `v`_)
- [x] The `id` in my `manifest.json` matches the `id` in the `community-plugins.json` file.
- [x] My README.md describes the plugin's purpose and provides clear usage instructions.
- [x] I have read the developer policies at https://docs.obsidian.md/Developer+policies, and have assessed my plugin's adherence to these policies.
- [x] I have read the tips in https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines and have self-reviewed my plugin to avoid these common pitfalls.
- [x] I have added a license in the LICENSE file.
- [x] My project respects and is compatible with the original license of any code from other plugins that I'm using.
      I have given proper attribution to these other projects in my `README.md`.
```

**テンプレート使用時の注意点**:
- チェックボックスは `- [x]` （スペース無し）または `- [ ]` （スペース1つ）
- インデントは正確に2スペース
- コメント（`<!--- ... --->`）は削除する
- URLは正確に記載する

#### 5. 自動チェックが実行される

PRを作成すると自動的にバリデーションが実行されます。

**よくあるエラーと対処法**:

| エラーメッセージ | 原因 | 対処法 |
|---------------|------|--------|
| "You did not follow the pull request template" | テンプレートの形式が正しくない | チェックボックスのフォーマット確認（スペースの数） |
| "Don't use the word obsidian in plugin ID" | IDに"obsidian"が含まれている | manifest.jsonのIDを変更してリビルド |
| "Description needs to have one of the following characters at the end" | 説明文の最後に句読点がない | 説明文の最後に`.`を追加 |

エラーが出た場合:
1. 指摘された箇所を修正
2. 再ビルド（必要な場合）
3. コミット＆プッシュ
4. PRは自動で更新される（新しいPRを作らない）

#### 6. 審査を待つ

- 審査期間: 数日〜数週間
- レビュアーからのフィードバックがあれば対応する
- 承認されるとObsidianのコミュニティプラグイン一覧に掲載される

### 13.6 リリース後の更新フロー

既に公式に登録されている場合の更新手順：

1. **開発 → 公開リポジトリにプッシュ**（上記Phase 1-2と同じ）
2. **GitHub Releaseを作成**（Phase 3と同じ）
3. **PRは不要** - 公式が自動的に新バージョンを検知

### 13.7 緊急バグ修正の場合

```bash
# 1. バグ修正
git add .
git commit -m "fix: 緊急バグの説明"

# 2. パッチバージョンアップ（例: 1.1.0 → 1.1.1）
# manifest.json と versions.json を更新

# 3. ビルド
npm run build

# 4. プッシュ
git push origin master
git push public master

# 5. タグとRelease
git tag -a 1.1.1 -m "Hotfix v1.1.1"
git push public 1.1.1
# GitHub上でReleaseを作成
```

### 13.8 チェックリスト

#### リリース前チェックリスト
- [ ] manifest.json のバージョン更新
- [ ] versions.json の更新
- [ ] CHANGELOG.md の更新
- [ ] ビルド成功（`npm run build`）
- [ ] Obsidianでの動作確認
- [ ] README.md の更新（必要な場合）
- [ ] エラーログの確認

#### GitHub Release チェックリスト
- [ ] タグのバージョンがmanifest.jsonと一致
- [ ] main.js をアップロード
- [ ] manifest.json をアップロード
- [ ] styles.css をアップロード
- [ ] Release descriptionにCHANGELOGを記載

#### 公式申請チェックリスト（初回のみ）
- [ ] community-plugins.json を正しく編集
- [ ] PRテンプレートに完全に従う
- [ ] チェックボックスのフォーマット確認
- [ ] URLの記載確認
- [ ] 自動チェック通過

---

## 14. トラブルシューティング（リリース関連）

### 問題: PRで自動チェックエラーが出る

**原因**: テンプレートの形式が正しくない

**解決**:
1. チェックボックスのスペースを確認
   - チェック済み: `- [x]` （`[x]`の間にスペース無し）
   - 未チェック: `- [ ]` （`[ ]`の間にスペース1つ）
2. インデントは2スペース
3. コメント（`<!--- ... --->`）を削除

### 問題: Releaseにファイルをアップロードし忘れた

**解決**:
1. Releaseページで **「Edit release」**
2. 不足しているファイルを追加
3. **「Update release」**

### 問題: タグを間違えてプッシュした

**解決**:
```bash
# ローカルのタグ削除
git tag -d 1.1.0

# リモートのタグ削除
git push public :refs/tags/1.1.0

# 正しいタグを作成してプッシュ
git tag -a 1.1.0 -m "Release v1.1.0"
git push public 1.1.0
```

### 問題: 公開用リポジトリとの同期がずれた

**解決**:
```bash
# 開発用の最新を取得
git checkout master
git pull origin master

# 公開用に強制プッシュ（注意！）
git push public master --force
```

**注意**: `--force` は慎重に使用。他の開発者がいる場合は調整が必要。

---

*このガイドラインは開発の進行に応じて随時更新されます。*
*最終更新: 2025-01-31*
