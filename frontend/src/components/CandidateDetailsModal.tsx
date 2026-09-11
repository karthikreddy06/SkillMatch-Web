import React from 'react';
import {
  X,
  Sparkles,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { Application, ApplicationStatus } from '../types';
import { VerifiedBadge } from './VerifiedBadge';

interface CandidateDetailsModalProps {
  application: Application | null;
  onClose: () => void;
  onUpdateStatus: (applicationId: string, newStatus: ApplicationStatus) => Promise<void>;
  onOpenSchedule: (application: Application) => void;
  onOpenChat: (applicationId: string) => void;
}

export const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({
  application,
  onClose,
  onUpdateStatus,
  onOpenSchedule,
  onOpenChat,
}) => {
  if (!application) return null;

  const applicant = application.applicant;
  const job = application.job;
  const matchScore = application.match_score ?? 75;

  return (
    <div className="modal-overlay" onClick={onClose} id="candidate-details-modal-overlay">
      <div
        className="modal-content candidate-details-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-panel)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Candidate Profile
            </h2>
            <span
              className={`badge ${
                application.status === 'interview'
                  ? 'badge-warning'
                  : application.status === 'shortlisted'
                  ? 'badge-success'
                  : application.status === 'rejected'
                  ? 'badge-danger'
                  : 'badge-secondary'
              }`}
              style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
            >
              {application.status === 'interview' ? '📅 Interview Scheduled' : application.status}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            id="close-candidate-modal-btn"
            aria-label="Close candidate details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Top Hero Banner */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                }}
              >
                {applicant?.avatar_url ? (
                  <img
                    src={applicant.avatar_url}
                    alt={applicant.full_name || 'Candidate'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (applicant?.full_name || applicant?.email || 'C')[0].toUpperCase()
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {applicant?.full_name || 'Candidate'}
                  </h3>
                  {applicant?.is_verified && <VerifiedBadge size="sm" />}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {applicant?.headline || 'Job Applicant'}
                </div>
                {job?.title && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Applied for: <strong style={{ color: 'var(--primary)' }}>{job.title}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Match Score Badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.25rem',
              }}
            >
              <div
                className="match-score-pill high"
                style={{ fontSize: '0.9rem', padding: '0.4rem 0.85rem' }}
              >
                <Sparkles size={15} />
                <span>{matchScore}% Skill Match</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Applied on {new Date(application.applied_at || application.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Contact & Career Meta Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div className="glass-panel" style={{ padding: '0.9rem 1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                <Mail size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>{applicant?.email || 'Not provided'}</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Location</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <MapPin size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>{applicant?.location || 'Not specified'}</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Experience</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <Briefcase size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>{applicant?.experience_years ? `${applicant.experience_years} years` : applicant?.experience_level || 'Not specified'}</span>
              </div>
            </div>

            {applicant?.phone && (
              <div className="glass-panel" style={{ padding: '0.9rem 1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Phone</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Phone size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span>{applicant.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* About / Bio */}
          {applicant?.bio && (
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                About the Candidate
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {applicant.bio}
              </p>
            </div>
          )}

          {/* Cover Note / Application Letter */}
          {application.cover_letter && (
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderRadius: '14px',
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                Cover Letter / Application Note
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {application.cover_letter}
              </p>
            </div>
          )}

          {/* Skills */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>
              Candidate Skills & Expertise
            </h4>
            {applicant?.skills && applicant.skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {applicant.skills.map((skill, index) => (
                  <span key={index} className="badge badge-skill" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No skills listed by candidate.</p>
            )}
          </div>

          {/* Resume Section */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Attached Resume
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  {applicant?.resume_url ? 'Candidate has attached a verified resume.' : 'No resume file attached.'}
                </p>
              </div>
              {applicant?.resume_url ? (
                <a
                  href={applicant.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FileText size={15} />
                  <span>View Attached Resume</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>Not uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1.15rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-panel)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Shortlist */}
            {application.status !== 'shortlisted' && application.status !== 'interview' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  await onUpdateStatus(application.id, 'shortlisted');
                }}
                id={`modal-shortlist-btn-${application.id}`}
              >
                <CheckCircle2 size={15} color="#10B981" />
                <span>Shortlist</span>
              </button>
            )}

            {/* Schedule Interview */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                onOpenSchedule(application);
              }}
              id={`modal-schedule-btn-${application.id}`}
            >
              <Calendar size={15} />
              <span>Schedule Interview</span>
            </button>

            {/* Message Candidate */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onOpenChat(application.id);
              }}
              id={`modal-chat-btn-${application.id}`}
            >
              <MessageSquare size={15} />
              <span>Direct Message</span>
            </button>

            {/* Reject */}
            {application.status !== 'rejected' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)' }}
                onClick={async () => {
                  await onUpdateStatus(application.id, 'rejected');
                }}
                id={`modal-reject-btn-${application.id}`}
              >
                <XCircle size={15} />
                <span>Reject</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
