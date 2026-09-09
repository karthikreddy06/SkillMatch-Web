import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Briefcase,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Building,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { VerifiedBadge } from './VerifiedBadge';
import { CompanyVerificationModal } from './CompanyVerificationModal';
import { JobLocationMap } from './JobLocationMap';

interface PostJobModalProps {
  onClose: () => void;
  onSuccess: (jobTitle: string) => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();

  const isCompanyVerified = !!user?.is_verified;
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState(user?.company_name || user?.full_name || 'TechNova Innovations');
  const [department, setDepartment] = useState('Operations & Technology');
  const [workplaceType, setWorkplaceType] = useState<'onsite' | 'hybrid' | 'remote'>('onsite');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationSearch, setLocationSearch] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [jobType, setJobType] = useState('Full-time');
  const [shiftPreference, setShiftPreference] = useState('Day Shift');
  const [flexibleHours, setFlexibleHours] = useState(true);
  const [salaryRange, setSalaryRange] = useState('₹45,000 - ₹70,000 / mo');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>(['Project Management', 'Communication', 'Problem Solving']);
  const [newSkill, setNewSkill] = useState('');
  const [requirementsText, setRequirementsText] = useState(
    'Demonstrated competence in role responsibilities\nStrong communication & collaborative attitude\nCommitment to quality execution and timely delivery'
  );
  const [benefitsText, setBenefitsText] = useState(
    'Health and accident coverage\nFlexible scheduling & performance bonuses\nProfessional training & skill advancement'
  );
  const [cultureText, setCultureText] = useState(
    'Skill-first inclusive work environment\nTransparent evaluation and merit recognition\nSupportive peer network'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const workplaceLocationValid = workplaceType === 'remote' || Boolean(address && city && state && postalCode && latitude !== undefined && longitude !== undefined && locationConfirmed);

  const reverseGeocode = async (lat: number, lng: number) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    if (!response.ok) throw new Error('Address lookup failed');
    const data = await response.json();
    const parts = data.address || {};
    const readable = data.display_name || '';
    setAddress(readable);
    setLocation(readable);
    setCity(parts.city || parts.town || parts.village || '');
    setState(parts.state || '');
    setPostalCode(parts.postcode || '');
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('Browser location is unavailable.'); return; }
    setLocationStatus('Requesting your current location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        await reverseGeocode(position.coords.latitude, position.coords.longitude);
        setLocationConfirmed(false);
        setLocationStatus('Location found. Confirm the exact workplace position.');
      } catch { setLocationStatus('Location found, but address lookup failed.'); }
    }, (error) => setLocationStatus(error.code === error.PERMISSION_DENIED ? 'Location access is disabled.' : 'Unable to get your current location.'), { enableHighAccuracy: true, timeout: 10000 });
  };

  const searchLocation = async () => {
    if (!locationSearch.trim()) return;
    setLocationStatus('Searching addresses...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(locationSearch)}`);
      const results = await response.json();
      if (!results[0]) throw new Error('No address found');
      const result = results[0];
      setLatitude(Number(result.lat)); setLongitude(Number(result.lon));
      const parts = result.address || {};
      setAddress(result.display_name || locationSearch); setLocation(result.display_name || locationSearch);
      setCity(parts.city || parts.town || parts.village || ''); setState(parts.state || ''); setPostalCode(parts.postcode || '');
      setLocationConfirmed(false); setLocationStatus('Address found. Confirm the exact workplace position.');
    } catch { setLocationStatus('Address could not be found. Try a more complete address.'); }
  };

  const handleCoordsChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationConfirmed(false);
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a job title and description');
      return;
    }
    if (!user?.id) {
      setError('You must be logged in as an employer to post a job');
      return;
    }
    if (workplaceType !== 'remote' && (!latitude || !longitude || !address || !city || !state || !postalCode || !locationConfirmed)) {
      setError('Confirm the exact workplace location before posting this job.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const requirements = requirementsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const benefits = benefitsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const culture = cultureText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.createJob({
        employer_id: user.id,
        title,
        company_name: companyName,
        department,
        location: workplaceType === 'remote' ? 'Remote' : location,
        address: workplaceType === 'remote' ? undefined : address,
        city: workplaceType === 'remote' ? undefined : city,
        state: workplaceType === 'remote' ? undefined : state,
        postal_code: workplaceType === 'remote' ? undefined : postalCode,
        latitude: workplaceType === 'remote' ? undefined : latitude,
        longitude: workplaceType === 'remote' ? undefined : longitude,
        job_type: jobType,
        shift_preference: shiftPreference,
        flexible_hours: flexibleHours,
        salary_range: salaryRange,
        description,
        skills,
        requirements,
        benefits,
        culture,
      });
      onSuccess(title);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} id="post-job-modal-overlay">
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                }}
              >
                <Briefcase size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Create Job Opening</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Published instantly to Candidate Discovery Feed & Commute Radar
                </span>
              </div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-post-job-modal-btn">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 'var(--radius-md)',
                    color: '#F87171',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Company Verification Banner / Status */}
              {isCompanyVerified ? (
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="#38BDF8" />
                    <span style={{ fontSize: '0.85rem', color: '#BAE6FD', fontWeight: 600 }}>
                      Authenticity Verified:
                    </span>
                    <VerifiedBadge size="sm" />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Badge will be prominently displayed to all applicants
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.16) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', maxWidth: '480px' }}>
                    <AlertTriangle size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FEF3C7' }}>
                        Your Company is Unverified
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#FDE68A', marginTop: '2px' }}>
                        Verified companies gain 3x higher candidate trust, verified search ranking, and the official Verified Badge.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowVerificationModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                      fontSize: '0.8rem',
                      padding: '0.45rem 0.9rem',
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>Verify Company Now</span>
                  </button>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Job Title *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Operations Specialist, Electrician, Customer Service Lead"
                    required
                    id="job-title-input"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Company / Business Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. TechNova Innovations"
                    required
                    id="job-company-input"
                  />
                </div>
              </div>

              {/* Department & Workplace Type */}
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Department / Sector</label>
                  <input
                    type="text"
                    className="input-field"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Field Services, Logistics, Tech, Retail"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Workplace Model</label>
                  <select
                    className="input-field"
                    value={workplaceType}
                    onChange={(e) => setWorkplaceType(e.target.value as any)}
                  >
                    <option value="onsite">On-site (Physical Workplace)</option>
                    <option value="hybrid">Hybrid (Local Office + Remote)</option>
                    <option value="remote">Fully Remote</option>
                  </select>
                </div>
              </div>

              {/* OpenStreetMap Location Analysis & Precision Pin Picker */}
              {workplaceType !== 'remote' && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-card)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <label className="input-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} color="#38BDF8" />
                      <span>Workplace Address & OpenStreetMap Precision Pin *</span>
                    </label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={useCurrentLocation}><Navigation size={14} /> Use my current location</button>
                  </div>

                  <input
                    type="text"
                    className="input-field"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search workplace address"
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={searchLocation} style={{ marginBottom: '0.75rem' }}>Search address</button>

                  <div className="grid-2">
                    <input className="input-field" value={address} onChange={(event) => { setAddress(event.target.value); setLocationConfirmed(false); }} placeholder="Full address" required />
                    <input className="input-field" value={city} onChange={(event) => { setCity(event.target.value); setLocationConfirmed(false); }} placeholder="City" required />
                    <input className="input-field" value={state} onChange={(event) => { setState(event.target.value); setLocationConfirmed(false); }} placeholder="State" required />
                    <input className="input-field" value={postalCode} onChange={(event) => { setPostalCode(event.target.value); setLocationConfirmed(false); }} placeholder="Postal code" required />
                  </div>

                  {/* Leaflet OSM Pin Picker */}
                  <JobLocationMap
                    mode="picker"
                    initialLat={latitude}
                    initialLng={longitude}
                    onCoordinatesChange={handleCoordsChange}
                    height="190px"
                  />
                  {locationStatus && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{locationStatus}</div>}
                  {latitude !== undefined && longitude !== undefined && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Selected coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</div>}
                  <button type="button" className="btn btn-secondary btn-sm" disabled={latitude === undefined || longitude === undefined || !address || !city || !state || !postalCode} onClick={() => { setLocationConfirmed(true); setLocationStatus('Exact workplace location selected.'); }} style={{ marginTop: '0.6rem' }}><Check size={14} /> {locationConfirmed ? 'Location confirmed' : 'Confirm Location'}</button>
                </div>
              )}
              {workplaceType === 'remote' && <div className="remote-location-note"><MapPin size={15} /> Remote - No fixed workplace</div>}

              {/* Shift, Schedule & Salary */}
              <div className="grid-3">
                <div className="input-group">
                  <label className="input-label">Employment Type</label>
                  <select
                    className="input-field"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract / Freelance</option>
                    <option>Shift / Hourly</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Shift Preference</label>
                  <select
                    className="input-field"
                    value={shiftPreference}
                    onChange={(e) => setShiftPreference(e.target.value)}
                  >
                    <option>Day Shift</option>
                    <option>Night Shift</option>
                    <option>Rotational Shift</option>
                    <option>Flexible / Remote</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Compensation Range</label>
                  <input
                    type="text"
                    className="input-field"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. ₹40,000 - ₹65,000 / mo"
                  />
                </div>
              </div>

              {/* Role Description */}
              <div className="input-group">
                <label className="input-label">Role Description *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe daily responsibilities, role impact, and the ideal candidate..."
                  required
                />
              </div>

              {/* Skills Tags */}
              <div className="input-group">
                <label className="input-label">Required Skills & Capabilities</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a required skill (e.g. Welding, Inventory, React, Sales)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    style={{ marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddSkill}
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="badge badge-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="input-group">
                <label className="input-label">Requirements & Qualifications (One per line)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                />
              </div>

              {/* Benefits & Culture */}
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Perks & Benefits (One per line)</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={benefitsText}
                    onChange={(e) => setBenefitsText(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Company Culture (One per line)</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={cultureText}
                    onChange={(e) => setCultureText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !workplaceLocationValid}
                id="submit-post-job-btn"
              >
                <PlusCircle size={16} />
                <span>{isSubmitting ? 'Publishing Opening...' : workplaceType !== 'remote' && !workplaceLocationValid ? 'Workplace location is required' : 'Publish Job Requisition'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Verification Modal if employer chooses to verify now */}
      {showVerificationModal && (
        <CompanyVerificationModal
          onClose={() => setShowVerificationModal(false)}
          onSuccess={() => {
            setShowVerificationModal(false);
          }}
        />
      )}
    </>
  );
};
