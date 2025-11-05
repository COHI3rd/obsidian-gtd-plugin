import { App, TFile, TFolder, Notice } from 'obsidian';
import { Project, Task } from '../types';
import { ProjectModel } from '../models/Project';
import { GTDSettings } from '../types';
import { ProjectCalculator } from '../utils/ProjectCalculator';
import { TemplateService } from './TemplateService';
import { ErrorHandler, GTDError, ErrorType } from '../utils/ErrorHandler';
import matter from 'gray-matter';

/**
 * プロジェクト操作サービス
 * プロジェクトのCRUDとビジネスロジックを提供
 */
export class ProjectService {
  private templateService?: TemplateService;

  constructor(
    private app: App,
    private settings: GTDSettings
  ) {}

  /**
   * テンプレートサービスを設定
   */
  setTemplateService(service: TemplateService): void {
    this.templateService = service;
  }

  /**
   * 全プロジェクトを取得
   * プロジェクトフォルダと完了フォルダの両方から取得
   */
  async getAllProjects(): Promise<Project[]> {
    const projects: Project[] = [];

    // プロジェクトフォルダから取得（完了フォルダは除外）
    const projectFolder = this.app.vault.getAbstractFileByPath(this.settings.projectFolder);
    if (projectFolder && projectFolder instanceof TFolder) {
      const files = this.getMarkdownFiles(projectFolder, ['完了']);
      for (const file of files) {
        try {
          const content = await this.app.vault.read(file);
          const project = this.parseProject(content, file.path);
          if (project) {
            projects.push(project);
          }
        } catch (error) {
          console.error(`Failed to read project file: ${file.path}`, error);
        }
      }
    }

    // 完了フォルダから取得
    const completedFolderPath = `${this.settings.projectFolder}/完了`;
    const completedFolder = this.app.vault.getAbstractFileByPath(completedFolderPath);
    if (completedFolder && completedFolder instanceof TFolder) {
      const files = this.getMarkdownFiles(completedFolder);
      for (const file of files) {
        try {
          const content = await this.app.vault.read(file);
          const project = this.parseProject(content, file.path);
          if (project) {
            projects.push(project);
          }
        } catch (error) {
          console.error(`Failed to read completed project file: ${file.path}`, error);
        }
      }
    }

    return projects;
  }

  /**
   * プロジェクトを作成
   */
  async createProject(data: {
    title: string;
    importance?: number;
    deadline?: Date;
    actionPlan?: string;
    color?: string;
  }): Promise<Project> {
    const result = await ErrorHandler.tryCatch(async () => {
      // バリデーション
      if (!data.title || data.title.trim() === '') {
        throw new GTDError(ErrorType.VALIDATION_ERROR, 'プロジェクトのタイトルは必須です');
      }

      // 一意のプロジェクトIDを生成
      const projectId = Date.now().toString();

      // タイトルをサニタイズ（ファイル名に使えない文字を除去）
      const sanitizedTitle = data.title.replace(/[/\\:*?"<>|]/g, '_');

      // ファイル名: タイトル_プロジェクトID.md（一意性を保証）
      const fileName = `${sanitizedTitle}_${projectId}.md`;
      const filePath = `${this.settings.projectFolder}/${fileName}`;

      // フォルダが存在しない場合は作成
      await this.ensureFolderExists(this.settings.projectFolder);

      // テンプレートから本文を取得
      let projectBody = '';
      if (this.templateService) {
        try {
          projectBody = await this.templateService.getProjectTemplate();
        } catch (error) {
          console.error('Failed to load project template:', error);
          // テンプレート読み込みに失敗しても続行
        }
      }

      const project = new ProjectModel({
        id: projectId,
        title: data.title,
        importance: data.importance || 3,
        deadline: data.deadline || null,
        status: 'not-started',
        actionPlan: data.actionPlan || '',
        progress: 0,
        startedDate: null,
        completedDate: null,
        color: data.color || '#6b7280', // デフォルトカラー: グレー
        filePath,
      });

      // プロジェクトに本文を追加
      (project as any).body = projectBody;

      const content = this.stringifyProject(project);
      await this.app.vault.create(filePath, content);

      ErrorHandler.success(`プロジェクト「${project.title}」を作成しました`);
      return project;
    }, 'プロジェクトの作成');

    if (!result) {
      throw new Error('Failed to create project');
    }
    return result;
  }

  /**
   * プロジェクトを更新
   */
  async updateProject(project: Project): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(project.filePath);

      if (!file || !(file instanceof TFile)) {
        throw new Error(`File not found: ${project.filePath}`);
      }

      const content = this.stringifyProject(project);
      await this.app.vault.modify(file, content);

      // プロジェクトが完了状態になった場合、完了フォルダに移動
      if (project.status === 'completed') {
        await this.moveProjectToCompleted(project);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      new Notice('プロジェクトの更新に失敗しました');
      throw error;
    }
  }

  /**
   * 完了プロジェクトを完了フォルダに移動
   */
  private async moveProjectToCompleted(project: Project): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(project.filePath);
      if (!file || !(file instanceof TFile)) {
        return;
      }

      // 既に完了フォルダにある場合はスキップ
      if (project.filePath.includes('完了/')) {
        return;
      }

      // 完了日を取得（今日）
      const completedDate = project.completedDate || new Date();
      const dateStr = this.formatYearMonth(completedDate);

      // 完了フォルダのパス: GTD/Projects/完了/YYYY-MM/
      const completedFolder = `${this.settings.projectFolder}/完了/${dateStr}`;

      // フォルダを作成（存在しない場合）
      const folder = this.app.vault.getAbstractFileByPath(completedFolder);
      if (!folder) {
        try {
          await this.app.vault.createFolder(completedFolder);
        } catch (error) {
          console.error(`Failed to create completed folder: ${completedFolder}`, error);
        }
      }

      // 新しいファイルパス
      const fileName = file.name;
      const newPath = `${completedFolder}/${fileName}`;

      // ファイルを移動
      await this.app.fileManager.renameFile(file, newPath);

      // プロジェクトのfilePathを更新
      project.filePath = newPath;

      console.log(`Project moved to completed: ${newPath}`);
    } catch (error) {
      console.error('Failed to move project to completed folder:', error);
      // エラーは握りつぶす（移動失敗してもプロジェクト更新は成功扱い）
    }
  }

  /**
   * 日付を YYYY-MM-DD 形式にフォーマット
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 日付を YYYY-MM 形式にフォーマット
   */
  private formatYearMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * プロジェクトの進捗率を更新
   */
  async updateProjectProgress(project: Project, allTasks: Task[]): Promise<void> {
    const progress = ProjectCalculator.calculateProgress(project, allTasks);
    const projectModel = new ProjectModel(project);
    projectModel.updateProgress(progress);
    await this.updateProject(projectModel);
  }

  /**
   * 全プロジェクトの進捗率を一括更新
   */
  async updateAllProjectsProgress(allTasks: Task[]): Promise<void> {
    const projects = await this.getAllProjects();

    for (const project of projects) {
      await this.updateProjectProgress(project, allTasks);
    }
  }

  /**
   * プロジェクトファイルをパース
   */
  private parseProject(content: string, filePath: string): Project | null {
    try {
      const { data, content: body } = matter(content);

      if (data.type !== 'project') {
        return null;
      }

      return new ProjectModel({
        id: this.extractFileId(filePath),
        title: data.title || '無題のプロジェクト',
        importance: data.importance || 3,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status || 'not-started',
        actionPlan: data['action-plan'] || '',
        progress: data.progress || 0,
        startedDate: data['started-date'] ? new Date(data['started-date']) : null,
        completedDate: data['completed-date'] ? new Date(data['completed-date']) : null,
        color: data.color || '#6b7280',
        filePath,
      });
    } catch (error) {
      console.error('Failed to parse project:', error);
      return null;
    }
  }

  /**
   * プロジェクトにタスクのリンクを追加
   */
  async addTaskLinkToProject(projectTitle: string, taskFilePath: string): Promise<void> {
    try {
      const projects = await this.getAllProjects();
      const project = projects.find(p => p.title === projectTitle);

      if (!project) {
        console.warn(`Project not found: ${projectTitle}`);
        return;
      }

      const file = this.app.vault.getAbstractFileByPath(project.filePath);
      if (!file || !(file instanceof TFile)) {
        console.warn(`Project file not found: ${project.filePath}`);
        return;
      }

      const content = await this.app.vault.read(file);
      const { data, content: body } = matter(content);

      // タスクファイル名を取得（拡張子なし）
      const taskFileName = taskFilePath.split('/').pop()?.replace('.md', '') || taskFilePath;
      const taskLink = `- [[${taskFileName}]]`;

      // 既に同じリンクが存在するかチェック
      if (body.includes(taskLink)) {
        return;
      }

      // タスクセクションを探すか作成
      let newBody = body;
      const tasksHeaderRegex = /^##\s+タスク\s*$/m;

      if (tasksHeaderRegex.test(body)) {
        // "## タスク" セクションが存在する場合、その下に追加
        newBody = body.replace(tasksHeaderRegex, `## タスク\n${taskLink}`);
      } else {
        // セクションが存在しない場合は新規作成
        newBody = body.trim() + '\n\n## タスク\n' + taskLink;
      }

      const newContent = matter.stringify(newBody, data);
      await this.app.vault.modify(file, newContent);
    } catch (error) {
      console.error('Failed to add task link to project:', error);
    }
  }

  /**
   * プロジェクトからタスクのリンクを削除
   */
  async removeTaskLinkFromProject(projectTitle: string, taskFilePath: string): Promise<void> {
    try {
      const projects = await this.getAllProjects();
      const project = projects.find(p => p.title === projectTitle);

      if (!project) {
        return;
      }

      const file = this.app.vault.getAbstractFileByPath(project.filePath);
      if (!file || !(file instanceof TFile)) {
        return;
      }

      const content = await this.app.vault.read(file);
      const { data, content: body } = matter(content);

      const taskFileName = taskFilePath.split('/').pop()?.replace('.md', '') || taskFilePath;
      const taskLink = `- [[${taskFileName}]]`;

      // リンクを削除
      const newBody = body.split('\n')
        .filter(line => !line.includes(taskLink))
        .join('\n');

      const newContent = matter.stringify(newBody, data);
      await this.app.vault.modify(file, newContent);
    } catch (error) {
      console.error('Failed to remove task link from project:', error);
    }
  }

  /**
   * プロジェクトをMarkdown形式に変換
   */
  private stringifyProject(project: Project): string {
    const frontmatter = {
      type: 'project',
      title: project.title,
      importance: project.importance,
      deadline: project.deadline ? this.formatDate(project.deadline) : undefined,
      status: project.status,
      'action-plan': project.actionPlan || undefined,
      progress: project.progress,
      'started-date': project.startedDate ? this.formatDate(project.startedDate) : undefined,
      'completed-date': project.completedDate ? this.formatDate(project.completedDate) : undefined,
      color: project.color || '#6b7280',
    };

    // undefinedのプロパティを除去
    const cleanedFrontmatter = Object.fromEntries(
      Object.entries(frontmatter).filter(([_, v]) => v !== undefined)
    );

    // プロジェクト本文（body）が存在する場合はそれを使用、なければ空文字列
    const projectBody = (project as any).body || '';
    return matter.stringify(projectBody, cleanedFrontmatter);
  }

  /**
   * ファイルパスからファイルIDを抽出
   */
  private extractFileId(filePath: string): string {
    return filePath.replace(/\\/g, '/').split('/').pop()?.replace('.md', '') || '';
  }

  /**
   * フォルダ内のMarkdownファイルを再帰的に取得
   * @param excludeFolderNames - 除外するフォルダ名のリスト
   */
  private getMarkdownFiles(folder: TFolder, excludeFolderNames: string[] = []): TFile[] {
    const files: TFile[] = [];

    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        files.push(child);
      } else if (child instanceof TFolder) {
        // 除外フォルダに該当する場合はスキップ
        if (excludeFolderNames.includes(child.name)) {
          continue;
        }
        files.push(...this.getMarkdownFiles(child, excludeFolderNames));
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
}
