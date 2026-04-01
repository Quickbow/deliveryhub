import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUsers } from '../store/mockData';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'customer' | 'seller' | 'delivery') => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: 'customer' | 'seller' | 'delivery') => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // sessionStorage is synchronous and tab-isolated — each tab keeps its own session.
  // loading is always false immediately since the read is synchronous.
  const [loading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveUser = (user: User | null) => {
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
    }
    setCurrentUser(user);
  };

  const login = async (email: string, password: string, role: 'customer' | 'seller' | 'delivery'): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        const user: User = await res.json();
        saveUser(user);
        return true;
      }
      return false;
    } catch {
      // Fallback to mock data when backend is unavailable
      const user = mockUsers.find(
        u => u.email === email && u.password === password && u.role === role
      );
      if (user) {
        saveUser(user);
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    saveUser(null);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'seller' | 'delivery'
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (res.ok) {
        const user: User = await res.json();
        saveUser(user);
        return true;
      }
      return false;
    } catch {
      // Fallback: accept registration when backend is unavailable
      const newUser: User = {
        id: `${Date.now()}`,
        name,
        email,
        password,
        role,
      };
      saveUser(newUser);
      return true;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, register, isAuthenticated: !!currentUser }}>
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