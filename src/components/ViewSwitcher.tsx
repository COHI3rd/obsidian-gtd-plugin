import React from 'react';
import { GTDSettings } from '../types';
import { getText } from '../i18n';

/**
 * ビュータイプ
 */
export type ViewType = 'main' | 'weekly-review' | 'project';

/**
 * ViewSwitcherコンポーネントのProps
 */
interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  settings: GTDSettings;
}

/**
 * ビュー切り替えアイコンボタンコンポーネント
 */
export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  settings,
}) => {
  const t = getText(settings.language);

  return (
    <div className="gtd-view-switcher">
      <button
        className={`gtd-view-switcher__button ${currentView === 'main' ? 'gtd-view-switcher__button--active' : ''}`}
        onClick={() => onViewChange('main')}
        title={t.gtdTasksTooltip}
      >
        📋
      </button>
      <button
        className={`gtd-view-switcher__button ${currentView === 'project' ? 'gtd-view-switcher__button--active' : ''}`}
        onClick={() => onViewChange('project')}
        title={t.projectListTooltip}
      >
        🎯
      </button>
      <button
        className={`gtd-view-switcher__button ${currentView === 'weekly-review' ? 'gtd-view-switcher__button--active' : ''}`}
        onClick={() => onViewChange('weekly-review')}
        title={t.weeklyReviewTooltip}
      >
        🔍
      </button>
    </div>
  );
};
