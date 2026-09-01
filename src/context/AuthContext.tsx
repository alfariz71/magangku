import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_MAHASISWA, INITIAL_ADMIN, INITIAL_STUDENTS_LIST } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string, rememberMe?: boolean) => { success: boolean; message?: string };
  loginAsDemo: (role: UserRole) => void;
  logout: () => void;
  updateCurrentUser: (updatedData: Partial<User>) => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('magangku_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_MAHASISWA; // Default to Andi Pratama
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('magangku_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('magangku_user');
    }
  }, [currentUser]);

  const login = (email: string, _password?: string, _rememberMe: boolean = false) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if admin
    if (cleanEmail === 'admin@magangku.id' || cleanEmail === 'admin' || cleanEmail === 'admin@kemdikbud.go.id') {
      setCurrentUser(INITIAL_ADMIN);
      return { success: true };
    }

    // Check in students list
    const student = INITIAL_STUDENTS_LIST.find(s => s.email.toLowerCase() === cleanEmail);
    if (student) {
      setCurrentUser(student);
      return { success: true };
    }

    // If matches andi format
    if (cleanEmail.includes('andi') || cleanEmail.includes('mahasiswa')) {
      setCurrentUser(INITIAL_MAHASISWA);
      return { success: true };
    }

    return {
      success: false,
      message: 'Email mahasiswa tidak terdaftar dalam sistem MagangKu. Hubungi administrator jika ini kesalahan.'
    };
  };

  const loginAsDemo = (demoRole: UserRole) => {
    if (demoRole === 'admin') {
      setCurrentUser(INITIAL_ADMIN);
    } else {
      setCurrentUser(INITIAL_MAHASISWA);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'admin') {
      setCurrentUser(INITIAL_ADMIN);
    } else {
      setCurrentUser(INITIAL_MAHASISWA);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateCurrentUser = (updatedData: Partial<User>) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'mahasiswa',
        isAuthenticated: !!currentUser,
        login,
        loginAsDemo,
        logout,
        updateCurrentUser,
        switchRole,
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
