import React, { useState, useRef, useEffect } from 'react';
import { GTDSettings } from '../types';
import { getText } from '../i18n';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  settings: GTDSettings;
}

/**
 * プロジェクト作成モーダルコンポーネント
 */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  settings,
}) => {
  const t = getText(settings.language);
  const [title, setTitle] = useState('');
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
      onSubmit(title.trim());
      setTitle('');
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
          <h2>{t.createProjectTitle}</h2>
          <button className="gtd-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gtd-modal-form">
          <div className="gtd-form-group">
            <label htmlFor="project-title">{t.projectName} {t.required}</label>
            <input
              ref={inputRef}
              id="project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.projectNamePlaceholder}
              className="gtd-input"
              required
            />
          </div>

          <div className="gtd-modal-actions">
            <button type="button" onClick={onClose} className="gtd-button gtd-button--secondary">
              {t.cancel}
            </button>
            <button type="submit" className="gtd-button gtd-button--primary">
              {t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
