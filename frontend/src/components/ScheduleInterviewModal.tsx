import React, { useState } from 'react';
import { X, Calendar, Clock, Video, FileText, Send, Check } from 'lucide-react';
import { Application } from '../types';
import { api } from '../services/api';

interface ScheduleInterviewModalProps {
  application: Application;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  application,
  onClose,
  onSuccess,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState('14:00');
  const [interviewType, setInterviewType] = useState('Google Meet Video Call');
  const [notes, setNotes] = useState('Link: https://meet.google.com/skm-interview-call — Please have your code portfolio or resume ready!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const applicant = application.applicant;
  const job = application.job;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.scheduleInterview(application.id, {
        date,
        time,
        type: interviewType,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="schedule-interview-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={20} color="#FBBF24" />
            <h2 style={{ fontSize: '1.25rem' }}>Schedule Candidate Interview</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-schedule-modal-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: '#F87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Candidate & Role Banner */}
            <div
              style={{
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#FFF' }}>
                {applicant?.full_name || 'Candidate'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Position: <strong style={{ color: '#818CF8' }}>{job?.title}</strong>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Interview Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  id="schedule-date-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Interview Time *</label>
                <input
                  type="time"
                  className="input-field"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  id="schedule-time-input"
                />
              </div>
            </div>

            {/* Type */}
            <div className="input-group">
              <label className="input-label">Interview Format / Mode</label>
              <select
                className="input-field"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                id="schedule-format-select"
              >
                <option value="Google Meet Video Call">Google Meet Video Call</option>
                <option value="Zoom Meeting">Zoom Meeting</option>
                <option value="Technical Coding Assessment">Technical Coding Assessment</option>
                <option value="In-Person Office Round">In-Person Office Round</option>
                <option value="Phone Screen">Phone Screen</option>
              </select>
            </div>

            {/* Notes & Meeting link */}
            <div className="input-group">
              <label className="input-label">Meeting Link & Instructions for Candidate</label>
              <textarea
                className="input-field"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include video conference link, preparation tips, or interviewer names..."
                id="schedule-notes-input"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                This invitation will automatically update the candidate's status and post to their chat thread.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="confirm-schedule-btn"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Scheduling...' : 'Send Interview Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
