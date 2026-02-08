import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

export interface AuthUser {
  username: string;
  userId: string;
  email?: string;
  attributes?: Record<string, any>;
  signInDetails?: {
    loginId?: string;
    authFlowType?: string;
  };
}

interface AuthContextType {
  user: User | null;
  currentAuthUser: AuthUser | null;
  authRole: User['role'] | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'user' | 'seller' | 'admin', fullName: string, currency?: string, phoneNumber?: string) => Promise<any>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; isSignedIn?: boolean; role?: User['role'] | null; error?: any }>;
  signOut: () => Promise<'user' | 'seller' | 'admin' | null>;
  resetPassword: (email: string) => Promise<any>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<any>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'beauzead_auth';

function loadStoredAuth(): { user: User; authUser: AuthUser } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

function saveAuth(user: User, authUser: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, authUser }));
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAuthUser, setCurrentAuthUser] = useState<AuthUser | null>(null);
  const [authRole, setAuthRole] = useState<User['role'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setUser(stored.user);
      setCurrentAuthUser(stored.authUser);
      setAuthRole(stored.user.role);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string, role: 'user' | 'seller' | 'admin', _fullName: string, _currency?: string, _phoneNumber?: string) => {
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // TODO: Connect to your backend signup API
      console.log('signUp called for', email, 'with role', role);
      return { success: true, userId, isSignUpComplete: false };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to sign up' } };
    }
  };

  const signIn = async (email: string, _password: string) => {
    try {
      // TODO: Connect to your backend login API
      const userId = `user_${Date.now()}`;
      const role: User['role'] = email.includes('admin') ? 'admin' : email.includes('seller') ? 'seller' : 'user';

      const newUser: User = {
        id: userId,
        email,
        role,
        created_at: new Date().toISOString(),
      };

      const authUser: AuthUser = {
        username: userId,
        userId: userId,
        signInDetails: { loginId: email },
      };

      setUser(newUser);
      setCurrentAuthUser(authUser);
      setAuthRole(role);
      saveAuth(newUser, authUser);

      return { success: true, isSignedIn: true, role };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to sign in' } };
    }
  };

  const signOut = async () => {
    const roleBeforeSignout = authRole;
    setUser(null);
    setCurrentAuthUser(null);
    setAuthRole(null);
    clearAuth();
    return roleBeforeSignout;
  };

  const resetPassword = async (_email: string) => {
    // TODO: Connect to your backend password reset API
    return { success: true };
  };

  const confirmPasswordReset = async (_email: string, _code: string, _newPassword: string) => {
    // TODO: Connect to your backend confirm password reset API
    return { success: true };
  };

  const confirmSignUp = async (_email: string, _code: string) => {
    // TODO: Connect to your backend OTP verification API
    return { success: true, isSignUpComplete: true };
  };

  const value = {
    user,
    currentAuthUser,
    authRole,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    confirmPasswordReset,
    confirmSignUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
