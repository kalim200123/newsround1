import axios from "axios";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api";

type AdminAuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "dn_admin_token";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

const setAuthHeader = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      setToken(stored);
      setAuthHeader(stored);
    }
  }, []);

  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    apiClient.defaults.baseURL = API_BASE_URL;

    const requestInterceptor = axios.interceptors.request.use((config) => {
      if (token && config.headers && config.url && config.url.includes("/admin")) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setAuthHeader(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setAuthHeader(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setAuthHeader(null);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      login,
      logout,
    }),
    [token, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
