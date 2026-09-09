import React, { useEffect, useState } from 'react';
import { Bell, ChevronRight, HelpCircle, LockKeyhole, Mail, Moon, Phone, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

type Theme = 'light' | 'dark' | 'system';
interface SettingsPageProps { user: Profile | null; theme: Theme; onThemeChange: (theme: Theme) => void; onEditProfile: () => void; onSignOut: () => void; onToast: (message: string, type?: 'success' | 'error' | 'info') => void; }

const readSetting = (key: string, fallback: boolean) => localStorage.getItem(key) === null ? fallback : localStorage.getItem(key) === 'true';

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, theme, onThemeChange, onEditProfile, onSignOut, onToast }) => {
  const [emailUpdates, setEmailUpdates] = useState(() => readSetting('skillmatch_email_updates', true));
  const [notifications, setNotifications] = useState(() => readSetting('skillmatch_notifications', true));
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [preferredDistance, setPreferredDistance] = useState(String(user?.preferred_distance || '25'));

  useEffect(() => { localStorage.setItem('skillmatch_email_updates', String(emailUpdates)); }, [emailUpdates]);
  useEffect(() => { localStorage.setItem('skillmatch_notifications', String(notifications)); }, [notifications]);

  const changePassword = async () => {
    if (password.length < 8) { onToast('Use at least 8 characters for your new password.', 'error'); return; }
    setIsSavingPassword(true);
    try { await api.updatePassword(password); setPassword(''); setShowPassword(false); onToast('Password updated successfully.', 'success'); } catch (error: any) { onToast(error.message || 'Unable to update password.', 'error'); } finally { setIsSavingPassword(false); }
  };
  const saveDistance = async () => { try { await api.updateProfile(user?.id || '', { preferred_distance: Number(preferredDistance) }); onToast('Job preferences saved.', 'success'); } catch (error: any) { onToast(error.message || 'Unable to save preferences.', 'error'); } };

  return <div className="dashboard-page settings-page"><header className="dashboard-page-header"><div><span className="dashboard-eyebrow">Account</span><h1>Settings</h1><p>Manage your account, preferences, privacy, and support.</p></div></header><div className="settings-sections">
    <section className="settings-card"><div className="settings-card-heading"><div><h2>Account</h2><p>Keep your account details and access secure.</p></div><ShieldCheck size={19} /></div><button className="settings-row" onClick={onEditProfile}><span><Mail size={16} /><b>Profile information</b><small>{user?.email}</small></span><ChevronRight size={17} /></button><button className="settings-row" onClick={() => setShowPassword(!showPassword)}><span><LockKeyhole size={16} /><b>Change password</b><small>Update your sign-in password</small></span><ChevronRight size={17} /></button>{showPassword && <div className="settings-inline-form"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" aria-label="New password" /><button className="btn btn-primary btn-sm" onClick={changePassword} disabled={isSavingPassword}>{isSavingPassword ? 'Saving...' : 'Update password'}</button></div>}<label className="settings-row settings-toggle-row"><span><Mail size={16} /><b>Email preferences</b><small>Receive useful job and application updates</small></span><input type="checkbox" checked={emailUpdates} onChange={(event) => setEmailUpdates(event.target.checked)} /></label><label className="settings-row settings-toggle-row"><span><Bell size={16} /><b>Notification preferences</b><small>Show in-app activity notifications</small></span><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /></label></section>
    <section className="settings-card"><div className="settings-card-heading"><div><h2>Preferences</h2><p>Control the jobs and shifts SkillMatch prioritizes.</p></div><SlidersIcon /></div><button className="settings-row" onClick={onEditProfile}><span><BriefcaseIcon /><b>Job recommendations</b><small>{user?.skills?.length ? `${user.skills.length} skills used for matching` : 'Add skills to improve matches'}</small></span><ChevronRight size={17} /></button><button className="settings-row" onClick={onEditProfile}><span><MapIcon /><b>Preferred work location</b><small>{user?.location || 'Not set'}</small></span><ChevronRight size={17} /></button><div className="settings-preference-control"><label htmlFor="preferred-distance">Preferred distance</label><div><input id="preferred-distance" type="number" min="1" max="500" value={preferredDistance} onChange={(event) => setPreferredDistance(event.target.value)} /><span>km</span><button className="btn btn-secondary btn-sm" onClick={saveDistance}>Save</button></div></div><button className="settings-row" onClick={onEditProfile}><span><ClockIcon /><b>Preferred shift</b><small>{user?.preferred_shift || 'Not set'}</small></span><ChevronRight size={17} /></button></section>
    <section className="settings-card"><div className="settings-card-heading"><div><h2>Appearance</h2><p>Choose how SkillMatch looks on this device.</p></div><Sun size={19} /></div><div className="theme-options">{(['light', 'dark', 'system'] as Theme[]).map((option) => <button className={theme === option ? 'theme-option active' : 'theme-option'} onClick={() => onThemeChange(option)} key={option}>{option === 'light' ? <Sun size={16} /> : option === 'dark' ? <Moon size={16} /> : <SettingsIcon />}{option[0].toUpperCase() + option.slice(1)}{theme === option && <CheckIcon />}</button>)}</div></section>
    <section className="settings-card"><div className="settings-card-heading"><div><h2>Privacy & Security</h2><p>Understand and control your SkillMatch data.</p></div><LockKeyhole size={19} /></div><button className="settings-row" onClick={() => setShowPrivacy(true)}><span><ShieldCheck size={16} /><b>Privacy Policy</b><small>How we collect and use information</small></span><ChevronRight size={17} /></button><button className="settings-row" onClick={() => onToast('Your data controls are available through Profile and sign out.', 'info')}><span><Trash2 size={16} /><b>Data & Privacy</b><small>Review profile and uploaded data choices</small></span><ChevronRight size={17} /></button><button className="settings-row" onClick={onSignOut}><span><LockKeyhole size={16} /><b>Sign out</b><small>End the current session</small></span><ChevronRight size={17} /></button></section>
    <section className="settings-card support-card"><div className="settings-card-heading"><div><h2>Help & Support</h2><p>We are here to help with your SkillMatch account.</p></div><HelpCircle size={19} /></div><div className="support-links"><a href="tel:9390527148"><Phone size={16} /><span><b>9390527148</b><small>Call support</small></span></a><a href="mailto:karthikkarthik05421@gmail.com"><Mail size={16} /><span><b>karthikkarthik05421@gmail.com</b><small>Email support</small></span></a><button onClick={() => onToast('Help Center is available through email support.', 'info')}><HelpCircle size={16} /><span><b>Help Center</b><small>Find answers and guidance</small></span></button></div></section>
  </div>{showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}</div>;
};

const SlidersIcon = () => <span className="settings-heading-icon">☷</span>;
const BriefcaseIcon = () => <span className="settings-row-icon">▣</span>;
const MapIcon = () => <span className="settings-row-icon">⌖</span>;
const ClockIcon = () => <span className="settings-row-icon">◷</span>;
const SettingsIcon = () => <span className="settings-row-icon">⚙</span>;
const CheckIcon = () => <span className="theme-check">✓</span>;
