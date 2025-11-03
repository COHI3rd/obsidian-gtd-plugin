/**
 * 多言語対応テキスト定義
 */

export type Language = 'ja' | 'en';

export interface I18nTexts {
  // ビュー名
  mainView: string;
  projectView: string;
  weeklyReviewView: string;

  // セクション
  today: string;
  inbox: string;
  nextAction: string;
  waiting: string;
  someday: string;
  trash: string;
  completedThisWeek: string;

  // ボタン
  addTask: string;
  quickAdd: string;
  createProject: string;
  refresh: string;
  insertToDailyNote: string;
  startReview: string;
  save: string;
  cancel: string;
  delete: string;

  // ラベル
  title: string;
  status: string;
  priority: string;
  project: string;
  date: string;
  notes: string;
  progress: string;
  importance: string;
  deadline: string;
  actionPlan: string;

  // 優先度
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;

  // ステータス
  notStarted: string;
  inProgress: string;
  completed: string;

  // メッセージ
  loading: string;
  noTasks: string;
  noProjects: string;
  emptyStateHint: string;
  dragToTrash: string;
  completedTasksThisWeek: string;

  // 設定
  settingsTitle: string;
  taskFolder: string;
  taskFolderDesc: string;
  projectFolder: string;
  projectFolderDesc: string;
  reviewFolder: string;
  reviewFolderDesc: string;
  dateFormat: string;
  dateFormatDesc: string;
  enableAutoDate: string;
  enableAutoDateDesc: string;
  defaultPriority: string;
  defaultPriorityDesc: string;
  taskSortMode: string;
  taskSortModeDesc: string;
  taskSortModeManual: string;
  taskSortModeAuto: string;
  dailyNoteIntegration: string;
  dailyNoteMode: string;
  dailyNoteModeDesc: string;
  dailyNoteModeNone: string;
  dailyNoteModeAutoWrite: string;
  dailyNoteModeDataview: string;
  dailyNoteModeCommand: string;
  dailyNoteFolder: string;
  dailyNoteFolderDesc: string;
  dailyNoteDateFormat: string;
  dailyNoteDateFormatDesc: string;
  language: string;
  languageDesc: string;

  // 使い方
  usage: string;
  usageStep1: string;
  usageStep2: string;
  usageStep3: string;
  usageStep4: string;
}

export const texts: Record<Language, I18nTexts> = {
  ja: {
    // ビュー名
    mainView: 'GTDビュー',
    projectView: 'プロジェクト',
    weeklyReviewView: '週次レビュー',

    // セクション
    today: '📅 Today',
    inbox: '📥 Inbox',
    nextAction: '▶️ 次に取るべき行動',
    waiting: '⏳ 連絡待ち',
    someday: '💭 いつかやる/多分やる',
    trash: '🗑️ ゴミ箱',
    completedThisWeek: '今週完了したタスク',

    // ボタン
    addTask: '+ タスクを追加',
    quickAdd: '素早く追加',
    createProject: '+ プロジェクトを作成',
    refresh: 'ビューを更新',
    insertToDailyNote: '📝 デイリーノートに反映',
    startReview: '週次レビューを開始',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',

    // ラベル
    title: 'タイトル',
    status: 'ステータス',
    priority: '優先度',
    project: 'プロジェクト',
    date: '日付',
    notes: 'メモ',
    progress: '進捗率',
    importance: '重要度',
    deadline: '期限',
    actionPlan: 'アクションプラン',

    // 優先度
    priorityHigh: '高',
    priorityMedium: '中',
    priorityLow: '低',

    // ステータス
    notStarted: '未着手',
    inProgress: '進行中',
    completed: '完了',

    // メッセージ
    loading: '読み込み中...',
    noTasks: 'タスクがありません',
    noProjects: 'プロジェクトがありません',
    emptyStateHint: '右側の「次に取るべき行動」からドラッグ&ドロップで追加',
    dragToTrash: 'タスクをここにドロップして削除',
    completedTasksThisWeek: '今週完了したタスク',

    // 設定
    settingsTitle: 'GTD プラグイン設定',
    taskFolder: 'タスクフォルダ',
    taskFolderDesc: 'タスクファイルを保存するフォルダパス',
    projectFolder: 'プロジェクトフォルダ',
    projectFolderDesc: 'プロジェクトファイルを保存するフォルダパス',
    reviewFolder: '週次レビューフォルダ',
    reviewFolderDesc: '週次レビューファイルを保存するフォルダパス',
    dateFormat: '日付フォーマット',
    dateFormatDesc: '日付の表示形式（date-fns形式）',
    enableAutoDate: '自動日付入力',
    enableAutoDateDesc: 'Todayにドラッグした際に自動で今日の日付を設定',
    defaultPriority: 'デフォルト優先度',
    defaultPriorityDesc: '新規タスクのデフォルト優先度',
    taskSortMode: 'タスク並び替えモード',
    taskSortModeDesc: 'タスクの表示順序を手動で並び替えるか、自動でソートするか',
    taskSortModeManual: '手動並び替え（ドラッグで順序変更）',
    taskSortModeAuto: '自動並び替え（優先度・日付順）',
    dailyNoteIntegration: 'デイリーノート連携',
    dailyNoteMode: '連携モード',
    dailyNoteModeDesc: '完了タスクをデイリーノートに反映する方法を選択',
    dailyNoteModeNone: 'なし（連携しない）',
    dailyNoteModeAutoWrite: '自動書き込み（完了時にデイリーノートに追記）',
    dailyNoteModeDataview: 'Dataview参照（推奨）',
    dailyNoteModeCommand: 'コマンド実行（手動で挿入）',
    dailyNoteFolder: 'デイリーノートフォルダ',
    dailyNoteFolderDesc: 'デイリーノートが保存されているフォルダ（空欄の場合はVaultルート）',
    dailyNoteDateFormat: 'デイリーノート日付フォーマット',
    dailyNoteDateFormatDesc: 'デイリーノートのファイル名に使用される日付フォーマット（例: YYYY-MM-DD, YYYY年MM月DD日）※YYYY/yyyyどちらも対応',
    language: '言語 / Language',
    languageDesc: '表示言語を選択 / Select display language',

    // 使い方
    usage: '使い方',
    usageStep1: '1. コマンドパレット（Ctrl/Cmd + P）から「GTDビューを開く」を実行',
    usageStep2: '2. Inboxに思いついたタスクを追加',
    usageStep3: '3. タスクをドラッグ&ドロップで「次に取るべき行動」または「Today」に移動',
    usageStep4: '4. Todayのタスクを実行してチェックボックスをオン',
  },

  en: {
    // Views
    mainView: 'GTD View',
    projectView: 'Projects',
    weeklyReviewView: 'Weekly Review',

    // Sections
    today: '📅 Today',
    inbox: '📥 Inbox',
    nextAction: '▶️ Next Actions',
    waiting: '⏳ Waiting For',
    someday: '💭 Someday/Maybe',
    trash: '🗑️ Trash',
    completedThisWeek: 'Completed This Week',

    // Buttons
    addTask: '+ Add Task',
    quickAdd: 'Quick Add',
    createProject: '+ Create Project',
    refresh: 'Refresh View',
    insertToDailyNote: '📝 Insert to Daily Note',
    startReview: 'Start Weekly Review',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',

    // Labels
    title: 'Title',
    status: 'Status',
    priority: 'Priority',
    project: 'Project',
    date: 'Date',
    notes: 'Notes',
    progress: 'Progress',
    importance: 'Importance',
    deadline: 'Deadline',
    actionPlan: 'Action Plan',

    // Priority
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',

    // Status
    notStarted: 'Not Started',
    inProgress: 'In Progress',
    completed: 'Completed',

    // Messages
    loading: 'Loading...',
    noTasks: 'No tasks',
    noProjects: 'No projects',
    emptyStateHint: 'Drag & drop tasks from "Next Actions" on the right',
    dragToTrash: 'Drop tasks here to delete',
    completedTasksThisWeek: 'Completed this week',

    // Settings
    settingsTitle: 'GTD Plugin Settings',
    taskFolder: 'Task Folder',
    taskFolderDesc: 'Folder path for task files',
    projectFolder: 'Project Folder',
    projectFolderDesc: 'Folder path for project files',
    reviewFolder: 'Review Folder',
    reviewFolderDesc: 'Folder path for weekly review files',
    dateFormat: 'Date Format',
    dateFormatDesc: 'Date display format (date-fns format)',
    enableAutoDate: 'Auto Date',
    enableAutoDateDesc: 'Automatically set today\'s date when dragged to Today',
    defaultPriority: 'Default Priority',
    defaultPriorityDesc: 'Default priority for new tasks',
    taskSortMode: 'Task Sort Mode',
    taskSortModeDesc: 'Manual reordering or automatic sorting by priority/date',
    taskSortModeManual: 'Manual (Drag to reorder)',
    taskSortModeAuto: 'Auto (Priority & Date)',
    dailyNoteIntegration: 'Daily Note Integration',
    dailyNoteMode: 'Integration Mode',
    dailyNoteModeDesc: 'How to reflect completed tasks in daily notes',
    dailyNoteModeNone: 'None (No integration)',
    dailyNoteModeAutoWrite: 'Auto Write (Append on completion)',
    dailyNoteModeDataview: 'Dataview Reference (Recommended)',
    dailyNoteModeCommand: 'Command (Manual insert)',
    dailyNoteFolder: 'Daily Note Folder',
    dailyNoteFolderDesc: 'Folder where daily notes are stored (leave empty for vault root)',
    dailyNoteDateFormat: 'Daily Note Date Format',
    dailyNoteDateFormatDesc: 'Date format used in daily note filenames (e.g., YYYY-MM-DD, YYYY年MM月DD日)',
    language: 'Language / 言語',
    languageDesc: 'Select display language / 表示言語を選択',

    // Usage
    usage: 'How to Use',
    usageStep1: '1. Open GTD View from Command Palette (Ctrl/Cmd + P)',
    usageStep2: '2. Add tasks to Inbox as you think of them',
    usageStep3: '3. Drag & drop tasks to "Next Actions" or "Today"',
    usageStep4: '4. Complete tasks in Today and check them off',
  },
};

/**
 * 言語設定に基づいてテキストを取得
 */
export function getText(language: Language): I18nTexts {
  return texts[language];
}
