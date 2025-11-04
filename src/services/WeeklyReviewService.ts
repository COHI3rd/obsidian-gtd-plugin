import { App, TFile, TFolder } from 'obsidian';
import { WeeklyReview } from '../models/WeeklyReview';
import { WeeklyReviewFrontmatter } from '../types';
import * as yaml from 'js-yaml';

/**
 * 週次レビューサービス
 * レビューファイルのCRUD操作を提供
 */
export class WeeklyReviewService {
  private app: App;
  private reviewFolder: string;

  constructor(app: App, reviewFolder: string) {
    this.app = app;
    this.reviewFolder = reviewFolder;
  }

  /**
   * 設定を更新
   */
  updateSettings(reviewFolder: string): void {
    this.reviewFolder = reviewFolder;
  }

  /**
   * レビューフォルダを取得または作成
   */
  private async ensureReviewFolder(): Promise<TFolder> {
    const folder = this.app.vault.getAbstractFileByPath(this.reviewFolder);
    if (folder instanceof TFolder) {
      return folder;
    }
    return await this.app.vault.createFolder(this.reviewFolder);
  }

  /**
   * 週次レビューファイルを作成
   */
  async createWeeklyReview(
    date: Date,
    options: {
      completedTasksCount?: number;
      activeProjectsCount?: number;
      notes?: string;
      reflections?: string;
      learnings?: string;
      nextWeekGoals?: string;
    } = {}
  ): Promise<WeeklyReview> {
    await this.ensureReviewFolder();

    // ファイル名: YYYY-MM-DD-weekly-review.md
    const dateStr = this.formatDate(date);
    const fileName = `${dateStr}-weekly-review.md`;
    const filePath = `${this.reviewFolder}/${fileName}`;

    // 既存ファイルチェック
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      throw new Error(`Review file already exists: ${filePath}`);
    }

    // レビューオブジェクトを作成
    const review = new WeeklyReview({
      id: `review-${Date.now()}`,
      date,
      filePath,
      completedTasksCount: options.completedTasksCount || 0,
      activeProjectsCount: options.activeProjectsCount || 0,
      notes: options.notes || '',
      reflections: options.reflections || '',
      learnings: options.learnings || '',
      nextWeekGoals: options.nextWeekGoals || '',
    });

    // Markdownコンテンツを生成
    const content = this.generateReviewContent(review);

    // ファイルを作成
    await this.app.vault.create(filePath, content);

    return review;
  }

  /**
   * レビューコンテンツを生成
   */
  private generateReviewContent(review: WeeklyReview): string {
    const frontmatter: WeeklyReviewFrontmatter = {
      type: 'weekly-review',
      date: this.formatDate(review.date),
      'review-type': 'weekly',
    };

    const frontmatterStr = yaml.dump(frontmatter, { lineWidth: -1 });

    return `---
${frontmatterStr.trim()}
---

# ${review.getTitle()}

**期間**: ${review.getWeekRange()}

## 📊 今週の成果

- **完了タスク**: ${review.completedTasksCount}件
- **進行中プロジェクト**: ${review.activeProjectsCount}件

## 💭 振り返り

${review.reflections || '_今週の振り返りを記入してください_'}

## 📚 学んだこと

${review.learnings || '_今週学んだことを記入してください_'}

## 🎯 来週の目標

${review.nextWeekGoals || '_来週の目標を記入してください_'}

## 📝 その他メモ

${review.notes || '_その他のメモがあれば記入してください_'}
`;
  }

  /**
   * すべてのレビューを取得
   */
  async getAllReviews(): Promise<WeeklyReview[]> {
    const folder = this.app.vault.getAbstractFileByPath(this.reviewFolder);
    if (!(folder instanceof TFolder)) {
      return [];
    }

    const reviews: WeeklyReview[] = [];

    for (const file of folder.children) {
      if (file instanceof TFile && file.extension === 'md') {
        try {
          const review = await this.parseReviewFile(file);
          if (review) {
            reviews.push(review);
          }
        } catch (error) {
          console.error(`Failed to parse review file: ${file.path}`, error);
        }
      }
    }

    // 日付順にソート（新しい順）
    reviews.sort((a, b) => b.date.getTime() - a.date.getTime());

    return reviews;
  }

  /**
   * 指定日付のレビューを取得
   */
  async getReviewByDate(date: Date): Promise<WeeklyReview | null> {
    const dateStr = this.formatDate(date);
    const fileName = `${dateStr}-weekly-review.md`;
    const filePath = `${this.reviewFolder}/${fileName}`;

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
      return null;
    }

    return await this.parseReviewFile(file);
  }

  /**
   * レビューファイルをパース
   */
  private async parseReviewFile(file: TFile): Promise<WeeklyReview | null> {
    const content = await this.app.vault.read(file);

    // フロントマターを抽出
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = yaml.load(frontmatterMatch[1]) as WeeklyReviewFrontmatter;
    if (frontmatter.type !== 'weekly-review') {
      return null;
    }

    // 本文を抽出
    const body = content.substring(frontmatterMatch[0].length).trim();

    // 日付をパース
    const date = frontmatter.date ? new Date(frontmatter.date) : new Date();

    // セクションを抽出
    const reflections = this.extractSection(body, '## 💭 振り返り', '##');
    const learnings = this.extractSection(body, '## 📚 学んだこと', '##');
    const nextWeekGoals = this.extractSection(body, '## 🎯 来週の目標', '##');
    const notes = this.extractSection(body, '## 📝 その他メモ', '##');

    // 統計情報を抽出
    const completedMatch = body.match(/完了タスク[：:]\s*(\d+)/);
    const projectsMatch = body.match(/進行中プロジェクト[：:]\s*(\d+)/);

    return new WeeklyReview({
      id: `review-${date.getTime()}`,
      date,
      filePath: file.path,
      completedTasksCount: completedMatch ? parseInt(completedMatch[1]) : 0,
      activeProjectsCount: projectsMatch ? parseInt(projectsMatch[1]) : 0,
      reflections: reflections.trim(),
      learnings: learnings.trim(),
      nextWeekGoals: nextWeekGoals.trim(),
      notes: notes.trim(),
    });
  }

  /**
   * Markdownからセクションを抽出
   */
  private extractSection(content: string, startMarker: string, endMarker: string): string {
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return '';

    const contentAfterStart = content.substring(startIndex + startMarker.length);
    const endIndex = contentAfterStart.indexOf(endMarker);

    if (endIndex === -1) {
      return contentAfterStart.trim();
    }

    return contentAfterStart.substring(0, endIndex).trim();
  }

  /**
   * レビューを更新
   */
  async updateReview(review: WeeklyReview): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(review.filePath);
    if (!(file instanceof TFile)) {
      throw new Error(`Review file not found: ${review.filePath}`);
    }

    const content = this.generateReviewContent(review);
    await this.app.vault.modify(file, content);
  }

  /**
   * レビューを削除
   */
  async deleteReview(id: string): Promise<void> {
    const reviews = await this.getAllReviews();
    const review = reviews.find(r => r.id === id);
    if (!review) {
      throw new Error(`Review not found: ${id}`);
    }

    const file = this.app.vault.getAbstractFileByPath(review.filePath);
    if (file instanceof TFile) {
      await this.app.vault.delete(file);
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
   * 今週のレビューが存在するかチェック
   */
  async hasReviewForCurrentWeek(): Promise<boolean> {
    const today = new Date();
    const review = await this.getReviewByDate(today);
    return review !== null;
  }
}
