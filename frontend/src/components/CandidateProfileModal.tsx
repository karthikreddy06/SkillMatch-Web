import React, { useRef, useState } from 'react';
import {
  X,
  User,
  Sparkles,
  Plus,
  Trash2,
  FileText,
  Check,
  Upload,
  AlertCircle,
  Clock,
  Globe,
  Pencil,
  MapPin,
  Building,
  ShieldCheck,
  Hash,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { VerifiedBadge } from './VerifiedBadge';

interface CandidateProfileModalProps {
  onClose: () => void;
  onSavedSuccess: () => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  onClose,
  onSavedSuccess,
}) => {
  const { user, updateProfile, setUserProfile } = useAuth();

  const isEmployer = user?.role === 'employer';

  // Seeker State
  const [fullName, setFullName] = useState(user?.full_name || 'James Carter');
  const [email, setEmail] = useState(user?.email || 'jamescarter1930@gmail.com');
  const [headline, setHeadline] = useState(user?.headline || 'Project manager');
  const [timezone, setTimezone] = useState('GMT-8');
  const [workingHours, setWorkingHours] = useState(user?.preferred_shift || '10 AM – 6 PM');
  const [location, setLocation] = useState(user?.location || '');
  const [latitude, setLatitude] = useState<number | undefined>(user?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(user?.longitude);
  const [locationStatus, setLocationStatus] = useState('');
  const [skills, setSkills] = useState<string[]>(
    user?.skills && user.skills.length > 0
      ? user.skills
      : []
  );
  const [newSkill, setNewSkill] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [resumeUrl, setResumeUrl] = useState(user?.resume_url || '');
  const [resumeName, setResumeName] = useState(
    user?.resume_url?.split('/').pop()?.split('?')[0] || ''
  );

  // Employer State
  const [companyName, setCompanyName] = useState(
    user?.company_name || user?.full_name || 'blp industry.AI'
  );
  const [regNumber, setRegNumber] = useState(user?.company_registration_no || 'U72200KA2021PTC148892');
  const [taxId, setTaxId] = useState(user?.tax_id || '29AAACT1234F1Z5');
  const [website, setWebsite] = useState(user?.company_website || 'https://blpindustry.ai');
  const [address, setAddress] = useState(
    user?.company_address || ''
  );
  const [bio, setBio] = useState(
    user?.bio || 'Enterprise AI and Industrial Intelligence Platform solving complex matching & automation.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');

    const allowedExts = ['pdf', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExts.includes(ext)) {
      setUploadError('Invalid file format. Allowed formats: PDF, DOC, DOCX.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    if (!user?.id) return;

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);

      const res = await api.uploadResume(formData);
      if (res.resume_url) {
        setResumeUrl(res.resume_url);
        setResumeName(res.filename || file.name);
        setUploadSuccess('Resume uploaded successfully!');
        if (res.profile) {
          setUserProfile(res.profile);
        }
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload resume.');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid image format. Allowed formats: JPG, JPEG, PNG, WebP.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size exceeds 2MB limit.');
      e.target.value = '';
      return;
    }
    if (!user?.id) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);
      const res = await api.uploadAvatar(formData);
      setAvatarUrl(res.avatar_url);
      if (res.profile) setUserProfile(res.profile);
      setUploadSuccess('Profile image uploaded successfully!');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload profile image.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('Browser location is unavailable.'); return; }
    setLocationStatus('Requesting location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude: nextLat, longitude: nextLng } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${nextLat}&lon=${nextLng}`);
        const data = response.ok ? await response.json() : null;
        setLatitude(nextLat); setLongitude(nextLng); setLocation(data?.display_name || location);
        setLocationStatus('Using your current location.');
      } catch { setLocationStatus('Coordinates found, but readable address lookup failed.'); }
    }, (error) => setLocationStatus(error.code === error.PERMISSION_DENIED ? 'Location access is disabled. You can search manually.' : 'Unable to get your location.'), { enableHighAccuracy: true, timeout: 10000 });
  };

  const searchLocation = async () => {
    if (!location.trim()) return;
    setLocationStatus('Searching location...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`);
      const result = (await response.json())[0];
      if (!result) throw new Error('Location not found');
      setLatitude(Number(result.lat)); setLongitude(Number(result.lon)); setLocation(result.display_name); setLocationStatus('Using your selected location.');
    } catch { setLocationStatus('Location not found. Try a city or area name.'); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadError('');
    try {
      if (isEmployer) {
        const updated = await updateProfile({
          company_name: companyName,
          full_name: companyName,
          email,
          company_website: website,
          company_location: address,
          about_company: bio,
          avatar_url: avatarUrl,
        });
        setUserProfile(updated);
      } else {
        const updated = await updateProfile({
          full_name: fullName,
          email,
          headline,
          location,
          avatar_url: avatarUrl,
          preferred_shift: workingHours,
          latitude,
          longitude,
          skills,
          resume_url: resumeUrl,
        });
        setUserProfile(updated);
      }
      onSavedSuccess();
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = user?.updated_at
    ? new Date(user.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Dec 24, 2025';

  return (
    <div className="modal-overlay" onClick={onClose} id="seeker-profile-modal-overlay">
      <div
        className="modal-content profile-editor-reference-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#FAFAFA',
          color: '#111827',
          borderRadius: '24px',
          padding: 0,
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F3F4F6',
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#111827' }}>
              {isEmployer ? 'Edit Company Profile' : 'Edit your profile'}
            </h2>
            {isEmployer && <VerifiedBadge size="sm" />}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            id="close-profile-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body: Split dual-pane */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            padding: '1.75rem 2rem',
            gap: '2rem',
            alignItems: 'start',
          }}
          className="profile-split-pane-grid"
        >
          {/* LEFT COLUMN: FORM INPUTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {isEmployer ? (
              /* =======================================
                 EMPLOYER COMPANY FORM FIELDS (NO RESUME)
                 ======================================= */
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="ref-profile-input"
                    placeholder="blp industry.AI"
                    required
                    id="profile-company-name-input"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Official Corporate Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ref-profile-input"
                    placeholder="lalithkumar3136@gmail.com"
                    id="profile-email-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        color: '#6B7280',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Registration / CIN #
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="ref-profile-input"
                      placeholder="U72200KA2021PTC148892"
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        color: '#6B7280',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Tax ID / GSTIN
                    </label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="ref-profile-input"
                      placeholder="29AAACT1234F1Z5"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Corporate Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="ref-profile-input"
                    placeholder="https://blpindustry.ai"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Registered HQ Physical Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="ref-profile-input"
                    placeholder="Prestige Tech Park, Marathahalli, Bengaluru, Karnataka"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Company Overview & Mission
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="ref-profile-input"
                    rows={3}
                    placeholder="Brief overview of your company..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </>
            ) : (
              /* =======================================
                 SEEKER CANDIDATE FORM FIELDS (WITH RESUME)
                 ======================================= */
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="ref-profile-input"
                    placeholder="James Carter"
                    id="profile-fullname-input"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ref-profile-input"
                    placeholder="jamescarter1930@gmail.com"
                    id="profile-email-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#6B7280', marginBottom: '0.4rem' }}>Preferred work location</label>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <input type="text" value={location} onChange={(event) => { setLocation(event.target.value); setLocationStatus(''); }} className="ref-profile-input" placeholder="Search city or area" />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={searchLocation}>Search</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={useCurrentLocation}>Use GPS</button>
                  </div>
                  {locationStatus && <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#625f73' }}>{locationStatus}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        color: '#6B7280',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="ref-profile-input"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="GMT-8">GMT-8</option>
                      <option value="GMT-5">GMT-5</option>
                      <option value="GMT+0">GMT+0</option>
                      <option value="GMT+5:30">GMT+5:30</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        color: '#6B7280',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Working hours
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={workingHours}
                        onChange={(e) => setWorkingHours(e.target.value)}
                        className="ref-profile-input"
                        style={{ paddingRight: '2rem', cursor: 'pointer' }}
                      >
                        <option value="10 AM – 6 PM">10 AM – 6 PM</option>
                        <option value="9 AM – 5 PM">9 AM – 5 PM</option>
                        <option value="Night Shift (9 PM - 5 AM)">Night Shift</option>
                        <option value="Flexible Shift">Flexible Hours</option>
                      </select>
                      <Clock
                        size={15}
                        color="#9CA3AF"
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="ref-profile-input"
                    placeholder="Project manager"
                    id="profile-headline-input"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Skills & Credentials
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="ref-profile-input"
                      placeholder="Add skill tag..."
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      style={{
                        background: '#111827',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '0 0.85rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {skills.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#F3F4F6',
                          color: '#374151',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {s}
                        <X
                          size={11}
                          style={{ cursor: 'pointer', color: '#9CA3AF' }}
                          onClick={() => handleRemoveSkill(s)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Candidate Resume Upload */}
                <div
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.65rem 0.85rem',
                    background: '#F9FAFB',
                    border: '1px dashed #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4B5563' }}>
                    <FileText size={15} color="#4F46E5" />
                    <span>{resumeName || (resumeUrl ? 'Resume attached' : 'Attach Resume (PDF/DOCX)')}</span>
                  </div>
                  <label
                    style={{
                      color: '#4F46E5',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    {uploadingResume ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {uploadSuccess && <div style={{ fontSize: '0.72rem', color: '#10B981' }}>{uploadSuccess}</div>}
                {uploadError && <div style={{ fontSize: '0.72rem', color: '#EF4444' }}>{uploadError}</div>}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE PREVIEW CARD */}
          <div
            style={{
              background: '#FFFFFF',
              borderLeft: '1px dashed #E5E7EB',
              paddingLeft: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '340px',
            }}
            className="profile-live-preview-col"
          >
            <div
              style={{
                fontSize: '0.78rem',
                color: '#9CA3AF',
                fontWeight: 500,
                marginBottom: '1.5rem',
              }}
            >
              Preview
            </div>

            {/* Round Avatar Container */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: isEmployer
                    ? 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)'
                    : 'linear-gradient(135deg, #FCA5A5 0%, #F472B6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  boxShadow: isEmployer
                    ? '0 8px 24px rgba(37, 99, 235, 0.3)'
                    : '0 8px 24px rgba(244, 114, 182, 0.25)',
                  overflow: 'hidden',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={isEmployer ? companyName : fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (isEmployer ? companyName || 'B' : fullName || 'J')[0].toUpperCase()
                )}
              </div>

              {/* Edit Pencil Icon Badge */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#374151',
                  cursor: 'pointer',
                  border: '1px solid #F3F4F6',
                }}
                title="Edit Logo / Avatar"
                aria-label="Upload profile image"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? <Upload size={13} /> : <Pencil size={13} />}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </button>
            </div>

            {/* Live Name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#111827',
                  textAlign: 'center',
                }}
              >
                {isEmployer ? companyName || 'blp industry.AI' : fullName || 'James Carter'}
              </h3>
              {isEmployer && <VerifiedBadge size="sm" showText={false} />}
            </div>

            {/* Live Subtitle / Role Title */}
            <p
              style={{
                fontSize: '0.85rem',
                color: '#6B7280',
                margin: '4px 0 1rem 0',
                textAlign: 'center',
              }}
            >
              {isEmployer ? 'Verified Employer Platform' : headline || 'Project manager'}
            </p>

            {/* Live Pill */}
            {isEmployer ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#0284C7',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.9rem',
                  borderRadius: '999px',
                }}
              >
                <Globe size={13} color="#0284C7" />
                <span>{website.replace('https://', '')}</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#F3F4F6',
                  color: '#4B5563',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  padding: '0.35rem 0.9rem',
                  borderRadius: '999px',
                }}
              >
                <Clock size={13} color="#6B7280" />
                <span>{workingHours}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar: Sticky at bottom with Save changes */}
        <div
          style={{
            padding: '1.1rem 2rem',
            background: '#F9FAFB',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
            Last updated: {formattedDate}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '999px',
                background: '#EEEEEE',
                border: 'none',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              id="cancel-profile-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.55rem 1.35rem',
                borderRadius: '999px',
                background: '#111827',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.15s',
              }}
              id="save-profile-btn"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
