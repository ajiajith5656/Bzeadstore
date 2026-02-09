import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import logger from '../utils/logger';

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
  signUp: (email: string, password: string, role: 'user' | 'seller' | 'admin', fullName: string, currency?: string, phoneNumber?: string, countryId?: string) => Promise<any>;
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

// Helper: fetch profile from Supabase `profiles` table
async function fetchProfile(supabaseUser: SupabaseUser, retries = 3): Promise<User | null> {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      logger.error(new Error(`fetchProfile attempt ${i + 1}: ${error.message}`), { code: error.code });
      // Profile may not exist yet (trigger hasn't fired), wait and retry
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      // All retries failed — return fallback from user_metadata
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: (supabaseUser.user_metadata?.role as User['role']) || 'user',
        full_name: supabaseUser.user_metadata?.full_name || '',
        phone: supabaseUser.user_metadata?.phone || '',
        created_at: supabaseUser.created_at || new Date().toISOString(),
      };
    }

    if (data) {
      return {
        id: data.id,
        email: data.email || supabaseUser.email || '',
        role: data.role || 'user',
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        is_verified: data.is_verified,
        approved: data.approved,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  }
  return null;
}

// Helper: convert Supabase user to AuthUser
function toAuthUser(su: SupabaseUser): AuthUser {
  return {
    username: su.id,
    userId: su.id,
    email: su.email,
    attributes: su.user_metadata,
    signInDetails: { loginId: su.email, authFlowType: 'USER_PASSWORD_AUTH' },
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAuthUser, setCurrentAuthUser] = useState<AuthUser | null>(null);
  const [authRole, setAuthRole] = useState<User['role'] | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: check existing Supabase session & listen for auth changes
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        // Add timeout to prevent getSession from hanging indefinitely
        // Supabase free tier cold starts can take 10-15s
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth session check timed out — continuing as guest')), 15000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user);
          if (profile) {
            setUser(profile);
            setCurrentAuthUser(toAuthUser(session.user));
            setAuthRole(profile.role);
          }
        }
      } catch (err) {
        // This is expected on first visit or cold starts — just log as info
        console.info('[Auth]', (err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setCurrentAuthUser(null);
        setAuthRole(null);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await fetchProfile(session.user);
        if (profile && mounted) {
          setUser(profile);
          setCurrentAuthUser(toAuthUser(session.user));
          setAuthRole(profile.role);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign up with email + password.
   * Supabase sends a 6-digit OTP email automatically (configured in Supabase dashboard).
   * The role & full_name are stored in user_metadata and inserted into `profiles` via DB trigger.
   */
  const signUp = async (
    email: string,
    password: string,
    role: 'user' | 'seller' | 'admin',
    fullName: string,
    currency?: string,
    phoneNumber?: string,
    _countryId?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            currency: currency || 'INR',
            phone: phoneNumber || '',
          },
        },
      });

      if (error) {
        return { success: false, error: { message: error.message } };
      }

      return {
        success: true,
        userId: data.user?.id,
        isSignUpComplete: false, // needs OTP verification
      };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to sign up' } };
    }
  };

  /**
   * Sign in with email + password.
   * After sign-in, fetches profile to get the role and redirects accordingly.
   */
  const signIn = async (email: string, password: string) => {
    try {
      // Sign in with timeout — Supabase free tier can be slow on cold starts
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sign in timed out. Please try again.')), 20000)
      );

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);

      if (error) {
        // Map Supabase errors to user-friendly messages
        let message = error.message;
        if (message.includes('Invalid login credentials')) {
          message = 'Incorrect email or password.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please verify your email first. Check your inbox for the OTP code.';
        }
        return { success: false, error: { message } };
      }

      if (!data.user) {
        return { success: false, error: { message: 'Sign in failed' } };
      }

      const profile = await fetchProfile(data.user);
      const role = profile?.role || (data.user.user_metadata?.role as User['role']) || 'user';

      if (profile) {
        setUser(profile);
        setCurrentAuthUser(toAuthUser(data.user));
        setAuthRole(role);
      }

      return { success: true, isSignedIn: true, role };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to sign in' } };
    }
  };

  const signOut = async () => {
    const roleBeforeSignout = authRole;
    await supabase.auth.signOut();
    setUser(null);
    setCurrentAuthUser(null);
    setAuthRole(null);
    return roleBeforeSignout;
  };

  /**
   * Send password reset OTP email.
   */
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/new-password`,
      });
      if (error) return { success: false, error: { message: error.message } };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to send reset code' } };
    }
  };

  /**
   * Verify OTP and set new password.
   * Uses Supabase's verifyOtp for email type, then updateUser for the new password.
   */
  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      // Verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });

      if (verifyError) {
        return { success: false, error: { message: verifyError.message } };
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: { message: updateError.message } };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to reset password' } };
    }
  };

  /**
   * Confirm signup OTP (6-digit code sent to email).
   */
  const confirmSignUp = async (email: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { success: false, alreadyConfirmed: true, error: { message: 'Already verified' } };
        }
        return { success: false, error: { message: error.message } };
      }

      // After OTP verification, user is auto signed in
      if (data.user) {
        const profile = await fetchProfile(data.user);
        if (profile) {
          setUser(profile);
          setCurrentAuthUser(toAuthUser(data.user));
          setAuthRole(profile.role);
        }
      }

      return { success: true, isSignUpComplete: true };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to verify OTP' } };
    }
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
