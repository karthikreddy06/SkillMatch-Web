import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Sparkles,
  Users,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Application, EmployerStats, Job } from '../types';
import { api } from '../services/api';

interface EmployerDashboardProps {
  onOpenPostJob: () => void;
  onViewPipeline: (jobId?: string) => void;
  onEditJob?: (job: Job) => void;
  onViewCandidate?: (application: Application) => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  onOpenPostJob,
  onViewPipeline,
  onEditJob,
  onViewCandidate,
}) => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<EmployerStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    if (!user?.id) return;
    setIsLoading(true);
    Promise.all([api.getEmployerStats(user.id), api.getEmployerApplicants(user.id)])
      .then(([stats, applicantData]) => {
        setStatsData(stats);
        setApplications(applicantData);
      })
      .catch((error) => console.error('Failed to load employer overview:', error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const stats = statsData?.stats || {
    active_jobs: 0,
    total_applicants: applications.length,
    new_today: 0,
    shortlisted: 0,
    interview: 0,
  };

  const averageMatch = applications.length
    ? Math.round(
        applications.reduce((sum, application) => sum + (application.match_score || 0), 0) /
          applications.length
      )
    : 0;

  const performance = [
    { label: 'Applications', value: stats.total_applicants, color: 'purple' },
    { label: 'Shortlisted', value: stats.shortlisted, color: 'pink' },
    { label: 'Interviews', value: stats.interview, color: 'green' },
    {
      label: 'Hired',
      value: applications.filter((application) => application.status === 'offered').length,
      color: 'blue',
    },
  ];

  const candidates = useMemo(
    () => applications.slice().sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 5),
    [applications]
  );

  const employerName = user?.company_name || user?.full_name || 'Employer';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '👋' };
    if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '👋' };
    if (hour >= 17 && hour < 21) return { text: 'Good evening', emoji: '👋' };
    return { text: 'Good night', emoji: '🌙' };
  }, []);

  const handleEditJobClick = async (jobSummary: any) => {
    if (!onEditJob) return;
    try {
      const fullJob = await api.getJobDetail(jobSummary.id);
      onEditJob(fullJob);
    } catch {
      onEditJob({
        id: jobSummary.id,
        employer_id: user?.id || '',
        title: jobSummary.title,
        company_name: user?.company_name || user?.full_name || 'Hiring Organization',
        location: jobSummary.location || '',
        job_type: 'Full-time',
        shift_preference: 'Day Shift',
        flexible_hours: true,
        salary_range: jobSummary.salary_range || '',
        description: '',
        status: jobSummary.status || 'active',
        created_at: jobSummary.created_at || new Date().toISOString(),
      });
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await api.updateJob(jobId, { status: nextStatus });
      loadData();
    } catch (err) {
      console.error('Failed to toggle job status:', err);
    }
  };

  return (
    <div className="dashboard-page employer-overview-page">
      {/* Hero Welcome Banner */}
      <section className="dashboard-welcome-hero glass-panel">
        <div className="dashboard-welcome-content">
          <span className="dashboard-welcome-eyebrow">
            <Sparkles size={14} /> Intelligent Hiring Workspace
          </span>
          <h1>
            {greeting.text}, {employerName} {greeting.emoji}
          </h1>
          <p>
            Find the right people for your team. Manage your jobs, discover matched candidates, and move great applicants forward.
          </p>
          <div className="dashboard-welcome-actions">
            <button className="btn btn-primary btn-primary-orange btn-pill" onClick={onOpenPostJob} id="hero-post-job-btn">
              <Plus size={16} /> Post a Job →
            </button>
            <button className="btn btn-secondary btn-pill" onClick={() => onViewPipeline()} id="hero-view-applications-btn">
              View Applications ({applications.length})
            </button>
          </div>
        </div>
        <div className="dashboard-welcome-badge-card">
          <div className="employer-hero-stat">
            {isLoading ? (
              <span className="skeleton-box" style={{ width: '40px', height: '28px', margin: '4px 0' }} />
            ) : (
              <strong>{stats.active_jobs}</strong>
            )}
            <small>Active Listings</small>
          </div>
          <div className="completion-meta">
            <strong>Hiring Activity</strong>
            <span>{isLoading ? 'Loading applicants...' : `${stats.total_applicants} applicants across active roles`}</span>
          </div>
        </div>
      </section>

      {/* 4 Stat Cards */}
      <section className="dashboard-stat-grid">
        {[
          { label: 'Active Jobs', value: stats.active_jobs, note: 'Open listings', icon: BriefcaseBusiness, color: 'indigo' },
          { label: 'Total Applicants', value: stats.total_applicants, note: `${stats.new_today} new today`, icon: Users, color: 'purple' },
          { label: 'Shortlisted', value: stats.shortlisted, note: 'Ready for review', icon: CheckCircle2, color: 'orange' },
          { label: 'Average Match', value: averageMatch ? `${averageMatch}%` : '—', note: 'Across applicants', icon: Sparkles, color: 'emerald' },
        ].map(({ label, value, note, icon: Icon, color }) => (
          <article className={`dashboard-stat-card glass-panel theme-${color}`} key={label}>
            <span className="dashboard-stat-icon">
              <Icon size={18} />
            </span>
            <div>
              <span className="dashboard-stat-label">{label}</span>
              {isLoading ? (
                <span className="skeleton-box" style={{ width: '45px', height: '24px', margin: '4px 0' }} />
              ) : (
                <strong>{value}</strong>
              )}
              <small>{note}</small>
            </div>
          </article>
        ))}
      </section>

      {/* Performance & Candidate Match Grid */}
      <div className="dashboard-content-grid">
        <section className="dashboard-panel glass-panel application-performance-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Application Performance</h2>
              <p>Candidate movement across your hiring funnel.</p>
            </div>
            <Clock3 size={17} className="panel-accent-icon" />
          </div>
          <div className="employer-performance-chart">
            {performance.map((item) => (
              <div className="employer-performance-column" key={item.label}>
                <div
                  className={`employer-bar ${item.color}`}
                  style={{ height: `${Math.max(8, Math.min(100, (item.value / Math.max(stats.total_applicants, 1)) * 100))}%` }}
                >
                  <span>{item.value}</span>
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel glass-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>AI Candidate Matching</h2>
              <p>Top matches from actual applicants.</p>
            </div>
            <Sparkles size={18} className="panel-accent-icon" />
          </div>
          <div className="candidate-match-list">
            {candidates.slice(0, 4).map((application) => (
              <div
                className="candidate-match-row interactive-card"
                key={application.id}
                onClick={() => onViewCandidate && onViewCandidate(application)}
                style={{ cursor: onViewCandidate ? 'pointer' : 'default' }}
                title="Click to view full candidate profile"
              >
                <span className="dashboard-company-mark">{(application.applicant?.full_name || 'C')[0].toUpperCase()}</span>
                <div>
                  <strong>{application.applicant?.full_name || 'Candidate'}</strong>
                  <span>{(application.applicant?.skills || []).slice(0, 3).join(' · ') || 'Skills not added yet'}</span>
                </div>
                <b className="match-score-pill">{application.match_score || 0}%</b>
              </div>
            ))}
            {!candidates.length && <p className="dashboard-muted">Applicant matches will appear here as candidates apply.</p>}
          </div>
        </section>
      </div>

      {/* Recent Applications Section */}
      <section className="dashboard-panel glass-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Recent Applications</h2>
            <p>Review your latest candidate activity.</p>
          </div>
          <button className="dashboard-inline-link" onClick={() => onViewPipeline()} id="view-all-pipeline-btn">
            View all applications <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Desktop Table View (>= 640px) */}
        <div className="dashboard-table-wrap employer-desktop-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied for</th>
                <th>Match</th>
                <th>Experience</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 6).map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.applicant?.full_name || 'Candidate'}</strong>
                  </td>
                  <td>{application.job?.title || 'Job'}</td>
                  <td>
                    <span className="dashboard-table-score">{application.match_score || 0}%</span>
                  </td>
                  <td>
                    {application.applicant?.experience_years
                      ? `${application.applicant.experience_years} years`
                      : 'Not specified'}
                  </td>
                  <td>
                    <span className={`dashboard-status ${application.status}`}>{application.status}</span>
                  </td>
                  <td>
                    <button
                      className="dashboard-table-action"
                      onClick={() => {
                        if (onViewCandidate) onViewCandidate(application);
                        else onViewPipeline(application.job_id);
                      }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.length && <div className="dashboard-empty">No applications received yet.</div>}
        </div>

        {/* Mobile Cards View (< 640px) */}
        <div className="employer-mobile-applications-list">
          {applications.slice(0, 6).map((application) => (
            <div
              key={application.id}
              className="employer-mobile-app-card interactive-card glass-panel"
              onClick={() => onViewCandidate && onViewCandidate(application)}
            >
              <div className="employer-mobile-app-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="dashboard-company-mark">
                    {(application.applicant?.full_name || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                      {application.applicant?.full_name || 'Candidate'}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {application.job?.title || 'Job Opening'}
                    </span>
                  </div>
                </div>
                <span className="match-score-pill" style={{ fontSize: '0.8rem' }}>
                  {application.match_score || 0}%
                </span>
              </div>
              <div className="employer-mobile-app-footer">
                <span className={`dashboard-status ${application.status}`}>{application.status}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewCandidate) onViewCandidate(application);
                    else onViewPipeline(application.job_id);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  Review Profile →
                </button>
              </div>
            </div>
          ))}
          {!applications.length && <div className="dashboard-empty">No applications received yet.</div>}
        </div>
      </section>

      {/* Active Job Listings */}
      <section className="dashboard-panel glass-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Active Job Listings</h2>
            <p>Manage openings and review their candidate pipelines.</p>
          </div>
          <button className="dashboard-inline-link" onClick={onOpenPostJob} id="dashboard-post-job-link">
            <Plus size={14} /> Post New Job
          </button>
        </div>
        <div className="employer-job-list">
          {(statsData?.jobs || []).map((job) => (
            <article className="employer-job-row glass-panel" key={job.id}>
              <span className="dashboard-company-mark">
                <BriefcaseBusiness size={16} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ fontSize: '0.92rem' }}>{job.title}</strong>
                <span className="job-card-meta" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {job.location} · {job.salary_range || 'Salary discussed'}
                </span>
              </div>
              <span className="employer-job-count">{job.applicants_count} applicants</span>
              <span className={`dashboard-status ${job.status === 'closed' ? 'rejected' : 'shortlisted'}`}>
                {job.status}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  className="dashboard-table-action"
                  onClick={() => handleEditJobClick(job)}
                  title="Edit job opening"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  id={`edit-job-btn-${job.id}`}
                >
                  <Pencil size={12} />
                  <span>Edit</span>
                </button>
                <button
                  className="dashboard-table-action"
                  onClick={() => onViewPipeline(job.id)}
                  title="View candidates for this job"
                  id={`view-applicants-btn-${job.id}`}
                >
                  View applicants
                </button>
              </div>
            </article>
          ))}
          {(!statsData?.jobs || statsData.jobs.length === 0) && (
            <div className="dashboard-empty">
              <p>No jobs posted yet.</p>
              <button className="btn btn-primary btn-sm" onClick={onOpenPostJob} style={{ marginTop: '0.5rem' }}>
                <Plus size={14} /> Post Your First Job
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
