import React from 'react';
import { Search, MapPin, Zap, UserPlus, Building2, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface HeroBannerProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  locationQuery: string;
  setLocationQuery: (loc: string) => void;
  selectedJobType: string;
  setSelectedJobType: (type: string) => void;
  selectedShift: string;
  setSelectedShift: (shift: string) => void;
  onSearch: () => void;
  onOpenAuth?: (mode?: 'login' | 'register', role?: UserRole) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  setSearchQuery,
  locationQuery,
  setLocationQuery,
  selectedJobType,
  setSelectedJobType,
  selectedShift,
  setSelectedShift,
  onSearch,
  onOpenAuth,
}) => {
  const { user, role, isAuthenticated } = useAuth();

  return (
    <section
      style={{
        padding: '1.25rem 0 0.5rem 0',
        position: 'relative',
      }}
    >
      <div className="container">
        {/* Title Area */}
        <div style={{ maxWidth: '820px', marginBottom: '1rem' }}>
          <div
            className="badge badge-primary"
            style={{
              display: 'inline-flex',
              padding: '0.35rem 0.85rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
            }}
          >
            <Zap size={14} color="#818CF8" />
            <span>AI-Powered Skill Match Score & Flexible Shift Intelligence</span>
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              background: 'none',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isAuthenticated
              ? (role === 'seeker'
                  ? `Welcome back, ${user?.full_name || 'Candidate'}!`
                  : `Employer Command Center`)
              : 'Find roles matching your exact skills. Not just keywords.'}
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {isAuthenticated ? (
              role === 'seeker' ? (
                user?.skills?.length
                  ? `Our matching engine compares your skills (${user.skills.slice(0, 4).join(', ')}) against active openings.`
                  : 'Add your skills to get relevant recommendations instead of generic results.'
              ) : (
                `Manage your active job listings, review AI-scored candidate pipelines, and coordinate direct interviews for ${user?.company_name || 'your company'}.`
              )
            ) : (
              'Connect with verified opportunities and top employers through deep skill breakdown, verified work shifts, and transparent direct communication.'
            )}
          </p>

          {/* If Unauthenticated: Prominent CTA buttons */}
          {!isAuthenticated && onOpenAuth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => onOpenAuth('register', 'seeker')}
                id="hero-candidate-join-btn"
              >
                <Briefcase size={18} />
                <span>Find Jobs as Candidate</span>
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => onOpenAuth('register', 'employer')}
                id="hero-employer-join-btn"
              >
                <Building2 size={18} />
                <span>Hire Talent as Employer</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter Glass Box */}
        <div
          className="glass-panel"
          style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="hero-search-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr auto',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            {/* Keyword Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#FFFFFF',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 1rem',
              }}
            >
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Job title, skills (e.g. Data Scientist, React, Python)..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  width: '100%',
                }}
                id="hero-keyword-input"
              />
            </div>

            {/* Location Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#FFFFFF',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 1rem',
              }}
            >
              <MapPin size={18} color="var(--text-muted)" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Location (e.g. Remote, Bangalore)..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  width: '100%',
                }}
                id="hero-location-input"
              />
            </div>

            {/* Search CTA */}
            <button
              className="btn btn-primary"
              onClick={onSearch}
              id="hero-search-btn"
              style={{ height: '48px', padding: '0 1.75rem' }}
            >
              <Search size={18} />
              <span>Search Roles</span>
            </button>
          </div>

          {/* Quick Filter Chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {/* Job Type Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
              {['All', 'Full-time', 'Part-time', 'Contract', 'Remote'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedJobType(type === 'All' ? '' : type)}
                  className={`btn btn-sm ${
                    (type === 'All' && !selectedJobType) || selectedJobType === type
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Shift Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Shift:</span>
              {['All', 'Day', 'Night', 'Flexible', 'Rotating'].map((shift) => (
                <button
                  key={shift}
                  onClick={() => setSelectedShift(shift === 'All' ? '' : shift)}
                  className={`btn btn-sm ${
                    (shift === 'All' && !selectedShift) || selectedShift === shift
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  {shift}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
