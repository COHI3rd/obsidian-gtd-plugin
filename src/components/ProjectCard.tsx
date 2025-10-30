import React from 'react';
import { Project } from '../types';
import { ProgressBar } from './ProgressBar';
import { DateManager } from '../utils/DateManager';

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

/**
 * プロジェクトカードコンポーネント
 * プロジェクトの概要を表示
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
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

  return (
    <div
      className="gtd-project-card"
      onClick={() => onClick && onClick(project)}
    >
      {/* ヘッダー */}
      <div className="gtd-project-card__header">
        <div className="gtd-project-card__title">{project.title}</div>
        <div className="gtd-project-card__importance">{getImportanceStars()}</div>
      </div>

      {/* ステータス */}
      <div className="gtd-project-card__status">
        <span
          className="gtd-project-card__status-badge"
          style={{ backgroundColor: getStatusColor() }}
        >
          {getStatusLabel()}
        </span>

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

      {/* 進捗バー */}
      <div className="gtd-project-card__progress">
        <ProgressBar progress={project.progress} height={6} showLabel={true} />
      </div>

      {/* アクションプラン（省略表示） */}
      {project.actionPlan && (
        <div className="gtd-project-card__action-plan">
          {project.actionPlan.split('\n')[0].substring(0, 60)}
          {project.actionPlan.length > 60 && '...'}
        </div>
      )}
    </div>
  );
};
