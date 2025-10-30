import { Task, TaskStatus, TaskPriority } from '../types';
import { TaskModel } from '../models/Task';
import { FileService } from './FileService';
import { DateManager } from '../utils/DateManager';

/**
 * タスク操作サービス
 * タスクのCRUDとビジネスロジックを提供
 */
export class TaskService {
  constructor(private fileService: FileService) {}

  /**
   * 全タスクを取得
   */
  async getAllTasks(): Promise<Task[]> {
    return await this.fileService.getAllTasks();
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
    const task = new TaskModel({
      id: Date.now().toString(),
      title: data.title,
      status: data.status || 'inbox',
      priority: data.priority || 'medium',
      project: data.project || null,
      date: data.date || null,
      completed: false,
      tags: [],
      notes: '',
      body: '',
      filePath: '',
    });

    await this.fileService.createTask(task);
    return task;
  }

  /**
   * タスクを更新
   */
  async updateTask(task: Task): Promise<void> {
    // バリデーション
    const validation = TaskParser.validate(task);
    if (!validation.valid) {
      throw new Error(`Invalid task: ${validation.errors.join(', ')}`);
    }

    await this.fileService.updateTask(task);
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
    if (taskModel.completed) {
      taskModel.uncomplete();
    } else {
      taskModel.complete();
    }

    await this.fileService.updateTask(taskModel);
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

    await this.fileService.updateTask(taskModel);
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
    await this.fileService.deleteTask(taskId);
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
}

// TaskParser をインポート（循環参照回避のため）
import { TaskParser } from '../utils/TaskParser';
