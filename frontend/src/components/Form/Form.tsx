import React, { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { apiService } from '../../services/api';
import type { Submission } from '../../domain/entities/Submission/Submission';
import type { CreateSubmissionRequest } from '../../presentation/requests/Submission/CreateSubmissionRequest';
import type { UpdateSubmissionRequest } from '../../presentation/requests/Submission/UpdateSubmissionRequest';
import './Form.css';

interface FormProps {
  onSubmitSuccess?: () => void;
  editSubmission?: Submission | null;
  onCancelEdit?: () => void;
}

interface FormData extends CreateSubmissionRequest {
  status: Submission['status'];
}

export const Form: React.FC<FormProps> = ({ onSubmitSuccess, editSubmission, onCancelEdit }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
    city: '',
    country: '',
    status: 'Open' as const,
  });

  const isEditMode = !!editSubmission;

  // Load submission data when editing
  useEffect(() => {
    if (editSubmission) {
      setFormData({
        name: editSubmission.name,
        email: editSubmission.email,
        message: editSubmission.message,
        city: editSubmission.city || '',
        country: editSubmission.country || '',
        status: editSubmission.status,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        message: '',
        city: '',
        country: '',
        status: 'Open',
      });
    }
  }, [editSubmission]);

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear submit message
    if (submitMessage) {
      setSubmitMessage(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      if (isEditMode && editSubmission) {
        // Update existing submission
        const updateRequest: UpdateSubmissionRequest = {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          city: formData.city || undefined,
          country: formData.country || undefined,
          status: formData.status as any,
        };
        await apiService.updateSubmission(editSubmission.id, updateRequest);
        setSubmitMessage({ type: 'success', text: 'Submission updated successfully!' });
      } else {
        // Create new submission
        await apiService.submitForm({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          city: formData.city || undefined,
          country: formData.country || undefined,
        });
        setSubmitMessage({ type: 'success', text: 'Form submitted successfully!' });
      }

      setFormData({ name: '', email: '', message: '', city: '', country: '', status: 'Open' });

      // Call success callback to refresh submissions list
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Clear edit mode if editing
      if (isEditMode && onCancelEdit) {
        onCancelEdit();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      
      if (errorMessage === 'A submission with this email already exists') {
        setErrors((prev) => ({ ...prev, email: errorMessage }));
        setSubmitMessage({
          type: 'error',
          text: 'This email has already been used. Please use a different one.',
        });
      } else {
        setSubmitMessage({
          type: 'error',
          text: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-header">
        <h2 className="form-title">{isEditMode ? 'Edit Submission' : 'Submit a Form'}</h2>
        {isEditMode && onCancelEdit && (
          <button
            type="button"
            className="cancel-button"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
      </div>

      <FormField
        label="Name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <FormField
        label="City"
        name="city"
        type="text"
        value={formData.city || ''}
        onChange={handleChange}
        error={errors.city}
      />

      <FormField
        label="Country"
        name="country"
        type="text"
        value={formData.country || ''}
        onChange={handleChange}
        error={errors.country}
      />

      {isEditMode && (
        <div className="form-group">
          <label htmlFor="status" className="form-label">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="form-input"
          >
            <option value="Open">Open</option>
            <option value="In Review">In Review</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      )}

      <FormField
        label="Message"
        name="message"
        type="textarea"
        value={formData.message}
        onChange={handleChange}
        error={errors.message}
        required
        rows={5}
      />

      {submitMessage && (
        <div className={`submit-message ${submitMessage.type}`}>
          {submitMessage.text}
        </div>
      )}

      <button
        type="submit"
        className="submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? (isEditMode ? 'Updating...' : 'Submitting...')
          : (isEditMode ? 'Update' : 'Submit')
        }
      </button>
    </form>
  );
};
