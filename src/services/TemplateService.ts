import { App, TFile } from 'obsidian';
import { GTDSettings, Language } from '../types';
import {
  DEFAULT_TASK_TEMPLATE,
  DEFAULT_PROJECT_TEMPLATE,
  DEFAULT_REVIEW_TEMPLATE_JA,
  DEFAULT_REVIEW_TEMPLATE_EN,
  TEMPLATE_FILENAMES,
} from '../utils/DefaultTemplates';

/**
 * テンプレート管理サービス
 * タスク、プロジェクト、レビューのテンプレートファイルを管理
 */
export class TemplateService {
  constructor(
    private app: App,
    private settings: GTDSettings
  ) {}

  /**
   * タスクテンプレートを取得
   * テンプレートファイルが存在しない場合はデフォルトテンプレートを作成して返す
   */
  async getTaskTemplate(): Promise<string> {
    const templatePath = `${this.settings.taskFolder}/${TEMPLATE_FILENAMES.TASK}`;
    return await this.getTemplate(templatePath, DEFAULT_TASK_TEMPLATE);
  }

  /**
   * プロジェクトテンプレートを取得
   * テンプレートファイルが存在しない場合はデフォルトテンプレートを作成して返す
   */
  async getProjectTemplate(): Promise<string> {
    const templatePath = `${this.settings.projectFolder}/${TEMPLATE_FILENAMES.PROJECT}`;
    return await this.getTemplate(templatePath, DEFAULT_PROJECT_TEMPLATE);
  }

  /**
   * 週次レビューテンプレートを取得
   * テンプレートファイルが存在しない場合はデフォルトテンプレートを作成して返す
   */
  async getReviewTemplate(): Promise<string> {
    const templatePath = `${this.settings.reviewFolder}/${TEMPLATE_FILENAMES.REVIEW}`;
    const defaultTemplate = this.settings.language === 'ja'
      ? DEFAULT_REVIEW_TEMPLATE_JA
      : DEFAULT_REVIEW_TEMPLATE_EN;
    return await this.getTemplate(templatePath, defaultTemplate);
  }

  /**
   * テンプレートを取得（共通処理）
   * @param templatePath - テンプレートファイルのパス
   * @param defaultContent - デフォルトテンプレート内容
   * @returns テンプレート内容
   */
  private async getTemplate(templatePath: string, defaultContent: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(templatePath);

    if (file instanceof TFile) {
      try {
        // テンプレートファイルが存在する場合は読み込む
        const content = await this.app.vault.read(file);
        return content;
      } catch (error) {
        console.error(`Failed to read template file: ${templatePath}`, error);
        return defaultContent;
      }
    } else {
      // テンプレートファイルが存在しない場合はデフォルトを作成
      await this.createTemplateFile(templatePath, defaultContent);
      return defaultContent;
    }
  }

  /**
   * テンプレートファイルを作成
   * @param templatePath - テンプレートファイルのパス
   * @param content - テンプレート内容
   */
  private async createTemplateFile(templatePath: string, content: string): Promise<void> {
    try {
      // 親フォルダが存在するか確認（通常は存在するはず）
      const folderPath = templatePath.substring(0, templatePath.lastIndexOf('/'));
      await this.ensureFolderExists(folderPath);

      // テンプレートファイルが既に存在する場合はスキップ
      const existingFile = this.app.vault.getAbstractFileByPath(templatePath);
      if (existingFile) {
        // 既に存在する場合は何もしない（エラーも出さない）
        return;
      }

      // テンプレートファイルを作成
      try {
        await this.app.vault.create(templatePath, content);
        console.log(`Created template file: ${templatePath}`);
      } catch (createError) {
        // ファイル作成エラーは無視（既に存在する可能性がある）
        console.debug(`Template file may already exist: ${templatePath}`);
      }
    } catch (error) {
      // すべてのエラーを無視（初期化時のエラーは致命的ではない）
      console.debug(`Template initialization skipped: ${templatePath}`);
    }
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
   * すべてのテンプレートファイルを初期化
   * 既存のテンプレートファイルがある場合は上書きしない
   */
  async initializeAllTemplates(): Promise<void> {
    await this.getTaskTemplate();
    await this.getProjectTemplate();
    await this.getReviewTemplate();
    console.log('All template files initialized');
  }

  /**
   * テンプレートファイルをデフォルトにリセット
   * 既存のファイルを上書きする
   */
  async resetTaskTemplate(): Promise<void> {
    const templatePath = `${this.settings.taskFolder}/${TEMPLATE_FILENAMES.TASK}`;
    await this.resetTemplate(templatePath, DEFAULT_TASK_TEMPLATE);
  }

  async resetProjectTemplate(): Promise<void> {
    const templatePath = `${this.settings.projectFolder}/${TEMPLATE_FILENAMES.PROJECT}`;
    await this.resetTemplate(templatePath, DEFAULT_PROJECT_TEMPLATE);
  }

  async resetReviewTemplate(): Promise<void> {
    const templatePath = `${this.settings.reviewFolder}/${TEMPLATE_FILENAMES.REVIEW}`;
    const defaultTemplate = this.settings.language === 'ja'
      ? DEFAULT_REVIEW_TEMPLATE_JA
      : DEFAULT_REVIEW_TEMPLATE_EN;
    await this.resetTemplate(templatePath, defaultTemplate);
  }

  /**
   * テンプレートをリセット（共通処理）
   */
  private async resetTemplate(templatePath: string, defaultContent: string): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(templatePath);

      if (file instanceof TFile) {
        // 既存ファイルを上書き
        await this.app.vault.modify(file, defaultContent);
      } else {
        // 新規作成
        await this.createTemplateFile(templatePath, defaultContent);
      }

      console.log(`Reset template: ${templatePath}`);
    } catch (error) {
      console.error(`Failed to reset template: ${templatePath}`, error);
    }
  }
}
