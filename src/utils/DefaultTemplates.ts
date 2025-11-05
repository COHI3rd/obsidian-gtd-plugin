/**
 * デフォルトテンプレート定義
 * タスク、プロジェクト、週次レビューの初期テンプレート
 */

/**
 * タスクのデフォルトテンプレート
 */
export const DEFAULT_TASK_TEMPLATE = `## 📋 タスク詳細

### 目的


### 次のアクション


### メモ

`;

/**
 * プロジェクトのデフォルトテンプレート
 */
export const DEFAULT_PROJECT_TEMPLATE = `## 🎯 プロジェクト概要


## 📝 アクションプラン


## 📊 進捗メモ

`;

/**
 * 週次レビューのデフォルトテンプレート
 * （i18n対応のため、TemplateServiceで動的に生成）
 */
export const DEFAULT_REVIEW_TEMPLATE_JA = `## 📊 今週の振り返り

### 成果


### 学び


### 来週の目標


### メモ

`;

export const DEFAULT_REVIEW_TEMPLATE_EN = `## 📊 Weekly Reflection

### Achievements


### Learnings


### Next Week Goals


### Notes

`;

/**
 * テンプレートファイル名
 */
export const TEMPLATE_FILENAMES = {
  TASK: 'temp_task.md',
  PROJECT: 'temp_project.md',
  REVIEW: 'temp_review.md',
} as const;
