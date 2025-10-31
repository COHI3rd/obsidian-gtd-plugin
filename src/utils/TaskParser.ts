import matter from 'gray-matter';
import { Task, TaskFrontmatter } from '../types';
import { TaskModel } from '../models/Task';

/**
 * タスクファイルのフロントマター解析・書き込みクラス
 *
 * gray-matterを使用してMarkdownファイルのYAMLフロントマターを処理
 */
export class TaskParser {
  /**
   * Markdownファイルの内容をパースしてTaskオブジェクトに変換
   *
   * @param content - ファイルの内容（フロントマター + 本文）
   * @param filePath - ファイルパス
   * @returns Taskオブジェクト
   */
  static parse(content: string, filePath: string): Task {
    try {
      const { data, content: body } = matter(content);
      const fm = data as TaskFrontmatter;

      return new TaskModel({
        id: this.extractFileId(filePath),
        title: fm.title || '無題のタスク',
        status: fm.status || 'inbox',
        project: fm.project || null,
        date: fm.date ? this.parseDate(fm.date) : null,
        completed: fm.completed || false,
        priority: fm.priority || 'medium',
        tags: fm.tags || [],
        notes: fm.notes || '',
        body: body.trim(),
        filePath,
        order: fm.order ?? 0,
      });
    } catch (error) {
      console.error('Failed to parse task file:', filePath, error);
      // パースエラー時はデフォルトタスクを返す
      return new TaskModel({
        id: this.extractFileId(filePath),
        title: '読み込みエラー',
        filePath,
      });
    }
  }

  /**
   * TaskオブジェクトをMarkdownファイル形式に変換
   *
   * @param task - Taskオブジェクト
   * @returns Markdownファイルの内容
   */
  static stringify(task: Task): string {
    const frontmatter: TaskFrontmatter = {
      title: task.title,
      status: task.status,
      project: task.project,
      date: task.date ? this.formatDate(task.date) : undefined,
      completed: task.completed,
      priority: task.priority,
      tags: task.tags.length > 0 ? task.tags : undefined,
      notes: task.notes || undefined,
      order: task.order ?? undefined,
    };

    // undefinedのプロパティを除去
    const cleanedFrontmatter = Object.fromEntries(
      Object.entries(frontmatter).filter(([_, v]) => v !== undefined)
    );

    return matter.stringify(task.body, cleanedFrontmatter);
  }

  /**
   * 日付文字列またはDateオブジェクトをDateオブジェクトに変換
   */
  private static parseDate(date: string | Date): Date {
    if (date instanceof Date) {
      return date;
    }
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  /**
   * DateオブジェクトをYYYY-MM-DD形式の文字列に変換
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * ファイルパスからファイルIDを抽出
   */
  private static extractFileId(filePath: string): string {
    return filePath.replace(/\\/g, '/').split('/').pop()?.replace('.md', '') || '';
  }

  /**
   * タスクのバリデーション
   */
  static validate(task: Task): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.title || task.title.trim() === '') {
      errors.push('タスクタイトルが空です');
    }

    if (!['inbox', 'next-action', 'today', 'waiting', 'someday'].includes(task.status)) {
      errors.push(`無効なステータス: ${task.status}`);
    }

    if (!['low', 'medium', 'high'].includes(task.priority)) {
      errors.push(`無効な優先度: ${task.priority}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
