import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// API 응답과 일치하는 User 인터페이스 정의
interface User {
  id: number;
  name: string;
  email: string;
  nickname: string;
}

interface UserAuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // 앱이 처음 로드될 때 localStorage에서 토큰과 사용자 정보를 가져와 상태를 초기화합니다.
    const storedToken = localStorage.getItem('user_token');
    const storedUser = localStorage.getItem('user_info');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user info from localStorage", error);
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
      }
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('user_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUser(null);
  };

  return (
    <UserAuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};