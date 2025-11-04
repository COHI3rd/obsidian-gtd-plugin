import { App, PluginSettingTab, Setting } from 'obsidian';
import type GTDPlugin from './main';
import { GTDSettings } from './types';
import { getText } from './i18n';

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
  language: 'ja',
  weekStartDay: 'monday',
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

    const t = getText(this.plugin.settings.language);

    containerEl.createEl('h2', { text: t.settingsTitle });

    // 言語設定
    new Setting(containerEl)
      .setName(t.language)
      .setDesc(t.languageDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            ja: '日本語 (Japanese)',
            en: 'English',
          })
          .setValue(this.plugin.settings.language)
          .onChange(async (value: any) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            // すべてのビューを再レンダリング（言語変更を反映）
            this.plugin.rerenderAllViews();
            // 設定画面を再描画
            this.display();
          })
      );

    // 週の開始曜日
    new Setting(containerEl)
      .setName(t.weekStartDay)
      .setDesc(t.weekStartDayDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            monday: t.weekStartDayMonday,
            sunday: t.weekStartDaySunday,
          })
          .setValue(this.plugin.settings.weekStartDay)
          .onChange(async (value: any) => {
            this.plugin.settings.weekStartDay = value;
            await this.plugin.saveSettings();
          })
      );

    // タスクフォルダ
    new Setting(containerEl)
      .setName(t.taskFolder)
      .setDesc(t.taskFolderDesc)
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
      .setName(t.projectFolder)
      .setDesc(t.projectFolderDesc)
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
      .setName(t.reviewFolder)
      .setDesc(t.reviewFolderDesc)
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
      .setName(t.dateFormat)
      .setDesc(t.dateFormatDesc)
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
      .setName(t.enableAutoDate)
      .setDesc(t.enableAutoDateDesc)
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
      .setName(t.defaultPriority)
      .setDesc(t.defaultPriorityDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            low: t.priorityLow,
            medium: t.priorityMedium,
            high: t.priorityHigh,
          })
          .setValue(this.plugin.settings.defaultPriority)
          .onChange(async (value: any) => {
            this.plugin.settings.defaultPriority = value;
            await this.plugin.saveSettings();
          })
      );

    // タスク並び替えモード
    new Setting(containerEl)
      .setName(t.taskSortMode)
      .setDesc(t.taskSortModeDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            manual: t.taskSortModeManual,
            auto: t.taskSortModeAuto,
          })
          .setValue(this.plugin.settings.taskSortMode)
          .onChange(async (value: any) => {
            this.plugin.settings.taskSortMode = value;
            await this.plugin.saveSettings();
          })
      );

    // デイリーノート連携
    containerEl.createEl('h3', { text: t.dailyNoteIntegration });

    new Setting(containerEl)
      .setName(t.dailyNoteMode)
      .setDesc(t.dailyNoteModeDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            none: t.dailyNoteModeNone,
            'auto-write': t.dailyNoteModeAutoWrite,
            dataview: t.dailyNoteModeDataview,
            command: t.dailyNoteModeCommand,
          })
          .setValue(this.plugin.settings.dailyNoteMode)
          .onChange(async (value: any) => {
            this.plugin.settings.dailyNoteMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t.dailyNoteFolder)
      .setDesc(t.dailyNoteFolderDesc)
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
      .setName(t.dailyNoteDateFormat)
      .setDesc(t.dailyNoteDateFormatDesc)
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
    containerEl.createEl('h3', { text: t.usage });
    containerEl.createEl('p', {
      text: t.usageStep1,
    });
    containerEl.createEl('p', {
      text: t.usageStep2,
    });
    containerEl.createEl('p', {
      text: t.usageStep3,
    });
    containerEl.createEl('p', {
      text: t.usageStep4,
    });
  }
}
