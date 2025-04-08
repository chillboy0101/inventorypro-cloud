/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

// Initialize the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

// Listen for auth events to help with debugging and managing redirects
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth event:', event);
  
  if (event === 'SIGNED_IN') {
    console.log('[Supabase] User signed in');
    
    // Check if this is from a social login
    if (sessionStorage.getItem('isSocialLogin') === 'true') {
      console.log('[Supabase] Social login detected in auth state change');
      // Don't do redirection here - let the AuthCallback component handle it
    }
    
    // Check for email verification flow
    const verificationEmail = localStorage.getItem('verification_email');
    const hasPending = sessionStorage.getItem('verification_email_pending') === 'true';
    
    if (verificationEmail && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
      console.log('[Supabase] Email verification flow detected');
      // Set flag for verification success screen
      sessionStorage.setItem('showing_verification_success', 'true');
      
      // IMPORTANT: Don't auto-redirect for email verification
      // Let the AuthCallback component handle showing the success screen first
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('[Supabase] User signed out');
    // Clear social login flags
    sessionStorage.removeItem('isSocialLogin');
    sessionStorage.removeItem('authProvider');
  }
});

// Log environment variables to help with debugging (without exposing secrets)
console.log('[Supabase Config] URL is configured:', !!supabaseUrl);
console.log('[Supabase Config] Anon key is configured:', !!supabaseAnonKey);
console.log('[Supabase Config] Email sender is configured:', !!import.meta.env.MAIL_FROM);

// Configure default email templates
const defaultEmailOptions = {
  emailRedirectTo: `${window.location.origin}/auth/callback`,
};

// Helper function to get email redirect URL
export const getEmailRedirectTo = (path: string = '/auth/callback') => {
  return `${window.location.origin}${path}`;
};

// Export email-related utilities
export const emailUtils = {
  // Get confirmation email settings
  getSignUpEmailSettings: () => ({
    emailRedirectTo: getEmailRedirectTo('/auth/callback'),
  }),
  
  // Get password reset email settings
  getResetPasswordEmailSettings: () => ({
    redirectTo: getEmailRedirectTo('/reset-password'),
  }),
  
  // Log email delivery attempt
  logEmailAttempt: (type: string, email: string, redirectUrl: string) => {
    console.log(`[Email Service] Sending ${type} email to: ${email}`);
    console.log(`[Email Service] Redirect URL: ${redirectUrl}`);
  },
};

// Add this for debugging in development
if (process.env.NODE_ENV === 'development') {
  // Log auth events
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Supabase auth event: ${event}`, session);
  });
}

export default supabase;