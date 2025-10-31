import React, { useState, useEffect } from 'react';
import { Task, Project, TaskStatus, GTDSettings } from '../types';
import { TaskCard } from '../components/TaskCard';
import { ProjectCard } from '../components/ProjectCard';
import { ViewSwitcher, ViewType } from '../components/ViewSwitcher';
import { TaskService } from '../services/TaskService';
import { ProjectService } from '../services/ProjectService';
import { FileService } from '../services/FileService';

interface WeeklyReviewViewProps {
  taskService: TaskService;
  projectService: ProjectService;
  fileService: FileService;
  settings: GTDSettings;
  onRefresh?: () => void;
  onViewChange?: (view: ViewType) => void;
  onMounted?: (refreshFn: () => void) => void;
}

/**
 * 週次レビュービューコンポーネント
 * GTDの週次レビュープロセスをサポート
 * - いつかやる/多分やるリストの表示と整理
 * - 進行中プロジェクトの一覧表示
 * - 待機中タスクのレビュー
 */
export const WeeklyReviewView: React.FC<WeeklyReviewViewProps> = ({
  taskService,
  projectService,
  fileService,
  settings,
  onRefresh,
  onViewChange,
  onMounted
}) => {
  const [somedayTasks, setSomedayTasks] = useState<Task[]>([]);
  const [waitingTasks, setWaitingTasks] = useState<Task[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [completedThisWeek, setCompletedThisWeek] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<'someday' | 'waiting' | 'projects' | 'completed'>('completed');

  // データを読み込み
  const loadData = async () => {
    try {
      setLoading(true);

      // タスクを読み込み
      const allTasks = await taskService.getAllTasks();

      // いつかやる/多分やるタスク（未完了のみ）
      const someday = allTasks.filter(t => t.status === 'someday' && !t.completed);
      setSomedayTasks(someday);

      // 連絡待ちタスク（未完了のみ）
      const waiting = allTasks.filter(t => t.status === 'waiting' && !t.completed);
      setWaitingTasks(waiting);

      // 進行中のプロジェクトを読み込み
      const allProjects = await projectService.getAllProjects();
      const active = allProjects.filter(p => p.status === 'in-progress');
      setActiveProjects(active);

      // 今週完了したタスクを抽出
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const completed = allTasks.filter(t => {
        if (!t.completed) return false;
        // 完了日が今週以内（dateフィールドを完了日として使用）
        if (t.date && t.date >= oneWeekAgo && t.date <= now) {
          return true;
        }
        return false;
      });
      setCompletedThisWeek(completed);
    } catch (error) {
      console.error('Failed to load weekly review data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // 親コンポーネントにリフレッシュ関数を渡す
    onMounted?.(loadData);
  }, []);

  // タスクステータスを変更（次に取るべき行動に移動）
  const moveToNextAction = async (task: Task) => {
    try {
      task.changeStatus('next-action');
      await taskService.updateTask(task);
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to move task to next-action:', error);
    }
  };

  // タスクを削除（アーカイブ）
  const archiveTask = async (task: Task) => {
    try {
      await taskService.deleteTask(task.id);
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to archive task:', error);
    }
  };

  // タスクをTodayに移動
  const moveToToday = async (task: Task) => {
    try {
      task.changeStatus('today');
      task.setDate(new Date());
      await taskService.updateTask(task);
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to move task to today:', error);
    }
  };

  // タスクをInboxに戻す
  const moveToInbox = async (task: Task) => {
    try {
      task.changeStatus('inbox');
      await taskService.updateTask(task);
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to move task to inbox:', error);
    }
  };

  if (loading) {
    return (
      <div className="gtd-weekly-review">
        <div className="gtd-weekly-review__loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="gtd-weekly-review">
      <div className="gtd-weekly-review__header">
        <ViewSwitcher
          currentView="weekly-review"
          onViewChange={(view) => {
            if (onViewChange) {
              onViewChange(view);
            }
          }}
        />
        <p className="gtd-weekly-review__subtitle">
          各リストを見直し、次の一週間の準備をしましょう
        </p>
      </div>

      {/* セクション選択タブ */}
      <div className="gtd-weekly-review__tabs">
        <button
          className={`gtd-tab ${selectedSection === 'completed' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('completed')}
        >
          ✅ 今週完了 ({completedThisWeek.length})
        </button>
        <button
          className={`gtd-tab ${selectedSection === 'someday' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('someday')}
        >
          🌟 いつかやる/多分やる ({somedayTasks.length})
        </button>
        <button
          className={`gtd-tab ${selectedSection === 'waiting' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('waiting')}
        >
          ⏳ 連絡待ち ({waitingTasks.length})
        </button>
        <button
          className={`gtd-tab ${selectedSection === 'projects' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('projects')}
        >
          🎯 進行中プロジェクト ({activeProjects.length})
        </button>
      </div>

      {/* 今週完了したタスクセクション */}
      {selectedSection === 'completed' && (
        <div className="gtd-weekly-review__section">
          <div className="gtd-weekly-review__section-header">
            <h3>✅ 今週完了したタスク</h3>
            <p className="gtd-weekly-review__hint">
              今週完了したタスクを振り返りましょう
            </p>
          </div>

          {completedThisWeek.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>今週完了したタスクはありません</p>
            </div>
          ) : (
            <div className="gtd-weekly-review__tasks">
              {completedThisWeek.map(task => (
                <div key={task.id} className="gtd-weekly-review__task-item">
                  <TaskCard
                    task={task}
                    onToggleComplete={async () => {
                      // 完了タスクの再トグルは不要
                    }}
                    onOpenTask={async () => {
                      const file = fileService.getApp().vault.getAbstractFileByPath(task.filePath);
                      if (file) {
                        await fileService.getApp().workspace.getLeaf(false).openFile(file as any);
                      }
                    }}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* いつかやる/多分やるセクション */}
      {selectedSection === 'someday' && (
        <div className="gtd-weekly-review__section">
          <div className="gtd-weekly-review__section-header">
            <h3>🌟 いつかやる/多分やる</h3>
            <p className="gtd-weekly-review__hint">
              これらのタスクを見直し、今週実行するものがあれば「次に取るべき行動」に移動しましょう
            </p>
          </div>

          {somedayTasks.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>🎉 いつかやる/多分やるリストは空です</p>
            </div>
          ) : (
            <div className="gtd-weekly-review__tasks">
              {somedayTasks.map(task => (
                <div key={task.id} className="gtd-weekly-review__task-item">
                  <TaskCard
                    task={task}
                    onToggleComplete={async () => {
                      task.completed ? task.uncomplete() : task.complete();
                      await taskService.updateTask(task);
                      await loadData();
                      onRefresh?.();
                    }}
                    onDelete={() => archiveTask(task)}
                    showProject={true}
                  />
                  <div className="gtd-weekly-review__task-actions">
                    <button
                      className="gtd-button gtd-button--small gtd-button--primary"
                      onClick={() => moveToNextAction(task)}
                      title="次に取るべき行動に移動"
                    >
                      ➡️ Next Action
                    </button>
                    <button
                      className="gtd-button gtd-button--small"
                      onClick={() => moveToToday(task)}
                      title="Todayに移動"
                    >
                      📅 Today
                    </button>
                    <button
                      className="gtd-button gtd-button--small gtd-button--danger"
                      onClick={() => archiveTask(task)}
                      title="アーカイブ（削除）"
                    >
                      🗑️ Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 連絡待ちセクション */}
      {selectedSection === 'waiting' && (
        <div className="gtd-weekly-review__section">
          <div className="gtd-weekly-review__section-header">
            <h3>⏳ 連絡待ち</h3>
            <p className="gtd-weekly-review__hint">
              返答があったタスクは「次に取るべき行動」に移動し、不要になったものはアーカイブしましょう
            </p>
          </div>

          {waitingTasks.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>🎉 連絡待ちリストは空です</p>
            </div>
          ) : (
            <div className="gtd-weekly-review__tasks">
              {waitingTasks.map(task => (
                <div key={task.id} className="gtd-weekly-review__task-item">
                  <TaskCard
                    task={task}
                    onToggleComplete={async () => {
                      task.completed ? task.uncomplete() : task.complete();
                      await taskService.updateTask(task);
                      await loadData();
                      onRefresh?.();
                    }}
                    onDelete={() => archiveTask(task)}
                    showProject={true}
                  />
                  <div className="gtd-weekly-review__task-actions">
                    <button
                      className="gtd-button gtd-button--small gtd-button--primary"
                      onClick={() => moveToNextAction(task)}
                      title="次に取るべき行動に移動"
                    >
                      ➡️ Next Action
                    </button>
                    <button
                      className="gtd-button gtd-button--small"
                      onClick={() => moveToInbox(task)}
                      title="Inboxに戻す"
                    >
                      📥 Inbox
                    </button>
                    <button
                      className="gtd-button gtd-button--small gtd-button--danger"
                      onClick={() => archiveTask(task)}
                      title="アーカイブ（削除）"
                    >
                      🗑️ Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 進行中プロジェクトセクション */}
      {selectedSection === 'projects' && (
        <div className="gtd-weekly-review__section">
          <div className="gtd-weekly-review__section-header">
            <h3>🎯 進行中プロジェクト</h3>
            <p className="gtd-weekly-review__hint">
              各プロジェクトの進捗を確認し、次に取るべきアクションを明確にしましょう
            </p>
          </div>

          {activeProjects.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>📝 進行中のプロジェクトはありません</p>
            </div>
          ) : (
            <div className="gtd-weekly-review__projects">
              {activeProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={async () => {
                    // プロジェクトファイルを開く
                    const file = fileService.getApp().vault.getAbstractFileByPath(project.filePath);
                    if (file) {
                      await fileService.getApp().workspace.getLeaf(false).openFile(file as any);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 週次レビューのヒント */}
      <div className="gtd-weekly-review__tips">
        <h4>💡 週次レビューのポイント</h4>
        <ul>
          <li>すべての「いつかやる/多分やる」リストを見直し、今週実行すべきものを「次に取るべき行動」に移動</li>
          <li>「連絡待ち」リストを確認し、返答があったものは行動に移す</li>
          <li>進行中のプロジェクトを見直し、次のアクションが明確か確認</li>
          <li>Inboxが空になっていることを確認</li>
          <li>来週の目標を設定し、Todayリストを準備</li>
        </ul>
      </div>
    </div>
  );
};
