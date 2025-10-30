import { Task, TaskStatus, TaskPriority } from '../types';

/**
 * タスククラス
 * ビジネスロジックを含むドメインモデル
 */
export class TaskModel implements Task {
  id: string;
  title: string;
  status: TaskStatus;
  project: string | null;
  date: Date | null;
  completed: boolean;
  priority: TaskPriority;
  tags: string[];
  notes: string;
  body: string;
  filePath: string;

  constructor(data: Partial<Task>) {
    this.id = data.id || '';
    this.title = data.title || '無題のタスク';
    this.status = data.status || 'inbox';
    this.project = data.project || null;
    this.date = data.date || null;
    this.completed = data.completed || false;
    this.priority = data.priority || 'medium';
    this.tags = data.tags || [];
    this.notes = data.notes || '';
    this.body = data.body || '';
    this.filePath = data.filePath || '';
  }

  /**
   * タスクが今日実行予定かどうか
   */
  isToday(): boolean {
    if (!this.date) return false;
    const today = new Date();
    return (
      this.date.getDate() === today.getDate() &&
      this.date.getMonth() === today.getMonth() &&
      this.date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * タスクが明日実行予定かどうか
   */
  isTomorrow(): boolean {
    if (!this.date) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      this.date.getDate() === tomorrow.getDate() &&
      this.date.getMonth() === tomorrow.getMonth() &&
      this.date.getFullYear() === tomorrow.getFullYear()
    );
  }

  /**
   * タスクが期限切れかどうか
   */
  isOverdue(): boolean {
    if (!this.date || this.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.date < today;
  }

  /**
   * タスクを完了する
   */
  complete(): void {
    this.completed = true;
  }

  /**
   * タスクを未完了にする
   */
  uncomplete(): void {
    this.completed = false;
  }

  /**
   * タスクのステータスを変更
   */
  changeStatus(newStatus: TaskStatus): void {
    this.status = newStatus;
  }

  /**
   * タスクに日付を設定
   */
  setDate(date: Date): void {
    this.date = date;
  }

  /**
   * タスクをプロジェクトに関連付け
   */
  assignToProject(projectName: string): void {
    this.project = `[[${projectName}]]`;
  }

  /**
   * タスクのプロジェクトとの関連付けを解除
   */
  unassignFromProject(): void {
    this.project = null;
  }
}
