import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, TaskPriority, Project, GTDSettings } from '../types';
import { getText } from '../i18n';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, status: TaskStatus, priority: TaskPriority, project?: string) => void;
  projects?: Project[];
  settings: GTDSettings;
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
  settings,
}) => {
  const t = getText(settings.language);
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
          <h2>{t.addTaskTitle}</h2>
          <button className="gtd-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gtd-modal-form">
          {/* タイトル入力 */}
          <div className="gtd-form-group">
            <label htmlFor="task-title">{t.taskName} {t.required}</label>
            <input
              ref={inputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.taskNamePlaceholder}
              className="gtd-input"
              required
            />
          </div>

          {/* ステータス選択 */}
          <div className="gtd-form-group">
            <label htmlFor="task-status">{t.status}</label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="gtd-select"
            >
              <option value="inbox">{t.inbox}</option>
              <option value="next-action">{t.nextAction}</option>
              <option value="today">{t.today}</option>
              <option value="waiting">{t.waiting}</option>
              <option value="someday">{t.someday}</option>
            </select>
          </div>

          {/* 優先度選択 */}
          <div className="gtd-form-group">
            <label htmlFor="task-priority">{t.priority}</label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="gtd-select"
            >
              <option value="low">{t.priorityLow}</option>
              <option value="medium">{t.priorityMedium}</option>
              <option value="high">{t.priorityHigh}</option>
            </select>
          </div>

          {/* プロジェクト選択 */}
          <div className="gtd-form-group">
            <label htmlFor="task-project">{t.project}</label>
            <select
              id="task-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="gtd-select"
            >
              <option value="">{t.none}</option>
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
              {t.cancel}
            </button>
            <button type="submit" className="gtd-button gtd-button--primary">
              {t.add}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
