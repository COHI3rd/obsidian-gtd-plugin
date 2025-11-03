import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, TaskPriority, GTDSettings, Project } from '../types';
import { TaskCard } from '../components/TaskCard';
import { QuickAddModal } from '../components/QuickAddModal';
import { ViewSwitcher, ViewType } from '../components/ViewSwitcher';
import { TaskService } from '../services/TaskService';
import { ProjectService } from '../services/ProjectService';
import { FileService } from '../services/FileService';
import { TaskModel } from '../models/Task';
import { getText } from '../i18n';

interface GTDMainViewProps {
  taskService: TaskService;
  projectService: ProjectService;
  fileService: FileService;
  settings: GTDSettings;
  onMounted?: (refreshFn: () => void) => void;
  onInsertToDailyNote?: () => void;
  onViewChange?: (view: ViewType) => void;
  onTaskUpdated?: () => void;
}

/**
 * GTDメインビューコンポーネント
 * 2カラムレイアウトでInbox/Today/次に取るべき行動を表示
 */
export const GTDMainView: React.FC<GTDMainViewProps> = ({ taskService, projectService, fileService, settings, onMounted, onInsertToDailyNote, onViewChange, onTaskUpdated }) => {
  const t = getText(settings.language);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    today: false,
    inbox: false,
    'next-action': false,
    waiting: false,
    someday: false,
  });
  const [splitRatio, setSplitRatio] = useState<number>(50); // パーセンテージ
  const [isResizing, setIsResizing] = useState(false);

  // タスク一覧を読み込み
  const loadTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await taskService.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // プロジェクト一覧を読み込み
  const loadProjects = async () => {
    try {
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadProjects();

    // リフレッシュ関数を親コンポーネントに渡す
    if (onMounted) {
      onMounted(loadTasks);
    }

    // ビューの幅をログ出力（デバッグ用）
    const logViewWidth = () => {
      const viewElement = document.querySelector('.gtd-main-view');
      if (viewElement) {
        console.log('GTD View Width:', viewElement.clientWidth, 'px');
      }
    };

    logViewWidth();
    window.addEventListener('resize', logViewWidth);

    return () => {
      window.removeEventListener('resize', logViewWidth);
    };
  }, []);

  // タスクをソート
  const sortTasks = (taskList: Task[]): Task[] => {
    // 完了タスクと未完了タスクに分ける
    const completedTasks = taskList.filter(t => t.completed);
    const incompleteTasks = taskList.filter(t => !t.completed);

    if (settings.taskSortMode === 'manual') {
      // 手動並び替えモード: order順にソート
      incompleteTasks.sort((a, b) => a.order - b.order);
      completedTasks.sort((a, b) => a.order - b.order);
    } else {
      // 自動並び替えモード: 優先度→日付順
      const sortByPriorityAndDate = (a: Task, b: Task) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];

        if (aPriority !== bPriority) return aPriority - bPriority;

        if (a.date && b.date) return a.date.getTime() - b.date.getTime();
        if (a.date) return -1;
        if (b.date) return 1;
        return 0;
      };

      incompleteTasks.sort(sortByPriorityAndDate);
      completedTasks.sort(sortByPriorityAndDate);
    }

    // 未完了タスクを上に、完了タスクを下に配置
    return [...incompleteTasks, ...completedTasks];
  };

  // タスクをステータスでフィルタ（useMemoでメモ化）
  const getTasksByStatus = useCallback((status: TaskStatus, excludeCompleted = true): Task[] => {
    const filtered = tasks.filter(
      (task) => task.status === status && (!excludeCompleted || !task.completed)
    );
    return sortTasks(filtered);
  }, [tasks, settings.taskSortMode]);

  // 今日のタスクを取得（完了済みも含める）- useMemoでメモ化
  const todayTasks = useMemo(() => {
    const todayTasks = tasks.filter((task) => task.isToday());
    return sortTasks(todayTasks);
  }, [tasks, settings.taskSortMode]);

  // 各ステータスのタスクをメモ化
  const inboxTasks = useMemo(() => getTasksByStatus('inbox'), [tasks, settings.taskSortMode]);
  const nextActionTasks = useMemo(() => getTasksByStatus('next-action'), [tasks, settings.taskSortMode]);
  const waitingTasks = useMemo(() => getTasksByStatus('waiting'), [tasks, settings.taskSortMode]);
  const somedayTasks = useMemo(() => getTasksByStatus('someday'), [tasks, settings.taskSortMode]);

  // タスク読み込み後に空のグループを閉じる
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      setCollapsedGroups({
        today: todayTasks.length === 0,
        inbox: inboxTasks.length === 0,
        'next-action': nextActionTasks.length === 0,
        waiting: waitingTasks.length === 0,
        someday: somedayTasks.length === 0,
      });
    }
  }, [loading, todayTasks, inboxTasks, nextActionTasks, waitingTasks, somedayTasks]);

  // グループの開閉をトグル
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // ドラッグ&ドロップ処理（完全な楽観的更新）
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    try {
      // 同じグループ内での並び替え
      if (source.droppableId === destination.droppableId) {
        if (source.index === destination.index) return;

        // 手動並び替えモードの場合のみorder更新
        if (settings.taskSortMode === 'manual') {
          await updateTaskOrder(source.droppableId, source.index, destination.index);
        }
        return;
      }

      // 異なるグループへの移動
      // 移動先に応じてタスクのステータスと日付を更新
      if (destination.droppableId === 'trash') {
        // UIから即座に削除
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
        // バックグラウンドでゴミ箱に移動（awaitしない）
        taskService.moveTaskToTrash(task.id).catch(error => {
          console.error('Failed to move task to trash:', error);
          loadTasks(); // エラー時のみ再読み込み
        });
      } else if (destination.droppableId === 'today') {
        // 状態を即座に更新
        setTasks(prevTasks => prevTasks.map(t =>
          t.id === task.id ? new TaskModel({ ...t, status: 'today' as TaskStatus, date: new Date() }) : t
        ));
        // バックグラウンドで保存
        taskService.moveTaskToToday(task.id).catch(error => {
          console.error('Failed to move task to today:', error);
          loadTasks();
        });
      } else if (destination.droppableId === 'next-action') {
        setTasks(prevTasks => prevTasks.map(t =>
          t.id === task.id ? new TaskModel({ ...t, status: 'next-action' as TaskStatus }) : t
        ));
        taskService.changeTaskStatus(task.id, 'next-action').catch(error => {
          console.error('Failed to change task status:', error);
          loadTasks();
        });
      } else if (destination.droppableId === 'inbox') {
        setTasks(prevTasks => prevTasks.map(t =>
          t.id === task.id ? new TaskModel({ ...t, status: 'inbox' as TaskStatus }) : t
        ));
        taskService.changeTaskStatus(task.id, 'inbox').catch(error => {
          console.error('Failed to change task status:', error);
          loadTasks();
        });
      } else if (destination.droppableId === 'waiting') {
        setTasks(prevTasks => prevTasks.map(t =>
          t.id === task.id ? new TaskModel({ ...t, status: 'waiting' as TaskStatus }) : t
        ));
        taskService.changeTaskStatus(task.id, 'waiting').catch(error => {
          console.error('Failed to change task status:', error);
          loadTasks();
        });
      } else if (destination.droppableId === 'someday') {
        setTasks(prevTasks => prevTasks.map(t =>
          t.id === task.id ? new TaskModel({ ...t, status: 'someday' as TaskStatus }) : t
        ));
        taskService.changeTaskStatus(task.id, 'someday').catch(error => {
          console.error('Failed to change task status:', error);
          loadTasks();
        });
      }
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  // タスクの順序を更新（並列実行でちらつき防止）
  const updateTaskOrder = async (droppableId: string, sourceIndex: number, destinationIndex: number) => {
    // 対象グループのタスクを取得（メモ化された値を使用）
    let groupTasks: Task[] = [];
    if (droppableId === 'today') {
      groupTasks = [...todayTasks];
    } else if (droppableId === 'inbox') {
      groupTasks = [...inboxTasks, ...tasks.filter(t => t.status === 'inbox' && t.completed)];
    } else if (droppableId === 'next-action') {
      groupTasks = [...nextActionTasks, ...tasks.filter(t => t.status === 'next-action' && t.completed)];
    } else if (droppableId === 'waiting') {
      groupTasks = [...waitingTasks, ...tasks.filter(t => t.status === 'waiting' && t.completed)];
    } else if (droppableId === 'someday') {
      groupTasks = [...somedayTasks, ...tasks.filter(t => t.status === 'someday' && t.completed)];
    }

    // 並び替え
    const [movedTask] = groupTasks.splice(sourceIndex, 1);
    groupTasks.splice(destinationIndex, 0, movedTask);

    // 状態を先に更新（即座にUIに反映）
    const updatedTaskIds = new Set<string>();
    const updatedGroupTasks = groupTasks.map((t, i) => {
      updatedTaskIds.add(t.id);
      return new TaskModel({ ...t, order: i });
    });

    setTasks(prevTasks => prevTasks.map(t => {
      if (updatedTaskIds.has(t.id)) {
        const updatedTask = updatedGroupTasks.find(gt => gt.id === t.id);
        return updatedTask ? updatedTask : t;
      }
      return t;
    }));

    // バックグラウンドで並列保存（awaitせず、すべて並列実行）
    Promise.all(
      updatedGroupTasks.map(taskModel => fileService.updateTask(taskModel))
    ).catch(error => {
      console.error('Failed to update task order:', error);
      loadTasks(); // エラー時のみ再読み込み
    });
  };

  // タスク完了トグル（完全な楽観的更新）
  const handleToggleComplete = async (taskId: string) => {
    console.log('[GTDMainView] Toggling task completion:', taskId);

    // 即座にUIを更新（楽観的更新）
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        const updatedTask = new TaskModel({ ...t, completed: !t.completed });
        return updatedTask;
      }
      return t;
    }));

    // バックグラウンドでファイル更新（awaitしない）
    taskService.toggleTaskComplete(taskId)
      .then(() => {
        console.log('[GTDMainView] Task completion toggled');
        // 楽観的更新を使用しているため、他のビューへの通知は不要
        // （ちらつき防止のため onTaskUpdated() を呼ばない）
      })
      .catch(error => {
        console.error('[GTDMainView] Failed to toggle task:', error);
        // エラー時は再読み込みして正しい状態に戻す
        loadTasks();
      });
  };

  // タスクのステータスを変更（右クリックメニュー用・完全な楽観的更新）
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    console.log('[GTDMainView] Changing task status:', taskId, 'to', newStatus);

    // 即座にUIを更新（楽観的更新）
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        const updatedTask = new TaskModel({ ...t, status: newStatus });
        return updatedTask;
      }
      return t;
    }));

    // バックグラウンドでファイル更新（awaitしない）
    taskService.changeTaskStatus(taskId, newStatus)
      .then(() => {
        console.log('[GTDMainView] Task status changed');
        // 楽観的更新を使用しているため、他のビューへの通知は不要
      })
      .catch(error => {
        console.error('[GTDMainView] Failed to change task status:', error);
        loadTasks();
      });
  };

  // タスクファイルを開く
  const handleOpenTask = async (task: Task) => {
    try {
      await fileService.openFile(task.filePath);
    } catch (error) {
      console.error('Failed to open task file:', error);
    }
  };

  // リサイズハンドラー
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const container = document.querySelector('.gtd-main-view__content');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = (y / rect.height) * 100;

    // 20%〜80%の範囲に制限
    const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
    setSplitRatio(clampedPercentage);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // クイック追加
  const handleQuickAdd = async (title: string, status: TaskStatus, priority: TaskPriority, project?: string) => {
    try {
      await taskService.createTask({ title, status, priority, project });
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  if (loading) {
    return <div className="gtd-loading">{t.loading}</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="gtd-main-view">
        {/* ヘッダー */}
        <div className="gtd-main-view__header">
          <div className="gtd-main-view__header-top">
            <ViewSwitcher
              currentView="main"
              settings={settings}
              onViewChange={(view) => {
                if (onViewChange) {
                  onViewChange(view);
                }
              }}
            />
            <button
              className="gtd-button gtd-button--icon"
              onClick={() => {
                loadTasks();
                loadProjects();
              }}
              title={t.refresh}
            >
              🔄
            </button>
          </div>
          <div className="gtd-main-view__header-buttons">
            <button className="gtd-button gtd-button--primary" onClick={() => {
              loadProjects(); // プロジェクトリストを最新化
              setIsModalOpen(true);
            }}>
              {t.addTask}
            </button>
            {onInsertToDailyNote && (
              <button
                className="gtd-button gtd-button--secondary"
                onClick={onInsertToDailyNote}
                title={t.insertToDailyNote}
              >
                {t.insertToDailyNote}
              </button>
            )}
          </div>
        </div>

        {/* 2カラムレイアウト */}
        <div className="gtd-main-view__content">
          {/* 左側: Today */}
          <div className="gtd-main-view__left" style={{ height: `${splitRatio}%` }}>
            <div className="gtd-section">
              <Droppable droppableId="today">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-section-wrapper ${collapsedGroups.today ? 'gtd-section-wrapper--collapsed' : ''}`}
                  >
                    <h3
                      className={`gtd-section__title ${snapshot.isDraggingOver && collapsedGroups.today ? 'gtd-section__title--dragging-over' : ''}`}
                      onClick={() => toggleGroup('today')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{collapsedGroups.today ? '▶' : '▼'}</span> {t.today} <span className="gtd-section__count">{todayTasks.length}</span>
                    </h3>
                    {!collapsedGroups.today && (
                      <div className={`gtd-droppable ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}>
                        {todayTasks.length === 0 ? (
                          <div className="gtd-empty-state">
                            <p>{t.noTasks}</p>
                            <p className="gtd-empty-state__hint">
                              {t.emptyStateHint}
                            </p>
                          </div>
                        ) : (
                          todayTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onOpenTask={handleOpenTask}
                                    onStatusChange={handleStatusChange}
                                    isDragging={snapshot.isDragging}
                                    showDateLabel={true}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* リサイズハンドル（1列レイアウト時のみ表示） */}
          <div
            className="gtd-resize-handle"
            onMouseDown={handleMouseDown}
            style={{ cursor: isResizing ? 'row-resize' : 'ns-resize' }}
          >
            <div className="gtd-resize-handle__bar"></div>
          </div>

          {/* 右側: Next Actions + Inbox */}
          <div className="gtd-main-view__right" style={{ height: `${100 - splitRatio}%` }}>
            {/* 次に取るべき行動 */}
            <div className="gtd-section">
              <Droppable droppableId="next-action">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-section-wrapper ${collapsedGroups['next-action'] ? 'gtd-section-wrapper--collapsed' : ''}`}
                  >
                    <h3
                      className={`gtd-section__title ${snapshot.isDraggingOver && collapsedGroups['next-action'] ? 'gtd-section__title--dragging-over' : ''}`}
                      onClick={() => toggleGroup('next-action')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{collapsedGroups['next-action'] ? '▶' : '▼'}</span> {t.nextAction} <span className="gtd-section__count">{nextActionTasks.length}</span>
                    </h3>
                    {!collapsedGroups['next-action'] && (
                      <div className={`gtd-droppable gtd-droppable--compact ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}>
                        {nextActionTasks.length === 0 ? (
                          <div className="gtd-empty-state">
                            <p>{t.noTasks}</p>
                          </div>
                        ) : (
                          nextActionTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onOpenTask={handleOpenTask}
                                    onStatusChange={handleStatusChange}
                                    isDragging={snapshot.isDragging}
                                    compact={true}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Inbox */}
            <div className="gtd-section">
              <Droppable droppableId="inbox">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-section-wrapper ${collapsedGroups.inbox ? 'gtd-section-wrapper--collapsed' : ''}`}
                  >
                    <h3
                      className={`gtd-section__title ${snapshot.isDraggingOver && collapsedGroups.inbox ? 'gtd-section__title--dragging-over' : ''}`}
                      onClick={() => toggleGroup('inbox')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{collapsedGroups.inbox ? '▶' : '▼'}</span> {t.inbox} <span className="gtd-section__count">{inboxTasks.length}</span>
                    </h3>
                    {!collapsedGroups.inbox && (
                      <div className={`gtd-droppable gtd-droppable--compact ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}>
                        {inboxTasks.length === 0 ? (
                          <div className="gtd-empty-state">
                            <p>{t.noTasks}</p>
                          </div>
                        ) : (
                          inboxTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onOpenTask={handleOpenTask}
                                    onStatusChange={handleStatusChange}
                                    isDragging={snapshot.isDragging}
                                    compact={true}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* 連絡待ち */}
            <div className="gtd-section">
              <Droppable droppableId="waiting">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-section-wrapper ${collapsedGroups.waiting ? 'gtd-section-wrapper--collapsed' : ''}`}
                  >
                    <h3
                      className={`gtd-section__title ${snapshot.isDraggingOver && collapsedGroups.waiting ? 'gtd-section__title--dragging-over' : ''}`}
                      onClick={() => toggleGroup('waiting')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{collapsedGroups.waiting ? '▶' : '▼'}</span> {t.waiting} <span className="gtd-section__count">{waitingTasks.length}</span>
                    </h3>
                    {!collapsedGroups.waiting && (
                      <div className={`gtd-droppable gtd-droppable--compact ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}>
                        {waitingTasks.length === 0 ? (
                          <div className="gtd-empty-state">
                            <p>{t.noTasks}</p>
                          </div>
                        ) : (
                          waitingTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onOpenTask={handleOpenTask}
                                    onStatusChange={handleStatusChange}
                                    isDragging={snapshot.isDragging}
                                    compact={true}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* いつかやる/多分やる */}
            <div className="gtd-section">
              <Droppable droppableId="someday">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-section-wrapper ${collapsedGroups.someday ? 'gtd-section-wrapper--collapsed' : ''}`}
                  >
                    <h3
                      className={`gtd-section__title ${snapshot.isDraggingOver && collapsedGroups.someday ? 'gtd-section__title--dragging-over' : ''}`}
                      onClick={() => toggleGroup('someday')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{collapsedGroups.someday ? '▶' : '▼'}</span> {t.someday} <span className="gtd-section__count">{somedayTasks.length}</span>
                    </h3>
                    {!collapsedGroups.someday && (
                      <div className={`gtd-droppable gtd-droppable--compact ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}>
                        {somedayTasks.length === 0 ? (
                          <div className="gtd-empty-state">
                            <p>{t.noTasks}</p>
                          </div>
                        ) : (
                          somedayTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onOpenTask={handleOpenTask}
                                    onStatusChange={handleStatusChange}
                                    isDragging={snapshot.isDragging}
                                    compact={true}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* ゴミ箱 */}
            <div className="gtd-section gtd-section--trash">
              <Droppable droppableId="trash">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="gtd-section-wrapper gtd-section-wrapper--trash"
                  >
                    <h3
                      className={`gtd-section__title gtd-section__title--trash ${snapshot.isDraggingOver ? 'gtd-section__title--dragging-over-trash' : ''}`}
                    >
                      {t.trash}
                    </h3>
                    <div className={`gtd-droppable gtd-droppable--trash ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over-trash' : ''}`}>
                      <div className="gtd-trash-hint">
                        {t.dragToTrash}
                      </div>
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>

        {/* クイック追加モーダル */}
        <QuickAddModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleQuickAdd}
          projects={projects}
          settings={settings}
        />
      </div>
    </DragDropContext>
  );
};
