import { App, TFile, Notice } from 'obsidian';
import { format } from 'date-fns';
import { Task, GTDSettings } from '../types';

/**
 * デイリーノートサービス
 * 完了タスクをデイリーノートに連携する
 */
export class DailyNoteService {
  constructor(
    private app: App,
    private settings: GTDSettings
  ) {}

  /**
   * 日付フォーマットを変換（YYYY → yyyy, DD → dd）
   * ユーザーが YYYY-MM-DD と入力しても date-fns v2 の yyyy-MM-dd に変換
   */
  private convertDateFormat(userFormat: string): string {
    return userFormat
      .replace(/YYYY/g, 'yyyy')
      .replace(/DD/g, 'dd')
      .replace(/D/g, 'd')
      .replace(/M/g, 'M'); // M はそのまま（MM も M も date-fns で有効）
  }

  /**
   * 今日のデイリーノートファイルを取得または作成
   */
  private async getTodayDailyNote(): Promise<TFile | null> {
    const today = new Date();
    const dateFormat = this.convertDateFormat(this.settings.dailyNoteDateFormat);
    const dateStr = format(today, dateFormat);

    // ファイル名を生成
    const fileName = `${dateStr}.md`;
    const folderPath = this.settings.dailyNoteFolder || '';
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // 既存ファイルを探す
    let file = this.app.vault.getAbstractFileByPath(filePath);

    if (file && file instanceof TFile) {
      return file;
    }

    // ファイルが存在しない場合は作成
    try {
      // フォルダが存在しない場合は作成
      if (folderPath) {
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
          await this.app.vault.createFolder(folderPath);
        }
      }

      // デイリーノートを作成
      const newFile = await this.app.vault.create(filePath, `# ${dateStr}\n\n`);
      return newFile;
    } catch (error) {
      console.error('Failed to create daily note:', error);
      return null;
    }
  }

  /**
   * 完了タスクをデイリーノートに自動書き込み
   */
  async writeCompletedTaskToDailyNote(task: Task): Promise<void> {
    if (this.settings.dailyNoteMode !== 'auto-write') {
      return;
    }

    const dailyNote = await this.getTodayDailyNote();
    if (!dailyNote) {
      new Notice('デイリーノートの取得に失敗しました');
      return;
    }

    try {
      // 既存の内容を読み込み
      let content = await this.app.vault.read(dailyNote);

      // 完了タスクセクションを探す
      const sectionTitle = '## 📋 完了したタスク';

      if (!content.includes(sectionTitle)) {
        // セクションが存在しない場合は追加
        content += `\n${sectionTitle}\n\n`;
      }

      // タスクを追加
      const taskLine = `- [x] ${task.title}${task.project ? ` - ${task.project}` : ''}${task.priority !== 'medium' ? ` (優先度: ${this.getPriorityLabel(task.priority)})` : ''}\n`;

      // セクションの最後に追加
      const sectionIndex = content.indexOf(sectionTitle);
      const nextSectionIndex = content.indexOf('\n##', sectionIndex + sectionTitle.length);

      if (nextSectionIndex === -1) {
        // 次のセクションがない場合は末尾に追加
        content = content.trimEnd() + '\n' + taskLine;
      } else {
        // 次のセクションの前に追加
        content = content.slice(0, nextSectionIndex) + taskLine + content.slice(nextSectionIndex);
      }

      await this.app.vault.modify(dailyNote, content);
      new Notice('デイリーノートに完了タスクを追加しました');
    } catch (error) {
      console.error('Failed to write to daily note:', error);
      new Notice('デイリーノートへの書き込みに失敗しました');
    }
  }

  /**
   * 今日完了したタスクをコマンドで挿入
   */
  async insertCompletedTasksCommand(completedTasks: Task[]): Promise<void> {
    console.log('insertCompletedTasksCommand called with tasks:', completedTasks);

    if (completedTasks.length === 0) {
      new Notice('今日完了したタスクはありません');
      return;
    }

    const dailyNote = await this.getTodayDailyNote();
    if (!dailyNote) {
      new Notice('デイリーノートの取得に失敗しました');
      return;
    }

    try {
      let content = await this.app.vault.read(dailyNote);

      // 完了タスクセクションを作成
      const sectionTitle = '## 📋 今日完了したタスク';

      if (!content.includes(sectionTitle)) {
        content += `\n${sectionTitle}\n\n`;
      }

      // タスクリストを生成（既にフィルタされているのでそのまま使用）
      const taskLines = completedTasks
        .map(task => `- [x] ${task.title}${task.project ? ` - ${task.project}` : ''}${task.priority !== 'medium' ? ` (優先度: ${this.getPriorityLabel(task.priority)})` : ''}`)
        .join('\n');

      // セクションの内容を置き換え
      const sectionIndex = content.indexOf(sectionTitle);
      const nextSectionIndex = content.indexOf('\n##', sectionIndex + sectionTitle.length);

      if (nextSectionIndex === -1) {
        content = content.slice(0, sectionIndex + sectionTitle.length) + '\n\n' + taskLines + '\n';
      } else {
        content = content.slice(0, sectionIndex + sectionTitle.length) + '\n\n' + taskLines + '\n' + content.slice(nextSectionIndex);
      }

      await this.app.vault.modify(dailyNote, content);
      new Notice(`${completedTasks.length}件の完了タスクをデイリーノートに挿入しました`);
    } catch (error) {
      console.error('Failed to insert tasks to daily note:', error);
      new Notice('デイリーノートへの挿入に失敗しました');
    }
  }

  /**
   * 優先度ラベルを取得
   */
  private getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[priority] || priority;
  }
}
