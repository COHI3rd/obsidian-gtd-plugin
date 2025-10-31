import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  title: string;
  onToggleComplete: (taskId: string) => void;
  onOpenTask?: (task: Task) => void;
  groupByStatus?: boolean;
  emptyMessage?: string;
}

/**
 * タスクリストコンポーネント
 * タスクをリスト表示し、オプションでステータスごとにグループ化
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  title,
  onToggleComplete,
  onOpenTask,
  groupByStatus = false,
  emptyMessage = 'タスクがありません',
}) => {
  // ステータスごとにグループ化
  const groupedTasks: Map<TaskStatus | 'completed', Task[]> = new Map();

  if (groupByStatus) {
    // 未完了タスクをステータスごとに分類
    const incompleteTasks = tasks.filter((t) => !t.completed);
    incompleteTasks.forEach((task) => {
      const status = task.status;
      if (!groupedTasks.has(status)) {
        groupedTasks.set(status, []);
      }
      groupedTasks.get(status)!.push(task);
    });

    // 完了タスクを分類
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length > 0) {
      groupedTasks.set('completed', completedTasks);
    }
  }

  const getStatusLabel = (status: TaskStatus | 'completed'): string => {
    const labels: Record<TaskStatus | 'completed', string> = {
      inbox: '📥 Inbox',
      'next-action': '▶️ 次に取るべき行動',
      today: '📅 今日',
      waiting: '⏳ 連絡待ち',
      someday: '💭 いつかやる/多分やる',
      trash: '🗑️ ゴミ箱',
      completed: '✅ 完了',
    };
    return labels[status] || status;
  };

  const renderTaskList = (taskList: Task[]) => {
    if (taskList.length === 0) {
      return <div className="gtd-task-list__empty">{emptyMessage}</div>;
    }

    return taskList.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        onToggleComplete={onToggleComplete}
        onOpenTask={onOpenTask}
      />
    ));
  };

  return (
    <div className="gtd-task-list">
      {/* タイトル */}
      <div className="gtd-task-list__header">
        <h3 className="gtd-task-list__title">{title}</h3>
        <span className="gtd-task-list__count">{tasks.length}</span>
      </div>

      {/* タスク表示 */}
      <div className="gtd-task-list__content">
        {groupByStatus ? (
          // ステータスごとにグループ化して表示
          Array.from(groupedTasks.entries()).map(([status, taskList]) => (
            <div key={status} className="gtd-task-list__group">
              <div className="gtd-task-list__group-header">
                {getStatusLabel(status)}
                <span className="gtd-task-list__group-count">
                  {taskList.length}
                </span>
              </div>
              <div className="gtd-task-list__group-content">
                {renderTaskList(taskList)}
              </div>
            </div>
          ))
        ) : (
          // グループ化せずに表示
          renderTaskList(tasks)
        )}
      </div>
    </div>
  );
};
