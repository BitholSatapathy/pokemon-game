import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  refreshUser: () => Promise<void>;
  updateStats: (stats: Partial<UserProfile>) => void;
  openAuthModal: (initialTab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:8000/api/v1';


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tcg_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const { showToast } = useToast();

  const openAuthModal = useCallback((initialTab: 'login' | 'register' = 'login') => {
    setAuthModalTab(initialTab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Fetch current player profile on mount if token exists
  useEffect(() => {
    let isMounted = true;

    const fetchMe = async () => {
      const storedToken = localStorage.getItem('tcg_auth_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser({
              id: String(data.id),
              username: data.username,
              email: data.email,
              coins: data.coins,
              gems: data.gems,
              level: data.level,
              xp: data.xp,
              xpToNextLevel: 500 * data.level,
              packsOpened: 14,
              totalCards: 68,
              maxCards: 240,
              binderCompletionRate: 42,
              avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              isAdmin: Boolean(data.is_admin),
              isBanned: Boolean(data.is_banned),
              banReason: data.ban_reason,
            });
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('tcg_auth_token');
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      } catch {
        // Server unreachable
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.detail || 'Login failed. Please check credentials.', 'error', 'Authentication Failed');
        return false;
      }

      localStorage.setItem('tcg_auth_token', data.access_token);
      setToken(data.access_token);

      const u = data.user;
      setUser({
        id: String(u.id),
        username: u.username,
        email: u.email,
        coins: u.coins,
        gems: u.gems,
        level: u.level,
        xp: u.xp,
        xpToNextLevel: 500 * u.level,
        packsOpened: 14,
        totalCards: 68,
        maxCards: 240,
        binderCompletionRate: 42,
        avatarUrl: u.avatar_url,
        isAdmin: Boolean(u.is_admin),
        isBanned: Boolean(u.is_banned),
        banReason: u.ban_reason,
      });

      showToast(`Welcome back, Trainer ${u.username}!`, 'success', 'Signed In');
      closeAuthModal();
      return true;
    } catch {
      showToast('Cannot connect to backend server on port 8000.', 'error', 'Network Error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.detail || 'Registration failed.', 'error', 'Sign Up Failed');
        return false;
      }

      localStorage.setItem('tcg_auth_token', data.access_token);
      setToken(data.access_token);

      const u = data.user;
      setUser({
        id: String(u.id),
        username: u.username,
        email: u.email,
        coins: u.coins,
        gems: u.gems,
        level: u.level,
        xp: u.xp,
        xpToNextLevel: 500,
        packsOpened: 0,
        totalCards: 0,
        maxCards: 240,
        binderCompletionRate: 0,
        avatarUrl: u.avatar_url,
        isAdmin: Boolean(u.is_admin),
        isBanned: Boolean(u.is_banned),
        banReason: u.ban_reason,
      });

      showToast(
        `Welcome Trainer ${u.username}! 10,000 Starting Coins have been deposited in your vault.`,
        'gold',
        'Account Created!'
      );
      closeAuthModal();
      return true;
    } catch {
      showToast('Cannot connect to backend server on port 8000.', 'error', 'Network Error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('tcg_auth_token');
    if (!storedToken) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => ({
          id: String(data.id),
          username: data.username,
          email: data.email,
          coins: data.coins,
          gems: data.gems,
          level: data.level,
          xp: data.xp,
          xpToNextLevel: 500 * data.level,
          packsOpened: prev?.packsOpened ?? 0,
          totalCards: prev?.totalCards ?? 0,
          maxCards: 240,
          binderCompletionRate: prev?.binderCompletionRate ?? 0,
          avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          isAdmin: Boolean(data.is_admin),
          isBanned: Boolean(data.is_banned),
          banReason: data.ban_reason,
        }));
      }
    } catch {
      // Ignore network errors on background refresh
    }
  }, []);

  const updateStats = useCallback((stats: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...stats } : null));
  }, []);

  const logout = () => {
    localStorage.removeItem('tcg_auth_token');
    setToken(null);
    setUser(null);
    showToast('You have been signed out.', 'info', 'Logged Out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        setUser,
        refreshUser,
        updateStats,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalTab,
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
