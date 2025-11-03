import React, { useState, useEffect } from 'react';
import { Task, Project, TaskStatus, GTDSettings } from '../types';
import { TaskCard } from '../components/TaskCard';
import { ProjectCard } from '../components/ProjectCard';
import { ViewSwitcher, ViewType } from '../components/ViewSwitcher';
import { TaskService } from '../services/TaskService';
import { ProjectService } from '../services/ProjectService';
import { FileService } from '../services/FileService';
import { getText } from '../i18n';

interface WeeklyReviewViewProps {
  taskService: TaskService;
  projectService: ProjectService;
  fileService: FileService;
  settings: GTDSettings;
  onRefresh?: () => void;
  onViewChange?: (view: ViewType) => void;
  onMounted?: (refreshFn: () => void) => void;
  onTaskUpdated?: () => void;
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
  onMounted,
  onTaskUpdated
}) => {
  const t = getText(settings.language);
  const [somedayTasks, setSomedayTasks] = useState<Task[]>([]);
  const [waitingTasks, setWaitingTasks] = useState<Task[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [completedThisWeek, setCompletedThisWeek] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<'someday' | 'waiting' | 'projects' | 'completed'>('completed');

  // データを読み込み
  const loadData = async () => {
    try {
      setLoading(true);

      // タスクを読み込み
      const tasks = await taskService.getAllTasks();
      setAllTasks(tasks);

      // いつかやる/多分やるタスク（未完了のみ）
      const someday = tasks.filter(t => t.status === 'someday' && !t.completed);
      setSomedayTasks(someday);

      // 連絡待ちタスク（未完了のみ）
      const waiting = tasks.filter(t => t.status === 'waiting' && !t.completed);
      setWaitingTasks(waiting);

      // 進行中のプロジェクトを読み込み
      const allProjects = await projectService.getAllProjects();
      const active = allProjects.filter(p => p.status === 'in-progress');
      setActiveProjects(active);

      // 今週完了したタスクを抽出
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const completed = tasks.filter(t => {
        if (!t.completed) return false;
        // 完了日が今週以内（dateフィールドを完了日として使用）
        if (t.date && t.date >= oneWeekAgo && t.date <= now) {
          return true;
        }
        return false;
      });

      // 完了日付順にソート（古い順）
      completed.sort((a, b) => {
        // ファイルパスから完了日付を抽出
        const dateMatchA = a.filePath.match(/完了[/\\](\d{4}-\d{2}-\d{2})/);
        const dateMatchB = b.filePath.match(/完了[/\\](\d{4}-\d{2}-\d{2})/);
        const dateA = dateMatchA ? new Date(dateMatchA[1]) : new Date(0);
        const dateB = dateMatchB ? new Date(dateMatchB[1]) : new Date(0);
        return dateA.getTime() - dateB.getTime(); // 昇順（古い順）
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

  // タスクの完了状態を切り替え
  const handleTaskToggleComplete = async (task: Task) => {
    try {
      console.log('[WeeklyReview] Toggling task:', task.id, task.title, 'current completed:', task.completed);
      task.completed ? task.uncomplete() : task.complete();
      console.log('[WeeklyReview] New completed state:', task.completed);
      await taskService.updateTask(task);
      console.log('[WeeklyReview] Task updated, reloading...');
      await loadData();
      onRefresh?.();
      console.log('[WeeklyReview] Data reloaded');

      // 他のビューも更新
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error('[WeeklyReview] Failed to toggle task completion:', error);
    }
  };

  if (loading) {
    return (
      <div className="gtd-weekly-review">
        <div className="gtd-weekly-review__loading">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="gtd-weekly-review">
      <div className="gtd-weekly-review__header">
        <div className="gtd-weekly-review__header-top">
          <ViewSwitcher
            currentView="weekly-review"
            onViewChange={(view) => {
              if (onViewChange) {
                onViewChange(view);
              }
            }}
            settings={settings}
          />
          <button
            className="gtd-button gtd-button--icon"
            onClick={loadData}
            title={t.refresh}
          >
            🔄
          </button>
        </div>
        <p className="gtd-weekly-review__subtitle">
          {t.weeklyReviewSubtitle}
        </p>
      </div>

      {/* セクション選択タブ */}
      <div className="gtd-weekly-review__tabs">
        <button
          className={`gtd-tab ${selectedSection === 'completed' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('completed')}
        >
          {t.completedThisWeekTab} ({completedThisWeek.length})
        </button>
        <button
          className={`gtd-tab ${selectedSection === 'someday' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('someday')}
        >
          {t.somedayTab} ({somedayTasks.length})
        </button>
        <button
          className={`gtd-tab ${selectedSection === 'waiting' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('waiting')}
        >
          {t.waitingTab} ({waitingTasks.length})
        </button>
        <button
          className={`gtd-tab ${selectedSection === 'projects' ? 'gtd-tab--active' : ''}`}
          onClick={() => setSelectedSection('projects')}
        >
          {t.activeProjectsTab} ({activeProjects.length})
        </button>
      </div>

      {/* 今週完了したタスクセクション */}
      {selectedSection === 'completed' && (
        <div className="gtd-weekly-review__section">
          <div className="gtd-weekly-review__section-header">
            <h3>{t.completedThisWeekTitle}</h3>
            <p className="gtd-weekly-review__hint">
              {t.completedThisWeekHint}
            </p>
          </div>

          {completedThisWeek.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>{t.emptyCompleted}</p>
            </div>
          ) : (
            <div className="gtd-weekly-review__tasks">
              {completedThisWeek.map(task => {
                // 完了日付を取得（ファイルパスから抽出）
                const completedDateMatch = task.filePath.match(/完了[/\\](\d{4}-\d{2}-\d{2})/);
                const completedDate = completedDateMatch ? completedDateMatch[1] : '';

                return (
                  <div
                    key={task.id}
                    className="gtd-weekly-review__completed-task"
                    onClick={async () => {
                      const file = fileService.getApp().vault.getAbstractFileByPath(task.filePath);
                      if (file) {
                        await fileService.getApp().workspace.getLeaf(false).openFile(file as any);
                      }
                    }}
                  >
                    <div className="gtd-weekly-review__completed-task-checkbox">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="gtd-weekly-review__completed-task-content">
                      <span className="gtd-weekly-review__completed-task-title">{task.title}</span>
                      <div className="gtd-weekly-review__completed-task-meta">
                        <span className="gtd-weekly-review__completed-date">✓ {completedDate}</span>
                        {task.project && (
                          <span className="gtd-weekly-review__completed-project">🎯 {task.project}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* いつかやる/多分やるセクション */}
      {selectedSection === 'someday' && (
        <div className="gtd-weekly-review__section">
          <div className="gtd-weekly-review__section-header">
            <h3>{t.somedayTitle}</h3>
            <p className="gtd-weekly-review__hint">
              {t.somedayHint}
            </p>
          </div>

          {somedayTasks.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>{t.emptySomeday}</p>
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
                      title={t.moveToNextAction}
                    >
                      {t.moveToNextAction}
                    </button>
                    <button
                      className="gtd-button gtd-button--small"
                      onClick={() => moveToToday(task)}
                      title={t.moveToToday}
                    >
                      {t.moveToToday}
                    </button>
                    <button
                      className="gtd-button gtd-button--small gtd-button--danger"
                      onClick={() => archiveTask(task)}
                      title={t.archive}
                    >
                      {t.archive}
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
            <h3>{t.waitingTitle}</h3>
            <p className="gtd-weekly-review__hint">
              {t.waitingHint}
            </p>
          </div>

          {waitingTasks.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>{t.emptyWaiting}</p>
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
                      title={t.moveToNextAction}
                    >
                      {t.moveToNextAction}
                    </button>
                    <button
                      className="gtd-button gtd-button--small"
                      onClick={() => moveToInbox(task)}
                      title={t.moveToInbox}
                    >
                      {t.moveToInbox}
                    </button>
                    <button
                      className="gtd-button gtd-button--small gtd-button--danger"
                      onClick={() => archiveTask(task)}
                      title={t.archive}
                    >
                      {t.archive}
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
            <h3>{t.activeProjectsTitle}</h3>
            <p className="gtd-weekly-review__hint">
              {t.activeProjectsHint}
            </p>
          </div>

          {activeProjects.length === 0 ? (
            <div className="gtd-weekly-review__empty">
              <p>{t.emptyActiveProjects}</p>
            </div>
          ) : (
            <div className="gtd-weekly-review__projects">
              {activeProjects.map(project => {
                // このプロジェクトに関連するタスク
                const relatedTasks = allTasks.filter(t => {
                  const projectLink = `[[${project.title}]]`;
                  return t.project === projectLink;
                });

                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    tasks={relatedTasks}
                    onClick={async () => {
                      // プロジェクトファイルを開く
                      const file = fileService.getApp().vault.getAbstractFileByPath(project.filePath);
                      if (file) {
                        await fileService.getApp().workspace.getLeaf(false).openFile(file as any);
                      }
                    }}
                    onTaskClick={(task) => fileService.openFile(task.filePath)}
                    onTaskToggleComplete={handleTaskToggleComplete}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 週次レビューのヒント */}
      <div className="gtd-weekly-review__tips">
        <h4>{t.reviewTips}</h4>
        <ul>
          <li>{t.reviewTip1}</li>
          <li>{t.reviewTip2}</li>
          <li>{t.reviewTip3}</li>
          <li>{t.reviewTip4}</li>
          <li>{t.reviewTip5}</li>
        </ul>
      </div>
    </div>
  );
};
