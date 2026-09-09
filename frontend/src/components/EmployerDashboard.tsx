import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Clock3, FileText, Plus, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Application, EmployerStats } from '../types';
import { api } from '../services/api';

interface EmployerDashboardProps {
  onOpenPostJob: () => void;
  onViewPipeline: (jobId?: string) => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ onOpenPostJob, onViewPipeline }) => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<EmployerStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([api.getEmployerStats(user.id), api.getEmployerApplicants(user.id)])
      .then(([stats, applicantData]) => {
        setStatsData(stats);
        setApplications(applicantData);
      })
      .catch((error) => console.error('Failed to load employer overview:', error))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const stats = statsData?.stats || {
    active_jobs: 0,
    total_applicants: applications.length,
    new_today: 0,
    shortlisted: 0,
    interview: 0,
  };

  const averageMatch = applications.length
    ? Math.round(applications.reduce((sum, application) => sum + (application.match_score || 0), 0) / applications.length)
    : 0;

  const performance = [
    { label: 'Applications', value: stats.total_applicants, color: 'purple' },
    { label: 'Shortlisted', value: stats.shortlisted, color: 'pink' },
    { label: 'Interviews', value: stats.interview, color: 'green' },
    { label: 'Hired', value: applications.filter((application) => application.status === 'offered').length, color: 'blue' },
  ];

  const candidates = useMemo(
    () => applications.slice().sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 5),
    [applications]
  );

  if (isLoading) return <div className="dashboard-page dashboard-loading">Loading hiring activity...</div>;

  return (
    <div className="dashboard-page employer-overview-page">
      {/* Header */}
      <header className="dashboard-page-header">
        <div className="dashboard-header-title-block">
          <span className="dashboard-eyebrow">Employer workspace</span>
          <h1>Overview</h1>
          <p>Track your hiring activity and discover qualified candidates.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenPostJob}>
          <Plus size={16} /> Post a job
        </button>
      </header>

      {/* 4 Stat Cards */}
      <section className="dashboard-stat-grid">
        {[
          { label: 'Active Jobs', value: stats.active_jobs, note: 'Open listings', icon: BriefcaseBusiness },
          { label: 'Total Applicants', value: stats.total_applicants, note: `${stats.new_today} new today`, icon: Users },
          { label: 'Shortlisted', value: stats.shortlisted, note: 'Ready for review', icon: CheckCircle2 },
          { label: 'Average Match', value: averageMatch ? `${averageMatch}%` : '—', note: 'Across applicants', icon: Sparkles },
        ].map(({ label, value, note, icon: Icon }) => (
          <article className="dashboard-stat-card" key={label}>
            <span className="dashboard-stat-icon">
              <Icon size={17} />
            </span>
            <div>
              <span className="dashboard-stat-label">{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          </article>
        ))}
      </section>

      {/* Performance & Candidate Match Grid */}
      <div className="dashboard-content-grid">
        <section className="dashboard-panel application-performance-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Application Performance</h2>
              <p>Candidate movement across your hiring funnel.</p>
            </div>
            <Clock3 size={17} className="dashboard-panel-icon" />
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

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>AI Candidate Matching</h2>
              <p>Top matches from actual applicants.</p>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="candidate-match-list">
            {candidates.slice(0, 3).map((application) => (
              <div className="candidate-match-row" key={application.id}>
                <span className="dashboard-company-mark">{(application.applicant?.full_name || 'C')[0]}</span>
                <div>
                  <strong>{application.applicant?.full_name || 'Candidate'}</strong>
                  <span>{(application.applicant?.skills || []).slice(0, 3).join(' · ') || 'Skills not added yet'}</span>
                </div>
                <b>{application.match_score || 0}%</b>
              </div>
            ))}
            {!candidates.length && <p className="dashboard-muted">Applicant matches will appear here as candidates apply.</p>}
          </div>
        </section>
      </div>

      {/* Recent Applications Table */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Recent Applications</h2>
            <p>Review your latest candidate activity.</p>
          </div>
          <button className="dashboard-inline-link" onClick={() => onViewPipeline()}>
            View all applications <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="dashboard-table-wrap">
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
                  <td>{application.applicant?.full_name || 'Candidate'}</td>
                  <td>{application.job?.title || 'Job'}</td>
                  <td>{application.match_score || 0}%</td>
                  <td>
                    {application.applicant?.experience_years
                      ? `${application.applicant.experience_years} years`
                      : 'Not specified'}
                  </td>
                  <td>
                    <span className={`dashboard-status ${application.status}`}>{application.status}</span>
                  </td>
                  <td>
                    <button className="dashboard-table-action" onClick={() => onViewPipeline(application.job_id)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.length && <div className="dashboard-empty">No applications received yet.</div>}
        </div>
      </section>

      {/* Active Job Listings */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Active Job Listings</h2>
            <p>Manage openings and review their candidate pipelines.</p>
          </div>
          <button className="dashboard-inline-link" onClick={() => onViewPipeline()}>
            Manage listings <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="employer-job-list">
          {(statsData?.jobs || []).map((job) => (
            <article className="employer-job-row" key={job.id}>
              <span className="dashboard-company-mark">
                <BriefcaseBusiness size={16} />
              </span>
              <div>
                <strong>{job.title}</strong>
                <span>
                  {job.location} · {job.salary_range || 'Salary discussed'}
                </span>
              </div>
              <span className="employer-job-count">{job.applicants_count} applicants</span>
              <span className="dashboard-status shortlisted">{job.status}</span>
              <button className="dashboard-table-action" onClick={() => onViewPipeline(job.id)}>
                View applicants
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
