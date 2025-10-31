import React, { useState, useRef, useEffect } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

/**
 * プロジェクト作成モーダルコンポーネント
 */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
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
          <h2>新規プロジェクトを作成</h2>
          <button className="gtd-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gtd-modal-form">
          <div className="gtd-form-group">
            <label htmlFor="project-title">プロジェクト名 *</label>
            <input
              ref={inputRef}
              id="project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="プロジェクト名を入力..."
              className="gtd-input"
              required
            />
          </div>

          <div className="gtd-modal-actions">
            <button type="button" onClick={onClose} className="gtd-button gtd-button--secondary">
              キャンセル
            </button>
            <button type="submit" className="gtd-button gtd-button--primary">
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
