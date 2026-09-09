import React from 'react';
import { AIEnergyBackground } from './AIEnergyBackground';
import { ArrowLeft, FileCheck, ShieldAlert, Scale, CheckCircle2, AlertTriangle, HelpCircle, Mail } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <div className="studio-landing-canvas" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Animated AI Neural Energy Particle Background */}
      <AIEnergyBackground />

      {/* Radiant atmospheric background lighting */}
      <div className="studio-ambient-aura aura-top-left" />
      <div className="studio-ambient-aura aura-bottom-left" />
      <div className="studio-ambient-aura aura-top-right" />
      <div className="studio-ambient-aura aura-bottom-right" />

      {/* Main Content Area */}
      <main className="container" style={{ maxWidth: '960px', padding: '3.5rem 1.5rem 6rem', position: 'relative', zIndex: 10 }}>
        {/* Back Button Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={onBack}
            className="studio-secondary-btn"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div className="studio-eyebrow" style={{ marginBottom: '1rem' }}>
            <span className="studio-eyebrow-dot" />
            <span>TERMS OF SERVICE AGREEMENT</span>
          </div>
          <h1 className="studio-headline" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '0.75rem' }}>
            Terms of Service
          </h1>
          <p className="studio-subtext" style={{ fontSize: '0.95rem', marginBottom: '0' }}>
            Last updated: September 2026 • Effective upon access or registration
          </p>
        </div>

        {/* Highlight Card */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '2.5rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(99, 102, 241, 0.4)', borderLeft: '4px solid #8B5CF6' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
            <FileCheck size={20} style={{ color: '#A78BFA' }} />
            <span>Acceptance of Terms</span>
          </h3>
          <p style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.65 }}>
            By accessing or using SkillMatch (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website or services.
          </p>
        </div>

        {/* Section Cards Stack */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Section 1 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <CheckCircle2 size={20} style={{ color: '#38BDF8' }} />
              <span>1. Using SkillMatch & Account Eligibility</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.85rem' }}>
                SkillMatch provides an intelligent hiring platform connecting job seekers with local employers.
              </p>
              <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.55rem' }}>
                <li>You must be at least 18 years old (or legal working age in your jurisdiction) to register an account.</li>
                <li>You agree to maintain the security of your password and accept responsibility for all activities occurring under your account credentials.</li>
                <li>Accounts created using automated bots, fake credentials, or unauthorized scripts are strictly prohibited.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Scale size={20} style={{ color: '#10B981' }} />
              <span>2. Job Seeker & Employer Responsibilities</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.85rem' }}><strong style={{ color: '#FFFFFF' }}>Job Seekers:</strong> You agree that all listed skills, work history, availability, and uploaded resumes represent truthful, accurate information.</p>
              <p><strong style={{ color: '#FFFFFF' }}>Employers:</strong> You agree that all published job openings represent genuine, lawful employment opportunities with accurate compensation, shift details, and non-discriminatory requirements.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
              <span>3. AI Skill Matching & Recommendations Disclaimer</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p>
                SkillMatch AI Match Scores, skill similarity metrics, and location proximity filters are assistive recommendations designed to help candidates and hiring managers connect. They do not guarantee employment, job offers, or candidate performance. Final hiring decisions rest solely between employers and candidates.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <ShieldAlert size={20} style={{ color: '#EC4899' }} />
              <span>4. Location Services & Prohibited Conduct</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.85rem' }}>Prohibited activities on SkillMatch include:</p>
              <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.55rem' }}>
                <li>Posting fraudulent, misleading, or deceptive job listings or candidate resumes.</li>
                <li>Harassing, spamming, or sending unauthorized promotional content to candidates or employers via in-app messaging.</li>
                <li>Scraping or harvesting user profile data, resumes, or job postings without written consent.</li>
                <li>Attempting to bypass security controls or reverse-engineer platform matching algorithms.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <FileCheck size={20} style={{ color: '#6366F1' }} />
              <span>5. Content & Uploaded Resumes</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p>
                You retain ownership of all resumes, work portfolios, and job posting content you upload to SkillMatch. By uploading content, you grant SkillMatch a worldwide, non-exclusive license to process, store, and display your content strictly to perform matching services and present applications to relevant hiring parties.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <HelpCircle size={20} style={{ color: '#38BDF8' }} />
              <span>6. Account Termination & Limitation of Liability</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p>
                SkillMatch reserves the right to suspend or terminate accounts violating these Terms. Under no circumstances shall SkillMatch be liable for indirect, incidental, or consequential damages resulting from employment disputes, hiring decisions, or platform downtime.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Mail size={20} style={{ color: '#A78BFA' }} />
              <span>7. Contact Us Regarding Terms</span>
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '1rem' }}>
              If you have any questions regarding these Terms of Service, please contact our legal team:
            </p>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#FFFFFF' }}>
              Email: <a href="mailto:karthikkarthik05421@gmail.com" style={{ color: '#A78BFA', textDecoration: 'underline' }}>karthikkarthik05421@gmail.com</a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
