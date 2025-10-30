import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, TaskPriority } from '../types';
import { TaskCard } from '../components/TaskCard';
import { QuickAddModal } from '../components/QuickAddModal';
import { TaskService } from '../services/TaskService';
import { FileService } from '../services/FileService';

interface GTDMainViewProps {
  taskService: TaskService;
  fileService: FileService;
}

/**
 * GTDメインビューコンポーネント
 * 2カラムレイアウトでInbox/Today/次に取るべき行動を表示
 */
export const GTDMainView: React.FC<GTDMainViewProps> = ({ taskService, fileService }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadTasks();
  }, []);

  // タスクをステータスでフィルタ
  const getTasksByStatus = (status: TaskStatus, excludeCompleted = true): Task[] => {
    return tasks.filter(
      (task) => task.status === status && (!excludeCompleted || !task.completed)
    );
  };

  // 今日のタスクを取得
  const getTodayTasks = (): Task[] => {
    return tasks.filter((task) => task.isToday() && !task.completed);
  };

  // ドラッグ&ドロップ処理
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    try {
      // 移動先に応じてタスクのステータスと日付を更新
      if (destination.droppableId === 'today') {
        await taskService.moveTaskToToday(task.id);
      } else if (destination.droppableId === 'next-action') {
        await taskService.changeTaskStatus(task.id, 'next-action');
      } else if (destination.droppableId === 'inbox') {
        await taskService.changeTaskStatus(task.id, 'inbox');
      }

      // タスクを再読み込み
      await loadTasks();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  // タスク完了トグル
  const handleToggleComplete = async (taskId: string) => {
    try {
      await taskService.toggleTaskComplete(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  // タスクファイルを開く
  const handleOpenTask = async (task: Task) => {
    try {
      await fileService.openFile(task.filePath);
    } catch (error) {
      console.error('Failed to open task file:', error);
    }
  };

  // クイック追加
  const handleQuickAdd = async (title: string, status: TaskStatus, priority: TaskPriority) => {
    try {
      await taskService.createTask({ title, status, priority });
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  if (loading) {
    return <div className="gtd-loading">読み込み中...</div>;
  }

  const inboxTasks = getTasksByStatus('inbox');
  const nextActionTasks = getTasksByStatus('next-action');
  const todayTasks = getTodayTasks();

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="gtd-main-view">
        {/* ヘッダー */}
        <div className="gtd-main-view__header">
          <h2>📋 GTD タスク管理</h2>
          <button className="gtd-button gtd-button--primary" onClick={() => setIsModalOpen(true)}>
            + タスクを追加
          </button>
        </div>

        {/* 2カラムレイアウト */}
        <div className="gtd-main-view__content">
          {/* 左側: Today */}
          <div className="gtd-main-view__left">
            <div className="gtd-section">
              <h3 className="gtd-section__title">
                📅 Today <span className="gtd-section__count">{todayTasks.length}</span>
              </h3>
              <Droppable droppableId="today">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-droppable ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}
                  >
                    {todayTasks.length === 0 ? (
                      <div className="gtd-empty-state">
                        <p>今日のタスクはありません</p>
                        <p className="gtd-empty-state__hint">
                          右側の「次に取るべき行動」からドラッグ&ドロップで追加
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
                                isDragging={snapshot.isDragging}
                                showDateLabel={true}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* 右側: Today + Next Actions + Inbox */}
          <div className="gtd-main-view__right">
            {/* Today（右側にも表示） */}
            <div className="gtd-section">
              <h3 className="gtd-section__title">
                📅 Today <span className="gtd-section__count">{todayTasks.length}</span>
              </h3>
              <Droppable droppableId="today-right">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-droppable gtd-droppable--compact ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}
                  >
                    {todayTasks.map((task, index) => (
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
                              isDragging={snapshot.isDragging}
                              compact={true}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* 次に取るべき行動 */}
            <div className="gtd-section">
              <h3 className="gtd-section__title">
                ▶️ 次に取るべき行動 <span className="gtd-section__count">{nextActionTasks.length}</span>
              </h3>
              <Droppable droppableId="next-action">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-droppable gtd-droppable--compact ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}
                  >
                    {nextActionTasks.map((task, index) => (
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
                              isDragging={snapshot.isDragging}
                              compact={true}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Inbox */}
            <div className="gtd-section">
              <h3 className="gtd-section__title">
                📥 Inbox <span className="gtd-section__count">{inboxTasks.length}</span>
              </h3>
              <Droppable droppableId="inbox">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`gtd-droppable gtd-droppable--compact ${snapshot.isDraggingOver ? 'gtd-droppable--dragging-over' : ''}`}
                  >
                    {inboxTasks.map((task, index) => (
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
                              isDragging={snapshot.isDragging}
                              compact={true}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
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
        />
      </div>
    </DragDropContext>
  );
};
