import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Layers,
  RefreshCw,
  Eye,
  Check,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { Profile, Job, ResumeAnalysisResult } from '../types';
import { api } from '../services/api';

interface ResumeAnalyzerViewProps {
  user: Profile | null;
  onSelectJob: (job: Job) => void;
  onProfileUpdated?: (profile: Profile) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenEditProfile?: () => void;
}

export const ResumeAnalyzerView: React.FC<ResumeAnalyzerViewProps> = ({
  user,
  onSelectJob,
  onProfileUpdated,
  onToast,
  onOpenEditProfile,
}) => {
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(() => {
    if (user?.id) {
      try {
        const cached = localStorage.getItem(`skillmatch_resume_analysis_${user.id}`);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore parse error
      }
    }
    return null;
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeAnalysisFile, setActiveAnalysisFile] = useState<File | null>(null);

  // Profile Sync Selection State
  const [syncSelections, setSyncSelections] = useState<{
    skills: boolean;
    experience_years: boolean;
    experience_level: boolean;
    headline: boolean;
    phone: boolean;
    location: boolean;
  }>({
    skills: true,
    experience_years: true,
    experience_level: true,
    headline: true,
    phone: true,
    location: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAttachedResume = Boolean(user?.resume_url);

  const isLegacyDocAttached = Boolean(
    user?.resume_url &&
    user.resume_url.toLowerCase().split('?')[0].endsWith('.doc')
  );

  const runAnalysis = async (file?: File, useExisting = false) => {
    if (!file && !useExisting && !hasAttachedResume) {
      onToast('Please upload a resume file (PDF or DOCX) to analyze.', 'info');
      return;
    }

    if (useExisting && isLegacyDocAttached) {
      onToast(
        'Your profile resume is in legacy Word (.doc) format. Please upload a PDF or .docx file to analyze.',
        'error'
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await api.analyzeResume({
        file: file || undefined,
        useExisting: useExisting || (!file && hasAttachedResume),
      });

      setAnalysis(res);
      if (user?.id) {
        try {
          localStorage.setItem(`skillmatch_resume_analysis_${user.id}`, JSON.stringify(res));
        } catch {
          // ignore storage error
        }
      }
      onToast(`✓ Resume analysis complete! Score: ${res.resume_score}/100`, 'success');
    } catch (err: any) {
      const msg = err.message || 'Failed to analyze resume. Please try again.';
      onToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
      setActiveAnalysisFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (ext === 'doc') {
      onToast(
        'Legacy Word (.doc) format is not supported for automated ATS analysis. Please upload your resume as a PDF or modern Word (.docx) file.',
        'error'
      );
      e.target.value = '';
      return;
    }

    if (!['pdf', 'docx'].includes(ext)) {
      onToast('Invalid file format. Allowed formats: PDF and modern Word (.docx).', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onToast('File size exceeds maximum allowed 5MB limit.', 'error');
      e.target.value = '';
      return;
    }

    setActiveAnalysisFile(file);
    runAnalysis(file, false);
  };

  const handleSyncToProfile = async () => {
    if (!user?.id || !analysis?.extracted_profile_updates) return;

    const updates = analysis.extracted_profile_updates;
    const payload: Partial<Profile> = {};

    if (syncSelections.skills && updates.skills && updates.skills.length > 0) {
      // Merge with existing skills deduplicated
      const mergedSkills = Array.from(new Set([...(user.skills || []), ...updates.skills]));
      payload.skills = mergedSkills;
    }

    if (syncSelections.experience_years && typeof updates.experience_years === 'number') {
      payload.experience_years = updates.experience_years;
    }

    if (syncSelections.experience_level && updates.experience_level) {
      payload.experience_level = updates.experience_level;
    }

    if (syncSelections.headline && updates.headline) {
      payload.headline = updates.headline;
    }

    if (syncSelections.phone && updates.phone && !user.phone) {
      payload.phone = updates.phone;
    }

    if (syncSelections.location && updates.location && !user.location) {
      payload.location = updates.location;
    }

    if (Object.keys(payload).length === 0) {
      onToast('No updates were selected to sync.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      const updated = await api.updateProfile(user.id, payload);
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      onToast('✓ Successfully synced selected resume information to your profile!', 'success');
    } catch (err: any) {
      onToast(err.message || 'Failed to sync resume data to profile.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const getScoreInterpretation = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Exceptional',
        color: '#10B981',
        summary: 'Your resume is highly optimized for modern ATS filters and recruiter keyword scans.',
      };
    }
    if (score >= 70) {
      return {
        label: 'Strong',
        color: '#6366F1',
        summary: 'Solid foundation with good skill coverage. Review the suggestions below to reach the top 10%.',
      };
    }
    if (score >= 50) {
      return {
        label: 'Competitive',
        color: '#F59E0B',
        summary: 'Good start. Adding measurable metrics and clarifying your skill categories will boost your visibility.',
      };
    }
    return {
      label: 'Needs Attention',
      color: '#EF4444',
      summary: 'Missing key sections or keywords required by employer ATS filters. Follow our targeted suggestions.',
    };
  };

  const scoreInfo = analysis ? getScoreInterpretation(analysis.resume_score) : null;

  return (
    <div className="dashboard-page resume-analyzer-page" style={{ paddingBottom: '3rem' }}>
      {/* Top Header */}
      <header className="dashboard-page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="dashboard-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Cpu size={14} /> AI Intelligence Suite
          </span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
            AI Resume Analyzer
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px' }}>
            Instant, transparent ATS score calculation, skill extraction, section health checks, and job recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx"
            style={{ display: 'none' }}
            id="resume-analyzer-file-input"
          />

          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            id="upload-new-resume-btn"
          >
            <Upload size={15} /> Upload Resume (PDF/DOCX)
          </button>

          {hasAttachedResume && (
            <button
              className="btn btn-primary"
              onClick={() => runAnalysis(undefined, true)}
              disabled={isAnalyzing || isLegacyDocAttached}
              title={isLegacyDocAttached ? 'Attached resume is legacy .doc format. Please upload a PDF or .docx file.' : 'Analyze Attached Resume'}
              id="analyze-current-resume-btn"
              style={isLegacyDocAttached ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            >
              <RefreshCw size={15} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Analyzing...' : isLegacyDocAttached ? 'Attached Resume (.doc not supported)' : 'Analyze Attached Resume'}
            </button>
          )}
        </div>
      </header>

      {/* Legacy .doc Notice if attached */}
      {isLegacyDocAttached && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#B45309',
            fontSize: '0.88rem',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Legacy Word (.doc) Attached:</strong> Your profile resume is in legacy .doc format, which is not supported for automated ATS analysis. Please use the <strong>Upload Resume (PDF/DOCX)</strong> button above to analyze a PDF or .docx file.
          </div>
        </div>
      )}

      {/* Loading State Animation */}
      {isAnalyzing && (
        <section className="dashboard-panel glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', position: 'relative', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '4px solid rgba(99, 102, 241, 0.15)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <Sparkles
              size={24}
              color="var(--primary)"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Analyzing your resume...</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '0.88rem' }}>
            Parsing document structure, extracting technical skills, measuring action verb density, and calculating your ATS score.
          </p>
        </section>
      )}

      {/* No Analysis Yet Empty State */}
      {!isAnalyzing && !analysis && (
        <section
          className="dashboard-panel glass-panel"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            borderRadius: '16px',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <FileText size={28} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Start Your Resume Analysis</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.75rem', fontSize: '0.9rem' }}>
            {isLegacyDocAttached
              ? 'Your profile resume is in legacy .doc format. Automated ATS analysis supports modern PDF and .docx files. Please upload a PDF or .docx file below to analyze.'
              : hasAttachedResume
              ? 'Your profile already has a resume attached. Click below to run a comprehensive ATS evaluation or upload a newer version.'
              : 'Upload your resume in PDF or Word (.docx) format to see your ATS score, detected skills, and recommended job matches.'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {hasAttachedResume && !isLegacyDocAttached && (
              <button className="btn btn-primary" onClick={() => runAnalysis(undefined, true)}>
                <Sparkles size={16} /> Analyze Attached Resume
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> {hasAttachedResume && isLegacyDocAttached ? 'Upload PDF or DOCX to Analyze' : 'Choose File to Analyze'}
            </button>
          </div>
        </section>
      )}

      {/* Analysis Results */}
      {!isAnalyzing && analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* TOP SCORE & BREAKDOWN HERO */}
          <section
            className="dashboard-panel glass-panel"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '2rem',
              alignItems: 'center',
              padding: '2rem',
              borderRadius: '18px',
            }}
          >
            {/* Circular Gauge Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  position: 'relative',
                  width: '130px',
                  height: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle
                    cx="65"
                    cy="65"
                    r="52"
                    fill="none"
                    stroke="var(--border-color, #E5E7EB)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="65"
                    cy="65"
                    r="52"
                    fill="none"
                    stroke={scoreInfo?.color || 'var(--primary)'}
                    strokeWidth="10"
                    strokeDasharray={326.7}
                    strokeDashoffset={326.7 - (326.7 * analysis.resume_score) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 65 65)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
                    {analysis.resume_score}
                  </span>
                  <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    / 100
                  </small>
                </div>
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: `${scoreInfo?.color}20`,
                    color: scoreInfo?.color,
                    marginBottom: '0.4rem',
                  }}
                >
                  {scoreInfo?.label}
                </span>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>ATS Compatibility Score</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                  {scoreInfo?.summary}
                </p>
                {analysis.filename && (
                  <small style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <FileText size={13} /> {analysis.filename}
                  </small>
                )}
              </div>
            </div>

            {/* Category Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.1rem' }}>
                Score Dimensions Breakdown
              </div>
              {[
                { label: 'Skills Coverage', val: analysis.breakdown.skills, weight: '25%' },
                { label: 'Experience Depth', val: analysis.breakdown.experience, weight: '25%' },
                { label: 'Projects & Impact', val: analysis.breakdown.projects, weight: '15%' },
                { label: 'Profile & Contact', val: analysis.breakdown.profile_completeness, weight: '15%' },
                { label: 'Education & Credentials', val: analysis.breakdown.education, weight: '10%' },
                { label: 'Keywords & Formatting', val: analysis.breakdown.keywords, weight: '10%' },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    <span>{item.label} <small style={{ color: 'var(--text-muted)' }}>({item.weight})</small></span>
                    <strong>{item.val}%</strong>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--border-color, #E5E7EB)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.val}%`,
                        background: item.val >= 80 ? '#10B981' : item.val >= 60 ? '#6366F1' : '#F59E0B',
                        borderRadius: '999px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TWO COLUMN GRID: EXTRACTED SKILLS & PROFILE INSIGHTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
            {/* Extracted Skills Cloud */}
            <section className="dashboard-panel glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Extracted Skills ({analysis.skills.length})</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>Normalized from resume text</small>
                </div>
                <Award size={18} color="var(--primary)" />
              </div>

              {analysis.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {analysis.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No technical skills detected in the document.</p>
              )}
            </section>

            {/* Profile Insights */}
            <section className="dashboard-panel glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Profile Insights</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>Experience, credentials & roles</small>
                </div>
                <Briefcase size={18} color="var(--primary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <Briefcase size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Detected Experience: </span>
                    <strong>{analysis.experience.years} years ({analysis.experience.seniority})</strong>
                  </div>
                </div>

                {analysis.detected_roles && analysis.detected_roles.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <ShieldCheck size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Detected Roles: </span>
                      <strong>{analysis.detected_roles.join(', ')}</strong>
                    </div>
                  </div>
                )}

                {analysis.education && analysis.education.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <GraduationCap size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Education: </span>
                      <strong>{analysis.education.join(' • ')}</strong>
                    </div>
                  </div>
                )}

                {analysis.certifications && analysis.certifications.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <Award size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Certifications: </span>
                      <strong>{analysis.certifications.join(', ')}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <FolderGit2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Project Section: </span>
                    <strong>{analysis.projects.has_project_section ? `Detected (~${analysis.projects.project_count || 1}+ projects)` : 'Not detected'}</strong>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* STRENGTHS, IMPROVEMENTS & MISSING SECTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
            {/* Strengths */}
            <section className="dashboard-panel glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#10B981' }}>
                <CheckCircle2 size={18} />
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'inherit' }}>Resume Strengths</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {analysis.strengths.map((s, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.83rem', lineHeight: 1.4 }}>
                    <Check size={14} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Improvement Suggestions */}
            <section className="dashboard-panel glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#F59E0B' }}>
                <TrendingUp size={18} />
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'inherit' }}>Actionable Improvements</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {analysis.improvements.map((imp, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.83rem', lineHeight: 1.4 }}>
                    <ChevronRight size={14} color="#F59E0B" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Missing Sections */}
            {analysis.missing_sections && analysis.missing_sections.length > 0 && (
              <section className="dashboard-panel glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#EF4444' }}>
                  <AlertTriangle size={18} />
                  <h3 style={{ fontSize: '1rem', margin: 0, color: 'inherit' }}>Missing Sections</h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  Standard ATS parsers look for these specific headings:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {analysis.missing_sections.map((sec) => (
                    <span
                      key={sec}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* SAFE PROFILE SYNC SECTION */}
          {analysis.extracted_profile_updates && Object.keys(analysis.extracted_profile_updates).length > 0 && (
            <section
              className="dashboard-panel glass-panel"
              style={{
                padding: '1.75rem',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                    Profile Synchronization
                  </span>
                  <h3 style={{ fontSize: '1.15rem', marginTop: '0.2rem', marginBottom: '0.25rem' }}>
                    Information Detected from Your Resume
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                    Select which items you would like to sync to your SkillMatch profile. Existing data will not be overwritten without your explicit consent.
                  </p>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleSyncToProfile}
                  disabled={isSyncing}
                  id="sync-resume-to-profile-btn"
                >
                  <CheckCircle2 size={16} />
                  {isSyncing ? 'Syncing...' : 'Sync Selected to Profile'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.85rem', marginTop: '1rem' }}>
                {analysis.extracted_profile_updates.skills && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem', background: 'var(--surface-color, #FFF)', borderRadius: '10px', border: '1px solid var(--border-color, #E5E7EB)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={syncSelections.skills}
                      onChange={(e) => setSyncSelections({ ...syncSelections, skills: e.target.checked })}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>Technical Skills</strong>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Add {analysis.extracted_profile_updates.skills.length} detected skills
                      </small>
                    </div>
                  </label>
                )}

                {analysis.extracted_profile_updates.experience_years !== undefined && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem', background: 'var(--surface-color, #FFF)', borderRadius: '10px', border: '1px solid var(--border-color, #E5E7EB)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={syncSelections.experience_years}
                      onChange={(e) => setSyncSelections({ ...syncSelections, experience_years: e.target.checked })}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>Experience Years</strong>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Set to {analysis.extracted_profile_updates.experience_years} years
                      </small>
                    </div>
                  </label>
                )}

                {analysis.extracted_profile_updates.experience_level && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem', background: 'var(--surface-color, #FFF)', borderRadius: '10px', border: '1px solid var(--border-color, #E5E7EB)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={syncSelections.experience_level}
                      onChange={(e) => setSyncSelections({ ...syncSelections, experience_level: e.target.checked })}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>Seniority Tier</strong>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Set to {analysis.extracted_profile_updates.experience_level}
                      </small>
                    </div>
                  </label>
                )}

                {analysis.extracted_profile_updates.headline && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem', background: 'var(--surface-color, #FFF)', borderRadius: '10px', border: '1px solid var(--border-color, #E5E7EB)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={syncSelections.headline}
                      onChange={(e) => setSyncSelections({ ...syncSelections, headline: e.target.checked })}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>Professional Title</strong>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        "{analysis.extracted_profile_updates.headline}"
                      </small>
                    </div>
                  </label>
                )}
              </div>
            </section>
          )}

          {/* MATCHING JOBS BASED ON RESUME */}
          {analysis.matching_jobs && analysis.matching_jobs.length > 0 && (
            <section className="dashboard-panel glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Top Matching Jobs for Your Resume</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Scored using SkillMatch's transparent matching engine against current job openings
                  </small>
                </div>
                <Sparkles size={18} color="var(--primary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analysis.matching_jobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      background: 'var(--surface-color, #FFF)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #E5E7EB)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{job.title}</h4>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: job.match_score >= 80 ? '#10B98120' : '#6366F120',
                            color: job.match_score >= 80 ? '#10B981' : '#6366F1',
                          }}
                        >
                          {job.match_score}% Match
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building2 size={13} /> {job.company_name}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={13} /> {job.location}
                        </span>
                        <span>{job.job_type}</span>
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectJob(job as any)}
                      id={`view-matching-job-${job.id}`}
                    >
                      <Eye size={14} /> View Job
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
