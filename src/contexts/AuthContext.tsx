import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponseDTO } from '../types';
import { logoutCall } from '../api/auth';
import {
  clearAuthSessionStorage,
  ensureSessionMetadata,
  readStoredUser,
  seedSessionMetadata,
  writeStoredUser,
} from '../lib/authSessionStorage';

interface AuthContextType {
  user: AuthResponseDTO | null;
  login: (userData: AuthResponseDTO) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser) {
      setUser(storedUser);
      ensureSessionMetadata();
    }
    setIsLoading(false);
  }, []);

  const login = (userData: AuthResponseDTO) => {
    writeStoredUser(userData);
    seedSessionMetadata();
    setUser(userData);
  };

  const logout = () => {
    logoutCall().catch(() => {});
    clearAuthSessionStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
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
