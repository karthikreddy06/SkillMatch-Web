import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Building2,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Application, Profile } from '../types';
import { api } from '../services/api';

interface MyApplicationsProps {
  user: Profile | null;
  onOpenChat: (applicationId: string) => void;
}

export const MyApplications: React.FC<MyApplicationsProps> = ({ user, onOpenChat }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const data = await api.getMyApplications(user.id);
        setApplications(data);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'interview':
        return <span className="badge badge-warning">📅 Interview Scheduled</span>;
      case 'shortlisted':
        return <span className="badge badge-info">⭐ Shortlisted</span>;
      case 'rejected':
        return <span className="badge badge-danger">Not Selected</span>;
      case 'offered':
        return <span className="badge badge-success">🎉 Offer Extended</span>;
      default:
        return <span className="badge badge-secondary">Pending Review</span>;
    }
  };

  const getStepProgress = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'shortlisted': return 2;
      case 'interview': return 3;
      case 'offered': return 4;
      case 'rejected': return -1;
      default: return 1;
    }
  };

  if (isLoading) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your applications...</p>
      </div>
    );
  }

  return (
    <section className="section" style={{ paddingTop: '1.5rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem' }}>My Applications & Interview Pipeline</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track your application status in real-time and coordinate interviews with hiring managers.
          </p>
        </div>

        {applications.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <UserCheck size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>No applications submitted yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Explore the Discover Jobs tab to find positions matching your skillset and submit 1-click applications!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {applications.map((app) => {
              const currentStep = getStepProgress(app.status);
              const job = app.job;

              return (
                <div
                  key={app.id}
                  className="glass-panel"
                  style={{
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                  }}
                >
                  {/* Top Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'var(--primary-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          color: '#FFF',
                        }}
                      >
                        {(job?.company_name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem' }}>{job?.title || 'Job Posting'}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <span>{job?.company_name}</span>
                          <span>•</span>
                          <span>{job?.location || 'Remote'}</span>
                          <span>•</span>
                          <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="match-score-pill high" style={{ fontSize: '0.75rem' }}>
                        <Sparkles size={12} />
                        <span>{app.match_score}% Match</span>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* Interview Callout Banner if status is 'interview' */}
                  {app.status === 'interview' && (
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(245, 158, 11, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Calendar size={18} color="#FBBF24" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#FDE68A', fontSize: '0.95rem' }}>
                            Interview Scheduled!
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                            The hiring manager sent an interview invitation. Check your chat inbox for details and meeting instructions.
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => onOpenChat(app.id)}
                        style={{ background: '#F59E0B', color: '#000', fontWeight: 700 }}
                      >
                        <MessageSquare size={14} />
                        <span>Open Interview Chat</span>
                      </button>
                    </div>
                  )}

                  {/* Interactive Status Progression Stepper */}
                  <div
                    style={{
                      padding: '1.25rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', position: 'relative' }}>
                      {[
                        { title: 'Application Sent', desc: 'Received by system', step: 1 },
                        { title: 'Resume Review', desc: 'Shortlist review', step: 2 },
                        { title: 'Interview Stage', desc: 'Live assessment', step: 3 },
                        { title: 'Decision', desc: 'Offer / Conclusion', step: 4 },
                      ].map((s) => {
                        const isCompleted = currentStep >= s.step;
                        const isCurrent = currentStep === s.step;

                        return (
                          <div key={s.step} style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                margin: '0 auto 0.5rem auto',
                                background: isCompleted
                                  ? 'var(--primary-gradient)'
                                  : 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFF',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                boxShadow: isCurrent ? '0 0 12px rgba(99, 102, 241, 0.5)' : 'none',
                              }}
                            >
                              {isCompleted ? <CheckCircle2 size={16} /> : s.step}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isCompleted ? '#FFF' : 'var(--text-muted)' }}>
                              {s.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {s.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '1rem',
                    }}
                  >
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenChat(app.id)}
                      id={`chat-app-btn-${app.id}`}
                    >
                      <MessageSquare size={15} />
                      <span>Message Recruiter</span>
                    </button>
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
