import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Building2,
  Briefcase,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle2,
  MoreHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, isDemoEnabled, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
  onClose: () => void;
  onSuccess: () => void;
}

const TESTIMONIALS = [
  {
    quote:
      'SkillMatch completely changed how I find work. I can finally see high-match roles near me and it only takes a few minutes.',
    author: 'Marcus Chen',
    role: 'Operations & Logistics Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'Within 48 hours of entering my skills, I connected with an electrical contractor 4km away. The skill-first matching is a game changer.',
    author: 'Sarah Jenkins',
    role: 'Certified Electrical Specialist',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'Hiring based on real skill alignment and shift compatibility cut our time-to-hire by 70%. Best hiring platform we have used.',
    author: 'David Ortiz',
    role: 'Hiring Team Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  initialRole = 'seeker',
  onClose,
  onSuccess,
}) => {
  const { login, register, switchDemoUser, updateProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [verifyCompanyNow, setVerifyCompanyNow] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const isSubmittingRef = useRef(false);

  // Auto-cycle testimonials smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        onSuccess();
        onClose();
      } else {
        const res = await register(
          email.trim(),
          password,
          role,
          fullName.trim(),
          companyName.trim()
        );
        if (res?.email_verification_required) {
          setSuccessMessage(
            res.message ||
              'Account created successfully! Please check your email to verify your account before signing in.'
          );
          setMode('login');
          setPassword('');
        } else {
          if (role === 'employer' && verifyCompanyNow && regNumber.trim()) {
            try {
              await updateProfile({
                company_registration_no: regNumber.trim(),
                tax_id: taxId.trim(),
                company_website: website.trim(),
                company_address: address.trim(),
                is_verified: true,
                verification_status: 'verified',
                verification_submitted_at: new Date().toISOString(),
              });
            } catch (e) {
              console.warn('Could not auto-verify immediately during registration', e);
            }
          }
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setError('Too many verification emails were requested. Please wait and try again later.');
      } else if (msg.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(msg || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleQuickDemo = async (userId: string) => {
    if (!isDemoEnabled) return;
    setIsLoading(true);
    try {
      await switchDemoUser(userId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTestimonial = TESTIMONIALS[testimonialIdx];

  return (
    <div className="auth-split-overlay" onClick={onClose} id="auth-modal-overlay">
      <div
        className="auth-split-card"
        onClick={(e) => e.stopPropagation()}
        id="auth-split-container"
      >
        {/* =========================================================================
            LEFT COLUMN: Warm Coral Product Showcase & Testimonial Stage
            ========================================================================= */}
        <div className="auth-stage-column">
          {/* Ambient Organic Curve Background */}
          <svg
            className="auth-ambient-curves"
            viewBox="0 0 500 640"
            preserveAspectRatio="none"
          >
            <path
              d="M-50 140 C 140 200, 360 60, 550 180"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="3.5"
              fill="none"
            />
            <path
              d="M-70 360 C 130 450, 370 290, 560 390"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="2.5"
              fill="none"
            />
            <circle
              cx="440"
              cy="90"
              r="150"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="45"
            />
            <circle
              cx="70"
              cy="560"
              r="170"
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="45"
            />
          </svg>

          {/* Top Decorative Floating Cards Area */}
          <div className="auth-visual-showcase">
            {/* Top-Right Floating Card: Verified Skills */}
            <div className="showcase-floating-card card-skills">
              <div className="pill-header">
                <div className="pill-icon-wrap icon-blue">
                  <CheckCircle2 size={13} color="#2563EB" />
                </div>
                <span className="pill-title">Verified Skills</span>
                <MoreHorizontal size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </div>
              <div className="pill-stat-row">
                <span className="pill-big-stat">14 Skills</span>
                <span className="pill-badge badge-green">
                  <TrendingUp size={11} /> +3 New
                </span>
              </div>
              <div className="pill-subtext">
                Matched across 24 local openings
              </div>
            </div>

            {/* Central Main Showcase Card: Match Overview with Bar Chart */}
            <div className="showcase-main-card">
              <div className="main-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div className="main-card-icon">
                    <Sparkles size={14} color="#FA7051" />
                  </div>
                  <span className="main-card-title">Match Overview</span>
                </div>
                <div className="main-card-legend">
                  <span className="legend-dot dot-coral" />
                  <span className="legend-label">Skills</span>
                  <span className="legend-dot dot-blue" />
                  <span className="legend-label">Location</span>
                </div>
              </div>

              <div className="main-card-stat-wrap">
                <span className="stat-value">96% Fit</span>
                <span className="stat-tag">Top Tier Compatibility</span>
              </div>

              {/* Bar Graph Simulation */}
              <div className="showcase-bar-chart">
                {/* Mon */}
                <div className="chart-col">
                  <div className="bar-pair">
                    <div className="bar bar-coral" style={{ height: '48px' }} />
                    <div className="bar bar-cyan" style={{ height: '64px' }} />
                  </div>
                  <span className="col-label">Mon</span>
                </div>

                {/* Tue */}
                <div className="chart-col">
                  <div className="bar-pair">
                    <div className="bar bar-coral" style={{ height: '62px' }} />
                    <div className="bar bar-cyan" style={{ height: '50px' }} />
                  </div>
                  <span className="col-label">Tue</span>
                </div>

                {/* Wed (Active Peak with Tooltip) */}
                <div className="chart-col active-col">
                  <div className="chart-tooltip">
                    <span>98% Match</span>
                  </div>
                  <div className="bar-pair">
                    <div className="bar bar-coral bar-active" style={{ height: '82px' }} />
                    <div className="bar bar-cyan" style={{ height: '70px' }} />
                  </div>
                  <span className="col-label col-active">Wed</span>
                </div>

                {/* Thu */}
                <div className="chart-col">
                  <div className="bar-pair">
                    <div className="bar bar-coral" style={{ height: '56px' }} />
                    <div className="bar bar-cyan" style={{ height: '60px' }} />
                  </div>
                  <span className="col-label">Thu</span>
                </div>

                {/* Fri */}
                <div className="chart-col">
                  <div className="bar-pair">
                    <div className="bar bar-coral" style={{ height: '72px' }} />
                    <div className="bar bar-cyan" style={{ height: '68px' }} />
                  </div>
                  <span className="col-label">Fri</span>
                </div>

                {/* Sat */}
                <div className="chart-col">
                  <div className="bar-pair">
                    <div className="bar bar-coral" style={{ height: '50px' }} />
                    <div className="bar bar-cyan" style={{ height: '78px' }} />
                  </div>
                  <span className="col-label">Sat</span>
                </div>
              </div>
            </div>

            {/* Bottom-Left Floating Card: Commute Distance */}
            <div className="showcase-floating-card card-commute">
              <div className="pill-header">
                <div className="pill-icon-wrap icon-coral">
                  <MapPin size={13} color="#FA7051" />
                </div>
                <span className="pill-title">Commute Radius</span>
                <MoreHorizontal size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </div>
              <div className="pill-stat-row">
                <span className="pill-big-stat">4.2 km</span>
                <span className="pill-badge badge-green">
                  &lt; 15 min
                </span>
              </div>
              <div className="pill-subtext">
                Within your preferred travel radius
              </div>
            </div>
          </div>

          {/* Bottom Testimonial Section with Avatar & Carousel Dots */}
          <div className="auth-testimonial-wrap">
            <p className="testimonial-quote">
              “{currentTestimonial.quote}”
            </p>

            {/* 3 Pagination Dots */}
            <div className="testimonial-dots">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTestimonialIdx(i)}
                  className={`dot-btn ${i === testimonialIdx ? 'dot-active' : ''}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="testimonial-author">
              <img
                src={currentTestimonial.avatar}
                alt={currentTestimonial.author}
                className="author-avatar"
              />
              <div>
                <div className="author-name">{currentTestimonial.author}</div>
                <div className="author-role">{currentTestimonial.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Clean Editorial Form Matching Reference
            ========================================================================= */}
        <div className="auth-form-column">
          {/* Close Modal Button */}
          <button
            type="button"
            className="auth-close-btn"
            onClick={onClose}
            id="close-auth-modal-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Stylized Asterisk / Star Brand Glyph */}
          <div className="auth-brand-glyph">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FA7051"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
            </svg>
          </div>

          {/* Headline & Subtitle */}
          <h2 className="auth-title">
            {mode === 'login' ? 'Sign in with clarity' : 'Match your skills with clarity'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Enter your email and password to access your account.'
              : 'Enter your email and preferred password to get started.'}
          </p>

          {/* Success / Error Banners */}
          {successMessage && (
            <div className="auth-banner-success" id="auth-success-message">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="auth-banner-error" id="auth-error-message">
              {error}
            </div>
          )}

          {/* Segmented Role Selector (for Register) */}
          {mode === 'register' && (
            <div className="auth-role-segmented">
              <button
                type="button"
                onClick={() => setRole('seeker')}
                className={`segmented-btn ${role === 'seeker' ? 'btn-active' : ''}`}
                id="role-select-seeker"
              >
                <Briefcase size={14} />
                <span>Job Seeker</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`segmented-btn ${role === 'employer' ? 'btn-active' : ''}`}
                id="role-select-employer"
              >
                <Building2 size={14} />
                <span>Employer</span>
              </button>
            </div>
          )}

          {/* The Form */}
          <form onSubmit={handleSubmit} className="auth-form-fields">
            {/* Full Name / Company Name (Register Only) */}
            {mode === 'register' && role === 'seeker' && (
              <div className="auth-input-group">
                <label className="auth-label">Full Name</label>
                <input
                  type="text"
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  required
                  disabled={isLoading}
                  id="register-fullname-input"
                />
              </div>
            )}

            {mode === 'register' && role === 'employer' && (
              <>
                <div className="auth-input-group">
                  <label className="auth-label">Company Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Industries"
                    required
                    disabled={isLoading}
                    id="register-company-input"
                  />
                </div>

                {/* Company Authenticity Verification Check */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => setVerifyCompanyNow(!verifyCompanyNow)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} color="#38BDF8" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#BAE6FD' }}>
                        Verify Company Authenticity
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#38BDF8', textDecoration: 'underline' }}>
                      {verifyCompanyNow ? 'Skip for now' : '+ Add Details Now'}
                    </span>
                  </div>

                  {verifyCompanyNow ? (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registration / CIN # *</label>
                        <input
                          type="text"
                          className="auth-input"
                          value={regNumber}
                          onChange={(e) => setRegNumber(e.target.value)}
                          placeholder="e.g. U72200KA2021PTC148892"
                          style={{ marginTop: '2px', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tax ID / GSTIN / EIN *</label>
                        <input
                          type="text"
                          className="auth-input"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          placeholder="e.g. 29AAACT1234F1Z5"
                          style={{ marginTop: '2px', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Official Website</label>
                        <input
                          type="url"
                          className="auth-input"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourcompany.com"
                          style={{ marginTop: '2px', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HQ Physical Address</label>
                        <input
                          type="text"
                          className="auth-input"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. Prestige Tech Park, Bengaluru"
                          style={{ marginTop: '2px', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Optional. If skipped, you can verify later before posting job openings.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="auth-input-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@workemail.com"
                required
                disabled={isLoading}
                id="auth-email-input"
              />
            </div>

            {/* Password Field */}
            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  id="auth-password-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Options Row: Terms or Remember Me */}
            {mode === 'register' ? (
              <label className="auth-terms-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  id="register-terms-checkbox"
                />
                <span>
                  I agree to the <a href="#terms">Terms & Conditions</a> and{' '}
                  <a href="#privacy">Privacy Policy</a>
                </span>
              </label>
            ) : (
              <div className="auth-remember-row">
                <label className="auth-terms-label" style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember this device</span>
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() =>
                    alert('Password reset link has been dispatched to your email.')
                  }
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-coral-btn"
              disabled={isLoading}
              id="auth-submit-btn"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Signing up...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Sign Up'}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Testing Links (if enabled) */}
          {isDemoEnabled && (
            <div className="auth-quick-demo-row">
              <span className="quick-demo-label">Dev Quick Login:</span>
              {DEMO_USERS.slice(0, 2).map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  className="quick-demo-pill"
                  onClick={() => handleQuickDemo(demo.id)}
                >
                  {demo.role === 'employer' ? '🏢 Employer' : '👤 Seeker'}
                </button>
              ))}
            </div>
          )}

          {/* Switch Mode Footer */}
          <div className="auth-switch-text">
            {mode === 'login' ? (
              <span>
                Don't have a SkillMatch account?{' '}
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccessMessage('');
                  }}
                  id="switch-to-signup-btn"
                >
                  Sign up now.
                </button>
              </span>
            ) : (
              <span>
                Already have a SkillMatch account?{' '}
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  id="switch-to-signin-btn"
                >
                  Sign in now.
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
