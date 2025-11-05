import { Task, TaskStatus, TaskPriority } from '../types';
import { TaskModel } from '../models/Task';
import { FileService } from './FileService';
import { TemplateService } from './TemplateService';
import { DateManager } from '../utils/DateManager';
import { DailyNoteService } from './DailyNoteService';
import { ErrorHandler, GTDError, ErrorType } from '../utils/ErrorHandler';

/**
 * タスク操作サービス
 * タスクのCRUDとビジネスロジックを提供
 */
export class TaskService {
  private dailyNoteService?: DailyNoteService;
  private projectService?: any; // ProjectService型は循環参照を避けるためany
  private templateService?: TemplateService;

  constructor(private fileService: FileService) {}

  /**
   * デイリーノートサービスを設定
   */
  setDailyNoteService(service: DailyNoteService): void {
    this.dailyNoteService = service;
  }

  /**
   * プロジェクトサービスを設定
   */
  setProjectService(service: any): void {
    this.projectService = service;
  }

  /**
   * テンプレートサービスを設定
   */
  setTemplateService(service: TemplateService): void {
    this.templateService = service;
  }

  /**
   * 全タスクを取得
   */
  async getAllTasks(): Promise<Task[]> {
    return await ErrorHandler.tryCatch(async () => {
      const tasks = await this.fileService.getAllTasks();

      // 前日から残ったTodayタスク（未完了）を今日の日付に自動更新
      await this.updateOverdueTodayTasks(tasks);

      return tasks;
    }, 'タスク一覧の取得') || [];
  }

  /**
   * 前日から残ったTodayタスクを今日の日付に更新
   */
  private async updateOverdueTodayTasks(tasks: Task[]): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of tasks) {
      // 未完了 && 日付が設定されている && 過去の日付 && todayステータス
      if (!task.completed && task.date && task.date < today && task.status === 'today') {
        const taskModel = new TaskModel(task);
        taskModel.setDate(new Date()); // 今日の日付に更新
        await this.fileService.updateTask(taskModel);
        console.log(`Updated overdue today task: ${task.title} from ${task.date} to today`);
      }
    }
  }

  /**
   * ステータスでフィルタしたタスクを取得
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter((task) => task.status === status);
  }

  /**
   * 今日のタスクを取得
   */
  async getTodayTasks(): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter((task) => task.isToday());
  }

  /**
   * 明日のタスクを取得
   */
  async getTomorrowTasks(): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter((task) => task.isTomorrow());
  }

  /**
   * プロジェクトに関連するタスクを取得
   */
  async getTasksByProject(projectName: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    const projectLink = `[[${projectName}]]`;
    return allTasks.filter((task) => task.project === projectLink);
  }

  /**
   * タスクを作成
   */
  async createTask(data: {
    title: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    project?: string;
    date?: Date;
  }): Promise<Task> {
    const result = await ErrorHandler.tryCatch(async () => {
      // バリデーション
      if (!data.title || data.title.trim() === '') {
        throw new GTDError(ErrorType.VALIDATION_ERROR, 'タスクのタイトルは必須です');
      }

      // statusがtodayの場合、dateが未指定なら今日の日付を自動設定
      const finalStatus = data.status || 'inbox';
      const finalDate = data.date || (finalStatus === 'today' ? new Date() : null);

      // テンプレートから本文を取得
      let taskBody = '';
      if (this.templateService) {
        try {
          taskBody = await this.templateService.getTaskTemplate();
        } catch (error) {
          console.error('Failed to load task template:', error);
          // テンプレート読み込みに失敗しても続行
        }
      }

      const task = new TaskModel({
        id: this.generateUUID(), // UUID生成
        title: data.title,
        status: finalStatus,
        priority: data.priority || 'medium',
        project: data.project || null,
        date: finalDate,
        completed: false,
        tags: [],
        notes: '',
        body: taskBody,
        filePath: '',
      });

      const createdFilePath = await this.fileService.createTask(task);
      task.filePath = createdFilePath;

      // プロジェクトが指定されている場合、プロジェクトファイルにタスクリンクを追加
      if (task.project && this.projectService) {
        const projectTitle = task.project.replace(/^\[\[/, '').replace(/\]\]$/, '');
        await this.projectService.addTaskLinkToProject(projectTitle, createdFilePath);

        // プロジェクト進捗を更新
        const allTasks = await this.getAllTasks();
        await this.projectService.updateAllProjectsProgress(allTasks);
      }

      ErrorHandler.success('タスクを作成しました');
      return task;
    }, 'タスクの作成');

    if (!result) {
      throw new Error('Failed to create task');
    }
    return result;
  }

  /**
   * タスクを更新
   */
  async updateTask(task: Task, oldProject?: string): Promise<void> {
    await ErrorHandler.tryCatch(async () => {
      console.log('[TaskService] Updating task:', task.id, task.title, 'completed:', task.completed, 'project:', task.project);

      // バリデーション
      if (!task.title || task.title.trim() === '') {
        throw new GTDError(ErrorType.VALIDATION_ERROR, 'タスクのタイトルは必須です');
      }

      await this.fileService.updateTask(task);
      console.log('[TaskService] Task file updated');

      // プロジェクトの変更を処理
      if (this.projectService) {
        let projectChanged = false;

        // 古いプロジェクトから削除
        if (oldProject && oldProject !== task.project) {
          const oldProjectTitle = oldProject.replace(/^\[\[/, '').replace(/\]\]$/, '');
          await this.projectService.removeTaskLinkFromProject(oldProjectTitle, task.filePath);
          projectChanged = true;
        }

        // 新しいプロジェクトに追加
        if (task.project && task.project !== oldProject) {
          const newProjectTitle = task.project.replace(/^\[\[/, '').replace(/\]\]$/, '');
          await this.projectService.addTaskLinkToProject(newProjectTitle, task.filePath);
          projectChanged = true;
        }

        // プロジェクトが削除された場合
        if (oldProject && !task.project) {
          const oldProjectTitle = oldProject.replace(/^\[\[/, '').replace(/\]\]$/, '');
          await this.projectService.removeTaskLinkFromProject(oldProjectTitle, task.filePath);
          projectChanged = true;
        }

        // プロジェクトが変更された、またはタスクにプロジェクトがある場合、進捗を更新
        if (projectChanged || task.project) {
          console.log('[TaskService] Updating project progress for task with project:', task.project);
          const allTasks = await this.getAllTasks();
          await this.projectService.updateAllProjectsProgress(allTasks);
        }
      }
      console.log('[TaskService] Task update complete');
    }, 'タスクの更新');
  }

  /**
   * タスクの完了状態をトグル
   */
  async toggleTaskComplete(taskId: string): Promise<void> {
    const task = await this.fileService.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const taskModel = new TaskModel(task);
    const wasCompleted = taskModel.completed;

    if (taskModel.completed) {
      taskModel.uncomplete();
    } else {
      taskModel.complete();
      // 完了時に日付がない場合は今日の日付を設定
      if (!taskModel.date) {
        taskModel.setDate(DateManager.getToday());
      }

      // デイリーノートに自動書き込み（設定がauto-writeの場合）
      if (this.dailyNoteService && !wasCompleted) {
        await this.dailyNoteService.writeCompletedTaskToDailyNote(taskModel);
      }
    }

    await this.fileService.updateTask(taskModel);

    // タスクにプロジェクトが紐づいている場合、プロジェクト進捗を更新
    if (taskModel.project && this.projectService) {
      const allTasks = await this.getAllTasks();
      await this.projectService.updateAllProjectsProgress(allTasks);
    }
  }

  /**
   * タスクのステータスを変更
   */
  async changeTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
    const task = await this.fileService.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const taskModel = new TaskModel(task);
    taskModel.changeStatus(newStatus);

    // inbox または next-action に移動する場合は日付をクリアし、完了フラグも解除
    if (newStatus === 'inbox' || newStatus === 'next-action' || newStatus === 'waiting' || newStatus === 'someday') {
      taskModel.setDate(null);
      // 完了状態から未完了に戻す
      if (taskModel.completed) {
        taskModel.uncomplete();
      }
    }

    await this.fileService.updateTask(taskModel);
  }

  /**
   * タスクをゴミ箱に移動
   */
  async moveTaskToTrash(taskId: string): Promise<void> {
    try {
      console.log(`[TaskService] Moving task to trash: ${taskId}`);
      const task = await this.fileService.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const taskModel = new TaskModel(task);
      taskModel.changeStatus('trash');

      // ゴミ箱に移動する際は日付と完了ステータスをクリア
      taskModel.setDate(null);
      taskModel.uncomplete();

      console.log(`[TaskService] Updating task status to trash`);
      await this.fileService.updateTask(taskModel);

      // ファイルを ゴミ箱 フォルダに移動
      const trashFolder = 'GTD/Tasks/ゴミ箱';
      console.log(`[TaskService] Moving task file to: ${trashFolder}`);
      await this.fileService.moveTaskToFolder(taskModel, trashFolder);
      console.log(`[TaskService] Successfully moved task to trash: ${taskId}`);
    } catch (error) {
      console.error(`[TaskService] Failed to move task to trash: ${taskId}`, error);
      throw error;
    }
  }

  /**
   * タスクをTodayに移動（日付を今日に設定）
   */
  async moveTaskToToday(taskId: string): Promise<void> {
    const task = await this.fileService.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const taskModel = new TaskModel(task);
    taskModel.setDate(DateManager.getToday());
    taskModel.changeStatus('today');

    await this.fileService.updateTask(taskModel);
  }

  /**
   * タスクをTomorrowに移動（日付を明日に設定）
   */
  async moveTaskToTomorrow(taskId: string): Promise<void> {
    const task = await this.fileService.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const taskModel = new TaskModel(task);
    taskModel.setDate(DateManager.getTomorrow());

    await this.fileService.updateTask(taskModel);
  }

  /**
   * タスクを削除
   */
  async deleteTask(taskId: string): Promise<void> {
    await ErrorHandler.tryCatch(async () => {
      await this.fileService.deleteTask(taskId);
      ErrorHandler.success('タスクを削除しました');
    }, 'タスクの削除');
  }

  /**
   * タスクをプロジェクトに関連付け
   */
  async assignTaskToProject(taskId: string, projectName: string): Promise<void> {
    const task = await this.fileService.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const taskModel = new TaskModel(task);
    taskModel.assignToProject(projectName);

    await this.fileService.updateTask(taskModel);
  }

  /**
   * UUID v4を生成
   */
  private generateUUID(): string {
    // crypto.randomUUID() が使える環境ならそれを使用
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // フォールバック: 簡易的なUUID生成
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// TaskParser をインポート（循環参照回避のため）
import { TaskParser } from '../utils/TaskParser';
