import React, { useState } from 'react';
import {
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register', role?: UserRole) => void;
  onOpenProfilePage: () => void;
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onOpenPostJob: () => void;
  unreadMessages: number;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenProfilePage,
  onOpenEditProfile,
  onOpenSettings,
  onOpenPostJob,
  unreadMessages,
}) => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!isAuthenticated) return null;

  const seekerSections = [
    { label: 'ESSENTIALS', items: [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'chat', label: 'Messages', icon: MessageSquare }, { id: 'matching', label: 'AI Matching', icon: Sparkles }] },
    { label: 'WORK', items: [{ id: 'discover', label: 'Discover Jobs', icon: Search }, { id: 'applications', label: 'My Applications', icon: FileText }, { id: 'saved', label: 'Saved Jobs', icon: Bookmark }] },
    { label: 'MEASURE', items: [{ id: 'activity', label: 'Job Activity', icon: BarChart3 }] },
    { label: 'ACCOUNT', items: [{ id: 'profile', label: 'Profile', icon: UserRound }, { id: 'settings', label: 'Settings', icon: Settings }] },
  ];
  const employerSections = [
    { label: 'ESSENTIALS', items: [{ id: 'dashboard', label: 'Overview', icon: LayoutDashboard }, { id: 'chat', label: 'Messages', icon: MessageSquare }, { id: 'matching', label: 'AI Matching', icon: Sparkles }] },
    { label: 'WORK', items: [{ id: 'candidates', label: 'Discover Candidates', icon: Users }, { id: 'jobs', label: 'Job Listings', icon: BriefcaseBusiness }, { id: 'pipeline', label: 'Applications', icon: FileText }] },
    { label: 'MEASURE', items: [{ id: 'analytics', label: 'Hiring Analytics', icon: BarChart3 }] },
    { label: 'ACCOUNT', items: [{ id: 'profile', label: 'Company Profile', icon: UserRound }, { id: 'settings', label: 'Settings', icon: Settings }] },
  ];
  const sections = role === 'employer' ? employerSections : seekerSections;

  const navigate = (id: string) => {
    if (id === 'profile') onOpenProfilePage();
    else if (id === 'settings') onOpenSettings();
    else if (id === 'jobs') onOpenPostJob();
    else setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      <button className="dashboard-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open dashboard navigation"><Menu size={20} /></button>
      {mobileOpen && <button className="dashboard-sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close dashboard navigation" />}
      <aside className={`dashboard-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="dashboard-sidebar-header">
          <button className="dashboard-brand" onClick={() => navigate(role === 'employer' ? 'dashboard' : 'overview')}>
            <span className="dashboard-brand-mark"><Sparkles size={17} /></span>
            {!collapsed && <span><strong>Skill<span>Match</span></strong><small>Intelligent hiring workspace</small></span>}
          </button>
          <button className="dashboard-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        {!collapsed && <label className="dashboard-sidebar-search"><Search size={15} /><input placeholder="Search" aria-label="Search workspace" /></label>}
        <nav className="dashboard-sidebar-nav">
          {sections.map((section) => <div className="dashboard-nav-section" key={section.label}><span className="dashboard-nav-label">{collapsed ? '•' : section.label}</span>{section.items.map(({ id, label, icon: Icon }) => <button key={id} className={`dashboard-nav-item ${activeTab === id ? 'is-active' : ''}`} onClick={() => navigate(id)} title={collapsed ? label : undefined}><Icon size={17} /><span>{!collapsed && label}</span>{id === 'chat' && unreadMessages > 0 && <b className="dashboard-unread-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</b>}</button>)}</div>)}
        </nav>
        <div className="dashboard-sidebar-footer">
          <button className="dashboard-user-card" onClick={() => setShowProfileMenu((current) => !current)} title={collapsed ? 'Open profile menu' : undefined}>
            <span className="dashboard-user-avatar">{user?.avatar_url ? <img src={user.avatar_url} alt="" /> : (user?.full_name || user?.company_name || 'U')[0].toUpperCase()}</span>
            {!collapsed && <span><strong>{user?.full_name || user?.company_name || 'Your profile'}</strong><small>{role === 'employer' ? 'Employer' : 'Job seeker'}</small></span>}
          </button>
          {!collapsed && showProfileMenu && <div className="dashboard-profile-menu"><button onClick={() => { setShowProfileMenu(false); onOpenProfilePage(); }}><UserRound size={14} /> View Profile</button><button onClick={() => { setShowProfileMenu(false); onOpenEditProfile(); }}><UserRound size={14} /> Edit Profile</button><button onClick={() => { setShowProfileMenu(false); onOpenSettings(); }}><Settings size={14} /> Settings</button><button className="danger" onClick={() => { setShowProfileMenu(false); logout(); }}><LogOut size={14} /> Sign out</button></div>}
        </div>
        <button className="dashboard-collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
      </aside>
    </>
  );
};
