import React from 'react';
import {
  Building2,
  Briefcase,
  Clock3,
  FileText,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  UserRound,
  Users,
  Calendar,
  HeartHandshake,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { Profile } from '../types';
import { VerifiedBadge } from './VerifiedBadge';

interface ProfilePageProps {
  user: Profile | null;
  onEdit: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onEdit }) => {
  const isEmployer = user?.role === 'employer';

  if (isEmployer) {
    const employerFields = [
      user?.company_name,
      user?.company_website || user?.website,
      user?.company_location || user?.location,
      user?.industry,
      user?.company_size,
      user?.about_company || user?.bio,
      user?.founded_year,
      user?.benefits && user.benefits.length > 0,
      user?.culture && user.culture.length > 0,
    ];
    const completion = user
      ? Math.round((employerFields.filter(Boolean).length / employerFields.length) * 100)
      : 0;
    const companyName = user?.company_name || user?.full_name || 'Hiring Organization';
    const websiteUrl = user?.company_website || user?.website;
    const companyLocation = user?.company_location || user?.location || 'Location Not Specified';
    const aboutText =
      user?.about_company ||
      user?.bio ||
      'No company description provided yet. Click "Edit Profile" to tell candidates about your organization, mission, and culture.';

    return (
      <div className="dashboard-page profile-page employer-profile-view">
        <header className="dashboard-page-header">
          <div>
            <span className="dashboard-eyebrow">Account</span>
            <h1>Company Profile</h1>
            <p>Your company's public presence, organizational details, and employer brand.</p>
          </div>
          <button className="btn btn-primary" onClick={onEdit} id="edit-company-profile-btn">
            <Pencil size={15} /> Edit Company Profile
          </button>
        </header>

        {/* Hero Banner */}
        <section className="profile-hero-panel dashboard-panel glass-panel">
          <div className="profile-page-avatar">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={companyName} />
            ) : (
              companyName[0].toUpperCase()
            )}
          </div>
          <div className="profile-hero-copy">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2>{companyName}</h2>
              {user?.is_verified && <VerifiedBadge size="md" />}
            </div>
            <p style={{ margin: '0.25rem 0' }}>
              {user?.tagline || user?.industry || 'Verified Employer Organization'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {companyLocation && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="var(--primary)" /> {companyLocation}
                </span>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)' }}
                >
                  <Globe size={14} /> {websiteUrl.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
          <div className="profile-completion-card">
            <strong>{completion}%</strong>
            <span>Company Profile Strength</span>
            <div>
              <i style={{ width: `${completion}%` }} />
            </div>
          </div>
        </section>

        {/* Detail Grid */}
        <div className="profile-detail-grid">
          {/* About Company */}
          <section className="dashboard-panel glass-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>About the Company</h2>
                <p>Mission, vision, and operational overview seen by talent.</p>
              </div>
              <Building2 size={18} className="panel-accent-icon" />
            </div>
            <p className="profile-body-copy">{aboutText}</p>
            <div className="profile-info-list" style={{ marginTop: '1.25rem' }}>
              <div>
                <Mail size={15} />
                <span>{user?.email || 'Official email not listed'}</span>
              </div>
              {websiteUrl && (
                <div>
                  <Globe size={15} />
                  <span>{websiteUrl}</span>
                </div>
              )}
              {companyLocation && (
                <div>
                  <MapPin size={15} />
                  <span>{companyLocation}</span>
                </div>
              )}
            </div>
          </section>

          {/* Organizational Meta */}
          <section className="dashboard-panel glass-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Company Information</h2>
                <p>Key structural facts for prospective candidates.</p>
              </div>
              <Users size={18} className="panel-accent-icon" />
            </div>
            <div className="profile-experience-row">
              <span>Industry / Sector</span>
              <strong>{user?.industry || 'Technology & Services'}</strong>
            </div>
            <div className="profile-experience-row">
              <span>Company Size</span>
              <strong>{user?.company_size || '51-200 employees'}</strong>
            </div>
            <div className="profile-experience-row">
              <span>Founded Year</span>
              <strong>{user?.founded_year || '2021'}</strong>
            </div>
            <div className="profile-experience-row">
              <span>Account Type</span>
              <strong style={{ color: 'var(--primary)' }}>Employer / Hiring Manager</strong>
            </div>
          </section>
        </div>

        {/* Benefits & Culture Cards */}
        <div className="profile-detail-grid" style={{ marginTop: '1.25rem' }}>
          {/* Benefits */}
          <section className="dashboard-panel glass-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Perks & Benefits</h2>
                <p>What makes working with your organization rewarding.</p>
              </div>
              <Gift size={18} className="panel-accent-icon" />
            </div>
            {user?.benefits && user.benefits.length > 0 ? (
              <div className="profile-skill-cloud">
                {user.benefits.map((benefit, index) => (
                  <span key={index} className="employer-perk-badge">
                    {benefit}
                  </span>
                ))}
              </div>
            ) : (
              <div className="dashboard-muted" style={{ padding: '0.5rem 0' }}>
                <p>Default benefits include: Health Insurance, Flexible Hours, Professional Development.</p>
                <button className="btn btn-secondary btn-sm" onClick={onEdit} style={{ marginTop: '0.5rem' }}>
                  Add Custom Benefits
                </button>
              </div>
            )}
          </section>

          {/* Culture */}
          <section className="dashboard-panel glass-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Workplace Culture</h2>
                <p>Values and collaborative principles your team upholds.</p>
              </div>
              <HeartHandshake size={18} className="panel-accent-icon" />
            </div>
            {user?.culture && user.culture.length > 0 ? (
              <div className="profile-skill-cloud">
                {user.culture.map((item, index) => (
                  <span key={index} className="employer-culture-badge">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <div className="dashboard-muted" style={{ padding: '0.5rem 0' }}>
                <p>Default culture: Inclusive Team, Transparent Growth, Merit-First Recognition.</p>
                <button className="btn btn-secondary btn-sm" onClick={onEdit} style={{ marginTop: '0.5rem' }}>
                  Add Workplace Culture Values
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // Seeker Profile View
  const fields = [
    user?.full_name,
    user?.headline,
    user?.bio,
    user?.location,
    user?.skills?.length,
    user?.resume_url,
    user?.experience_level,
  ];
  const completion = user ? Math.round((fields.filter(Boolean).length / fields.length) * 100) : 0;
  const displayName = user?.full_name || 'Your profile';

  return (
    <div className="dashboard-page profile-page">
      <header className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">Account</span>
          <h1>Profile</h1>
          <p>Your professional identity and matching information.</p>
        </div>
        <button className="btn btn-primary" onClick={onEdit} id="edit-seeker-profile-btn">
          <Pencil size={15} /> Edit Profile
        </button>
      </header>

      <section className="profile-hero-panel dashboard-panel">
        <div className="profile-page-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={displayName} />
          ) : (
            displayName[0].toUpperCase()
          )}
        </div>
        <div className="profile-hero-copy">
          <h2>{displayName}</h2>
          <p>{user?.headline || 'Add a professional title'}</p>
          {user?.location && (
            <span>
              <MapPin size={14} /> {user.location}
            </span>
          )}
        </div>
        <div className="profile-completion-card">
          <strong>{completion}%</strong>
          <span>Profile completion</span>
          <div>
            <i style={{ width: `${completion}%` }} />
          </div>
        </div>
      </section>

      <div className="profile-detail-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>About</h2>
              <p>How employers and candidates see your profile.</p>
            </div>
            <UserRound size={18} />
          </div>
          <p className="profile-body-copy">
            {user?.bio ||
              'Add a short bio to tell people about your experience, strengths, and what you are looking for.'}
          </p>
          <div className="profile-info-list">
            <div>
              <Mail size={15} />
              <span>{user?.email || 'Email not available'}</span>
            </div>
            {user?.phone && (
              <div>
                <Phone size={15} />
                <span>{user.phone}</span>
              </div>
            )}
            <div>
              <Briefcase size={15} />
              <span>{user?.preferred_job_type || 'Preferred job type not set'}</span>
            </div>
            <div>
              <Clock3 size={15} />
              <span>{user?.preferred_shift || 'Preferred shift not set'}</span>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Skills & Experience</h2>
              <p>Signals used for SkillMatch recommendations.</p>
            </div>
          </div>
          <div className="profile-skill-cloud">
            {user?.skills?.length ? (
              user.skills.map((skill) => <span key={skill}>{skill}</span>)
            ) : (
              <p className="dashboard-muted">No skills added yet.</p>
            )}
          </div>
          <div className="profile-experience-row">
            <span>Experience level</span>
            <strong>{user?.experience_level || 'Not specified'}</strong>
          </div>
          <div className="profile-experience-row">
            <span>Experience</span>
            <strong>
              {user?.experience_years ? `${user.experience_years} years` : 'Not specified'}
            </strong>
          </div>
        </section>
      </div>

      <section className="dashboard-panel profile-resume-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Resume</h2>
            <p>Keep your latest resume attached to applications.</p>
          </div>
          <FileText size={18} />
        </div>
        {user?.resume_url ? (
          <a className="profile-resume-link" href={user.resume_url} target="_blank" rel="noreferrer">
            <FileText size={17} /> Open attached resume
          </a>
        ) : (
          <p className="dashboard-muted">No resume uploaded yet. Edit your profile to attach one.</p>
        )}
      </section>
    </div>
  );
};
