import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { GTDSettings } from './types';
import { DEFAULT_SETTINGS, GTDSettingTab } from './settings';
import { FileService } from './services/FileService';
import { TaskService } from './services/TaskService';
import { GTDMainView } from './views/GTDMainView';

const VIEW_TYPE_GTD = 'gtd-main-view';

/**
 * GTDビュー - Obsidianのビューとして登録
 */
class GTDView extends ItemView {
  private root: ReactDOM.Root | null = null;
  private taskService: TaskService;
  private fileService: FileService;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: GTDPlugin
  ) {
    super(leaf);
    this.fileService = new FileService(this.app, plugin.settings);
    this.taskService = new TaskService(this.fileService);
  }

  getViewType(): string {
    return VIEW_TYPE_GTD;
  }

  getDisplayText(): string {
    return 'GTD タスク管理';
  }

  getIcon(): string {
    return 'checkbox-glyph';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    // Reactアプリをマウント
    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <React.StrictMode>
        <GTDMainView taskService={this.taskService} fileService={this.fileService} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    // Reactアプリをアンマウント
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

/**
 * GTDプラグイン - メインエントリーポイント
 */
export default class GTDPlugin extends Plugin {
  settings!: GTDSettings;
  private taskService: TaskService | null = null;

  async onload(): Promise<void> {
    console.log('Loading GTD Plugin');

    // 設定を読み込み
    await this.loadSettings();

    // サービスを初期化
    const fileService = new FileService(this.app, this.settings);
    this.taskService = new TaskService(fileService);

    // ビューを登録
    this.registerView(VIEW_TYPE_GTD, (leaf) => new GTDView(leaf, this));

    // リボンアイコン
    this.addRibbonIcon('checkbox-glyph', 'GTDビューを開く', () => {
      this.activateView();
    });

    // コマンド: GTDビューを開く
    this.addCommand({
      id: 'gtd-open-main-view',
      name: 'GTDビューを開く',
      callback: () => {
        this.activateView();
      },
    });

    // コマンド: タスクを素早く追加
    this.addCommand({
      id: 'gtd-quick-add',
      name: 'タスクを素早く追加',
      callback: () => {
        // QuickAddModalを開く処理（後で実装）
        console.log('Quick add task');
      },
    });

    // コマンド: 今日のタスクを表示
    this.addCommand({
      id: 'gtd-show-today',
      name: '今日のタスクを表示',
      callback: async () => {
        if (this.taskService) {
          const todayTasks = await this.taskService.getTodayTasks();
          console.log('Today tasks:', todayTasks);
        }
      },
    });

    // 設定タブを追加
    this.addSettingTab(new GTDSettingTab(this.app, this));

    console.log('GTD Plugin loaded successfully');
  }

  async onunload(): Promise<void> {
    console.log('Unloading GTD Plugin');

    // ビューをクリーンアップ
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GTD);
  }

  /**
   * GTDビューをアクティブ化
   */
  async activateView(): Promise<void> {
    const { workspace } = this.app;

    // 既存のビューを探す
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_GTD)[0];

    if (!leaf) {
      // 新しいビューを右側に作成
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({
          type: VIEW_TYPE_GTD,
          active: true,
        });
      }
    }

    // ビューを表示
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  /**
   * 設定を読み込み
   */
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * 設定を保存
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
