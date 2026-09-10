import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Profile, UserRole } from '../types';
import { api } from '../services/api';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  description: string;
}

export const isDemoEnabled = import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'true';

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'fd1bbefd-e108-4e88-8cc1-6f6d27328aba',
    name: 'Anusha Bezawada (Tech Nova)',
    email: 'anushabezawada11@gmail.com',
    role: 'employer',
    description: 'Employer with 2 active listings & 9 applicants',
  },
  {
    id: '091216f7-875a-4c7a-b3cc-f5319410a6c3',
    name: 'M.Karthik Reddy',
    email: 'karthikkarthik05421@gmail.com',
    role: 'seeker',
    description: 'Candidate exploring AI & Fullstack roles',
  },
  {
    id: 'ba9302dc-8efe-40c2-81a6-2d6677acb2ef',
    name: 'Bezawada Hemanth',
    email: 'hemanthbezawada7@gmail.com',
    role: 'seeker',
    description: 'Candidate with scheduled interview',
  },
  {
    id: '7391e710-a68e-4668-981b-c86a861f1e77',
    name: 'Snehitha',
    email: 'snehitha2703@gmail.com',
    role: 'seeker',
    description: 'Candidate with data & engineering skills',
  },
];

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string,
    companyName?: string
  ) => Promise<any>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<Profile>;
  setUserProfile: (profile: Profile) => void;
  switchDemoUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Derive role strictly from authenticated user profile
  const role: UserRole = user?.role || 'seeker';

  // Initialize session from localStorage without auto-login
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Handle Supabase email confirmation redirect callbacks (#access_token=... or ?code=... or #error=...)
        const hash = window.location.hash;
        const search = window.location.search;

        if (hash || search) {
          const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : '');
          const searchParams = new URLSearchParams(search);

          const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
          const errorDesc = hashParams.get('error_description') || searchParams.get('error_description') || hashParams.get('error');

          if (accessToken) {
            localStorage.setItem('skillmatch_token', accessToken);
            if (refreshToken) {
              localStorage.setItem('skillmatch_refresh_token', refreshToken);
            }
            try {
              const freshProfile = await api.getMe();
              setUser(freshProfile);
              localStorage.setItem('skillmatch_user', JSON.stringify(freshProfile));
            } catch (err) {
              console.error('Failed to load profile for verified token:', err);
            }
            window.history.replaceState(null, '', window.location.pathname);
            setIsLoading(false);
            return;
          } else if (errorDesc) {
            console.error('Auth verification error from URL:', errorDesc);
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        const savedUserStr = localStorage.getItem('skillmatch_user');
        const token = localStorage.getItem('skillmatch_token');
        if (savedUserStr && token) {
          const parsed = JSON.parse(savedUserStr);
          setUser(parsed);
          // Verify with backend in background
          api.getMe()
            .then((freshProfile) => {
              setUser(freshProfile);
              localStorage.setItem('skillmatch_user', JSON.stringify(freshProfile));
            })
            .catch(() => {
              // Token invalid or expired: log out
              logout();
            });
        } else {
          // Strictly unauthenticated when no token exists
          setUser(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.profile);
      localStorage.setItem('skillmatch_user', JSON.stringify(data.profile));
    } finally {
      setIsLoading(false);
    }
  };

  const isRegisteringRef = useRef(false);

  const setUserProfile = (profile: Profile) => {
    setUser(profile);
    localStorage.setItem('skillmatch_user', JSON.stringify(profile));
  };

  const register = async (
    email: string,
    password: string,
    regRole: UserRole,
    fullName?: string,
    companyName?: string
  ) => {
    if (isRegisteringRef.current) {
      throw new Error('Registration is already in progress. Please wait.');
    }
    isRegisteringRef.current = true;
    setIsLoading(true);
    try {
      const data = await api.register(email, password, regRole, fullName, companyName);
      if (data.session?.access_token) {
        setUser(data.profile);
        localStorage.setItem('skillmatch_user', JSON.stringify(data.profile));
      }
      return data;
    } finally {
      setIsLoading(false);
      isRegisteringRef.current = false;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    localStorage.removeItem('skillmatch_user');
    localStorage.removeItem('skillmatch_token');
  };

  const updateProfile = async (data: Partial<Profile>): Promise<Profile> => {
    if (!user) throw new Error('No user logged in');
    const updated = await api.updateProfile(user.id, data);
    setUser(updated);
    localStorage.setItem('skillmatch_user', JSON.stringify(updated));
    return updated;
  };

  const switchDemoUser = async (userId: string) => {
    if (!isDemoEnabled) {
      console.warn('Demo accounts are disabled.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.getDemoToken(userId);
      setUser(data.profile);
      localStorage.setItem('skillmatch_user', JSON.stringify(data.profile));
    } catch (err) {
      console.error('Failed to switch demo user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        setUserProfile,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
