import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChatConversation } from '../types';
import { api } from '../services/api';
import { VerifiedBadge } from './VerifiedBadge';

interface ChatInboxViewProps {
  onOpenChat: (applicationId: string) => void;
}

export const ChatInboxView: React.FC<ChatInboxViewProps> = ({ onOpenChat }) => {
  const { user, role } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInbox = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const data = await api.getChatInbox(user.id);
        setConversations(data);
      } catch (err) {
        console.error('Failed to load chat inbox:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInbox();
  }, [user?.id]);

  const filteredConversations = conversations.filter((conversation) => {
    const haystack = `${conversation.contact_name} ${conversation.job_title} ${conversation.last_message}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase().trim());
  });

  if (isLoading) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading conversations...</p>
      </div>
    );
  }

  return (
    <section className="section" style={{ paddingTop: '1.5rem' }}>
      <div className="container">
        <div className="chat-inbox-heading">
          <h2 style={{ fontSize: '1.75rem' }}>Direct Messages & Interview Threads</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Communicate directly with {role === 'seeker' ? 'recruiters and hiring managers' : 'candidates and applicants'}.
          </p>
          <label className="chat-search-field">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages"
              aria-label="Search messages"
            />
          </label>
        </div>

        {conversations.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <MessageSquare size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>No conversation threads yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Conversations are initiated automatically when an application is submitted or when an interview invitation is dispatched.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredConversations.map((conv) => (
              <div
                key={conv.application_id}
                className="glass-panel interactive-card"
                onClick={() => onOpenChat(conv.application_id)}
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-lg)',
                }}
                id={`chat-thread-${conv.application_id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                        color: '#FFFFFF',
                    }}
                  >
                    {(conv.contact_name || 'U')[0].toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {conv.contact_name}
                      </span>
                      {role === 'seeker' && <VerifiedBadge size="sm" />}
                      {conv.unread_count > 0 && <span className="chat-unread-dot" aria-label={`${conv.unread_count} unread messages`} />}
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {conv.job_title}
                      </span>
                      {conv.status === 'interview' && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          📅 Interview
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.2rem',
                        maxWidth: '550px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {conv.last_message}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(conv.last_message_time).toLocaleDateString()}
                  </div>
                  <button className="btn btn-ghost btn-icon">
                    <ArrowRight size={18} color="var(--primary)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
