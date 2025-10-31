import React from 'react';

interface WelcomeModalProps {
  onClose: () => void;
  onCreateSampleData: () => void;
}

/**
 * ウェルカムモーダルコンポーネント
 * 初回起動時に表示される
 */
export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  onClose,
  onCreateSampleData
}) => {
  return (
    <div className="gtd-modal-overlay" onClick={onClose}>
      <div className="gtd-modal-content gtd-welcome-modal" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="gtd-modal-header">
          <h2>🎉 GTD Task Manager へようこそ！</h2>
          <button className="gtd-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 本文 */}
        <div className="gtd-welcome-modal__content">
          <div className="gtd-welcome-modal__section">
            <h3>📋 GTDとは？</h3>
            <p>
              GTD (Getting Things Done) は、デビッド・アレン氏が考案したタスク管理手法です。
              頭の中のタスクを外部システムに記録し、集中して実行できる環境を作ります。
            </p>
          </div>

          <div className="gtd-welcome-modal__section">
            <h3>✨ 主な機能</h3>
            <ul>
              <li><strong>📥 Inbox</strong>: 思いついたことをすぐに記録</li>
              <li><strong>➡️ Next Actions</strong>: 次に取るべき行動を整理</li>
              <li><strong>📅 Today</strong>: 今日実行するタスクを管理</li>
              <li><strong>⏳ Waiting/🌟 Someday</strong>: 待機中・将来のタスクを保管</li>
              <li><strong>🎯 Projects</strong>: 複数タスクからなるプロジェクトを管理</li>
              <li><strong>📋 Weekly Review</strong>: 週次でタスクとプロジェクトを見直し</li>
            </ul>
          </div>

          <div className="gtd-welcome-modal__section">
            <h3>🚀 はじめ方</h3>
            <p>
              サンプルデータを作成して、すぐにGTD Task Managerの使い方を学ぶことができます。
            </p>
            <button
              className="gtd-button gtd-button--primary gtd-welcome-modal__button"
              onClick={() => {
                onCreateSampleData();
                onClose();
              }}
            >
              📦 サンプルデータを作成
            </button>
            <p className="gtd-welcome-modal__note">
              ※ サンプルデータは GTD/Tasks、GTD/Projects フォルダに作成されます
            </p>
          </div>

          <div className="gtd-welcome-modal__section">
            <h3>⚙️ 設定</h3>
            <p>
              設定 → コミュニティプラグイン → GTD Task Manager で、
              タスクフォルダやプロジェクトフォルダのパスを変更できます。
            </p>
          </div>

          <div className="gtd-welcome-modal__tips">
            <h4>💡 ヒント</h4>
            <ul>
              <li>コマンドパレット（Ctrl/Cmd + P）から「GTD」で検索すると、すべての機能にアクセスできます</li>
              <li>タスクをドラッグ&ドロップで簡単に移動できます</li>
              <li>タスクのタイトルをクリックすると、Markdownファイルが開きます</li>
              <li>グループ名の横の▶/▼をクリックすると、グループを折りたたみできます</li>
            </ul>
          </div>
        </div>

        {/* フッター */}
        <div className="gtd-welcome-modal__footer">
          <button className="gtd-button gtd-button--secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
