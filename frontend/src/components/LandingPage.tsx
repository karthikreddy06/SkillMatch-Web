import React from 'react';
import { Job, UserRole } from '../types';
import { SkillMatchScene } from './SkillMatchScene';
import { AIEnergyBackground } from './AIEnergyBackground';

interface LandingPageProps {
  jobs: Job[];
  onOpenAuth: (mode?: 'login' | 'register', role?: UserRole) => void;
  onSelectJob: (job: Job) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
}) => {
  return (
    <div className="studio-landing-canvas">
      {/* Animated AI Neural Energy Particle Background */}
      <AIEnergyBackground />

      {/* Radiant atmospheric background lighting */}
      <div className="studio-ambient-aura aura-top-left" />
      <div className="studio-ambient-aura aura-bottom-left" />
      <div className="studio-ambient-aura aura-top-right" />
      <div className="studio-ambient-aura aura-bottom-right" />

      {/* =========================================================================
          01 — HERO SECTION (Centered, Editorial with Handwritten Accents)
          ========================================================================= */}
      <section className="studio-hero-section">
        <div className="container" style={{ maxWidth: '1180px', position: 'relative' }}>
          {/* Handwritten Annotation — Left: "Real People, Real Work" */}
          <div className="handwritten-annotation annotation-left">
            <span className="annotation-line">Real</span>
            <span className="annotation-line">People</span>
            <span className="annotation-line">Real Work</span>
            <svg className="annotation-curl" width="96" height="12" viewBox="0 0 96 12" fill="none">
              <path d="M2 7 C 28 2, 64 11, 94 4" stroke="#818CF8" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Handwritten Annotation — Right: "More Opportunities Closer to You" */}
          <div className="handwritten-annotation annotation-right">
            <span className="annotation-line">More</span>
            <span className="annotation-line">Opportunities</span>
            <span className="annotation-line">Closer to You</span>
            <svg className="annotation-curl" width="112" height="12" viewBox="0 0 112 12" fill="none">
              <path d="M3 6 C 36 10, 78 3, 109 7" stroke="#C084FC" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Small Eyebrow */}
          <div className="studio-eyebrow">
            <span className="studio-eyebrow-dot" />
            <span>AI-POWERED JOB MATCHING</span>
          </div>

          {/* Main Headline Wrap with Radiating Sparkles */}
          <div className="studio-headline-wrap">
            <svg className="headline-spark-rays" width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 32 L 17 25" stroke="#8B5CF6" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M15 17 L 21 8" stroke="#8B5CF6" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M26 23 L 34 17" stroke="#8B5CF6" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            <h1 className="studio-headline">
              Find work that fits you.
            </h1>
          </div>

          {/* Supporting Text */}
          <p className="studio-subtext">
            For skilled trades, service, office roles, logistics, tech, and everything in between — SkillMatch pairs what you can do with opportunities near you.
          </p>

          {/* Call to Action Row */}
          <div className="studio-cta-row">
            <button
              className="studio-primary-btn"
              onClick={() => onOpenAuth('register', 'seeker')}
              id="hero-find-jobs-btn"
            >
              <span>Find Jobs Near You</span>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>→</span>
            </button>

            <a
              href="#how-it-works"
              className="studio-secondary-btn"
              id="hero-how-it-works-btn"
            >
              How It Works
            </a>
          </div>



          {/* =========================================================================
              02 — THE UNBOXED CINEMATIC HERO VISUAL (Natural, Open, Centerpiece)
              ========================================================================= */}
          <div className="hero-scene-wrap">
            <SkillMatchScene />
          </div>
        </div>
      </section>

      {/* =========================================================================
          04 — FINAL CLOSING CTA SECTION
          ========================================================================= */}
      <section className="studio-cta-section">
        <div className="container" style={{ maxWidth: '780px' }}>
          <div className="studio-eyebrow" style={{ marginBottom: '1.5rem' }}>
            <span className="studio-eyebrow-dot" />
            <span>GET STARTED</span>
          </div>

          <h2 className="studio-cta-title">
            Your next opportunity is closer than you think.
          </h2>

          <p className="studio-cta-desc">
            Find jobs matched to your skills and location — across all crafts, trades, and industries.
          </p>

          <button
            className="studio-primary-btn"
            onClick={() => onOpenAuth('register', 'seeker')}
            id="footer-find-jobs-btn"
          >
            <span>Find Jobs Near You</span>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>→</span>
          </button>
        </div>
      </section>
    </div>
  );
};
