import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Building, Globe, MapPin, Hash, FileCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VerifiedBadge } from './VerifiedBadge';

interface CompanyVerificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CompanyVerificationModal: React.FC<CompanyVerificationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { user, updateProfile } = useAuth();

  const [legalName, setLegalName] = useState(user?.company_name || 'TechNova Solutions Pvt Ltd');
  const [regNumber, setRegNumber] = useState(user?.company_registration_no || 'U72200KA2021PTC148892');
  const [taxId, setTaxId] = useState(user?.tax_id || '29AAACT1234F1Z5');
  const [website, setWebsite] = useState(user?.company_website || 'https://technova.io');
  const [address, setAddress] = useState(user?.company_address || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim() || !regNumber.trim() || !taxId.trim()) {
      setError('Please provide Legal Name, Registration / CIN, and Tax ID.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateProfile({
        company_name: legalName.trim(),
        company_registration_no: regNumber.trim(),
        tax_id: taxId.trim(),
        company_website: website.trim(),
        company_address: address.trim(),
        is_verified: true,
        verification_status: 'verified',
        verification_submitted_at: new Date().toISOString(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="company-verification-modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: 0, overflow: 'hidden' }}
      >
        {/* Header with Verification Trust Header */}
        <div
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#FFFFFF' }}>
                  Company Authenticity Verification
                </h2>
                <VerifiedBadge size="sm" />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Verify legal business identity to earn the official trust badge and increase candidate reach.
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-verification-modal-btn">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem' }}>
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: '#F87171',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Why Verify Notice Box */}
            <div
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
                color: '#BAE6FD',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2 size={18} style={{ color: '#38BDF8', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Verified Employer Benefits:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)' }}>
                  <li>Official <strong>Verified Company Badge</strong> displayed on all job cards and direct chats</li>
                  <li>3x higher candidate application rates and instant candidate trust</li>
                  <li>Priority placement in Candidate Discovery Feed & Commute Radar</li>
                </ul>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={14} color="#38BDF8" />
                  <span>Legal Registered Business Name *</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Acme Technologies Private Limited"
                  required
                  id="verification-legal-name-input"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Hash size={14} color="#38BDF8" />
                  <span>Registration / CIN / Business License # *</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. U72200KA2021PTC148892"
                  required
                  id="verification-cin-input"
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileCheck size={14} color="#38BDF8" />
                  <span>Tax ID / GSTIN / EIN *</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. 29AAACT1234F1Z5 or EIN-1234567"
                  required
                  id="verification-tax-input"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe size={14} color="#38BDF8" />
                  <span>Official Corporate Website</span>
                </label>
                <input
                  type="url"
                  className="input-field"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  id="verification-website-input"
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="#38BDF8" />
                <span>Registered Physical Headquarters Address *</span>
              </label>
              <textarea
                className="input-field"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building, Street, Landmark, City, State, Postal Code"
                required
                id="verification-address-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSubmitting}
                id="cancel-verification-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                id="submit-verification-btn"
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                }}
              >
                <ShieldCheck size={16} />
                <span>{isSubmitting ? 'Verifying Credentials...' : 'Submit & Activate Verified Badge'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
