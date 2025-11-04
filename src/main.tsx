import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { GTDSettings } from './types';
import { DEFAULT_SETTINGS, GTDSettingTab } from './settings';
import { FileService } from './services/FileService';
import { TaskService } from './services/TaskService';
import { ProjectService } from './services/ProjectService';
import { DailyNoteService } from './services/DailyNoteService';
import { WeeklyReviewService } from './services/WeeklyReviewService';
import { GTDMainView } from './views/GTDMainView';
import { WeeklyReviewView } from './views/WeeklyReviewView';
import { ProjectView } from './views/ProjectView';

const VIEW_TYPE_GTD = 'gtd-main-view';
const VIEW_TYPE_WEEKLY_REVIEW = 'gtd-weekly-review';
const VIEW_TYPE_PROJECT = 'gtd-project-view';

/**
 * GTDビュー - Obsidianのビューとして登録
 */
class GTDView extends ItemView {
  private root: ReactDOM.Root | null = null;
  private taskService: TaskService;
  private projectService: ProjectService;
  private fileService: FileService;
  private dailyNoteService: DailyNoteService;
  private weeklyReviewService: WeeklyReviewService;
  public refreshCallback: (() => void) | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: GTDPlugin
  ) {
    super(leaf);
    this.fileService = new FileService(this.app, plugin.settings);
    this.taskService = new TaskService(this.fileService);
    this.projectService = new ProjectService(this.app, plugin.settings);
    this.dailyNoteService = new DailyNoteService(this.app, plugin.settings);
    this.weeklyReviewService = new WeeklyReviewService(this.app, plugin.settings.reviewFolder, plugin.settings.weekStartDay, plugin.settings.language);
    this.taskService.setDailyNoteService(this.dailyNoteService);
    this.taskService.setProjectService(this.projectService);
  }

  /**
   * リフレッシュコールバックを設定
   */
  setRefreshCallback(callback: () => void): void {
    this.refreshCallback = callback;
  }

  /**
   * ビューを再レンダリング（言語変更時などに使用）
   */
  rerender(): void {
    if (this.root) {
      const container = this.containerEl.children[1];

      // デイリーノート挿入ハンドラ
      const handleInsertToDailyNote = async () => {
        const allTasks = await this.taskService.getAllTasks();
        const todayCompletedTasks = allTasks.filter(task => task.isToday() && task.completed);
        await this.dailyNoteService.insertCompletedTasksCommand(todayCompletedTasks);
      };

      // ビュー切り替えハンドラ
      const handleViewChange = async (view: string) => {
        if (view === 'weekly-review') {
          await this.plugin.activateWeeklyReviewView();
        } else if (view === 'project') {
          await this.plugin.activateProjectView();
        }
      };

      // 再レンダリング
      this.root.render(
        <React.StrictMode>
          <GTDMainView
            taskService={this.taskService}
            projectService={this.projectService}
            fileService={this.fileService}
            settings={this.plugin.settings}
            onMounted={(refreshFn) => this.setRefreshCallback(refreshFn)}
            onInsertToDailyNote={handleInsertToDailyNote}
            onViewChange={handleViewChange}
            onTaskUpdated={() => this.plugin.refreshAllViews()}
          />
        </React.StrictMode>
      );
    }
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
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();

    // デイリーノート挿入ハンドラ
    const handleInsertToDailyNote = async () => {
      const allTasks = await this.taskService.getAllTasks();
      const todayCompletedTasks = allTasks.filter(task => task.isToday() && task.completed);
      await this.dailyNoteService.insertCompletedTasksCommand(todayCompletedTasks);
    };

    // ビュー切り替えハンドラ
    const handleViewChange = async (view: string) => {
      if (view === 'weekly-review') {
        await this.plugin.activateWeeklyReviewView();
      } else if (view === 'project') {
        await this.plugin.activateProjectView();
      }
      // 'main' の場合は何もしない（既に表示中）
    };

    // Reactアプリをマウント
    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <React.StrictMode>
        <GTDMainView
          taskService={this.taskService}
          projectService={this.projectService}
          fileService={this.fileService}
          settings={this.plugin.settings}
          onMounted={(refreshFn) => this.setRefreshCallback(refreshFn)}
          onInsertToDailyNote={handleInsertToDailyNote}
          onViewChange={handleViewChange}
          onTaskUpdated={() => this.plugin.refreshAllViews()}
        />
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
 * 週次レビュービュー - Obsidianのビューとして登録
 */
class WeeklyReviewViewLeaf extends ItemView {
  private root: ReactDOM.Root | null = null;
  private taskService: TaskService;
  private projectService: ProjectService;
  private fileService: FileService;
  private weeklyReviewService: WeeklyReviewService;
  public refreshFn: (() => void) | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: GTDPlugin
  ) {
    super(leaf);
    this.fileService = new FileService(this.app, plugin.settings);
    this.taskService = new TaskService(this.fileService);
    this.projectService = new ProjectService(this.app, plugin.settings);
    this.weeklyReviewService = new WeeklyReviewService(this.app, plugin.settings.reviewFolder, plugin.settings.weekStartDay, plugin.settings.language);
    this.taskService.setProjectService(this.projectService);
  }

  /**
   * ビューを再レンダリング（言語変更時などに使用）
   */
  rerender(): void {
    if (this.root) {
      const handleViewChange = async (view: string) => {
        if (view === 'main') {
          await this.plugin.activateView();
        } else if (view === 'project') {
          await this.plugin.activateProjectView();
        }
      };

      this.root.render(
        <React.StrictMode>
          <WeeklyReviewView
            taskService={this.taskService}
            projectService={this.projectService}
            fileService={this.fileService}
            weeklyReviewService={this.weeklyReviewService}
            settings={this.plugin.settings}
            onRefresh={() => {
              this.plugin.refreshActiveView();
            }}
            onViewChange={handleViewChange}
            onMounted={(refreshFn) => {
              this.refreshFn = refreshFn;
            }}
            onTaskUpdated={() => this.plugin.refreshAllViews()}
          />
        </React.StrictMode>
      );
    }
  }

  getViewType(): string {
    return VIEW_TYPE_WEEKLY_REVIEW;
  }

  getDisplayText(): string {
    return '週次レビュー';
  }

  getIcon(): string {
    return 'calendar-check';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    // ビュー切り替えハンドラ
    const handleViewChange = async (view: string) => {
      if (view === 'main') {
        await this.plugin.activateView();
      } else if (view === 'project') {
        await this.plugin.activateProjectView();
      }
      // 'weekly-review' の場合は何もしない（既に表示中）
    };

    // Reactアプリをマウント
    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <React.StrictMode>
        <WeeklyReviewView
          taskService={this.taskService}
          projectService={this.projectService}
          fileService={this.fileService}
          weeklyReviewService={this.weeklyReviewService}
          settings={this.plugin.settings}
          onRefresh={() => {
            // GTDビューをリフレッシュ
            this.plugin.refreshActiveView();
          }}
          onViewChange={handleViewChange}
          onMounted={(refreshFn) => {
            this.refreshFn = refreshFn;
          }}
          onTaskUpdated={() => this.plugin.refreshAllViews()}
        />
      </React.StrictMode>
    );

    // ビューが表示される度に最新の状態に更新
    if (this.refreshFn) {
      this.refreshFn();
    }
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
 * プロジェクトビュー - Obsidianのビューとして登録
 */
class ProjectViewLeaf extends ItemView {
  private root: ReactDOM.Root | null = null;
  private taskService: TaskService;
  private projectService: ProjectService;
  private fileService: FileService;
  public refreshFn: (() => void) | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: GTDPlugin
  ) {
    super(leaf);
    this.fileService = new FileService(this.app, plugin.settings);
    this.taskService = new TaskService(this.fileService);
    this.projectService = new ProjectService(this.app, plugin.settings);
    this.taskService.setProjectService(this.projectService);
  }

  /**
   * ビューを再レンダリング（言語変更時などに使用）
   */
  rerender(): void {
    if (this.root) {
      const handleViewChange = async (view: string) => {
        if (view === 'main') {
          await this.plugin.activateView();
        } else if (view === 'weekly-review') {
          await this.plugin.activateWeeklyReviewView();
        }
      };

      this.root.render(
        <React.StrictMode>
          <ProjectView
            projectService={this.projectService}
            taskService={this.taskService}
            fileService={this.fileService}
            settings={this.plugin.settings}
            onViewChange={handleViewChange}
            onMounted={(refreshFn) => {
              this.refreshFn = refreshFn;
            }}
            onTaskUpdated={() => this.plugin.refreshAllViews()}
          />
        </React.StrictMode>
      );
    }
  }

  getViewType(): string {
    return VIEW_TYPE_PROJECT;
  }

  getDisplayText(): string {
    return 'プロジェクト';
  }

  getIcon(): string {
    return 'folder-kanban';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    // ビュー切り替えハンドラ
    const handleViewChange = async (view: string) => {
      if (view === 'main') {
        await this.plugin.activateView();
      } else if (view === 'weekly-review') {
        await this.plugin.activateWeeklyReviewView();
      }
      // 'project' の場合は何もしない（既に表示中）
    };

    // Reactアプリをマウント
    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <React.StrictMode>
        <ProjectView
          projectService={this.projectService}
          taskService={this.taskService}
          fileService={this.fileService}
          settings={this.plugin.settings}
          onViewChange={handleViewChange}
          onMounted={(refreshFn) => {
            this.refreshFn = refreshFn;
          }}
          onTaskUpdated={() => this.plugin.refreshAllViews()}
        />
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
  private dailyNoteService: DailyNoteService | null = null;
  private midnightCheckInterval: number | null = null;
  private lastCheckedDate: string = new Date().toDateString();

  async onload(): Promise<void> {
    console.log('Loading GTD Plugin');

    // 設定を読み込み
    await this.loadSettings();

    // サービスを初期化
    const fileService = new FileService(this.app, this.settings);
    this.taskService = new TaskService(fileService);
    const projectService = new ProjectService(this.app, this.settings);
    this.dailyNoteService = new DailyNoteService(this.app, this.settings);
    this.taskService.setDailyNoteService(this.dailyNoteService);
    this.taskService.setProjectService(projectService);

    // ビューを登録
    this.registerView(VIEW_TYPE_GTD, (leaf) => new GTDView(leaf, this));
    this.registerView(VIEW_TYPE_WEEKLY_REVIEW, (leaf) => new WeeklyReviewViewLeaf(leaf, this));
    this.registerView(VIEW_TYPE_PROJECT, (leaf) => new ProjectViewLeaf(leaf, this));

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

    // コマンド: 今日の完了タスクをデイリーノートに挿入
    this.addCommand({
      id: 'gtd-insert-completed-tasks',
      name: '今日の完了タスクをデイリーノートに挿入',
      callback: async () => {
        if (!this.taskService || !this.dailyNoteService) {
          return;
        }

        const allTasks = await this.taskService.getAllTasks();
        const todayCompletedTasks = allTasks.filter(task => task.isToday() && task.completed);

        await this.dailyNoteService.insertCompletedTasksCommand(todayCompletedTasks);
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

    // コマンド: 週次レビューを開く
    this.addCommand({
      id: 'gtd-open-weekly-review',
      name: '週次レビューを開く',
      callback: () => {
        this.activateWeeklyReviewView();
      },
    });

    // コマンド: プロジェクト一覧を開く
    this.addCommand({
      id: 'gtd-open-project-view',
      name: 'プロジェクト一覧を開く',
      callback: () => {
        this.activateProjectView();
      },
    });

    // 設定タブを追加
    this.addSettingTab(new GTDSettingTab(this.app, this));

    // コマンド: ビューを手動更新
    this.addCommand({
      id: 'gtd-refresh-views',
      name: 'すべてのビューを更新',
      callback: () => {
        console.log('[GTDPlugin] Manual refresh triggered');
        this.refreshAllViews();
      },
    });

    // 日付変更の自動検知を開始（1分ごとにチェック）
    this.startMidnightCheck();

    // ファイル変更イベントを監視
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        // タスクフォルダ内のファイルが変更された場合、ビューをリフレッシュ
        if (file.path.startsWith(this.settings.taskFolder)) {
          this.refreshActiveView();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        // タスクフォルダ内のファイルが削除された場合、ビューをリフレッシュ
        if (file.path.startsWith(this.settings.taskFolder)) {
          this.refreshActiveView();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        // タスクフォルダ内のファイルが移動/リネームされた場合、ビューをリフレッシュ
        if (file.path.startsWith(this.settings.taskFolder) || oldPath.startsWith(this.settings.taskFolder)) {
          this.refreshActiveView();
        }
      })
    );

    // ワークスペースが完全に読み込まれた後、GTDビューを開く
    this.app.workspace.onLayoutReady(() => {
      this.activateView();
    });

    console.log('GTD Plugin loaded successfully');
  }

  /**
   * アクティブなGTDビューをリフレッシュ
   */
  refreshActiveView(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GTD);
    leaves.forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof GTDView && view.refreshCallback) {
        view.refreshCallback();
      }
    });
  }

  /**
   * すべてのビューをリフレッシュ（タスク状態同期用）
   */
  refreshAllViews(): void {
    console.log('[GTDPlugin] Refreshing all views');

    // GTDメインビューをリフレッシュ
    const gtdLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GTD);
    gtdLeaves.forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof GTDView && view.refreshCallback) {
        console.log('[GTDPlugin] Refreshing GTD main view');
        view.refreshCallback();
      }
    });

    // 週次レビュービューをリフレッシュ
    const weeklyLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WEEKLY_REVIEW);
    weeklyLeaves.forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof WeeklyReviewViewLeaf && view.refreshFn) {
        console.log('[GTDPlugin] Refreshing weekly review view');
        view.refreshFn();
      }
    });

    // プロジェクトビューをリフレッシュ
    const projectLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT);
    projectLeaves.forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof ProjectViewLeaf && view.refreshFn) {
        console.log('[GTDPlugin] Refreshing project view');
        view.refreshFn();
      }
    });
  }

  async onunload(): Promise<void> {
    // 日付変更チェックを停止
    this.stopMidnightCheck();

    // Obsidianが自動的にビューをクリーンアップするため、
    // 手動でdetachLeavesOfTypeを呼ぶ必要はない
  }

  /**
   * 日付変更の自動検知を開始
   * 1分ごとに日付をチェックし、日付が変わっていたら全ビューをリフレッシュ
   */
  startMidnightCheck(): void {
    console.log('[GTDPlugin] Starting midnight check (checking every 60 seconds)');

    this.midnightCheckInterval = window.setInterval(() => {
      const currentDate = new Date().toDateString();

      if (currentDate !== this.lastCheckedDate) {
        console.log(`[GTDPlugin] Date changed from ${this.lastCheckedDate} to ${currentDate}`);
        console.log('[GTDPlugin] Refreshing all views due to date change');

        this.lastCheckedDate = currentDate;
        this.refreshAllViews();
      }
    }, 60000); // 60秒 = 1分ごと
  }

  /**
   * 日付変更チェックを停止
   */
  stopMidnightCheck(): void {
    if (this.midnightCheckInterval !== null) {
      console.log('[GTDPlugin] Stopping midnight check');
      window.clearInterval(this.midnightCheckInterval);
      this.midnightCheckInterval = null;
    }
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
   * 週次レビュービューをアクティブ化
   */
  async activateWeeklyReviewView(): Promise<void> {
    const { workspace } = this.app;

    // 既存のビューを探す
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_WEEKLY_REVIEW)[0];

    if (!leaf) {
      // 新しいビューを右側に作成
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({
          type: VIEW_TYPE_WEEKLY_REVIEW,
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
   * プロジェクトビューをアクティブ化
   */
  async activateProjectView(): Promise<void> {
    const { workspace } = this.app;

    // 既存のビューを探す
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_PROJECT)[0];

    if (!leaf) {
      // 新しいビューを右側に作成
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({
          type: VIEW_TYPE_PROJECT,
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
   * すべてのビューを再レンダリング（言語変更時などに使用）
   */
  rerenderAllViews(): void {
    console.log('[GTDPlugin] Re-rendering all views');

    // GTDメインビューを再レンダリング
    const gtdLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GTD);
    gtdLeaves.forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof GTDView) {
        console.log('[GTDPlugin] Re-rendering GTD main view');
        view.rerender();
      }
    });

    // 週次レビュービューを再レンダリング
    const weeklyLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WEEKLY_REVIEW);
    weeklyLeaves.forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof WeeklyReviewViewLeaf) {
        console.log('[GTDPlugin] Re-rendering weekly review view');
        view.rerender();
      }
    });

    // プロジェクトビューを再レンダリング
    const projectLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT);
    projectLeaves.forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof ProjectViewLeaf) {
        console.log('[GTDPlugin] Re-rendering project view');
        view.rerender();
      }
    });
  }

  /**
   * 設定を保存
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
