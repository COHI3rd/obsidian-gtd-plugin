import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  showLabel?: boolean;
}

/**
 * 進捗バーコンポーネント
 * プロジェクトの進捗率を視覚的に表示
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = '#4dabf7',
  showLabel = true,
}) => {
  // 進捗率を0-100の範囲に制限
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // 進捗率に応じた色
  const getProgressColor = () => {
    if (clampedProgress === 100) return '#51cf66'; // 完了: 緑
    if (clampedProgress >= 75) return '#4dabf7'; // 75%以上: 青
    if (clampedProgress >= 50) return '#ffa500'; // 50%以上: オレンジ
    if (clampedProgress >= 25) return '#ffb84d'; // 25%以上: 薄いオレンジ
    return '#e9ecef'; // 25%未満: グレー
  };

  return (
    <div className="gtd-progress-bar">
      <div
        className="gtd-progress-bar__track"
        style={{ height: `${height}px` }}
      >
        <div
          className="gtd-progress-bar__fill"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color || getProgressColor(),
            height: '100%',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {showLabel && (
        <div className="gtd-progress-bar__label">{clampedProgress}%</div>
      )}
    </div>
  );
};
