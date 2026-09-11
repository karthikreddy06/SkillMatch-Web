import React, { useState } from 'react';
import {
  Sparkles,
  Briefcase,
  UserCheck,
  Bookmark,
  MessageSquare,
  LayoutDashboard,
  PlusCircle,
  Users,
  ChevronDown,
  LogOut,
  LogIn,
  Menu,
  User,
  UserPlus,
  ShieldCheck,
  X,
  Home,
  ArrowRight,
} from 'lucide-react';
import { useAuth, isDemoEnabled, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types';
import { VerifiedBadge } from './VerifiedBadge';
import { CompanyVerificationModal } from './CompanyVerificationModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register', role?: UserRole) => void;
  onOpenProfile: () => void;
  onOpenPostJob: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenProfile,
  onOpenPostJob,
}) => {
  const { user, role, isAuthenticated, logout, switchDemoUser } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={isAuthenticated ? "glass-nav" : "editorial-header"} id="main-navigation">
      <div
        className="container navbar-inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px',
        }}
      >
        {/* Brand Logo */}
        {isAuthenticated ? (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setActiveTab(role === 'employer' ? 'dashboard' : 'discover')}
            id="brand-logo-btn"
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '1.35rem',
                    letterSpacing: '-0.03em',
                    color: '#FFFFFF',
                  }}
                >
                  Skill<span style={{ color: '#818CF8' }}>Match</span>
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                  AI Core
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '-2px' }}>
                Intelligent Skill-Based Hiring
              </div>
            </div>
          </div>
        ) : null}

        {/* Center: Navigation Links */}
        {isAuthenticated ? (
          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            id="primary-nav-links"
            className={`nav-center-tabs ${mobileMenuOpen ? 'is-mobile-open' : ''}`}
          >
            {role === 'seeker' ? (
              /* Authenticated Candidate Navigation */
              <>
                <button
                  className={`btn ${activeTab === 'discover' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                  onClick={() => { setActiveTab('discover'); setMobileMenuOpen(false); }}
                  id="nav-discover-btn"
                >
                  <Sparkles size={16} />
                  <span>Discover Jobs</span>
                </button>
                <button
                  className={`btn ${activeTab === 'applications' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                  onClick={() => { setActiveTab('applications'); setMobileMenuOpen(false); }}
                  id="nav-applications-btn"
                >
                  <UserCheck size={16} />
                  <span>My Applications</span>
                </button>
                <button
                  className={`btn ${activeTab === 'saved' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                  onClick={() => { setActiveTab('saved'); setMobileMenuOpen(false); }}
                  id="nav-saved-btn"
                >
                  <Bookmark size={16} />
                  <span>Saved</span>
                </button>
              </>
            ) : (
              /* Authenticated Employer Navigation */
              <>
                <button
                  className={`btn ${activeTab === 'dashboard' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  id="nav-dashboard-btn"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </button>
                <button
                  className={`btn ${activeTab === 'pipeline' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                  onClick={() => { setActiveTab('pipeline'); setMobileMenuOpen(false); }}
                  id="nav-pipeline-btn"
                >
                  <Users size={16} />
                  <span>ATS Pipeline</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { onOpenPostJob(); setMobileMenuOpen(false); }}
                  id="nav-post-job-btn"
                >
                  <PlusCircle size={16} />
                  <span>Post Job</span>
                </button>
              </>
            )}

            <button
              className={`btn ${activeTab === 'chat' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
              onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
              id="nav-messages-btn"
            >
              <MessageSquare size={16} />
              <span>Messages</span>
            </button>
          </nav>
        ) : (
          /* Logged-Out Public Minimal Header (Warm Studio Editorial Style) */
          <div className="public-header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {/* LEFT: SkillMatch Wordmark */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              id="brand-logo-public"
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: '#111317',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                S
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.02em',
                  color: '#111317',
                }}
              >
                SkillMatch<span style={{ color: '#4F46E5' }}>.</span>
              </span>
            </div>

            {!mobileMenuOpen && (
              <>
                {/* CENTER: Navigation Links */}
                <nav className="public-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <a href="#how-it-works" className="fora-nav-link" id="nav-how-it-works">
                    How It Works
                  </a>
                  <span
                    className="fora-nav-link"
                    onClick={() => { onOpenAuth('register', 'seeker'); setMobileMenuOpen(false); }}
                    id="nav-link-seekers"
                  >
                    For Job Seekers
                  </span>
                  <span
                    className="fora-nav-link"
                    onClick={() => { onOpenAuth('register', 'employer'); setMobileMenuOpen(false); }}
                    id="nav-link-employers"
                  >
                    For Employers
                  </span>
                </nav>

                {/* RIGHT: Sign In & Get Started */}
                <div className="public-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <button
                    className="fora-signin-btn"
                    onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                    id="header-signin-btn"
                  >
                    Sign In
                  </button>
                  <button
                    className="fora-getstarted-btn"
                    onClick={() => { onOpenAuth('register', 'seeker'); setMobileMenuOpen(false); }}
                    id="header-get-started-btn"
                  >
                    Get Started
                  </button>
                </div>
              </>
            )}

            {mobileMenuOpen && (
              <div className="public-mobile-panel is-mobile-open" role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
                <div className="public-mobile-panel-header">
                  <div className="public-mobile-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="public-mobile-brand-mark">S</div>
                    <span>SkillMatch<span>.</span></span>
                  </div>
                  <button
                    className="public-mobile-panel-close"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="public-mobile-panel-nav" aria-label="Mobile navigation">
                  <a href="#how-it-works" className="public-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    <span className="public-mobile-link-icon"><Home size={16} /></span>
                    <span>How It Works</span>
                  </a>
                  <button className="public-mobile-link" type="button" onClick={() => { onOpenAuth('register', 'seeker'); setMobileMenuOpen(false); }}>
                    <span className="public-mobile-link-icon"><User size={16} /></span>
                    <span>For Job Seekers</span>
                  </button>
                  <button className="public-mobile-link" type="button" onClick={() => { onOpenAuth('register', 'employer'); setMobileMenuOpen(false); }}>
                    <span className="public-mobile-link-icon"><Briefcase size={16} /></span>
                    <span>For Employers</span>
                  </button>
                </nav>

                <div className="public-mobile-divider" />

                <div className="public-mobile-cta-stack">
                  <button
                    className="public-mobile-cta primary"
                    onClick={() => { onOpenAuth('register', 'seeker'); setMobileMenuOpen(false); }}
                    type="button"
                  >
                    <span>Get Started</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="public-mobile-cta secondary"
                    onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                    type="button"
                  >
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="public-mobile-footer">Find work. Grow your future.</div>
              </div>
            )}
          </div>
        )}

        <button
          className={`navbar-mobile-toggle ${mobileMenuOpen ? 'is-mobile-open' : ''}`}
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Right Section: Auth Controls / Profile ONLY if Authenticated */}
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Development Test Accounts — ONLY visible when Authenticated AND VITE_ENABLE_DEMO_ACCOUNTS=true */}
            {isDemoEnabled && (
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  id="demo-accounts-toggle-btn"
                  style={{ fontSize: '0.75rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                  <span>Dev Test Accounts</span>
                  <ChevronDown size={14} />
                </button>

                {showDemoMenu && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      width: '300px',
                      padding: '0.75rem',
                      zIndex: 100,
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Dev Test Profiles (VITE_ENABLE_DEMO_ACCOUNTS=true)
                    </div>
                    {DEMO_USERS.map((demo) => (
                      <div
                        key={demo.id}
                        onClick={() => {
                          switchDemoUser(demo.id);
                          setShowDemoMenu(false);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          background: user?.id === demo.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          border: user?.id === demo.id ? '1px solid var(--primary)' : '1px solid transparent',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{demo.name}</span>
                          <span
                            className={`badge ${demo.role === 'employer' ? 'badge-warning' : 'badge-primary'}`}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {demo.role}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {demo.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Profile Menu */}
            {user && (
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-card)',
                    cursor: 'pointer',
                  }}
                  id="user-profile-menu-btn"
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: '#FFF',
                    }}
                  >
                    {(user.full_name || user.company_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>
                      {user.full_name || user.company_name || user.email.split('@')[0]}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {user.role === 'employer' ? 'Employer' : 'Candidate'}
                      {user.role === 'employer' && user.is_verified && <VerifiedBadge size="sm" showText={false} />}
                    </span>
                  </div>
                  <ChevronDown size={14} color="var(--text-secondary)" />
                </div>

                {showUserMenu && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      width: '230px',
                      padding: '0.5rem',
                      zIndex: 100,
                    }}
                  >
                    <div
                      onClick={() => {
                        onOpenProfile();
                        setShowUserMenu(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                      }}
                      id="menu-edit-profile-btn"
                    >
                      <User size={16} />
                      <span>{role === 'employer' ? 'Company Profile' : 'Profile & Skills'}</span>
                    </div>

                    {role === 'employer' && (
                      <div
                        onClick={() => {
                          setShowVerificationModal(true);
                          setShowUserMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: user?.is_verified ? '#38BDF8' : '#F59E0B',
                        }}
                        id="menu-verify-business-btn"
                      >
                        <ShieldCheck size={16} />
                        <span>{user?.is_verified ? 'Business Verified ✓' : 'Verify Business Entity'}</span>
                      </div>
                    )}

                    <div
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: 'var(--danger)',
                      }}
                      id="menu-logout-btn"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showVerificationModal && (
        <CompanyVerificationModal
          onClose={() => setShowVerificationModal(false)}
          onSuccess={() => setShowVerificationModal(false)}
        />
      )}
    </header>
  );
};
