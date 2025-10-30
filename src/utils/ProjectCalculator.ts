import { Project, Task } from '../types';

/**
 * プロジェクトの進捗率計算クラス
 *
 * 【重要な設計思想】
 * - タスクが project: [[プロジェクト名]] でプロジェクトを参照（B案）
 * - プロジェクトはタスクのリストを持たない
 * - この設計により、タスク追加時の編集は1ファイルのみで完結
 * - Obsidianのバックリンク機能と完全に連動
 */
export class ProjectCalculator {
  /**
   * プロジェクトの進捗率を計算
   * 子タスクの completed: true の割合を算出
   *
   * @param project - 対象プロジェクト
   * @param allTasks - 全タスクリスト
   * @returns 進捗率（0-100）
   */
  static calculateProgress(project: Project, allTasks: Task[]): number {
    // プロジェクトを参照している全タスクを取得
    const childTasks = this.getChildTasks(project, allTasks);

    if (childTasks.length === 0) return 0;

    // completed: true のタスクをカウント
    const completedTasks = childTasks.filter((t) => t.completed);
    const progress = (completedTasks.length / childTasks.length) * 100;

    return Math.round(progress);
  }

  /**
   * プロジェクトに関連する子タスクを取得
   *
   * @param project - 対象プロジェクト
   * @param allTasks - 全タスクリスト
   * @returns 子タスクの配列
   */
  static getChildTasks(project: Project, allTasks: Task[]): Task[] {
    const projectLink = `[[${project.title}]]`;
    const projectLinkAlt = `[[${project.id}]]`;

    return allTasks.filter((task) => {
      if (!task.project) return false;
      // [[プロジェクト名]] または [[ファイル名]] でマッチング
      return task.project === projectLink || task.project === projectLinkAlt;
    });
  }

  /**
   * プロジェクトの統計情報を取得
   *
   * @param project - 対象プロジェクト
   * @param allTasks - 全タスクリスト
   * @returns 統計情報
   */
  static getStatistics(project: Project, allTasks: Task[]): {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    progress: number;
  } {
    const childTasks = this.getChildTasks(project, allTasks);
    const completed = childTasks.filter((t) => t.completed).length;
    const inProgress = childTasks.filter(
      (t) => !t.completed && (t.status === 'today' || t.status === 'next-action')
    ).length;
    const notStarted = childTasks.filter(
      (t) => !t.completed && (t.status === 'inbox' || t.status === 'someday')
    ).length;

    return {
      total: childTasks.length,
      completed,
      inProgress,
      notStarted,
      progress: this.calculateProgress(project, allTasks),
    };
  }

  /**
   * 複数プロジェクトの進捗率を一括計算
   *
   * @param projects - プロジェクトの配列
   * @param allTasks - 全タスクリスト
   * @returns プロジェクトIDと進捗率のマップ
   */
  static calculateAllProgress(
    projects: Project[],
    allTasks: Task[]
  ): Map<string, number> {
    const progressMap = new Map<string, number>();

    for (const project of projects) {
      const progress = this.calculateProgress(project, allTasks);
      progressMap.set(project.id, progress);
    }

    return progressMap;
  }
}
