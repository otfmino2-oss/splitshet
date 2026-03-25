'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState, SubscriptionPlan } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  upgradePlan: (plan: SubscriptionPlan) => void;
  cancelSubscription: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Safe localStorage wrapper for SSR
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silent fail
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  }
};

/**
 * Get the current access token
 */
function getAccessToken(): string | null {
  return safeStorage.getItem(TOKEN_KEY);
}

/**
 * Get the refresh token
 */
function getRefreshToken(): string | null {
  return safeStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Fetch user from /api/auth/me using access token
 */
async function fetchCurrentUser(accessToken: string): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Attempt to refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      safeStorage.removeItem(TOKEN_KEY);
      safeStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }

    const data = await response.json();
    safeStorage.setItem(TOKEN_KEY, data.accessToken);
    safeStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return data.accessToken;
  } catch {
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(REFRESH_TOKEN_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [isMounted, setIsMounted] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    setIsMounted(true);

    const initializeAuth = async () => {
      const accessToken = getAccessToken();
      
      if (accessToken) {
        // Try to fetch user with current token
        let user = await fetchCurrentUser(accessToken);

        // If token expired, try refresh
        if (!user) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            user = await fetchCurrentUser(newToken);
          }
        }

        if (user) {
          setAuthState({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              passwordHash: '', // Don't store password hash on client
              plan: user.plan as SubscriptionPlan,
              subscriptionStatus: user.subscriptionStatus as 'active' | 'inactive' | 'cancelled',
              subscriptionEndDate: user.subscriptionEndDate,
              createdAt: user.createdAt,
              lastLogin: user.lastLogin,
            },
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }

      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    };

    initializeAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return { success: false, error: data.error || 'Login failed' };
        }

        // Store tokens
        safeStorage.setItem(TOKEN_KEY, data.accessToken);
        safeStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

        setAuthState({
          user: {
            ...data.user,
            passwordHash: '',
            plan: data.user.plan as SubscriptionPlan,
          },
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: 'An error occurred. Please try again.' };
      }
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return { success: false, error: data.error || 'Signup failed' };
        }

        // Store tokens
        safeStorage.setItem(TOKEN_KEY, data.accessToken);
        safeStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

        setAuthState({
          user: {
            ...data.user,
            passwordHash: '',
            plan: data.user.plan as SubscriptionPlan,
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: 'An error occurred. Please try again.' };
      }
    },
    []
  );

  const logout = useCallback(() => {
    // Call logout API
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    }).catch(() => {
      // Silent fail - still logout client-side
    });

    // Clear storage
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(REFRESH_TOKEN_KEY);

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!authState.user) return;

    const updatedUser: User = {
      ...authState.user,
      ...updates,
      passwordHash: '', // Don't update password hash from client
    };

    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
  }, [authState.user]);

  const upgradePlan = useCallback(
    (plan: SubscriptionPlan) => {
      if (!authState.user) return;

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      updateUser({
        plan,
        subscriptionStatus: 'active',
        subscriptionEndDate: endDate.toISOString(),
      });
    },
    [authState.user, updateUser]
  );

  const cancelSubscription = useCallback(() => {
    updateUser({
      plan: SubscriptionPlan.STARTER,
      subscriptionStatus: 'cancelled',
    });
  }, [updateUser]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          isLoading: true,
          login: async () => ({ success: false, error: 'Loading...' }),
          signup: async () => ({ success: false, error: 'Loading...' }),
          logout: () => {},
          updateUser: () => {},
          upgradePlan: () => {},
          cancelSubscription: () => {},
        }}
      >
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        updateUser,
        upgradePlan,
        cancelSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
