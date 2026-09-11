import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Filter,
  Check,
  Building2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Application, ApplicationStatus } from '../types';
import { api } from '../services/api';
import { VerifiedBadge } from './VerifiedBadge';

interface ATSPipelineProps {
  initialJobId?: string;
  onOpenSchedule: (application: Application) => void;
  onOpenChat: (applicationId: string) => void;
  onViewCandidate?: (application: Application) => void;
}

export const ATSPipeline: React.FC<ATSPipelineProps> = ({
  initialJobId,
  onOpenSchedule,
  onOpenChat,
  onViewCandidate,
}) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const fetchApplicants = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await api.getEmployerApplicants(
        user.id,
        selectedJobId || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [user?.id, selectedJobId, statusFilter]);

  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      const updated = await api.updateApplicationStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: updated.status } : a))
      );
      setActionSuccessMsg(`Updated candidate status to ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
      interview: applications.filter((a) => a.status === 'interview').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <section className="section" style={{ paddingTop: '1.5rem' }}>
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Candidate ATS Pipeline</h1>
              {user?.is_verified && <VerifiedBadge size="md" />}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Screen, shortlist, schedule interviews, and message applicant talent in one place.
            </p>
          </div>

          {actionSuccessMsg && (
            <div
              className="badge badge-success"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <Check size={14} />
              <span>{actionSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Filter Bar & Tabs */}
        <div
          className="glass-panel"
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Candidates' },
              { key: 'pending', label: 'Pending Review' },
              { key: 'shortlisted', label: 'Shortlisted' },
              { key: 'interview', label: 'Interview Scheduled' },
              { key: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(tab.key)}
                id={`ats-tab-${tab.key}`}
                style={{ fontSize: '0.8rem' }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {selectedJobId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedJobId('')}
              style={{ fontSize: '0.8rem' }}
            >
              Clear Job Filter
            </button>
          )}
        </div>

        {/* Applicant Cards */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            Loading candidates...
          </div>
        ) : applications.length === 0 ? (
          <div
            className="glass-panel"
            style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}
          >
            <Users size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>No candidates in this stage</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Select a different stage or promote applicants through your hiring funnel.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {applications.map((app) => {
              const applicant = app.applicant;
              const job = app.job;
              const match = app.match_score || 75;

              return (
                <div
                  key={app.id}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                  }}
                  id={`candidate-card-${app.id}`}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {/* Left: Applicant info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'var(--primary-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: '#FFF',
                        }}
                      >
                        {(applicant?.full_name || applicant?.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                            {applicant?.full_name || 'Candidate'}
                          </h3>
                          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                            Applied for: <strong style={{ color: '#FFF' }}>{job?.title}</strong>
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {applicant?.headline || applicant?.email} • {applicant?.location || 'Location Not Specified'}
                        </div>
                      </div>
                    </div>

                    {/* Right: AI Match Score & Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="match-score-pill high" style={{ fontSize: '0.8rem' }}>
                        <Sparkles size={13} />
                        <span>{match}% Skill Match</span>
                      </div>
                      <span
                        className={`badge ${
                          app.status === 'interview'
                            ? 'badge-warning'
                            : app.status === 'shortlisted'
                            ? 'badge-success'
                            : app.status === 'rejected'
                            ? 'badge-danger'
                            : 'badge-secondary'
                        }`}
                        style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                      >
                        {app.status === 'interview' ? '📅 Interview Scheduled' : app.status}
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {applicant?.skills && applicant.skills.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                        Candidate Skills:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {applicant.skills.map((skill, i) => (
                          <span key={i} className="badge badge-skill" style={{ fontSize: '0.75rem' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cover note if present */}
                  {app.cover_letter && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderLeft: '3px solid var(--primary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                      }}
                    >
                      <strong style={{ color: '#FFF' }}>Cover Note: </strong>
                      {app.cover_letter}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div
                    className="ats-card-action-bar"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '1rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Applied: {new Date(app.applied_at || app.created_at || Date.now()).toLocaleDateString()}
                    </div>

                    <div className="ats-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {/* View Candidate Details */}
                      {onViewCandidate && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onViewCandidate(app)}
                          id={`view-profile-btn-${app.id}`}
                        >
                          <Eye size={14} />
                          <span>View Profile</span>
                        </button>
                      )}

                      {/* Shortlist action */}
                      {app.status !== 'shortlisted' && app.status !== 'interview' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                          id={`shortlist-btn-${app.id}`}
                        >
                          <CheckCircle2 size={14} color="#34D399" />
                          <span>Shortlist</span>
                        </button>
                      )}

                      {/* Schedule Interview */}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onOpenSchedule(app)}
                        id={`schedule-btn-${app.id}`}
                      >
                        <Calendar size={14} />
                        <span>Schedule</span>
                      </button>

                      {/* Reject */}
                      {app.status !== 'rejected' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          style={{ color: 'var(--danger)' }}
                          id={`reject-btn-${app.id}`}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      )}

                      {/* Open Chat */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenChat(app.id)}
                        id={`chat-btn-${app.id}`}
                      >
                        <MessageSquare size={14} />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
