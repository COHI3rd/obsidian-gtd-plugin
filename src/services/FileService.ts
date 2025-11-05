import { App, TFile, TFolder, Notice } from 'obsidian';
import { Task, Project } from '../types';
import { TaskParser } from '../utils/TaskParser';
import { GTDSettings } from '../types';

/**
 * ファイルI/Oサービス
 * Obsidian Vaultへのファイル読み書きを担当
 */
export class FileService {
  constructor(
    private app: App,
    private settings: GTDSettings
  ) {}

  /**
   * Appインスタンスを取得
   */
  getApp(): App {
    return this.app;
  }

  /**
   * 全タスクを取得
   */
  async getAllTasks(): Promise<Task[]> {
    const tasks: Task[] = [];
    const folder = this.app.vault.getAbstractFileByPath(this.settings.taskFolder);

    if (!folder || !(folder instanceof TFolder)) {
      return tasks;
    }

    const files = this.getMarkdownFiles(folder);

    // テンプレートファイルを除外
    const templateFileNames = ['temp_task.md', 'temp_project.md', 'temp_review.md'];

    for (const file of files) {
      // テンプレートファイルの場合はスキップ
      if (templateFileNames.includes(file.name)) {
        continue;
      }

      try {
        const content = await this.app.vault.read(file);
        const task = TaskParser.parse(content, file.path);
        tasks.push(task);
      } catch (error) {
        console.error(`Failed to read task file: ${file.path}`, error);
      }
    }

    return tasks;
  }

  /**
   * タスクIDからタスクを取得
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    const tasks = await this.getAllTasks();
    return tasks.find((t) => t.id === taskId) || null;
  }

  /**
   * タスクを作成
   */
  async createTask(task: Task): Promise<string> {
    try {
      const fileName = `${task.title.replace(/[/\\:*?"<>|]/g, '_')}.md`;
      const filePath = `${this.settings.taskFolder}/${fileName}`;

      // フォルダが存在しない場合は作成
      await this.ensureFolderExists(this.settings.taskFolder);

      // ファイルが既に存在する場合は番号を付ける
      let finalPath = filePath;
      let counter = 1;
      while (this.app.vault.getAbstractFileByPath(finalPath)) {
        finalPath = `${this.settings.taskFolder}/${task.title}_${counter}.md`;
        counter++;
      }

      const content = TaskParser.stringify(task);
      await this.app.vault.create(finalPath, content);
      // 通知はTaskServiceで行うため、ここでは通知しない

      return finalPath;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * タスクを更新
   */
  async updateTask(task: Task): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(task.filePath);

      if (!file || !(file instanceof TFile)) {
        throw new Error(`File not found: ${task.filePath}`);
      }

      const content = TaskParser.stringify(task);
      await this.app.vault.modify(file, content);

      // ゴミ箱ステータスの場合は自動移動をスキップ（moveTaskToFolderで明示的に移動される）
      if (task.status === 'trash') {
        return;
      }

      // 完了状態が変更された場合、ファイルを移動
      if (task.completed) {
        await this.moveTaskToCompletedFolder(file, task);
      } else {
        await this.moveTaskToActiveFolder(file, task);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      new Notice('タスクの更新に失敗しました');
      throw error;
    }
  }

  /**
   * 完了タスクを完了フォルダに移動
   */
  private async moveTaskToCompletedFolder(file: TFile, task: Task): Promise<void> {
    // 今日の日付でフォルダ名を作成 (YYYY-MM-DD)
    const today = new Date();
    const dateFolder = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const completedFolder = `${this.settings.taskFolder}/完了/${dateFolder}`;

    // 既に完了フォルダ内にある場合は移動しない
    if (file.path.includes('/完了/')) {
      return;
    }

    await this.ensureFolderExists(completedFolder);

    const newPath = `${completedFolder}/${file.name}`;

    // 同名ファイルが存在する場合は番号を付ける
    let finalPath = newPath;
    let counter = 1;
    while (this.app.vault.getAbstractFileByPath(finalPath)) {
      const baseName = file.basename;
      finalPath = `${completedFolder}/${baseName}_${counter}.md`;
      counter++;
    }

    await this.app.vault.rename(file, finalPath);

    // タスクのfilePathを更新
    task.filePath = finalPath;
  }

  /**
   * 未完了タスクをアクティブフォルダに移動
   */
  private async moveTaskToActiveFolder(file: TFile, task: Task): Promise<void> {
    // 完了フォルダにない場合は移動しない
    if (!file.path.includes('/完了/')) {
      return;
    }

    const newPath = `${this.settings.taskFolder}/${file.name}`;

    // 同名ファイルが存在する場合は番号を付ける
    let finalPath = newPath;
    let counter = 1;
    while (this.app.vault.getAbstractFileByPath(finalPath)) {
      const baseName = file.basename;
      finalPath = `${this.settings.taskFolder}/${baseName}_${counter}.md`;
      counter++;
    }

    await this.app.vault.rename(file, finalPath);

    // タスクのfilePathを更新
    task.filePath = finalPath;
  }

  /**
   * タスクを削除
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const file = this.app.vault.getAbstractFileByPath(task.filePath);
      if (file && file instanceof TFile) {
        await this.app.fileManager.trashFile(file);
        new Notice(`タスク「${task.title}」を削除しました`);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      new Notice('タスクの削除に失敗しました');
      throw error;
    }
  }

  /**
   * フォルダ内のMarkdownファイルを再帰的に取得
   */
  private getMarkdownFiles(folder: TFolder): TFile[] {
    const files: TFile[] = [];

    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        files.push(child);
      } else if (child instanceof TFolder) {
        files.push(...this.getMarkdownFiles(child));
      }
    }

    return files;
  }

  /**
   * フォルダが存在しない場合は作成
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      try {
        await this.app.vault.createFolder(folderPath);
      } catch (error) {
        // フォルダが既に存在する場合のエラーは無視
        console.debug(`Folder already exists or creation failed: ${folderPath}`);
      }
    }
  }

  /**
   * タスクファイルを指定フォルダに移動
   */
  async moveTaskToFolder(task: Task, folderPath: string): Promise<void> {
    try {
      // フォルダが存在しない場合は作成
      await this.ensureFolderExists(folderPath);

      const file = this.app.vault.getAbstractFileByPath(task.filePath);
      if (!file || !(file instanceof TFile)) {
        throw new Error(`Task file not found: ${task.filePath}`);
      }

      // 新しいファイルパスを生成
      const fileName = file.name;
      const newPath = `${folderPath}/${fileName}`;

      // ファイルを移動
      await this.app.fileManager.renameFile(file, newPath);

      // タスクのfilePathを更新
      task.filePath = newPath;
    } catch (error) {
      console.error('Failed to move task to folder:', error);
      new Notice('タスクの移動に失敗しました');
      throw error;
    }
  }

  /**
   * ファイルをObsidianで開く
   */
  async openFile(filePath: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }
}
