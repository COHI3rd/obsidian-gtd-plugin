import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, TaskPriority, Project } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, status: TaskStatus, priority: TaskPriority, project?: string) => void;
  projects?: Project[];
}

/**
 * クイック追加モーダルコンポーネント
 * タスクを素早く追加するためのモーダルダイアログ
 */
export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects = [],
}) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('inbox');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [project, setProject] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // モーダルが開いたら入力欄にフォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim(), status, priority, project || undefined);
      setTitle('');
      setStatus('inbox');
      setPriority('medium');
      setProject('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="gtd-modal-overlay" onClick={onClose}>
      <div
        className="gtd-modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="gtd-modal-header">
          <h2>タスクを追加</h2>
          <button className="gtd-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gtd-modal-form">
          {/* タイトル入力 */}
          <div className="gtd-form-group">
            <label htmlFor="task-title">タスク名 *</label>
            <input
              ref={inputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスクの内容を入力..."
              className="gtd-input"
              required
            />
          </div>

          {/* ステータス選択 */}
          <div className="gtd-form-group">
            <label htmlFor="task-status">ステータス</label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="gtd-select"
            >
              <option value="inbox">📥 Inbox</option>
              <option value="next-action">▶️ 次に取るべき行動</option>
              <option value="today">📅 今日</option>
              <option value="waiting">⏳ 連絡待ち</option>
              <option value="someday">💭 いつかやる/多分やる</option>
            </select>
          </div>

          {/* 優先度選択 */}
          <div className="gtd-form-group">
            <label htmlFor="task-priority">優先度</label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="gtd-select"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          {/* プロジェクト選択 */}
          <div className="gtd-form-group">
            <label htmlFor="task-project">プロジェクト</label>
            <select
              id="task-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="gtd-select"
            >
              <option value="">なし</option>
              {projects.map((p) => (
                <option key={p.id} value={`[[${p.title}]]`}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* ボタン */}
          <div className="gtd-modal-actions">
            <button type="button" onClick={onClose} className="gtd-button gtd-button--secondary">
              キャンセル
            </button>
            <button type="submit" className="gtd-button gtd-button--primary">
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
