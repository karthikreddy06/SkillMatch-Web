import React, { useState, useEffect } from 'react';
import {
  Heart,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  Ruler,
  Calendar,
  Search,
} from 'lucide-react';
import { SavedJobItem, Job, Profile } from '../types';
import { api } from '../services/api';

interface SavedJobsViewProps {
  user: Profile | null;
  onSelectJob: (job: Job) => void;
  onApplyJob: (job: Job) => void;
  onRemoveSaved: (jobId: string) => void;
  onNavigateDiscover?: () => void;
}

export const SavedJobsView: React.FC<SavedJobsViewProps> = ({
  user,
  onSelectJob,
  onApplyJob,
  onRemoveSaved,
  onNavigateDiscover,
}) => {
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const data = await api.getSavedJobs(user.id);
        setSavedJobs(data);
      } catch (err) {
        console.error('Error fetching saved jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSaved();
  }, [user?.id]);

  const handleRemove = async (jobId: string) => {
    if (!user?.id || !jobId) return;
    try {
      await api.toggleSaveJob(jobId, user.id, false);
      setSavedJobs((prev) => prev.filter((item) => item.job?.id !== jobId && item.job_id !== jobId));
      onRemoveSaved(jobId);
    } catch (err) {
      console.error('Error removing saved job:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently posted';
    try {
      const date = new Date(dateString);
      return `Posted ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return 'Recently posted';
    }
  };

  return (
    <section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#6366F1', textTransform: 'uppercase' }}>
              Your Bookmarks
            </span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
            Saved Opportunities
          </h2>
          <p style={{ color: 'var(--text-secondary, #64748B)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Jobs bookmarked for fast review, comparison, and one-click application.
          </p>
        </div>

        {/* Loading Skeleton Grid */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F1F5F9' }} />
                  <div style={{ width: '80px', height: '24px', borderRadius: '12px', background: '#F1F5F9' }} />
                </div>
                <div style={{ height: '20px', width: '70%', background: '#F1F5F9', borderRadius: '4px' }} />
                <div style={{ height: '14px', width: '40%', background: '#F1F5F9', borderRadius: '4px' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ height: '24px', width: '100px', background: '#F1F5F9', borderRadius: '6px' }} />
                  <div style={{ height: '24px', width: '80px', background: '#F1F5F9', borderRadius: '6px' }} />
                </div>
                <div style={{ height: '40px', background: '#F1F5F9', borderRadius: '8px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : savedJobs.length === 0 ? (
          /* Empty State */
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              padding: '4rem 2rem',
              textAlign: 'center',
              maxWidth: '560px',
              margin: '2rem auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(99, 102, 241, 0.1))',
                color: '#EC4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <Heart size={36} fill="none" strokeWidth={2} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
              No saved jobs yet
            </h3>

            <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Save jobs you're interested in while browsing recommendations, and return here anytime to compare and apply.
            </p>

            <button
              className="btn btn-primary"
              onClick={() => {
                if (onNavigateDiscover) onNavigateDiscover();
                else window.location.hash = '#discover';
              }}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              }}
            >
              <Search size={18} />
              <span>Discover Jobs →</span>
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {savedJobs.map((item) => {
              const job = item.job || item.job_details;
              if (!job || !job.id) return null;

              const isRemote =
                (job.job_type || '').toLowerCase().includes('remote') ||
                (job.location || '').toLowerCase().includes('remote');

              const initial = (job.company_name || job.title || 'C')[0].toUpperCase();

              return (
                <article
                  key={item.id || job.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  className="interactive-card"
                >
                  <div>
                    {/* Top Row: Logo/Avatar + Match Score */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                        }}
                      >
                        {initial}
                      </div>

                      {typeof job.match_score === 'number' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#4F46E5',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                          }}
                        >
                          <Sparkles size={13} color="#4F46E5" />
                          <span>{job.match_score}% Match</span>
                        </div>
                      )}
                    </div>

                    {/* Job Title & Company */}
                    <h3
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        margin: '0 0 0.25rem 0',
                        cursor: 'pointer',
                        lineHeight: 1.3,
                      }}
                      onClick={() => onSelectJob(job)}
                    >
                      {job.title}
                    </h3>

                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#475569',
                        marginBottom: '1rem',
                      }}
                    >
                      {job.company_name}
                    </div>

                    {/* Key Attributes Pills */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          background: '#F1F5F9',
                          color: '#334155',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                        }}
                      >
                        <MapPin size={13} color="#6366F1" />
                        {isRemote ? '🌐 Remote' : job.location || 'Location specified'}
                      </span>

                      {typeof job.distance_km === 'number' && !isRemote && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '8px',
                            background: '#F0FDF4',
                            color: '#166534',
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            border: '1px solid #DCFCE7',
                          }}
                        >
                          <Ruler size={13} color="#16A34A" />
                          {job.distance_km} km away
                        </span>
                      )}

                      {job.job_type && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '8px',
                            background: '#F1F5F9',
                            color: '#334155',
                            fontSize: '0.82rem',
                            fontWeight: 500,
                          }}
                        >
                          <Clock size={13} color="#64748B" />
                          {job.job_type}
                        </span>
                      )}

                      {job.salary_range && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '8px',
                            background: '#EFF6FF',
                            color: '#1E40AF',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            border: '1px solid #DBEAFE',
                          }}
                        >
                          <DollarSign size={13} color="#2563EB" />
                          {job.salary_range}
                        </span>
                      )}
                    </div>

                    {/* Required Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.35rem',
                          marginBottom: '1rem',
                        }}
                      >
                        {job.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: 'rgba(99, 102, 241, 0.08)',
                              color: '#4F46E5',
                              fontWeight: 600,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 4 && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', alignSelf: 'center' }}>
                            +{job.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Created at date */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        color: '#94A3B8',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <Calendar size={13} />
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #F1F5F9',
                    }}
                  >
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectJob(job)}
                      style={{
                        flex: 1,
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      View Details
                    </button>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemove(job.id)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        color: '#EC4899',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                      title="Remove from saved jobs"
                    >
                      <Heart size={16} fill="#EC4899" />
                      <span>Saved</span>
                    </button>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onApplyJob(job)}
                      style={{
                        flex: 1.2,
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{job.has_applied ? 'Applied' : 'Apply Now'}</span>
                      {!job.has_applied && <ArrowRight size={14} />}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
