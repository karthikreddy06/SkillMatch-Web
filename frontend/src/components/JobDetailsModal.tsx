import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Zap,
  CheckCircle2,
  Circle,
  Building2,
  Send,
  Heart,
  Coffee,
  Navigation,
  ArrowLeft,
} from 'lucide-react';
import { Job, Profile } from '../types';
import { api } from '../services/api';
import { VerifiedBadge } from './VerifiedBadge';
import { JobLocationMap } from './JobLocationMap';

interface JobDetailsModalProps {
  job: Job;
  user: Profile | null;
  onClose: () => void;
  onApplySuccess: (message: string) => void;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  user,
  onClose,
  onApplySuccess,
  isSaved = false,
  onToggleSave,
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [directionsStatus, setDirectionsStatus] = useState<'idle' | 'requesting' | 'ready' | 'denied' | 'error'>('idle');

  // Record view on mount
  useEffect(() => {
    if (user?.id) {
      api.recordJobView(job.id, user.id).catch(() => {});
    }
  }, [job.id, user?.id]);

  const userSkillsSet = new Set(
    (user?.skills || []).map((s) => s.toLowerCase().trim())
  );

  const matchedSkills = (job.skills || []).filter((s) =>
    userSkillsSet.has(s.toLowerCase().trim())
  );
  const missingSkills = (job.skills || []).filter(
    (s) => !userSkillsSet.has(s.toLowerCase().trim())
  );

  const handleApply = async () => {
    if (job.has_applied) return;
    if (!user) {
      setError('Please sign in to submit an application.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await api.applyJob(job.id, user.id, coverLetter);
      onApplySuccess(`Successfully submitted application for ${job.title}!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="job-details-modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: '#FFF',
              }}
            >
              {(job.company_name || 'C')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>{job.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{job.company_name}</span>
                <VerifiedBadge size="sm" />
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={13} color="#38BDF8" />
                  {job.location}
                </span>
              </div>
            </div>
          </div>
          <div className="job-details-modal-actions">
            <button className="btn btn-ghost btn-sm" onClick={onClose} id="back-job-details-btn"><ArrowLeft size={15} /> Back</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-job-modal-btn" aria-label="Close job details"><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Key Facts Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Clock size={16} color="#818CF8" />
              <span>{job.job_type} ({job.shift_preference || 'Standard'} Shift)</span>
            </div>
            {job.flexible_hours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#38BDF8' }}>
                <Zap size={16} />
                <span>Flexible Hours Approved</span>
              </div>
            )}
            {job.salary_range && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#34D399' }}>
                <DollarSign size={16} />
                <span>{job.salary_range}</span>
              </div>
            )}
          </div>

          <div className="job-application-status">
            {user?.resume_url ? 'Resume attached ✓' : 'Upload your resume in your profile before applying.'}
          </div>

          {/* AI Skill Match Analysis Card */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              background: 'rgba(99, 102, 241, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#818CF8" />
                <h4 style={{ fontSize: '1rem', margin: 0 }}>AI Skill Match Breakdown</h4>
              </div>
              <div className="match-score-pill high" style={{ fontSize: '0.85rem' }}>
                {job.match_score ?? '—'}% Overall Match
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              SkillMatch combines employer skill requirements, real distance, experience, and your work preferences.
            </p>

            <div className="job-match-reasons">
              {typeof job.match_breakdown?.skills === 'number' && <span>Skills {job.match_breakdown.skills}%</span>}
              {typeof job.match_breakdown?.location === 'number' && <span>Location {job.match_breakdown.location}%</span>}
              {typeof job.match_breakdown?.experience === 'number' && <span>Experience {job.match_breakdown.experience}%</span>}
              {typeof job.match_breakdown?.preferences === 'number' && <span>Preferences {job.match_breakdown.preferences}%</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', marginBottom: '0.4rem' }}>
                  MATCHED SKILLS ({matchedSkills.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {matchedSkills.length > 0 ? (
                    matchedSkills.map((s, i) => (
                      <span key={i} className="badge badge-success">
                        <CheckCircle2 size={12} />
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No direct matches yet</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  OTHER REQUIREMENTS ({missingSkills.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {missingSkills.map((s, i) => (
                    <span key={i} className="badge badge-skill" style={{ opacity: 0.8 }}>
                      <Circle size={10} />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          {job.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Role Overview</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Key Responsibilities & Qualifications</h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {job.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits & Culture */}
          {((job.benefits && job.benefits.length > 0) || (job.culture && job.culture.length > 0)) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Coffee size={15} color="#38BDF8" />
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Perks & Benefits</h4>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {job.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.culture && job.culture.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Heart size={15} color="#EC4899" />
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Company Culture</h4>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {job.culture.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Workplace Location & Commute Analysis (OpenStreetMap Leaflet) */}
          {typeof job.latitude === 'number' && typeof job.longitude === 'number' && (
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Navigation size={16} color="#38BDF8" />
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>Workplace Location & Commute Analysis</h4>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  OpenStreetMap Precision
                </span>
              </div>
              <div className="job-direction-controls" style={{ marginBottom: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDirections((visible) => !visible)}>
                  <Navigation size={14} /> {showDirections ? 'Hide Directions' : 'Show Directions'}
                </button>
                <span className="job-location-fit-status">
                  Location Fit: {directionsStatus === 'ready' ? 'Route calculated' : 'Enable location'}
                </span>
              </div>
              <JobLocationMap mode="single" job={job} height="240px" showDirections={showDirections} onDirectionsStatus={setDirectionsStatus} />
            </div>
          )}

          {/* Application Cover Note */}
          <div className="input-group" style={{ marginBottom: '0.5rem' }}>
            <label className="input-label">
              Cover Note / Introduction (Optional)
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Highlight any specific projects or why your skills match this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              id="apply-cover-letter-input"
            />
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: '#F87171',
                fontSize: '0.85rem',
                marginTop: '0.5rem',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {onToggleSave && (
            <button className="btn btn-secondary" onClick={() => onToggleSave(job)}>
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save Job'}
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={isSubmitting || Boolean(job.has_applied)}
            id="submit-application-btn"
          >
            <Send size={16} />
            <span>{job.has_applied ? 'Applied' : isSubmitting ? 'Submitting...' : 'Apply Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
