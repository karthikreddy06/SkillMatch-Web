import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface AnimatedFooterProps {
  onNavigate?: (tab: string) => void;
}

export const AnimatedFooter: React.FC<AnimatedFooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer
      style={{
        background: '#0B0D12',
        color: '#FFFFFF',
        padding: '5rem 0 2rem 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="animated-cinematic-footer"
      id="main-animated-footer"
    >
      <div className="container">
        {/* Upper Grid: HEADQUARTERS, NEWSLETTER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            marginBottom: '4rem',
            fontSize: '0.85rem',
            fontFamily: 'monospace, sans-serif',
            maxWidth: '850px',
            margin: '0 auto 4rem auto',
          }}
        >

          {/* HEADQUARTERS/ */}
          <div>
            <div
              style={{
                color: '#6B7280',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                marginBottom: '1.25rem',
              }}
            >
              HEADQUARTERS/
            </div>
            <div style={{ color: '#D1D5DB', lineHeight: 1.8 }}>
              <div>Bengaluru, India</div>
            </div>
          </div>

          {/* NEWSLETTER/ */}
          <div style={{ gridColumn: 'span 1' }}>
            <div
              style={{
                color: '#6B7280',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                marginBottom: '1.25rem',
              }}
            >
              NEWSLETTER/
            </div>
            <form onSubmit={handleSubscribe} style={{ marginBottom: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.5rem',
                }}
              >
                <input
                  type="email"
                  placeholder="EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace, sans-serif',
                    outline: 'none',
                    flex: 1,
                    padding: '0.25rem 0.5rem',
                  }}
                  required
                />
                <button
                  type="submit"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', lineHeight: 1.5 }}>
              {subscribed
                ? '✓ Subscribed! You will receive periodic matching insights.'
                : 'Receive occasional insights on brand identity, AI matching, and market taste.'}
            </div>
          </div>
        </div>

        {/* GIANT ANIMATED BRAND TITLE: SKILLMATCH */}
        <div
          style={{
            textAlign: 'center',
            margin: '2rem 0 3rem 0',
            userSelect: 'none',
            overflow: 'hidden',
          }}
          className="giant-brand-title-container"
        >
          <div className="giant-brand-text">
            SKILLMATCH
          </div>
        </div>

        {/* Bottom Metadata & Legal Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem',
            fontFamily: 'monospace, sans-serif',
            color: '#6B7280',
          }}
        >
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span
              style={{ cursor: 'pointer' }}
              className="legal-link"
              onClick={() => {
                if (onNavigate) onNavigate('privacy');
                window.location.hash = '#privacy';
              }}
            >
              PRIVACY POLICY
            </span>
            <span
              style={{ cursor: 'pointer' }}
              className="legal-link"
              onClick={() => {
                if (onNavigate) onNavigate('support');
                window.location.hash = '#support';
              }}
            >
              SUPPORT
            </span>
            <span
              style={{ cursor: 'pointer' }}
              className="legal-link"
              onClick={() => {
                if (onNavigate) onNavigate('terms');
                window.location.hash = '#terms';
              }}
            >
              TERMS OF SERVICE
            </span>
          </div>

          <div>
            © {new Date().getFullYear()} SKILLMATCH STUDIOS LLC. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  );
};
