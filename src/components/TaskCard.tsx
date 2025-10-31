import React, { useState } from 'react';
import { Task } from '../types';
import { DateManager } from '../utils/DateManager';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onOpenTask?: (task: Task) => void;
  isDragging?: boolean;
  compact?: boolean;
  showDateLabel?: boolean;
}

/**
 * タスクカードコンポーネント
 * ドラッグ可能なタスク表示カード
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onOpenTask,
  isDragging = false,
  compact = false,
  showDateLabel = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleComplete(task.id);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    // チェックボックスエリアクリック時はファイルを開かない
    e.stopPropagation();
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenTask) {
      onOpenTask(task);
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#ffa500';
      case 'low':
        return '#4dabf7';
      default:
        return '#868e96';
    }
  };

  const getPriorityLabel = () => {
    switch (task.priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '';
    }
  };

  if (showDateLabel) {
    // 左側のTodayビュー用：大きく表示、枠線あり
    // 1列レイアウト時はCSSで自動的にコンパクトに変換される
    return (
      <div
        className={`gtd-task-card gtd-task-card--today ${
          task.completed ? 'gtd-task-card--completed' : ''
        }`}
        onClick={handleTitleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* チェックボックス（1列レイアウト時に表示） */}
        <div className="gtd-task-card__checkbox" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleCheckboxChange}
          />
        </div>

        {/* コンテンツ */}
        <div className="gtd-task-card__content">
          {/* 1行目: チェックボックス + 今日（2列レイアウト時のみ表示） */}
          <div className="gtd-task-card__header-row">
            <div className="gtd-task-card__checkbox" onClick={handleCheckboxClick}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={handleCheckboxChange}
              />
            </div>
            <span className="gtd-task-card__today-label">📅 今日</span>
          </div>

          {/* 2行目: タイトル */}
          <div className="gtd-task-card__title">
            {task.title}
          </div>

          {/* メタ情報 */}
          {!compact && (
            <div className="gtd-task-card__meta">
              {/* 優先度 */}
              {task.priority !== 'medium' && (
                <span
                  className="gtd-task-card__priority"
                  style={{ backgroundColor: getPriorityColor() }}
                >
                  {getPriorityLabel()}
                </span>
              )}

              {/* 日付（1列レイアウト時に表示） */}
              {task.date && (
                <span
                  className={`gtd-task-card__date ${
                    task.isOverdue() ? 'gtd-task-card__date--overdue' : ''
                  }`}
                >
                  📅 {DateManager.getRelativeString(task.date)}
                </span>
              )}

              {/* プロジェクト */}
              {task.project && (
                <span className="gtd-task-card__project">
                  📁 {task.project.replace(/\[\[|\]\]/g, '')}
                </span>
              )}

              {/* タグ */}
              {task.tags.length > 0 && (
                <div className="gtd-task-card__tags">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="gtd-task-card__tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ノート */}
          {task.notes && !compact && (
            <div className="gtd-task-card__notes">{task.notes}</div>
          )}
        </div>

        {/* ドラッグハンドル */}
        {isHovered && !task.completed && (
          <div className="gtd-task-card__drag-handle">⋮⋮</div>
        )}
      </div>
    );
  }

  // 右側＆コンパクト表示用：シンプル
  return (
    <div
      className={`gtd-task-card ${compact ? 'gtd-task-card--compact' : ''} ${
        task.completed ? 'gtd-task-card--completed' : ''
      }`}
      onClick={handleTitleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* チェックボックス */}
      <div className="gtd-task-card__checkbox" onClick={handleCheckboxClick}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleCheckboxChange}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="gtd-task-card__content">
        {/* タイトル */}
        <div className="gtd-task-card__title">
          {task.title}
        </div>

        {/* メタ情報 */}
        {!compact && (
          <div className="gtd-task-card__meta">
            {/* 優先度 */}
            {task.priority !== 'medium' && (
              <span
                className="gtd-task-card__priority"
                style={{ backgroundColor: getPriorityColor() }}
              >
                {getPriorityLabel()}
              </span>
            )}

            {/* 日付 */}
            {task.date && (
              <span
                className={`gtd-task-card__date ${
                  task.isOverdue() ? 'gtd-task-card__date--overdue' : ''
                }`}
              >
                📅 {DateManager.getRelativeString(task.date)}
              </span>
            )}

            {/* プロジェクト */}
            {task.project && (
              <span className="gtd-task-card__project">
                📁 {task.project.replace(/\[\[|\]\]/g, '')}
              </span>
            )}

            {/* タグ */}
            {task.tags.length > 0 && (
              <div className="gtd-task-card__tags">
                {task.tags.map((tag, index) => (
                  <span key={index} className="gtd-task-card__tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ノート */}
        {task.notes && !compact && (
          <div className="gtd-task-card__notes">{task.notes}</div>
        )}
      </div>

      {/* ドラッグハンドル */}
      {isHovered && !task.completed && (
        <div className="gtd-task-card__drag-handle">⋮⋮</div>
      )}
    </div>
  );
};
