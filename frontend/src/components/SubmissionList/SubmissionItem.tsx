import React from 'react';
import type { Submission } from '../../domain/entities/Submission/Submission';
import './SubmissionList.css';

interface SubmissionItemProps {
  submission: Submission;
  onEdit?: (submission: Submission) => void;
  onDelete?: (id: string) => void;
}

export const SubmissionItem: React.FC<SubmissionItemProps> = ({ submission, onEdit, onDelete }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="submission-item">
      <div className="submission-header">
        <div className="submission-author">
          <strong>{submission.name}</strong>
          <span className="submission-email">{submission.email}</span>
        </div>
        <span className="submission-date">{formatDate(submission.createdAt)}</span>
      </div>
      
      {(submission.city || submission.country || submission.status) && (
        <div className="submission-metadata">
          {submission.status && (
            <span className={`submission-status status-${submission.status.toLowerCase().replace(' ', '-')}`}>
              {submission.status}
            </span>
          )}
          {(submission.city || submission.country) && (
            <span className="submission-location">
              📍 {[submission.city, submission.country].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      )}

      <div className="submission-message">{submission.message}</div>
      {onEdit && (
        <div className="submission-actions">
          <button
            className="edit-button"
            onClick={() => onEdit(submission)}
            title="Edit submission"
          >
            ✏️ Edit
          </button>
          {onDelete && (
            <button
              className="delete-button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this submission?')) {
                  onDelete(submission.id);
                }
              }}
              title="Delete submission"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
