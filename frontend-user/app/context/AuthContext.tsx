"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User } from '@/lib/types/user';
import { addSessionExpiredListener } from '@/lib/api/fetchWrapper';

// Helper function to decode JWT
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken) {
        let isValidToken = false;
        
        const decodedToken = parseJwt(storedToken);
        if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
            isValidToken = true;
        }

        if (isValidToken) {
            setToken(storedToken);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } else {
            logout();
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      logout();
    } finally {
      setIsLoading(false);
    }

    const sessionCheckInterval = setInterval(() => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        let isValidToken = false;
        const decodedToken = parseJwt(storedToken);
        if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
            isValidToken = true;
        }
        if (!isValidToken) {
          logout();
        }
      }
    }, 1000 * 30); // Check every 30 seconds

    const cleanupApiListener = addSessionExpiredListener(logout);

    return () => {
      clearInterval(sessionCheckInterval);
      cleanupApiListener();
    };
  }, [logout]);

  const login = (newToken: string, newUser: User) => {
    let isValidToken = false;

    const decodedToken = parseJwt(newToken);
    if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
        isValidToken = true;
    }

    if (isValidToken) {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('authUser', JSON.stringify(newUser));
    } else {
      console.error("Attempted to login with an invalid or expired token.");
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};