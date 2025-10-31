import { App, PluginSettingTab, Setting } from 'obsidian';
import type GTDPlugin from './main';
import { GTDSettings } from './types';

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: GTDSettings = {
  taskFolder: 'GTD/Tasks',
  projectFolder: 'GTD/Projects',
  reviewFolder: 'GTD/Reviews',
  dateFormat: 'yyyy-MM-dd',
  enableAutoDate: true,
  defaultPriority: 'medium',
  taskSortMode: 'manual',
  dailyNoteMode: 'command',
  dailyNoteFolder: '',
  dailyNoteDateFormat: 'YYYY-MM-DD',
};

/**
 * 設定タブ
 */
export class GTDSettingTab extends PluginSettingTab {
  plugin: GTDPlugin;

  constructor(app: App, plugin: GTDPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'GTD プラグイン設定' });

    // タスクフォルダ
    new Setting(containerEl)
      .setName('タスクフォルダ')
      .setDesc('タスクファイルを保存するフォルダパス')
      .addText((text) =>
        text
          .setPlaceholder('GTD/Tasks')
          .setValue(this.plugin.settings.taskFolder)
          .onChange(async (value) => {
            this.plugin.settings.taskFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // プロジェクトフォルダ
    new Setting(containerEl)
      .setName('プロジェクトフォルダ')
      .setDesc('プロジェクトファイルを保存するフォルダパス')
      .addText((text) =>
        text
          .setPlaceholder('GTD/Projects')
          .setValue(this.plugin.settings.projectFolder)
          .onChange(async (value) => {
            this.plugin.settings.projectFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // レビューフォルダ
    new Setting(containerEl)
      .setName('週次レビューフォルダ')
      .setDesc('週次レビューファイルを保存するフォルダパス')
      .addText((text) =>
        text
          .setPlaceholder('GTD/Reviews')
          .setValue(this.plugin.settings.reviewFolder)
          .onChange(async (value) => {
            this.plugin.settings.reviewFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // 日付フォーマット
    new Setting(containerEl)
      .setName('日付フォーマット')
      .setDesc('日付の表示形式（date-fns形式）')
      .addText((text) =>
        text
          .setPlaceholder('yyyy-MM-dd')
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          })
      );

    // 自動日付入力
    new Setting(containerEl)
      .setName('自動日付入力')
      .setDesc('Todayにドラッグした際に自動で今日の日付を設定')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAutoDate)
          .onChange(async (value) => {
            this.plugin.settings.enableAutoDate = value;
            await this.plugin.saveSettings();
          })
      );

    // デフォルト優先度
    new Setting(containerEl)
      .setName('デフォルト優先度')
      .setDesc('新規タスクのデフォルト優先度')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            low: '低',
            medium: '中',
            high: '高',
          })
          .setValue(this.plugin.settings.defaultPriority)
          .onChange(async (value: any) => {
            this.plugin.settings.defaultPriority = value;
            await this.plugin.saveSettings();
          })
      );

    // タスク並び替えモード
    new Setting(containerEl)
      .setName('タスク並び替えモード')
      .setDesc('タスクの表示順序を手動で並び替えるか、自動でソートするか')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            manual: '手動並び替え（ドラッグで順序変更）',
            auto: '自動並び替え（優先度・日付順）',
          })
          .setValue(this.plugin.settings.taskSortMode)
          .onChange(async (value: any) => {
            this.plugin.settings.taskSortMode = value;
            await this.plugin.saveSettings();
          })
      );

    // デイリーノート連携
    containerEl.createEl('h3', { text: 'デイリーノート連携' });

    new Setting(containerEl)
      .setName('連携モード')
      .setDesc('完了タスクをデイリーノートに反映する方法を選択')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            none: 'なし（連携しない）',
            'auto-write': '自動書き込み（完了時にデイリーノートに追記）',
            dataview: 'Dataview参照（推奨）',
            command: 'コマンド実行（手動で挿入）',
          })
          .setValue(this.plugin.settings.dailyNoteMode)
          .onChange(async (value: any) => {
            this.plugin.settings.dailyNoteMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('デイリーノートフォルダ')
      .setDesc('デイリーノートが保存されているフォルダ（空欄の場合はVaultルート）')
      .addText((text) =>
        text
          .setPlaceholder('Daily Notes')
          .setValue(this.plugin.settings.dailyNoteFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('デイリーノート日付フォーマット')
      .setDesc('デイリーノートのファイル名に使用される日付フォーマット（例: YYYY-MM-DD, YYYY年MM月DD日）※YYYY/yyyyどちらも対応')
      .addText((text) =>
        text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.plugin.settings.dailyNoteDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteDateFormat = value;
            await this.plugin.saveSettings();
          })
      );

    // 使い方
    containerEl.createEl('h3', { text: '使い方' });
    containerEl.createEl('p', {
      text: '1. コマンドパレット（Ctrl/Cmd + P）から「GTDビューを開く」を実行',
    });
    containerEl.createEl('p', {
      text: '2. Inboxに思いついたタスクを追加',
    });
    containerEl.createEl('p', {
      text: '3. タスクをドラッグ&ドロップで「次に取るべき行動」または「Today」に移動',
    });
    containerEl.createEl('p', {
      text: '4. Todayのタスクを実行してチェックボックスをオン',
    });
  }
}
