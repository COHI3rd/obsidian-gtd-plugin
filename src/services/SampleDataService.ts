import { TaskService } from './TaskService';
import { ProjectService } from './ProjectService';
import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * サンプルデータ生成サービス
 * 初回起動時にサンプルタスクとプロジェクトを生成
 */
export class SampleDataService {
  constructor(
    private taskService: TaskService,
    private projectService: ProjectService
  ) {}

  /**
   * サンプルデータを作成
   */
  async createSampleData(): Promise<void> {
    await ErrorHandler.tryCatch(async () => {
      // サンプルプロジェクトを作成
      const project1 = await this.projectService.createProject({
        title: 'Obsidian GTDプラグインを使いこなす',
        importance: 5,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
        actionPlan: '- GTDの基本を理解する\n- タスクを実際に管理してみる\n- 週次レビューを習慣化する'
      });

      const project2 = await this.projectService.createProject({
        title: '読書リスト',
        importance: 3,
        actionPlan: '- GTDの本を読む\n- 読書ノートを作成する'
      });

      // サンプルタスクを作成
      const sampleTasks = [
        // Inboxタスク
        {
          title: 'Inboxの使い方を学ぶ',
          status: 'inbox' as const,
          notes: '思いついたことはすぐにInboxに記録しましょう'
        },
        {
          title: '週次レビューの日程を決める',
          status: 'inbox' as const
        },

        // Next Actionタスク
        {
          title: 'GTDの5つのステップを確認する',
          status: 'next-action' as const,
          priority: 'high' as const,
          project: `[[${project1.title}]]`,
          notes: '把握、見極め、整理、更新、選択・実行'
        },
        {
          title: 'タスクをドラッグ&ドロップで移動してみる',
          status: 'next-action' as const,
          project: `[[${project1.title}]]`
        },
        {
          title: '『はじめてのGTD』を読む',
          status: 'next-action' as const,
          project: `[[${project2.title}]]`
        },

        // Todayタスク
        {
          title: 'サンプルタスクを確認する',
          status: 'today' as const,
          date: new Date(),
          priority: 'high' as const,
          notes: 'このタスクを完了してGTDをスタートしましょう！'
        },
        {
          title: 'プロジェクトビューを開いてみる',
          status: 'today' as const,
          date: new Date(),
          project: `[[${project1.title}]]`,
          notes: 'コマンドパレットから「プロジェクト一覧を開く」を実行'
        },

        // Waitingタスク
        {
          title: '友人からの読書リスト共有を待つ',
          status: 'waiting' as const,
          project: `[[${project2.title}]]`,
          notes: '田中さんに依頼済み'
        },

        // Somedayタスク
        {
          title: 'Obsidianのプラグイン開発を学ぶ',
          status: 'someday' as const,
          notes: '将来的にカスタムプラグインを作成したい'
        },
        {
          title: 'タスク管理システムをチーム全体に展開',
          status: 'someday' as const
        }
      ];

      for (const taskData of sampleTasks) {
        await this.taskService.createTask(taskData);
      }

      ErrorHandler.success('✅ サンプルデータを作成しました！GTDを始めましょう🎉');
    }, 'サンプルデータの作成');
  }

  /**
   * サンプルデータが既に存在するかチェック
   */
  async hasSampleData(): Promise<boolean> {
    try {
      const tasks = await this.taskService.getAllTasks();
      const projects = await this.projectService.getAllProjects();

      // タスクまたはプロジェクトが既に存在する場合はtrue
      return tasks.length > 0 || projects.length > 0;
    } catch (error) {
      console.error('Failed to check sample data:', error);
      return false;
    }
  }
}
