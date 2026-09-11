import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, MapPin, Map as MapIcon, Navigation, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Job, Profile } from '../types';
import { JobLocationMap, calculateDistanceKm } from './JobLocationMap';

interface DiscoveryFeedProps {
  jobs: Job[];
  user: Profile | null;
  savedJobIds: Set<string>;
  onSelectJob: (job: Job) => void;
  onApplyJob: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onOpenProfile: () => void;
  recommendationRadius: number | null;
  onRadiusChange: (radius: number | null) => void;
  isLoading: boolean;
}

const categoryForJob = (job: Job) => {
  const text = `${job.title} ${job.description} ${(job.skills || []).join(' ')}`.toLowerCase();
  if (/developer|engineer|software|data|react|python|sql/.test(text)) return 'Software / IT';
  if (/sales|hr|human resource|accountant|office|admin/.test(text)) return text.includes('sales') ? 'Sales' : 'Office / Administration';
  if (/delivery|warehouse|driver|logistics/.test(text)) return 'Driving / Logistics';
  if (/hotel|hospitality|guest/.test(text)) return 'Hospitality';
  if (/health|clinic|patient/.test(text)) return 'Healthcare';
  if (/retail|store/.test(text)) return 'Retail';
  if (/electric|technician|maintenance|construction/.test(text)) return 'Skilled Trades';
  if (/machine|cnc|mechanical|operator/.test(text)) return 'Manufacturing';
  if (/support|customer/.test(text)) return 'Customer Service';
  return 'Other';
};

const profileCompletion = (user: Profile | null) => {
  if (!user) return 0;
  const fields = [user.full_name, user.headline, user.bio, user.location, user.skills?.length, user.resume_url, user.experience_level];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

export const DiscoveryFeed: React.FC<DiscoveryFeedProps> = ({ jobs, user, savedJobIds, onSelectJob, onApplyJob, onToggleSave, onOpenProfile, recommendationRadius, onRadiusChange, isLoading }) => {
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(recommendationRadius);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [query, setQuery] = useState('');
  const userCoordinates = typeof user?.latitude === 'number' && typeof user?.longitude === 'number'
    ? { lat: user.latitude, lng: user.longitude }
    : undefined;
  const hasLocation = Boolean(userCoordinates);
  const userLat = userCoordinates?.lat;
  const userLng = userCoordinates?.lng;
  const userSkills = useMemo(() => new Set((user?.skills || []).map((skill) => skill.toLowerCase().trim())), [user?.skills]);

  useEffect(() => {
    setMaxDistanceKm(recommendationRadius);
  }, [recommendationRadius]);

  const augmentedJobs = useMemo(() => jobs.map((job) => {
    const hasJobCoordinates = typeof job.latitude === 'number' && typeof job.longitude === 'number';
    const distance = hasLocation && hasJobCoordinates && userLat !== undefined && userLng !== undefined ? calculateDistanceKm(userLat, userLng, job.latitude!, job.longitude!) : undefined;
    return { ...job, category: categoryForJob(job), commute_distance_km: distance };
  }), [jobs, hasLocation, userLat, userLng]);

  const scoredJobs = augmentedJobs;

  const filteredJobs = scoredJobs.filter((job) => {
    const matchesQuery = !query || `${job.title} ${job.company_name} ${job.location} ${job.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !categoryFilter || job.category === categoryFilter;
    const matchesDistance = maxDistanceKm === null || job.commute_distance_km === undefined || job.commute_distance_km <= maxDistanceKm;
    return matchesQuery && matchesCategory && matchesDistance;
  });
  const recommended = filteredJobs.filter((job) => job.match_score !== undefined).sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 6);
  const moreJobs = filteredJobs.filter((job) => !recommended.some((recommendedJob) => recommendedJob.id === job.id)).slice(0, 12);

  if (isLoading) return <div className="container section discovery-loading">Loading jobs...</div>;

  const renderCard = (job: Job) => {
    const isSaved = savedJobIds.has(job.id);
    const matched = (job.skills || []).filter((skill) => userSkills.has(skill.toLowerCase().trim()));
    return <article className="job-card" key={job.id}>
      <div className="job-card-topline">
        <div className="job-company-avatar">{(job.company_name || 'C')[0].toUpperCase()}</div>
        <div className="job-card-heading"><h3>{job.title}</h3><strong>{job.company_name}</strong><span className="job-posted">Posted {new Date(job.created_at).toLocaleDateString()}</span></div>
        {job.match_score !== undefined && userSkills.size > 0 ? <span className="job-match-score">{job.match_score}% Match</span> : <span className="job-match-muted">Complete profile</span>}
      </div>
      <div className="job-facts"><span><MapPin size={14} />{job.location}</span>{job.distance_km !== undefined && job.distance_km !== null && <span><Navigation size={14} />{job.distance_km} km</span>}<span>{job.job_type}</span><span>{job.salary_range || 'Salary discussed'}</span></div>
      <p className="job-summary">{job.description}</p>
      <div className="job-score-breakdown"><span>Skills {job.match_breakdown?.skills ?? '—'}%</span><span>Location {job.match_breakdown?.location ?? '—'}%</span><span>Experience {job.match_breakdown?.experience ?? '—'}%</span></div><div className="job-skill-list">{(job.skills || []).slice(0, 4).map((skill) => <span className={matched.includes(skill) ? 'job-skill matched' : 'job-skill'} key={skill}>{matched.includes(skill) && <CheckCircle2 size={12} />}{skill}</span>)}</div>
      <div className="job-card-actions"><button className="btn btn-primary btn-sm" onClick={() => onSelectJob(job)}>View Details</button><button className={`btn btn-sm ${isSaved ? 'btn-secondary saved-job-button' : 'btn-ghost'}`} onClick={() => onToggleSave(job)}><Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save'}</button></div>
    </article>;
  };

  return <section className="section discovery-section"><div className="container"><div className="discovery-layout">
    <aside className="candidate-profile-card"><div className="candidate-avatar">{user?.avatar_url ? <img src={user.avatar_url} alt="" /> : (user?.full_name || 'U')[0].toUpperCase()}</div><h3>{user?.full_name || 'Professional Seeker'}</h3><p>{user?.headline || 'Add a headline to improve your matches.'}</p>{user?.location && <span className="candidate-location"><MapPin size={13} />{user.location}</span>}<div className="profile-completion"><span>Profile completion</span><strong>{profileCompletion(user)}%</strong><div><i style={{ width: `${profileCompletion(user)}%` }} /></div></div></aside>
    <main className="discovery-main"><div className="discovery-filters"><div className="discovery-search-row"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs or skills" /></label><label><MapPin size={16} /><input value={user?.location || ''} readOnly placeholder="Set your location in Profile" /></label><button className="btn btn-primary" onClick={() => setQuery(query)}>Search</button></div><div className="discovery-filter-row"><span><SlidersHorizontal size={14} /> Radius</span>{[5, 15, 25, 50, 100, null].map((distance) => <button className={recommendationRadius === distance ? 'filter-chip active' : 'filter-chip'} onClick={() => { setMaxDistanceKm(distance); onRadiusChange(distance); }} key={String(distance)}>{distance === null ? 'All India' : `${distance} km`}</button>)}<span><SlidersHorizontal size={14} /> Category</span>{['', 'Software / IT', 'Office / Administration', 'Sales', 'Retail', 'Hospitality', 'Healthcare', 'Driving / Logistics', 'Manufacturing', 'Skilled Trades'].map((category) => <button className={categoryFilter === category ? 'filter-chip active' : 'filter-chip'} onClick={() => setCategoryFilter(category)} key={category}>{category || 'All'}</button>)}</div></div>
      {!hasLocation && <div className="location-notice"><MapPin size={17} /><span><strong>Set your location to find jobs near you.</strong> Distances will appear after you add a profile location.</span><button className="btn btn-secondary btn-sm" onClick={onOpenProfile}>Set location</button></div>}
      {userSkills.size === 0 && <div className="profile-prompt"><Sparkles size={18} /><div><strong>Tell us what you can do</strong><p>Add your skills to get better job matches.</p></div><button className="btn btn-primary btn-sm" onClick={onOpenProfile}>Add skills</button></div>}
      {viewMode === 'map' ? <JobLocationMap mode="radar" jobs={filteredJobs} height="360px" onSelectJob={onSelectJob} userLat={userLat} userLng={userLng} /> : <><div className="section-heading"><div><h2>Recommended for you</h2><p>{userSkills.size ? 'Ranked using your skills and preferences.' : 'Add profile details to unlock personalized ranking.'}</p></div><button className="btn btn-secondary btn-sm" onClick={() => setViewMode('map')}><MapIcon size={14} /> Nearby map</button></div>{recommended.length ? <div className="job-card-grid">{recommended.map(renderCard)}</div> : <div className="empty-jobs"><h3>No matching jobs found.</h3><p>Try increasing your distance or changing your filters.</p><button className="btn btn-secondary btn-sm" onClick={() => { setCategoryFilter(''); setMaxDistanceKm(null); setQuery(''); onRadiusChange(null); }}>Clear Filters</button></div>}{moreJobs.length > 0 && <><div className="section-heading more-jobs-heading"><div><h2>More jobs near you</h2><p>Explore additional active opportunities.</p></div></div><div className="job-card-grid">{moreJobs.map(renderCard)}</div></>}</>}
    </main>
  </div></div></section>;
};
