import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardSidebar } from './components/DashboardSidebar';
import { HeroBanner } from './components/HeroBanner';
import { LandingPage } from './components/LandingPage';
import { DiscoveryFeed } from './components/DiscoveryFeed';
import { JobDetailsModal } from './components/JobDetailsModal';
import { MyApplications } from './components/MyApplications';
import { SavedJobsView } from './components/SavedJobsView';
import { CandidateProfileModal } from './components/CandidateProfileModal';
import { EmployerDashboard } from './components/EmployerDashboard';
import { ATSPipeline } from './components/ATSPipeline';
import { PostJobModal } from './components/PostJobModal';
import { ScheduleInterviewModal } from './components/ScheduleInterviewModal';
import { ChatModal } from './components/ChatModal';
import { ChatInboxView } from './components/ChatInboxView';
import { CandidateOverview } from './components/CandidateOverview';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { AnimatedFooter } from './components/AnimatedFooter';
import { ToastContainer, ToastMessage } from './components/Toast';
import { PrivacyPage } from './components/PrivacyPage';
import { SupportPage } from './components/SupportPage';
import { TermsPage } from './components/TermsPage';
import { Job, Application, UserRole } from './types';
import { api } from './services/api';

const MainAppContent: React.FC = () => {
  const { user, role, isAuthenticated, logout, updateProfile, setUserProfile } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [recommendationRadius, setRecommendationRadius] = useState<number | null>(25);

  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Modal State
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
    role: UserRole;
  }>({
    isOpen: false,
    mode: 'login',
    role: 'seeker',
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('skillmatch_theme') as 'light' | 'dark' | 'system') || 'light');
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [applicationForScheduling, setApplicationForScheduling] = useState<Application | null>(null);
  const [activeChatAppId, setActiveChatAppId] = useState<string | null>(null);
  const [selectedPipelineJobId, setSelectedPipelineJobId] = useState<string | undefined>(undefined);
  const [navigationInitialized, setNavigationInitialized] = useState(false);

  // Toasts with Deduplication & Max Cap
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (!message || !message.trim()) return;
    const cleanMsg = message.trim();
    setToasts((prev) => {
      // Prevent duplicate notification if exact same message is currently showing
      if (prev.some((t) => t.message === cleanMsg)) return prev;
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToasts = [...prev, { id, message: cleanMsg, type }];
      return newToasts.slice(-3); // max 3 visible toasts
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getParentTab = (tab: string) => {
    if (tab === 'applications' || tab === 'saved' || tab === 'chat' || tab === 'profile' || tab === 'settings') return role === 'employer' ? 'dashboard' : 'overview';
    if (tab === 'pipeline' || tab === 'candidates' || tab === 'jobs' || tab === 'analytics') return 'dashboard';
    return role === 'employer' ? 'dashboard' : 'overview';
  };

  const navigateInApp = (nextTab: string, replace = false) => {
    setActiveTab(nextTab);
    const state = { skillmatch: true, tab: nextTab };
    if (replace) window.history.replaceState(state, '', `#${nextTab}`);
    else if (window.history.state?.tab !== nextTab) window.history.pushState(state, '', `#${nextTab}`);
  };

  const closeModalInApp = (fallbackTab = activeTab) => {
    if (window.history.state?.modal) {
      window.history.back();
    } else {
      navigateInApp(fallbackTab);
    }
  };

  useEffect(() => {
    localStorage.setItem('skillmatch_theme', theme);
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    };
    applyTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNavigationInitialized(false);
      return;
    }
    if (navigationInitialized) return;
    const currentTab = window.history.state?.skillmatch ? window.history.state.tab : null;
    const initialTab = currentTab || (role === 'employer' ? 'dashboard' : 'overview');
    window.history.replaceState({ skillmatch: true, tab: initialTab, guard: true }, '', `#${initialTab}`);
    window.history.pushState({ skillmatch: true, tab: initialTab }, '', `#${initialTab}`);
    setActiveTab(initialTab);
    setNavigationInitialized(true);
  }, [isAuthenticated, role, navigationInitialized]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.skillmatch) {
        if (event.state.guard) {
          window.history.pushState({ skillmatch: true, tab: activeTab, guard: true }, '', `#${activeTab}`);
          return;
        }
        setActiveTab(event.state.tab || getParentTab(activeTab));
        if (!event.state.modal) {
          setSelectedJobForDetails(null);
          setIsProfileModalOpen(false);
          setIsPostJobModalOpen(false);
          setApplicationForScheduling(null);
          setActiveChatAppId(null);
        }
      } else if (isAuthenticated) {
        navigateInApp(getParentTab(activeTab), true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, isAuthenticated, role]);

  // Sync active tab with authentication role
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'employer' && (activeTab === 'discover' || activeTab === 'overview')) {
        setActiveTab('dashboard');
      } else if (role === 'seeker' && activeTab === 'dashboard') {
        setActiveTab('overview');
      }
    } else {
      setActiveTab('overview');
    }
  }, [isAuthenticated, role]);

  // Listen to URL hash for direct navigation like #login or #signup
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#login' || hash === '#signin') {
        setAuthModalConfig({ isOpen: true, mode: 'login', role: 'seeker' });
      } else if (hash === '#signup' || hash === '#register') {
        setAuthModalConfig({ isOpen: true, mode: 'register', role: 'seeker' });
      } else if (hash === '#privacy') {
        setActiveTab('privacy');
      } else if (hash === '#support') {
        setActiveTab('support');
      } else if (hash === '#terms') {
        setActiveTab('terms');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch Jobs
  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      if (searchQuery || locationQuery || selectedJobType || selectedShift) {
        const data = await api.getJobs({
          search: searchQuery,
          location: locationQuery,
          job_type: selectedJobType,
          shift: selectedShift,
        });
        setJobs(data);
      } else {
        const data = await api.getRecommendations(user?.id, recommendationRadius);
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Fetch Saved Jobs (candidate only)
  const fetchSavedJobs = async () => {
    if (!isAuthenticated || !user?.id || role !== 'seeker') {
      setSavedJobIds(new Set());
      return;
    }
    try {
      const data = await api.getSavedJobs(user.id);
      const validIds = (data || [])
        .map((d) => d.job?.id || d.job_id)
        .filter((id): id is string => Boolean(id) && id !== 'undefined');
      setSavedJobIds(new Set(validIds));
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user?.id, selectedJobType, selectedShift, recommendationRadius]);

  useEffect(() => {
    fetchSavedJobs();
  }, [user?.id, role, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUnreadMessages(0);
      return;
    }
    const refreshUnreadMessages = () => api.getUnreadMessageCount().then(setUnreadMessages).catch(() => {});
    refreshUnreadMessages();
    const afterInboxRead = activeTab === 'chat' ? window.setTimeout(refreshUnreadMessages, 1200) : undefined;
    const interval = window.setInterval(refreshUnreadMessages, 15000);
    return () => { window.clearInterval(interval); if (afterInboxRead) window.clearTimeout(afterInboxRead); };
  }, [isAuthenticated, user?.id, activeTab, activeChatAppId]);

  // Handle Save / Bookmark toggle
  const handleToggleSave = async (job: Job) => {
    if (!job || !job.id || job.id === 'undefined') {
      showToast('⚠ Unable to save this job. Please try again.', 'error');
      return;
    }
    if (!isAuthenticated || !user?.id) {
      setAuthModalConfig({ isOpen: true, mode: 'login', role: 'seeker' });
      showToast('Please sign in to save opportunities', 'info');
      return;
    }
    const isCurrentlySaved = savedJobIds.has(job.id);
    try {
      await api.toggleSaveJob(job.id, user.id, !isCurrentlySaved);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.delete(job.id);
          showToast('✓ Job removed from saved jobs', 'info');
        } else {
          next.add(job.id);
          showToast('✓ Job saved successfully', 'success');
        }
        return next;
      });
    } catch (err: any) {
      showToast('⚠ Unable to save this job. Please try again.', 'error');
    }
  };

  // Handle Apply button
  const handleApplyClick = (job: Job) => {
    if (!isAuthenticated) {
      setAuthModalConfig({ isOpen: true, mode: 'register', role: 'seeker' });
      showToast('Create an account or sign in to submit your application', 'info');
      return;
    }
    setSelectedJobForDetails(job);
  };

  const openAuth = (mode: 'login' | 'register' = 'login', initialRole: UserRole = 'seeker') => {
    setAuthModalConfig({
      isOpen: true,
      mode,
      role: initialRole,
    });
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation || !user?.id) {
      showToast('Browser location is unavailable.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        let location = user.location || '';
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        if (response.ok) {
          const data = await response.json();
          location = data.display_name || location;
        }
        const updated = await updateProfile({ latitude, longitude, location });
        setUserProfile(updated);
        showToast('Location enabled and saved to your profile.', 'success');
      } catch (error: any) {
        showToast(error.message || 'Unable to save your location.', 'error');
      }
    }, (error) => {
      showToast(error.code === error.PERMISSION_DENIED ? 'Location access is required for nearby jobs and directions.' : 'Unable to get your location.', 'error');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };

  return (
    <div className={isAuthenticated ? 'dashboard-app-shell' : 'public-app-shell'}>
      {/* Navbar with role-specific navigation */}
      {isAuthenticated ? (
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={navigateInApp}
          onOpenAuth={openAuth}
          onOpenProfilePage={() => navigateInApp('profile')}
          onOpenEditProfile={() => { setIsProfileModalOpen(true); window.history.pushState({ skillmatch: true, tab: activeTab, modal: 'profile-edit' }, '', `#${activeTab}/edit-profile`); }}
          onOpenSettings={() => navigateInApp('settings')}
          onOpenPostJob={() => { setIsPostJobModalOpen(true); window.history.pushState({ skillmatch: true, tab: activeTab, modal: 'post-job' }, '', `#${activeTab}/post-job`); }}
          unreadMessages={unreadMessages}
        />
      ) : (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuth={openAuth}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenPostJob={() => setIsPostJobModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className={isAuthenticated ? 'dashboard-main-workspace' : 'public-main-workspace'}>
        {!isAuthenticated ? (
          activeTab === 'privacy' ? (
            <PrivacyPage onBack={() => navigateInApp(getParentTab('privacy'))} onOpenAuth={openAuth} />
          ) : activeTab === 'support' ? (
            <SupportPage onBack={() => navigateInApp(getParentTab('support'))} onOpenAuth={openAuth} />
          ) : activeTab === 'terms' ? (
            <TermsPage onBack={() => navigateInApp(getParentTab('terms'))} onOpenAuth={openAuth} />
          ) : (
            <LandingPage
              jobs={jobs}
              onOpenAuth={openAuth}
              onSelectJob={(job) => { setSelectedJobForDetails(job); window.history.pushState({ skillmatch: true, tab: 'overview', modal: 'job-details', jobId: job.id }, '', `#overview/job/${job.id}`); }}
            />
          )
        ) : activeTab === 'privacy' ? (
          <PrivacyPage onBack={() => navigateInApp(getParentTab('privacy'))} onOpenAuth={openAuth} />
        ) : activeTab === 'support' ? (
          <SupportPage onBack={() => navigateInApp(getParentTab('support'))} onOpenAuth={openAuth} />
        ) : activeTab === 'terms' ? (
          <TermsPage onBack={() => navigateInApp(getParentTab('terms'))} onOpenAuth={openAuth} />
        ) : role === 'seeker' ? (
          /* =========================================================================
             2. AUTHENTICATED JOB SEEKER EXPERIENCE
             ========================================================================= */
          <>
            {activeTab === 'profile' && <ProfilePage user={user} onEdit={() => { setIsProfileModalOpen(true); window.history.pushState({ skillmatch: true, tab: 'profile', modal: 'profile-edit' }, '', '#profile/edit-profile'); }} />}
            {activeTab === 'settings' && <SettingsPage user={user} theme={theme} onThemeChange={setTheme} onEditProfile={() => { setIsProfileModalOpen(true); window.history.pushState({ skillmatch: true, tab: 'settings', modal: 'profile-edit' }, '', '#settings/edit-profile'); }} onSignOut={logout} onToast={showToast} />}
            {activeTab === 'overview' && (
              <CandidateOverview
                user={user}
                jobs={jobs}
                savedJobIds={savedJobIds}
                onSelectJob={(job) => { setSelectedJobForDetails(job); window.history.pushState({ skillmatch: true, tab: 'overview', modal: 'job-details', jobId: job.id }, '', `#overview/job/${job.id}`); }}
                onToggleSave={handleToggleSave}
                onViewApplications={() => navigateInApp('applications')}
                onRequestLocation={requestUserLocation}
              />
            )}
            {(activeTab === 'matching' || activeTab === 'activity') && (
              <CandidateOverview
                user={user}
                jobs={jobs}
                savedJobIds={savedJobIds}
                onSelectJob={(job) => { setSelectedJobForDetails(job); window.history.pushState({ skillmatch: true, tab: activeTab, modal: 'job-details', jobId: job.id }, '', `#${activeTab}/job/${job.id}`); }}
                onToggleSave={handleToggleSave}
                onViewApplications={() => navigateInApp('applications')}
                onRequestLocation={requestUserLocation}
              />
            )}
            {activeTab === 'discover' && (
              <>
                <HeroBanner
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  locationQuery={locationQuery}
                  setLocationQuery={setLocationQuery}
                  selectedJobType={selectedJobType}
                  setSelectedJobType={setSelectedJobType}
                  selectedShift={selectedShift}
                  setSelectedShift={setSelectedShift}
                  onSearch={fetchJobs}
                />
                <DiscoveryFeed
                  jobs={jobs}
                  user={user}
                  savedJobIds={savedJobIds}
                  onSelectJob={(job) => { setSelectedJobForDetails(job); window.history.pushState({ skillmatch: true, tab: 'discover', modal: 'job-details', jobId: job.id }, '', `#discover/job/${job.id}`); }}
                  onApplyJob={(job) => { setSelectedJobForDetails(job); window.history.pushState({ skillmatch: true, tab: 'discover', modal: 'job-details', jobId: job.id }, '', `#discover/job/${job.id}`); }}
                  onToggleSave={handleToggleSave}
                  onOpenProfile={() => navigateInApp('profile')}
                  recommendationRadius={recommendationRadius}
                  onRadiusChange={setRecommendationRadius}
                  isLoading={isLoadingJobs}
                />
              </>
            )}

            {activeTab === 'applications' && (
              <MyApplications
                user={user}
                onOpenChat={(appId) => { setActiveChatAppId(appId); window.history.pushState({ skillmatch: true, tab: 'applications', modal: 'chat', applicationId: appId }, '', `#applications/chat/${appId}`); }}
              />
            )}

            {activeTab === 'saved' && (
              <SavedJobsView
                user={user}
                onNavigateDiscover={() => navigateInApp('discover')}
                onSelectJob={(job) => {
                  if (!job || !job.id || job.id === 'undefined') return;
                  setSelectedJobForDetails(job);
                  window.history.pushState(
                    { skillmatch: true, tab: 'saved', modal: 'job-details', jobId: job.id },
                    '',
                    `#saved/job/${job.id}`
                  );
                }}
                onApplyJob={(job) => {
                  if (!job || !job.id || job.id === 'undefined') return;
                  setSelectedJobForDetails(job);
                  window.history.pushState(
                    { skillmatch: true, tab: 'saved', modal: 'job-details', jobId: job.id },
                    '',
                    `#saved/job/${job.id}`
                  );
                }}
                onRemoveSaved={(jobId) => {
                  setSavedJobIds((prev) => {
                    const next = new Set(prev);
                    next.delete(jobId);
                    return next;
                  });
                  showToast('✓ Job removed from saved jobs', 'info');
                }}
              />
            )}

            {activeTab === 'chat' && (
              <ChatInboxView onOpenChat={(appId) => { setActiveChatAppId(appId); window.history.pushState({ skillmatch: true, tab: 'chat', modal: 'chat', applicationId: appId }, '', `#chat/${appId}`); }} />
            )}
          </>
        ) : (
          /* =========================================================================
             3. AUTHENTICATED EMPLOYER EXPERIENCE
             ========================================================================= */
          <>
            {activeTab === 'profile' && <ProfilePage user={user} onEdit={() => { setIsProfileModalOpen(true); window.history.pushState({ skillmatch: true, tab: 'profile', modal: 'profile-edit' }, '', '#profile/edit-profile'); }} />}
            {activeTab === 'settings' && <SettingsPage user={user} theme={theme} onThemeChange={setTheme} onEditProfile={() => { setIsProfileModalOpen(true); window.history.pushState({ skillmatch: true, tab: 'settings', modal: 'profile-edit' }, '', '#settings/edit-profile'); }} onSignOut={logout} onToast={showToast} />}
            {activeTab === 'dashboard' && (
              <EmployerDashboard
                onOpenPostJob={() => { setIsPostJobModalOpen(true); window.history.pushState({ skillmatch: true, tab: activeTab, modal: 'post-job' }, '', `#${activeTab}/post-job`); }}
                onViewPipeline={(jobId) => {
                  setSelectedPipelineJobId(jobId);
                  navigateInApp('pipeline');
                }}
              />
            )}
            {(activeTab === 'matching' || activeTab === 'analytics' || activeTab === 'candidates' || activeTab === 'jobs') && (
              <EmployerDashboard
                onOpenPostJob={() => { setIsPostJobModalOpen(true); window.history.pushState({ skillmatch: true, tab: activeTab, modal: 'post-job' }, '', `#${activeTab}/post-job`); }}
                onViewPipeline={(jobId) => {
                  setSelectedPipelineJobId(jobId);
                  navigateInApp('pipeline');
                }}
              />
            )}

            {activeTab === 'pipeline' && (
              <ATSPipeline
                initialJobId={selectedPipelineJobId}
                onOpenSchedule={(app) => { setApplicationForScheduling(app); window.history.pushState({ skillmatch: true, tab: 'pipeline', modal: 'schedule-interview', applicationId: app.id }, '', `#pipeline/schedule/${app.id}`); }}
                onOpenChat={(appId) => { setActiveChatAppId(appId); window.history.pushState({ skillmatch: true, tab: 'pipeline', modal: 'chat', applicationId: appId }, '', `#pipeline/chat/${appId}`); }}
              />
            )}

            {activeTab === 'chat' && (
              <ChatInboxView onOpenChat={(appId) => { setActiveChatAppId(appId); window.history.pushState({ skillmatch: true, tab: 'chat', modal: 'chat', applicationId: appId }, '', `#chat/${appId}`); }} />
            )}
          </>
        )}
      </main>

      {!isAuthenticated && <AnimatedFooter onNavigate={setActiveTab} />}

      {/* Modals */}
      {selectedJobForDetails && (
        <JobDetailsModal
          job={selectedJobForDetails}
          user={user}
          onClose={() => { setSelectedJobForDetails(null); closeModalInApp(); }}
          onApplySuccess={(msg) => {
            showToast(msg, 'success');
            fetchJobs();
          }}
          isSaved={savedJobIds.has(selectedJobForDetails.id)}
          onToggleSave={handleToggleSave}
        />
      )}

      {isProfileModalOpen && (
        <CandidateProfileModal
          onClose={() => { setIsProfileModalOpen(false); closeModalInApp(); }}
          onSavedSuccess={() => {
            showToast('Profile saved successfully!', 'success');
            fetchJobs();
          }}
        />
      )}

      {isPostJobModalOpen && (
        <PostJobModal
          onClose={() => { setIsPostJobModalOpen(false); closeModalInApp(); }}
          onSuccess={(jobTitle) => {
            showToast(`Published job opening for "${jobTitle}"!`, 'success');
            fetchJobs();
            navigateInApp('dashboard');
          }}
        />
      )}

      {applicationForScheduling && (
        <ScheduleInterviewModal
          application={applicationForScheduling}
          onClose={() => { setApplicationForScheduling(null); closeModalInApp(); }}
          onSuccess={() => {
            showToast('Interview invitation sent to candidate!', 'success');
          }}
        />
      )}

      {activeChatAppId && (
        <ChatModal
          applicationId={activeChatAppId}
          user={user}
          onClose={() => { setActiveChatAppId(null); closeModalInApp(); }}
        />
      )}

      {authModalConfig.isOpen && (
        <AuthModal
          initialMode={authModalConfig.mode}
          initialRole={authModalConfig.role}
          onClose={() => {
            setAuthModalConfig({ ...authModalConfig, isOpen: false });
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }}
          onSuccess={() => {
            showToast('Signed in successfully!', 'success');
            fetchJobs();
          }}
        />
      )}

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
