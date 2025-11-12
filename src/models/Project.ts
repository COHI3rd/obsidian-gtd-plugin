import { Project, ProjectStatus } from '../types';

/**
 * プロジェクトクラス
 * ビジネスロジックを含むドメインモデル
 *
 * 【重要な設計思想】
 * - プロジェクトは子タスクのリストを持たない
 * - progress は外部（ProjectCalculator）から設定される
 */
export class ProjectModel implements Project {
  id: string;
  title: string;
  importance: number;
  deadline: Date | null;
  status: ProjectStatus;
  actionPlan: string;
  progress: number;
  startedDate: Date | null;
  completedDate: Date | null;
  color: string;
  body?: string;
  filePath: string;

  constructor(data: Partial<Project>) {
    this.id = data.id || '';
    this.title = data.title || '無題のプロジェクト';
    this.importance = data.importance || 3;
    this.deadline = data.deadline || null;
    this.status = data.status || 'not-started';
    this.actionPlan = data.actionPlan || '';
    this.progress = data.progress || 0;
    this.startedDate = data.startedDate || null;
    this.completedDate = data.completedDate || null;
    this.color = data.color || '#6b7280'; // デフォルト: グレー
    this.body = data.body;
    this.filePath = data.filePath || '';
  }

  /**
   * プロジェクトが期限切れかどうか
   */
  isOverdue(): boolean {
    if (!this.deadline || this.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.deadline < today;
  }

  /**
   * プロジェクトが完了しているかどうか
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * プロジェクトのステータスを変更
   */
  changeStatus(newStatus: ProjectStatus): void {
    this.status = newStatus;
  }

  /**
   * プロジェクトの進捗率を更新
   * （通常は ProjectCalculator から呼ばれる）
   */
  updateProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(100, progress));
  }

  /**
   * プロジェクトを完了する
   */
  complete(): void {
    this.status = 'completed';
    this.progress = 100;
    // 完了日が未設定の場合のみ設定
    if (!this.completedDate) {
      this.completedDate = new Date();
    }
  }

  /**
   * プロジェクトを開始する
   */
  start(): void {
    if (this.status === 'not-started') {
      this.status = 'in-progress';
      // 開始日が未設定の場合のみ設定
      if (!this.startedDate) {
        this.startedDate = new Date();
      }
    }
  }
}
