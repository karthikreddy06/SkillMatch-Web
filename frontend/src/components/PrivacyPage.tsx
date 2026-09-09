import React from 'react';
import { AIEnergyBackground } from './AIEnergyBackground';
import { ArrowLeft, Shield, Lock, Eye, Database, Server, UserCheck, Mail } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
            <span>LEGAL & PRIVACY TRUST</span>
          </div>
          <h1 className="studio-headline" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '0.75rem' }}>
            Privacy Policy
          </h1>
          <p className="studio-subtext" style={{ fontSize: '0.95rem', marginBottom: '0' }}>
            Last updated: September 2026 • Effective for all SkillMatch users globally
          </p>
        </div>

        {/* Highlight Banner Card */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '2.5rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(99, 102, 241, 0.4)', borderLeft: '4px solid #6366F1' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
            <Lock size={20} style={{ color: '#818CF8' }} />
            <span>Our Commitment to Privacy</span>
          </h3>
          <p style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.65 }}>
            SkillMatch built our AI skill-matching platform to put user privacy and data control first. We collect only the data necessary to provide intelligent skill matching, distance proximity calculations, and direct communication between job seekers and employers.
          </p>
        </div>

        {/* Section Cards Stack */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Section 1 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Eye size={20} style={{ color: '#38BDF8' }} />
              <span>1. Information We Collect</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.85rem' }}>
                We collect information you directly provide when creating an account, building a candidate profile, or posting employment opportunities:
              </p>
              <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.55rem' }}>
                <li><strong style={{ color: '#FFFFFF' }}>Account Credentials:</strong> Full name, verified email address, phone number, and encrypted authentication tokens.</li>
                <li><strong style={{ color: '#FFFFFF' }}>Skill Profiles & Work History:</strong> Listed technical/trade skills, experience level, preferred shifts, hourly rate expectations, and uploaded resume files (PDF/DOCX).</li>
                <li><strong style={{ color: '#FFFFFF' }}>Location & Proximity Data:</strong> Zip code/city location and selected travel radius preference (e.g. 5 km, 10 km, 15 km) to compute job proximity.</li>
                <li><strong style={{ color: '#FFFFFF' }}>Employer Business Details:</strong> Company name, tax/business registration, office address, hiring manager name, and active job postings.</li>
                <li><strong style={{ color: '#FFFFFF' }}>Messaging & Application Data:</strong> In-app candidate messages, scheduled interview dates, ATS pipeline statuses, and application submission timestamps.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Database size={20} style={{ color: '#8B5CF6' }} />
              <span>2. How We Use Information</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.85rem' }}>Your data enables our core AI engine and platform capabilities:</p>
              <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.55rem' }}>
                <li>Computing AI Skill Match percentage scores between candidate capability vectors and job requirements.</li>
                <li>Displaying localized job recommendations within your configured commute radius.</li>
                <li>Allowing employers to view applicant profiles and process applications through the ATS Kanban pipeline.</li>
                <li>Enabling real-time candidate-employer messaging and interview scheduling.</li>
                <li>Sending essential transactional notifications regarding application updates and interview invitations.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Server size={20} style={{ color: '#10B981' }} />
              <span>3. Location Data & Permissions</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p>
                SkillMatch uses location data solely for calculating distance compatibility between job seekers and active work sites. Your exact GPS coordinates are never made public to other users or sold to third-party ad networks. Distance is presented as approximate radial ranges (e.g. "4 km away") to protect personal location privacy.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Lock size={20} style={{ color: '#EC4899' }} />
              <span>4. Data Security & Storage</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.85rem' }}>
                We employ enterprise-grade security controls to safeguard user information:
              </p>
              <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.55rem' }}>
                <li>HTTPS SSL/TLS encryption for all data in transit.</li>
                <li>Token-based authentication and secure session management.</li>
                <li>Restricted database access policies ensuring resume files and candidate contact details are accessible only by relevant hiring parties.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <UserCheck size={20} style={{ color: '#F59E0B' }} />
              <span>5. User Rights & Data Control</span>
            </h2>
            <div style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.85rem' }}>You maintain full rights over your personal data:</p>
              <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.55rem' }}>
                <li><strong style={{ color: '#FFFFFF' }}>Access & Update:</strong> Modify your profile, skills, experience, and uploaded resume at any time via Settings.</li>
                <li><strong style={{ color: '#FFFFFF' }}>Deletion Request:</strong> Request complete account and profile deletion by emailing our support team.</li>
                <li><strong style={{ color: '#FFFFFF' }}>Preferences:</strong> Toggle notifications, dark/light theme, and radius settings freely.</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Contact */}
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Mail size={20} style={{ color: '#818CF8' }} />
              <span>6. Contact Us Regarding Privacy</span>
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '1rem' }}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please reach out to our privacy officer:
            </p>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#FFFFFF' }}>
              Email: <a href="mailto:karthikkarthik05421@gmail.com" style={{ color: '#A5B4FC', textDecoration: 'underline' }}>karthikkarthik05421@gmail.com</a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
