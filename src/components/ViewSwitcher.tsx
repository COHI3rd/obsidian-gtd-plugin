import React from 'react';

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
}

/**
 * ビュー切り替えアイコンボタンコンポーネント
 */
export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <div className="gtd-view-switcher">
      <button
        className={`gtd-view-switcher__button ${currentView === 'main' ? 'gtd-view-switcher__button--active' : ''}`}
        onClick={() => onViewChange('main')}
        title="GTDタスク"
      >
        📋
      </button>
      <button
        className={`gtd-view-switcher__button ${currentView === 'project' ? 'gtd-view-switcher__button--active' : ''}`}
        onClick={() => onViewChange('project')}
        title="プロジェクト一覧"
      >
        🎯
      </button>
      <button
        className={`gtd-view-switcher__button ${currentView === 'weekly-review' ? 'gtd-view-switcher__button--active' : ''}`}
        onClick={() => onViewChange('weekly-review')}
        title="週次レビュー"
      >
        🔍
      </button>
    </div>
  );
};
