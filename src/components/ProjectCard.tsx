import React, { useState } from 'react';
import { Project, ProjectStatus, Task } from '../types';
import { ProgressBar } from './ProgressBar';
import { DateManager } from '../utils/DateManager';

interface ProjectCardProps {
  project: Project;
  tasks?: Task[];
  onClick?: (project: Project) => void;
  onStatusChange?: (project: Project, status: ProjectStatus) => void;
  onImportanceChange?: (project: Project, importance: number) => void;
  onTaskClick?: (task: Task) => void;
  onTaskToggleComplete?: (task: Task) => void;
  onAddTask?: (project: Project) => void;
}

/**
 * プロジェクトカードコンポーネント
 * プロジェクトの概要を表示
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  tasks = [],
  onClick,
  onStatusChange,
  onImportanceChange,
  onTaskClick,
  onTaskToggleComplete,
  onAddTask
}) => {
  // デフォルトは閉じた状態（false）
  const [isExpanded, setIsExpanded] = useState(false);
  const getStatusLabel = () => {
    switch (project.status) {
      case 'not-started':
        return '未着手';
      case 'in-progress':
        return '進行中';
      case 'completed':
        return '完了';
      default:
        return project.status;
    }
  };

  const getStatusColor = () => {
    switch (project.status) {
      case 'not-started':
        return '#868e96';
      case 'in-progress':
        return '#4dabf7';
      case 'completed':
        return '#51cf66';
      default:
        return '#868e96';
    }
  };

  const getImportanceStars = () => {
    return '⭐'.repeat(project.importance);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(project, e.target.value as ProjectStatus);
    }
  };

  const handleImportanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (onImportanceChange) {
      onImportanceChange(project, parseInt(e.target.value));
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="gtd-project-card">
      {/* ヘッダー */}
      <div
        className="gtd-project-card__header"
        onClick={() => onClick && onClick(project)}
      >
        <div className="gtd-project-card__title">{project.title}</div>
        <div className="gtd-project-card__importance">
          {onImportanceChange ? (
            <select
              value={project.importance}
              onChange={handleImportanceChange}
              className="gtd-project-card__importance-select"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="1">⭐</option>
              <option value="2">⭐⭐</option>
              <option value="3">⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐</option>
              <option value="5">⭐⭐⭐⭐⭐</option>
            </select>
          ) : (
            getImportanceStars()
          )}
        </div>
      </div>

      {/* ステータス */}
      <div className="gtd-project-card__status">
        <div className="gtd-project-card__status-left">
          {onStatusChange ? (
            <select
              value={project.status}
              onChange={handleStatusChange}
              className="gtd-project-card__status-select"
              style={{ backgroundColor: getStatusColor() }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="not-started">未着手</option>
              <option value="in-progress">進行中</option>
              <option value="completed">完了</option>
            </select>
          ) : (
            <span
              className="gtd-project-card__status-badge"
              style={{ backgroundColor: getStatusColor() }}
            >
              {getStatusLabel()}
            </span>
          )}

          {project.deadline && (
            <span
              className={`gtd-project-card__deadline ${
                project.isOverdue() ? 'gtd-project-card__deadline--overdue' : ''
              }`}
            >
              📅 {DateManager.getRelativeString(project.deadline)}
            </span>
          )}
        </div>

        {/* タスク追加ボタン */}
        {onAddTask && (
          <button
            className="gtd-button gtd-button--text gtd-button--small gtd-project-card__add-task-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(project);
            }}
            title="タスクを追加"
          >
            + タスク追加
          </button>
        )}
      </div>

      {/* 進捗バー */}
      <div className="gtd-project-card__progress">
        <ProgressBar progress={project.progress} height={6} showLabel={true} />
      </div>

      {/* アクションプラン（省略表示） */}
      {project.actionPlan && !isExpanded && (
        <div className="gtd-project-card__action-plan">
          {project.actionPlan.split('\n')[0].substring(0, 60)}
          {project.actionPlan.length > 60 && '...'}
        </div>
      )}

      {/* タスクリスト展開ボタン */}
      {tasks.length > 0 && (
        <div className="gtd-project-card__toggle" onClick={toggleExpand}>
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span className="gtd-project-card__task-count">
            タスク ({tasks.filter(t => !t.completed).length}/{tasks.length})
          </span>
        </div>
      )}

      {/* タスクリスト */}
      {isExpanded && tasks.length > 0 && (
        <div className="gtd-project-card__tasks">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`gtd-project-card__task ${task.completed ? 'gtd-project-card__task--completed' : ''}`}
            >
              <span
                className="gtd-project-card__task-checkbox"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskToggleComplete?.(task);
                }}
                style={{ cursor: onTaskToggleComplete ? 'pointer' : 'default' }}
              >
                {task.completed ? '✓' : '○'}
              </span>
              <span
                className="gtd-project-card__task-title"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick?.(task);
                }}
              >
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
