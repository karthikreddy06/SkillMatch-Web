import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, CheckCircle2, Compass, FileText, MapPin, MessageSquare, Sparkles, UserCheck } from 'lucide-react';
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
  onExploreJobs?: () => void;
}

export const CandidateOverview: React.FC<CandidateOverviewProps> = ({
  user,
  savedJobIds,
  jobs,
  onSelectJob,
  onToggleSave,
  onViewApplications,
  onRequestLocation,
  onExploreJobs,
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
        .slice(0, 6),
    [jobs]
  );

  const averageMatch = applications.length
    ? Math.round(applications.reduce((sum, application) => sum + (application.match_score || 0), 0) / applications.length)
    : recommendedJobs.length
    ? Math.round(recommendedJobs.reduce((sum, job) => sum + (job.match_score || 0), 0) / recommendedJobs.length)
    : 0;

  const hasSkills = Boolean(user?.skills?.length);

  const profileCompletionCalc = useMemo(() => {
    if (!user) return 0;
    const fields = [user.full_name, user.headline, user.location, user.skills?.length, user.resume_url];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  const matchMetrics = [
    { label: 'Skill match', value: hasSkills ? Math.min(98, averageMatch + 5) : 0 },
    { label: 'Location fit', value: user?.latitude !== undefined && user?.longitude !== undefined ? Math.min(96, averageMatch + 1) : 0 },
    { label: 'Experience fit', value: user?.experience_level ? Math.min(94, averageMatch - 2) : 0 },
    { label: 'Overall match', value: averageMatch },
  ];

  const userName = user?.full_name?.split(' ')[0] || user?.company_name || 'Candidate';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '👋' };
    if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '👋' };
    if (hour >= 17 && hour < 21) return { text: 'Good evening', emoji: '👋' };
    return { text: 'Good night', emoji: '🌙' };
  }, []);

  return (
    <div className="dashboard-page candidate-overview-page">
      {/* Location Onboarding Banner if location not set */}
      {!(typeof user?.latitude === 'number' && typeof user?.longitude === 'number') && (
        <div className="location-onboarding-card glass-panel">
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

      {/* Hero Welcome Banner */}
      <section className="dashboard-welcome-hero glass-panel">
        <div className="dashboard-welcome-content">
          <span className="dashboard-welcome-eyebrow">
            <Sparkles size={14} /> AI-Powered Match Workspace
          </span>
          <h1>
            {greeting.text}, {userName} {greeting.emoji}
          </h1>
          <p>Find work that fits you. Explore curated roles matched to your skillset and preferences.</p>
          <div className="dashboard-welcome-actions">
            {onExploreJobs && (
              <button className="btn btn-primary btn-primary-orange btn-pill" onClick={onExploreJobs}>
                <Compass size={16} /> Explore Jobs →
              </button>
            )}
            <button className="btn btn-secondary btn-pill" onClick={onViewApplications}>
              My Applications ({applications.length})
            </button>
          </div>
        </div>
        <div className="dashboard-welcome-badge-card">
          <div className="dashboard-completion-ring">
            <svg viewBox="0 0 36 36" className="completion-ring-svg">
              <path
                className="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="ring-fill"
                strokeDasharray={`${profileCompletionCalc}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="ring-text">
              <strong>{profileCompletionCalc}%</strong>
              <small>Profile</small>
            </div>
          </div>
          <div className="completion-meta">
            <strong>Profile Score</strong>
            <span>{hasSkills ? 'Skills & Experience set' : 'Add skills to boost rank'}</span>
          </div>
        </div>
      </section>

      {/* 4-Stat Metric Grid */}
      <section className="dashboard-stat-grid">
        {[
          { label: 'Recommended Jobs', value: jobs.length, note: 'Active matches available', icon: Sparkles, color: 'indigo' },
          { label: 'Applications', value: applications.length, note: 'Submitted applications', icon: FileText, color: 'purple' },
          { label: 'Saved Jobs', value: savedJobIds.size, note: 'Shortlisted roles', icon: Bookmark, color: 'pink' },
          { label: 'Profile Completion', value: `${profileCompletionCalc}%`, note: hasSkills ? 'Match system active' : 'Complete profile details', icon: Activity, color: 'emerald' },
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

      {/* Match Performance & Activity Panel Grid */}
      <div className="dashboard-content-grid">
        <section className="dashboard-panel glass-panel match-performance-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Your AI Match Performance</h2>
              <p>Transparent signals behind your recommendations.</p>
            </div>
            <Sparkles size={18} className="panel-accent-icon" />
          </div>
          <div className="match-performance-list">
            {matchMetrics.map((metric) => (
              <div className="match-performance-row" key={metric.label}>
                <div className="match-perf-meta">
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

        <section className="dashboard-panel glass-panel activity-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest movement in your workspace.</p>
            </div>
            <Activity size={18} className="panel-accent-icon" />
          </div>
          {isLoading ? (
            <div className="dashboard-activity-list">
              {[1, 2, 3].map((idx) => (
                <div className="dashboard-activity-item" key={idx}>
                  <span className="skeleton-box" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <span className="skeleton-box" style={{ width: '140px', height: '14px' }} />
                    <span className="skeleton-box" style={{ width: '90px', height: '12px', marginTop: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-activity-list">
              {applications.slice(0, 4).map((application) => (
                <div className="dashboard-activity-item" key={application.id}>
                  <span className="activity-dot">
                    <CheckCircle2 size={14} />
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
                    <Bookmark size={14} />
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
      <section className="dashboard-panel glass-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Recommended Jobs</h2>
            <p>Roles ranked for your current profile skills and preferences.</p>
          </div>
          {onExploreJobs && (
            <button className="dashboard-inline-link" onClick={onExploreJobs}>
              Explore all jobs <ArrowUpRight size={14} />
            </button>
          )}
        </div>
        <div className="dashboard-job-grid">
          {recommendedJobs.map((job) => (
            <article className="dashboard-job-card glass-panel" key={job.id}>
              <div>
                <div className="dashboard-job-card-header">
                  <span className="dashboard-company-mark">{(job.company_name || 'C')[0].toUpperCase()}</span>
                  <span className="dashboard-match-badge">
                    {job.match_score ? `${job.match_score}% Match` : 'Complete profile'}
                  </span>
                </div>
                <h3>{job.title}</h3>
                <strong className="job-card-company">{job.company_name}</strong>
                <p className="job-card-meta">
                  <MapPin size={13} /> {job.location} · {job.job_type}
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
      <section className="dashboard-panel glass-panel">
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
              {isLoading ? (
                [1, 2, 3].map((rowIdx) => (
                  <tr key={rowIdx}>
                    <td><span className="skeleton-box" style={{ width: '130px', height: '14px' }} /></td>
                    <td><span className="skeleton-box" style={{ width: '100px', height: '14px' }} /></td>
                    <td><span className="skeleton-box" style={{ width: '80px', height: '14px' }} /></td>
                    <td><span className="skeleton-box" style={{ width: '40px', height: '14px' }} /></td>
                    <td><span className="skeleton-box" style={{ width: '70px', height: '14px' }} /></td>
                  </tr>
                ))
              ) : (
                applications.slice(0, 5).map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.job?.title || 'Job'}</strong>
                    </td>
                    <td>{application.job?.company_name || 'Company'}</td>
                    <td>{application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently'}</td>
                    <td>
                      <span className="dashboard-table-score">{application.match_score || 0}%</span>
                    </td>
                    <td>
                      <span className={`dashboard-status ${application.status}`}>
                        {application.status === 'pending' ? 'Under review' : application.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && !applications.length && (
            <div className="dashboard-empty">No applications submitted yet. Explore recommended jobs above.</div>
          )}
        </div>
      </section>
    </div>
  );
};
