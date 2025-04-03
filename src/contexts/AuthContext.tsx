import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  handleSocialLogin: (provider: 'google' | 'github') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthError = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password';
      case 'User already registered':
        return 'Email already in use';
      case 'Email not confirmed':
        return 'Please verify your email before logging in';
      default:
        return error.message;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_confirmed: false,
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      const error = err as AuthError;
      setError(handleAuthError(error));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      const error = err as AuthError;
      setError(handleAuthError(error));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      const error = err as AuthError;
      setError(handleAuthError(error));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
    } catch (err) {
      const error = err as AuthError;
      setError(handleAuthError(error));
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
    } catch (err) {
      const error = err as AuthError;
      setError(handleAuthError(error));
      throw error;
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (error.message.includes('popup')) {
          setError('Please enable popups for this site to use social login');
        } else if (error.message.includes('cancelled')) {
          setError('Login was cancelled');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('An unexpected error occurred during social login');
      console.error('Social login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updatePassword,
    handleSocialLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 