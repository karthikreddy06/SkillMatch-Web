import React, { useState } from 'react';
import { AIEnergyBackground } from './AIEnergyBackground';
import { ArrowLeft, Search, Phone, Mail, HelpCircle, User, FileText, Briefcase, Sparkles, MapPin, CheckCircle, ChevronDown, Send } from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);

  const faqs = [
    {
      category: 'Account & Profile',
      icon: <User size={18} style={{ color: '#38BDF8' }} />,
      question: 'How do I reset my password or update my profile skills?',
      answer: 'You can switch between Candidate and Employer modes from the Settings menu. To update listed skills, upload a fresh resume in Profile settings or manually add capabilities in your profile editor.',
    },
    {
      category: 'Finding Jobs',
      icon: <FileText size={18} style={{ color: '#8B5CF6' }} />,
      question: 'How does SkillMatch recommend jobs near me?',
      answer: 'Job recommendations combine vector skill compatibility with your selected commute distance radius. Our engine parses job requirements and ranks opportunities based on your exact skill fit.',
    },
    {
      category: 'Applications & Saved Jobs',
      icon: <Briefcase size={18} style={{ color: '#10B981' }} />,
      question: 'How do I track submitted applications and saved jobs?',
      answer: 'Candidate dashboards feature dedicated tabs for "My Applications" (real-time ATS status tracking) and "Saved Jobs" (bookmarking interesting opportunities to apply later).',
    },
    {
      category: 'AI Matching Questions',
      icon: <Sparkles size={18} style={{ color: '#F59E0B' }} />,
      question: 'What does the Match Percentage score mean?',
      answer: 'The Match Percentage combines your skill capability fit and location radius proximity into an objective score so you immediately see how well your qualifications fit a job opening.',
    },
    {
      category: 'Location & Nearby Jobs',
      icon: <MapPin size={18} style={{ color: '#6366F1' }} />,
      question: 'How do I adjust my search radius for local jobs?',
      answer: 'Use the location radius filter (5 km, 10 km, 15 km, 25 km, or 50 km) on the Job Discovery view to adjust how far you want to travel for local opportunities.',
    },
    {
      category: 'Employer Job Posting & Pipeline',
      icon: <CheckCircle size={18} style={{ color: '#EC4899' }} />,
      question: 'How do employers post jobs and screen applicants?',
      answer: 'Employers click "Post Job Opening" to publish roles. Applications stream into an interactive ATS Kanban pipeline where hiring managers can review candidates, shortlist, and schedule interviews.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => setTicketSent(false), 5000);
  };

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
      <main className="container" style={{ maxWidth: '1040px', padding: '3.5rem 1.5rem 6rem', position: 'relative', zIndex: 10 }}>
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

        {/* Hero Banner with Search */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="studio-eyebrow" style={{ marginBottom: '1rem' }}>
            <span className="studio-eyebrow-dot" />
            <span>HELP & SUPPORT CENTER</span>
          </div>
          <h1 className="studio-headline" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', marginBottom: '1rem' }}>
            How can we help?
          </h1>
          <p className="studio-subtext" style={{ fontSize: '1.05rem', marginBottom: '2rem' }}>
            Search for answers or connect directly with our SkillMatch support team.
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
            <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search topics: AI matching, resume upload, location radius, posting jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1.25rem 1rem 3.25rem',
                borderRadius: '99px',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: 'rgba(17, 25, 54, 0.85)',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                outline: 'none',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* Direct Contact Cards Row (Clickable Phone & Email) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
          {/* Phone Support Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.18)', display: 'grid', placeItems: 'center', color: '#38BDF8', flexShrink: 0 }}>
              <Phone size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CALL SUPPORT</span>
              <h3 style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>
                <a href="tel:9390527148" style={{ color: '#FFFFFF', textDecoration: 'none' }} className="support-contact-link">
                  9390527148
                </a>
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600 }}>Mon - Sat, 9:00 AM - 7:00 PM IST</span>
            </div>
          </div>

          {/* Email Support Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.18)', display: 'grid', placeItems: 'center', color: '#A78BFA', flexShrink: 0 }}>
              <Mail size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>EMAIL SUPPORT</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.2rem 0', wordBreak: 'break-all' }}>
                <a href="mailto:karthikkarthik05421@gmail.com" style={{ color: '#FFFFFF', textDecoration: 'none' }} className="support-contact-link">
                  karthikkarthik05421@gmail.com
                </a>
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600 }}>Fast response within 2 hours</span>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', color: '#FFFFFF' }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{ borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s ease', background: 'rgba(17, 25, 54, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#FFFFFF',
                      font: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {faq.icon}
                      <span style={{ fontWeight: 600, fontSize: '1.02rem' }}>{faq.question}</span>
                    </div>
                    <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: '#9CA3AF' }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem 3.1rem', color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.65, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
                      <span className="badge badge-primary" style={{ marginBottom: '0.5rem', fontSize: '0.7rem' }}>{faq.category}</span>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', maxWidth: '720px', margin: '0 auto', background: 'rgba(17, 25, 54, 0.9)', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFFFFF' }}>Contact Support</h3>
            <p style={{ color: '#CBD5E1', fontSize: '0.9rem' }}>
              Have a specific inquiry? Submit a ticket directly to <span style={{ color: '#818CF8' }}>karthikkarthik05421@gmail.com</span>
            </p>
          </div>

          {ticketSent ? (
            <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', textAlign: 'center', color: '#34D399', fontWeight: 600 }}>
              ✓ Support ticket sent successfully! Our team will respond shortly.
            </div>
          ) : (
            <form onSubmit={handleSupportTicket} style={{ display: 'grid', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label" style={{ color: '#CBD5E1' }}>Your Name</label>
                  <input type="text" className="input-field" placeholder="John Doe" required style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }} />
                </div>
                <div>
                  <label className="input-label" style={{ color: '#CBD5E1' }}>Email Address</label>
                  <input type="email" className="input-field" placeholder="you@example.com" required style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }} />
                </div>
              </div>
              <div>
                <label className="input-label" style={{ color: '#CBD5E1' }}>Subject</label>
                <input type="text" className="input-field" placeholder="Skill matching / Account question" required style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }} />
              </div>
              <div>
                <label className="input-label" style={{ color: '#CBD5E1' }}>How can we help you?</label>
                <textarea className="input-field" placeholder="Describe your issue or question in detail..." rows={4} required style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }} />
              </div>
              <button type="submit" className="studio-primary-btn" style={{ justifySelf: 'center', padding: '0.85rem 2.5rem', borderRadius: '99px', marginTop: '0.5rem' }}>
                <Send size={16} />
                <span>Submit Ticket</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
