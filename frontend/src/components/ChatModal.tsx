import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Calendar,
  User,
  Clock,
  Check,
  Sparkles,
  MapPin,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { Message, Profile } from '../types';
import { api } from '../services/api';
import { VerifiedBadge } from './VerifiedBadge';

interface ChatModalProps {
  applicationId: string;
  user: Profile | null;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  applicationId,
  user,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSeeker = user?.role === 'seeker';

  // Dynamic LinkedIn-style suggestion prompt chips
  const suggestionPrompts = isSeeker
    ? [
        { label: '👋 Express Interest', text: "Hello! I am very interested in this role and would love to connect." },
        { label: '📅 Inquire Interview', text: "When would be a convenient time for a brief screening call?" },
        { label: '📍 Workplace & Shifts', text: "Could you please share details regarding the workplace location and shift hours?" },
        { label: '📄 Portfolio & Skills', text: "I have updated my profile with relevant project experience and credentials." },
        { label: '💼 Immediate Availability', text: "I am available to join immediately or within a short notice period." },
      ]
    : [
        { label: '👋 Initial Screening', text: "Thanks for applying! We were impressed by your background and would like to schedule a 15-minute introductory call." },
        { label: '🕒 Check Availability', text: "Are you available for a brief interview tomorrow between 2:00 PM and 5:00 PM?" },
        { label: '📍 Commute Check', text: "Our workplace is located at our main facility. Does that commute work comfortably for you?" },
        { label: '📋 Experience Details', text: "Could you tell us more about your direct hands-on experience in this domain?" },
        { label: '✅ Next Steps', text: "Your profile has been shortlisted! We will be sending an official interview calendar invite shortly." },
      ];

  const fetchMessages = async () => {
    try {
      const data = await api.getApplicationMessages(applicationId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const content = (textToSend || newMessage).trim();
    if (!content || !user?.id) return;

    setIsSending(true);
    try {
      const msg = await api.sendMessage(applicationId, content, user.id);
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="chat-modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          height: '700px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header with Verified Badge */}
        <div
          className="modal-header"
          style={{
            padding: '1.15rem 1.5rem',
            background: '#FFFFFF',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontWeight: 700,
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                  {isSeeker ? 'Employer Hiring Desk' : 'Candidate Messenger'}
                </h3>
                <VerifiedBadge size="sm" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Verified Direct Thread • Real-time ATS Synchronization
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-chat-modal-btn">
            <X size={20} />
          </button>
        </div>

        {/* Message Thread Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: '#F8F9FC',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                margin: 'auto',
                color: 'var(--text-muted)',
                maxWidth: '380px',
                padding: '1.5rem',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <Sparkles size={26} color="#818CF8" />
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                Start a Professional Conversation
              </div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Use the smart suggestions below to introduce yourself, discuss qualifications, or coordinate interview timings.
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const isInterviewNotice = msg.content.includes('📅 Interview Invitation');

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: isInterviewNotice ? '1rem 1.25rem' : '0.75rem 1.15rem',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isInterviewNotice
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)'
                        : isMine
                        ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: isInterviewNotice
                        ? '1px solid rgba(245, 158, 11, 0.5)'
                        : isMine
                        ? 'none'
                        : '1px solid var(--border-card)',
                      color: isMine || isInterviewNotice ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      boxShadow: isMine ? '0 4px 14px rgba(99, 102, 241, 0.25)' : 'none',
                    }}
                  >
                    {isInterviewNotice && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontWeight: 700,
                          color: '#FDE68A',
                          fontSize: '0.85rem',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <Calendar size={15} />
                        <span>Official Interview Notice</span>
                      </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.25rem',
                      padding: '0 0.4rem',
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips Bar (LinkedIn Style) */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            background: '#FFFFFF',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={11} color="#818CF8" />
            <span>Suggested Responses (Click to insert or send):</span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.45rem',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
            }}
          >
            {suggestionPrompts.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNewMessage(chip.text);
                }}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 500,
                  background: '#F8F7FC',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = '#818CF8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F8F7FC';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                title={chip.text}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            padding: '0.9rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            background: '#FFFFFF',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder={
              isSeeker
                ? 'Type message to employer or select a suggestion above...'
                : 'Type message to applicant or select a suggestion above...'
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ marginBottom: 0 }}
            id="chat-message-input"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSending || !newMessage.trim()}
            id="send-message-btn"
            style={{ padding: '0.75rem 1.25rem' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
