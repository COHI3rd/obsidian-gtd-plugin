import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Task, TaskStatus } from '../types';
import { DateManager } from '../utils/DateManager';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onOpenTask?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssignProject?: (taskId: string, projectName: string | null) => void;
  availableProjects?: Array<{ title: string; color: string }>;
  isDragging?: boolean;
  compact?: boolean;
  showDateLabel?: boolean;
  showProject?: boolean;
  projectColor?: string; // プロジェクトカラー（Todayグループ以外で使用）
}

/**
 * タスクカードコンポーネント
 * ドラッグ可能なタスク表示カード
 * React.memoでメモ化してパフォーマンスを最適化
 */
export const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  onToggleComplete,
  onOpenTask,
  onStatusChange,
  onAssignProject,
  availableProjects = [],
  isDragging = false,
  compact = false,
  showDateLabel = false,
  showProject = false,
  projectColor,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

    // クリック操作の場合のみファイルを開く
    // （ドラッグ判定はGTDMainView.tsxのhandleOpenTaskで行う）
    if (onOpenTask) {
      onOpenTask(task);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onStatusChange) return;

    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleStatusMenuClick = (status: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, status);
    }
    setShowContextMenu(false);
  };

  const handleProjectAssign = (projectName: string | null) => {
    if (onAssignProject) {
      onAssignProject(task.id, projectName);
    }
    setShowContextMenu(false);
  };

  // クリックアウェイでメニューを閉じる
  React.useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

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
      <>
        <div
          className={`gtd-task-card gtd-task-card--today ${
            projectColor ? 'gtd-task-card--with-color' : ''
          } ${
            task.completed ? 'gtd-task-card--completed' : ''
          }`}
          onClick={handleTitleClick}
          onContextMenu={handleContextMenu}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={projectColor ? { borderLeft: `4px solid ${projectColor}` } : undefined}
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

        {/* コンテキストメニュー（Portal経由でbodyにレンダリング） */}
        {showContextMenu && onStatusChange && ReactDOM.createPortal(
          <div
            className="gtd-context-menu"
            style={{
              position: 'fixed',
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              zIndex: 999999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gtd-context-menu__section">
              <div className="gtd-context-menu__title">ステータス</div>
              <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('inbox')}>
                📥 Inbox
              </div>
              <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('next-action')}>
                ⚡ Next Action
              </div>
              <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('today')}>
                📅 Today
              </div>
              <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('waiting')}>
                ⏳ Waiting
              </div>
              <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('someday')}>
                💡 Someday
              </div>
              <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('trash')}>
                🗑️ Trash
              </div>
            </div>

            {onAssignProject && availableProjects.length > 0 && (
              <div className="gtd-context-menu__section">
                <div className="gtd-context-menu__title">プロジェクト</div>
                <div className="gtd-context-menu__item" onClick={() => handleProjectAssign(null)}>
                  🚫 プロジェクトから外す
                </div>
                {availableProjects.map((project) => (
                  <div
                    key={project.title}
                    className="gtd-context-menu__item"
                    onClick={() => handleProjectAssign(`[[${project.title}]]`)}
                  >
                    <span style={{ color: project.color }}>●</span> {project.title}
                  </div>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
      </>
    );
  }

  // 右側＆コンパクト表示用：シンプル
  return (
    <>
      <div
        className={`gtd-task-card ${compact ? 'gtd-task-card--compact' : ''} ${
          projectColor ? 'gtd-task-card--with-color' : ''
        } ${
          task.completed ? 'gtd-task-card--completed' : ''
        }`}
        onClick={handleTitleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={projectColor ? { borderLeft: `4px solid ${projectColor}` } : undefined}
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

    {/* コンテキストメニュー（Portal経由でbodyにレンダリング） */}
    {showContextMenu && onStatusChange && ReactDOM.createPortal(
      <div
        className="gtd-context-menu"
        style={{
          position: 'fixed',
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`,
          zIndex: 999999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gtd-context-menu__section">
          <div className="gtd-context-menu__title">ステータス</div>
          <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('inbox')}>
            📥 Inbox
          </div>
          <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('next-action')}>
            ⚡ Next Action
          </div>
          <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('today')}>
            📅 Today
          </div>
          <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('waiting')}>
            ⏳ Waiting
          </div>
          <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('someday')}>
            💡 Someday
          </div>
          <div className="gtd-context-menu__item" onClick={() => handleStatusMenuClick('trash')}>
            🗑️ Trash
          </div>
        </div>

        {onAssignProject && availableProjects.length > 0 && (
          <div className="gtd-context-menu__section">
            <div className="gtd-context-menu__title">プロジェクト</div>
            <div className="gtd-context-menu__item" onClick={() => handleProjectAssign(null)}>
              🚫 プロジェクトから外す
            </div>
            {availableProjects.map((project) => (
              <div
                key={project.title}
                className="gtd-context-menu__item"
                onClick={() => handleProjectAssign(`[[${project.title}]]`)}
              >
                <span style={{ color: project.color }}>●</span> {project.title}
              </div>
            ))}
          </div>
        )}
      </div>,
      document.body
    )}
  </>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数: 重要なプロパティが同じなら再レンダリングしない

  // availableProjectsの変更をチェック（配列の長さと内容）
  const prevProjects = prevProps.availableProjects || [];
  const nextProjects = nextProps.availableProjects || [];
  const projectsEqual =
    prevProjects.length === nextProjects.length &&
    prevProjects.every((p, i) =>
      p.title === nextProjects[i]?.title &&
      p.color === nextProjects[i]?.color
    );

  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.completed === nextProps.task.completed &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.project === nextProps.task.project &&
    prevProps.task.date?.getTime() === nextProps.task.date?.getTime() &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.projectColor === nextProps.projectColor &&
    projectsEqual
  );
});
