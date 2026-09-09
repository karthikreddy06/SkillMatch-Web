import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Bookmark, BriefcaseBusiness, CheckCircle2, FileText, MessageSquare, Sparkles } from 'lucide-react';
import { Application, Job, Profile } from '../types';
import { api } from '../services/api';

interface CandidateOverviewProps {
  user: Profile | null;
  savedJobIds: Set<string>;
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onViewApplications: () => void;
  onRequestLocation: () => void;
}

export const CandidateOverview: React.FC<CandidateOverviewProps> = ({
  user,
  savedJobIds,
  jobs,
  onSelectJob,
  onToggleSave,
  onViewApplications,
  onRequestLocation,
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api
      .getMyApplications(user.id)
      .then(setApplications)
      .catch((error) => console.error('Failed to load candidate overview:', error))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const recommendedJobs = useMemo(
    () =>
      jobs
        .filter((job) => !job.has_applied)
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        .slice(0, 4),
    [jobs]
  );

  const averageMatch = applications.length
    ? Math.round(applications.reduce((sum, application) => sum + (application.match_score || 0), 0) / applications.length)
    : recommendedJobs.length
    ? Math.round(recommendedJobs.reduce((sum, job) => sum + (job.match_score || 0), 0) / recommendedJobs.length)
    : 0;

  const hasSkills = Boolean(user?.skills?.length);

  const matchMetrics = [
    { label: 'Skill match', value: hasSkills ? Math.min(98, averageMatch + 5) : 0 },
    { label: 'Location fit', value: user?.latitude !== undefined && user?.longitude !== undefined ? Math.min(96, averageMatch + 1) : 0 },
    { label: 'Experience fit', value: user?.experience_level ? Math.min(94, averageMatch - 2) : 0 },
    { label: 'Overall match', value: averageMatch },
  ];

  return (
    <div className="dashboard-page candidate-overview-page">
      {/* Location Onboarding Banner if location not set */}
      {!(typeof user?.latitude === 'number' && typeof user?.longitude === 'number') && (
        <div className="location-onboarding-card">
          <div>
            <strong>Enable location matching</strong>
            <p>Use your location to find relevant jobs near you and calculate accurate commute times.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={onRequestLocation}>
              Allow Location
            </button>
          </div>
        </div>
      )}

      {/* Main Page Header */}
      <header className="dashboard-page-header">
        <div className="dashboard-header-title-block">
          <span className="dashboard-eyebrow">Candidate workspace</span>
          <h1>Overview</h1>
          <p>Your personalized job activity and AI-powered matches.</p>
        </div>
        <div className="dashboard-toolbar">
          <button className="dashboard-select">Last 30 days</button>
          <button className="dashboard-select">All jobs</button>
          <button className="dashboard-select">Recommended</button>
        </div>
      </header>

      {/* 4-Stat Metric Grid */}
      <section className="dashboard-stat-grid">
        {[
          { label: 'Recommended Jobs', value: jobs.length, note: 'Active matches', icon: Sparkles },
          { label: 'Applications', value: applications.length, note: 'Across active roles', icon: FileText },
          { label: 'Saved Jobs', value: savedJobIds.size, note: 'Your shortlist', icon: Bookmark },
          { label: 'Average Match', value: averageMatch ? `${averageMatch}%` : '—', note: hasSkills ? 'Based on your profile' : 'Add skills to calculate', icon: Activity },
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

      {/* Match Performance & Activity Panel Grid */}
      <div className="dashboard-content-grid">
        <section className="dashboard-panel match-performance-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Your AI Match Performance</h2>
              <p>Transparent signals behind your recommendations.</p>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="match-performance-list">
            {matchMetrics.map((metric) => (
              <div className="match-performance-row" key={metric.label}>
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value ? `${metric.value}%` : 'Complete profile'}</strong>
                </div>
                <div className="match-progress">
                  <i style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          {!hasSkills && (
            <button className="dashboard-inline-link" onClick={() => onViewApplications()} style={{ marginTop: '1rem' }}>
              Add profile skills to improve matches <ArrowUpRight size={14} />
            </button>
          )}
        </section>

        <section className="dashboard-panel activity-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest movement in your workspace.</p>
            </div>
            <Activity size={18} />
          </div>
          {isLoading ? (
            <p className="dashboard-muted">Loading activity...</p>
          ) : (
            <div className="dashboard-activity-list">
              {applications.slice(0, 4).map((application) => (
                <div className="dashboard-activity-item" key={application.id}>
                  <span className="activity-dot">
                    <CheckCircle2 size={13} />
                  </span>
                  <div>
                    <strong>Application submitted</strong>
                    <span>
                      {application.job?.title || 'Job application'} · {application.status}
                    </span>
                  </div>
                </div>
              ))}
              {savedJobIds.size > 0 && (
                <div className="dashboard-activity-item">
                  <span className="activity-dot pink">
                    <Bookmark size={13} />
                  </span>
                  <div>
                    <strong>Jobs saved</strong>
                    <span>{savedJobIds.size} opportunities in your shortlist</span>
                  </div>
                </div>
              )}
              {!applications.length && !savedJobIds.size && (
                <p className="dashboard-muted">Your job activity will appear here as you save and apply for jobs.</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Recommended Jobs Grid */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Recommended Jobs</h2>
            <p>Roles ranked for your current profile skills and preferences.</p>
          </div>
          <button className="dashboard-inline-link" onClick={onViewApplications}>
            View all jobs <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="dashboard-job-grid">
          {recommendedJobs.map((job) => (
            <article className="dashboard-job-card" key={job.id}>
              <div>
                <div className="dashboard-job-card-header">
                  <span className="dashboard-company-mark">{(job.company_name || 'C')[0]}</span>
                  <span className="dashboard-match-badge">
                    {job.match_score ? `${job.match_score}% Match` : 'Complete profile'}
                  </span>
                </div>
                <h3>{job.title}</h3>
                <strong>{job.company_name}</strong>
                <p>
                  {job.location} · {job.job_type}
                </p>
                <span className="dashboard-job-salary">{job.salary_range || 'Salary discussed'}</span>
                <div className="dashboard-job-skills">
                  {(job.skills || []).slice(0, 3).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
              <div className="dashboard-job-actions">
                <button className="btn btn-primary btn-sm" onClick={() => onSelectJob(job)}>
                  View Details
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onToggleSave(job)}>
                  <Bookmark size={14} fill={savedJobIds.has(job.id) ? 'currentColor' : 'none'} />
                  {savedJobIds.has(job.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </article>
          ))}
          {!recommendedJobs.length && (
            <div className="dashboard-empty" style={{ gridColumn: '1 / -1' }}>
              No recommendations yet. Add your skills to improve job matching.
            </div>
          )}
        </div>
      </section>

      {/* Recent Applications Table */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Recent Applications</h2>
            <p>Track your job application pipeline and response status.</p>
          </div>
          <button className="dashboard-inline-link" onClick={onViewApplications}>
            View all applications <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Applied Date</th>
                <th>Match Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 5).map((application) => (
                <tr key={application.id}>
                  <td>{application.job?.title || 'Job'}</td>
                  <td>{application.job?.company_name || 'Company'}</td>
                  <td>{application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently'}</td>
                  <td>{application.match_score || 0}%</td>
                  <td>
                    <span className={`dashboard-status ${application.status}`}>
                      {application.status === 'pending' ? 'Under review' : application.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.length && (
            <div className="dashboard-empty">No applications submitted yet. Explore recommended jobs above.</div>
          )}
        </div>
      </section>
    </div>
  );
};
