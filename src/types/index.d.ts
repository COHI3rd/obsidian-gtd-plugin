// 型定義ファイル

/**
 * GTDワークフロー上のタスクの位置
 */
export type TaskStatus = 'inbox' | 'next-action' | 'today' | 'waiting' | 'someday' | 'trash';

/**
 * タスクの優先度
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * プロジェクトのステータス
 */
export type ProjectStatus = 'not-started' | 'in-progress' | 'completed';

/**
 * タスクデータモデル
 *
 * 【重要な設計思想】
 * - status: GTDワークフロー上の位置を示す
 * - completed: タスクの完了状態（進捗率計算に使用）
 * - project: タスクから親プロジェクトへのリンク（タスク側のみが関連を保持）
 */
export interface Task {
  id: string;                    // ファイル名またはパス
  title: string;
  status: TaskStatus;
  project: string | null;        // [[プロジェクト名]] 形式
  date: Date | null;             // 実施予定日
  completed: boolean;
  priority: TaskPriority;
  tags: string[];
  notes: string;
  body: string;                  // Markdown本文
  filePath: string;              // Vault内のファイルパス
  order: number;                 // 手動並び替え用の順序

  // メソッド
  isToday(): boolean;
  isTomorrow(): boolean;
  isOverdue(): boolean;
  complete(): void;
  uncomplete(): void;
  changeStatus(newStatus: TaskStatus): void;
  setDate(date: Date): void;
  assignToProject(projectName: string): void;
  unassignFromProject(): void;
}

/**
 * プロジェクトデータモデル
 *
 * 【重要な設計思想】
 * - プロジェクトは子タスクのリストを持たない
 * - 子タスクは project: [[このプロジェクト]] でプロジェクトを参照
 * - progress は子タスクの completed: true の割合から自動計算
 */
export interface Project {
  id: string;
  title: string;
  importance: number;            // 1-5
  deadline: Date | null;
  status: ProjectStatus;
  actionPlan: string;            // アクションプラン（マルチライン）
  progress: number;              // 0-100（自動計算）
  startedDate: Date | null;      // 開始日（in-progressになった日）
  completedDate: Date | null;    // 完了日（completedになった日）
  color: string;                 // プロジェクトカラー（例: "#3b82f6"）
  body?: string;                 // Markdown本文（テンプレートから読み込まれる）
  filePath: string;

  // メソッド
  isOverdue(): boolean;
  isCompleted(): boolean;
  changeStatus(newStatus: ProjectStatus): void;
  updateProgress(progress: number): void;
  complete(): void;
  start(): void;
}

/**
 * 週次レビューデータモデル
 */
export interface WeeklyReview {
  id: string;
  date: Date;
  reviewType: 'weekly';
  filePath: string;
  notes: string;
  completedTasksCount: number;
  activeProjectsCount: number;
  reflections: string;
  learnings: string;
  nextWeekGoals: string;
  weekStartDay: WeekStartDay;
}

/**
 * タスクのフロントマター（YAMLパース用）
 */
export interface TaskFrontmatter {
  id?: string;                   // 一意のタスクID（UUID）
  title?: string;
  status?: TaskStatus;
  project?: string | null;
  date?: string | Date;
  completed?: boolean;
  priority?: TaskPriority;
  tags?: string[];
  notes?: string;
  order?: number;
}

/**
 * プロジェクトのフロントマター（YAMLパース用）
 */
export interface ProjectFrontmatter {
  id?: string;                   // 一意のプロジェクトID（UUID）
  type?: 'project';
  title?: string;
  importance?: number;
  deadline?: string | Date;
  status?: ProjectStatus;
  'action-plan'?: string;
  progress?: number;
  'started-date'?: string | Date;
  'completed-date'?: string | Date;
  color?: string;
}

/**
 * 週次レビューのフロントマター（YAMLパース用）
 */
export interface WeeklyReviewFrontmatter {
  type?: 'weekly-review';
  date?: string | Date;
  'review-type'?: 'weekly';
}

/**
 * デイリーノート連携モード
 */
export type DailyNoteMode = 'none' | 'auto-write' | 'dataview' | 'command';

/**
 * 言語設定
 */
export type Language = 'ja' | 'en';

/**
 * 週の開始曜日
 */
export type WeekStartDay = 'sunday' | 'monday';

/**
 * プラグイン設定
 */
export interface GTDSettings {
  taskFolder: string;            // タスクフォルダパス
  projectFolder: string;         // プロジェクトフォルダパス
  reviewFolder: string;          // レビューフォルダパス
  dateFormat: string;            // 日付フォーマット
  enableAutoDate: boolean;       // 自動日付入力
  defaultPriority: TaskPriority; // デフォルト優先度
  taskSortMode: 'manual' | 'auto'; // タスク並び替えモード
  dailyNoteMode: DailyNoteMode;  // デイリーノート連携モード
  dailyNoteFolder: string;       // デイリーノートフォルダ
  dailyNoteDateFormat: string;   // デイリーノートの日付フォーマット
  language: Language;            // 表示言語
  weekStartDay: WeekStartDay;    // 週の開始曜日
}
