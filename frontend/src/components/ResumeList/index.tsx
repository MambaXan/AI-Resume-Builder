import React from 'react';
import { Resume } from '../../types';
import styles from './ResumeList.module.scss';

interface Props {
  resumes: Resume[];
  activeId?: number;
  onSelect: (r: Resume) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ResumeList: React.FC<Props> = ({ resumes, activeId, onSelect, onDelete, onNew }) => {
  return (
    <div className={styles['resume-list']}>
      <button className="btn btn--primary" style={{ width: '100%', marginBottom: 8 }} onClick={onNew}>
        + New Resume
      </button>

      {resumes.length === 0 ? (
        <p className={styles['resume-list__empty']}>No resumes yet. Create one!</p>
      ) : (
        resumes.map(r => (
          <div
            key={r.id}
            className={[
              styles['resume-list__item'],
              r.id === activeId ? styles['resume-list__item--active'] : '',
            ].join(' ')}
            onClick={() => onSelect(r)}
          >
            <div className={styles['resume-list__info']}>
              <span className={styles['resume-list__title']}>{r.title || 'Untitled'}</span>
              <span className={styles['resume-list__date']}>
                {r.updated_at ? `Updated ${formatDate(r.updated_at)}` : formatDate(r.created_at)}
              </span>
            </div>

            <div className={styles['resume-list__actions']}>
              <button
                className={`btn btn--danger ${styles['resume-list__btn']}`}
                onClick={e => { e.stopPropagation(); if (r.id) onDelete(r.id); }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ResumeList;