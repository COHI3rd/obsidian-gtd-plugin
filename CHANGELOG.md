# Changelog

All notable changes to the GTD Task Manager plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- 週次レビューテンプレート機能
- プロジェクト一覧ビュー
- タスクの一括操作機能
- モバイル最適化
- カレンダービュー連携
- 統計・分析機能

## [0.1.0] - 2025-10-30

### Added
- 初回リリース
- GTDの基本ワークフロー（Inbox → 次に取るべき行動 → Today）
- ドラッグ&ドロップによるタスク移動
- 日付自動入力機能（Todayにドラッグ時）
- タスクの完了管理（チェックボックス）
- プロジェクト管理機能
- プロジェクトの進捗率自動計算
- クイック追加モーダル
- 完全日本語UI
- Markdown完全対応
- バックリンク対応

### Core Features
- **Inboxシステム**: 思いついたことを即座に記録
- **次に取るべき行動**: 実行可能なアクションリスト
- **Today/Tomorrowビュー**: 今日・明日のタスクを管理
- **ステータス管理**: inbox/next-action/today/waiting/someday
- **優先度管理**: 低/中/高
- **タグ機能**: タスクの分類
- **プロジェクトリンク**: タスクをプロジェクトに関連付け

### Technical
- TypeScript 5.3で実装
- React 18でUI構築
- @hello-pangea/dnd でドラッグ&ドロップ
- gray-matter でフロントマター処理
- date-fns で日付操作

### Documentation
- README.md（日本語）
- 要件定義書.md
- 実装計画.md
- .claude/CLAUDE.md（開発ガイドライン）

---

## Release Notes

### v0.1.0 - Initial Release

Obsidian × GTDの完璧な統合を実現する初回リリースです。

**主な機能:**
- ✅ Notion風のドラッグ&ドロップUI
- ✅ 日本語完全対応
- ✅ GTDワークフローの完全サポート
- ✅ プロジェクト管理と進捗率自動計算
- ✅ Markdownファイルベース
- ✅ Obsidianのバックリンクと完全統合

**対応環境:**
- Obsidian v1.0.0以上
- Windows / macOS / Linux
- モバイル版（ベータ）

**既知の問題:**
- 大量のタスク（1000件以上）でパフォーマンスが低下する場合がある
- モバイル版でドラッグ&ドロップの操作性が若干劣る

**次回リリース予定:**
- 週次レビュー機能の強化
- プロジェクト一覧ビューの追加
- パフォーマンスの最適化

---

*このプラグインはコミュニティによって維持されています。*
