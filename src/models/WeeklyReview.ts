import { WeeklyReview as IWeeklyReview } from '../types';

/**
 * 週次レビューモデルクラス
 * 週次レビューデータの操作を提供
 */
export class WeeklyReview implements IWeeklyReview {
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

  constructor(data: Partial<WeeklyReview> & { id: string; date: Date; filePath: string }) {
    this.id = data.id;
    this.date = data.date;
    this.reviewType = 'weekly';
    this.filePath = data.filePath;
    this.notes = data.notes || '';
    this.completedTasksCount = data.completedTasksCount || 0;
    this.activeProjectsCount = data.activeProjectsCount || 0;
    this.reflections = data.reflections || '';
    this.learnings = data.learnings || '';
    this.nextWeekGoals = data.nextWeekGoals || '';
  }

  /**
   * レビューの週の開始日を取得（月曜日）
   */
  getWeekStart(): Date {
    const date = new Date(this.date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の開始とする
    return new Date(date.setDate(diff));
  }

  /**
   * レビューの週の終了日を取得（日曜日）
   */
  getWeekEnd(): Date {
    const start = this.getWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  }

  /**
   * 週の範囲を文字列で取得
   */
  getWeekRange(): string {
    const start = this.getWeekStart();
    const end = this.getWeekEnd();
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return `${formatDate(start)} 〜 ${formatDate(end)}`;
  }

  /**
   * レビューのタイトルを取得
   */
  getTitle(): string {
    return `週次レビュー ${this.getWeekRange()}`;
  }
}
