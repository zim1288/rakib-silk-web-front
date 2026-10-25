/**
 * Merchant Authentication Context & Provider.
 *
 * Manages merchant login session persistence via `sessionStorage`
 * and broadcasts live API latency metrics to the global navigation bar.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeLatency, getLastLatency, BASE_URL } from '../services/api';

/**
 * Interface contract for the merchant authentication context.
 */
export interface AuthContextType {
  /** Active logged-in merchant email, or null if unauthenticated */
  userEmail: string | null;
  /** Sets the active session email and token version, saving to sessionStorage */
  login: (email: string, tokenVersion?: number) => void;
  /** Clears the session and logs the merchant out */
  logout: () => void;
  /** Real-time API round-trip latency in milliseconds */
  apiLatency: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication context provider wrapping application routes.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return sessionStorage.getItem('rakib_user_email');
  });

  const [apiLatency, setApiLatency] = useState<number>(getLastLatency());

  useEffect(() => {
    const unsubscribe = subscribeLatency((latency) => {
      setApiLatency(latency);
    });
    return unsubscribe;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('rakib_user_email');
    sessionStorage.removeItem('rakib_token_version');
    setUserEmail(null);
  }, []);

  const login = useCallback((email: string, tokenVersion?: number) => {
    sessionStorage.setItem('rakib_user_email', email);
    if (tokenVersion !== undefined) {
      sessionStorage.setItem('rakib_token_version', tokenVersion.toString());
    }
    setUserEmail(email);
  }, []);

  // Multi-Device Session Guard:
  // Verifies that this device's tokenVersion is still valid.
  // If the password was changed on another device, tokenVersion increments and this device is immediately logged out!
  const verifyCurrentSession = useCallback(async () => {
    const currentEmail = sessionStorage.getItem('rakib_user_email');
    if (!currentEmail) return;

    const storedVer = sessionStorage.getItem('rakib_token_version');
    const versionNum = storedVer ? parseInt(storedVer, 10) : 1;

    try {
      const res = await fetch(`${BASE_URL}/auth/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, tokenVersion: versionNum }),
      });

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'SESSION_REVOKED') {
          console.warn('⚠️ Session revoked: password was changed on another device. Logging out...');
          logout();
          alert('Your password was changed from another device. Please sign in again with your new password.');
          window.location.href = '/login';
        }
      }
    } catch {
      // Ignore network timeout
    }
  }, [logout]);

  // Check on window focus and every 20 seconds
  useEffect(() => {
    if (!userEmail) return;

    const interval = setInterval(verifyCurrentSession, 20000);
    window.addEventListener('focus', verifyCurrentSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', verifyCurrentSession);
    };
  }, [userEmail, verifyCurrentSession]);

  return (
    <AuthContext.Provider value={{ userEmail, login, logout, apiLatency }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context.
 *
 * @throws Error if used outside of an {@link AuthProvider}.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
