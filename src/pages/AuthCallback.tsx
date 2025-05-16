import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

// This immediate run block detects verification URLs before React even mounts
(function detectVerificationBeforeMount() {
  try {
    // Only run this in browser environment
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      // Check if this is a password reset flow
      const isPasswordReset = url.pathname.includes('reset-password') || 
                              url.searchParams.has('type') && url.searchParams.get('type') === 'recovery';
      
      // Skip verification detection for password reset flows
      if (isPasswordReset) {
        console.log('[Auth] Password reset flow detected, skipping verification check');
        return;
      }
      
      // IMPROVED CHECK: More clearly separate OAuth from email verification
      // Check if this is a social login
      const isSocialLogin = sessionStorage.getItem('authProvider') || 
                          sessionStorage.getItem('isSocialLogin') === 'true' ||
                          url.searchParams.has('provider') ||
                          url.hash.includes('provider=');
      
      // Skip the verification detection completely for social logins
      if (isSocialLogin) {
        console.log('[Auth] Social login detected, skipping verification check');
        return;
      }
      
      // Now check if it's an email verification (only if NOT a social login or password reset)
      const hasCode = url.searchParams.has('code');
      const hasType = url.searchParams.has('type') && url.searchParams.get('type') === 'signup';
      const hasEmailConfirm = url.searchParams.has('email_confirm') || url.hash.includes('email_confirm');
      
      const isVerification = (hasCode || hasType || hasEmailConfirm || url.hash.includes('type=signup'));
      
      // If this looks like verification and we don't have local override flag
      if (isVerification) {
        console.log('[Auth] Email verification detection, setting storage flag');
        // Set a flag to show success page
        sessionStorage.setItem('showing_verification_success', 'true');
        
        // Get email from URL or storage
        const email = url.searchParams.get('email') || 
                      url.hash.includes('email=') && decodeURIComponent(url.hash.split('email=')[1].split('&')[0]) ||
                      localStorage.getItem('verification_email');
                      
        if (email) {
          localStorage.setItem('verification_email', email);
        }
      }
    }
  } catch (e) {
    console.error('[Auth] Error in early detection:', e);
  }
})();

const AuthCallback: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const searchParams = new URLSearchParams(url.search);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        
        // Get email from various sources
        const email = searchParams.get('email') || 
                      hashParams.get('email') || 
                      localStorage.getItem('verification_email');
        
        if (email) {
          setVerifiedEmail(email);
          // Only store the email if not a social login
          if (!sessionStorage.getItem('isSocialLogin')) {
            localStorage.setItem('verification_email', email);
          }
        }
        
        // IMPROVED: Clear handling distinction between social login and verification
        // Check if this is a social login first - this takes priority
        if (sessionStorage.getItem('isSocialLogin') === 'true') {
          console.log('[AuthCallback] Processing social login flow');
          
          // For social login, we don't want to show verification screens
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Set user and redirect to dashboard immediately
            console.log('[AuthCallback] Social login session found, redirecting to dashboard');
            setUser(session.user);
            sessionStorage.removeItem('isSocialLogin');
            sessionStorage.removeItem('authProvider');
            navigate('/', { replace: true });
            return;
          } else if (searchParams.has('code') || hashParams.has('code')) {
            // Exchange code for session
            const code = searchParams.get('code') || hashParams.get('code');
            
            console.log('[AuthCallback] Exchanging code for session in social login flow');
            await supabase.auth.exchangeCodeForSession(code || '');
            
            const { data: { session: newSession } } = await supabase.auth.getSession();
            
            if (newSession) {
              console.log('[AuthCallback] Session established via code exchange, redirecting');
              setUser(newSession.user);
              sessionStorage.removeItem('isSocialLogin');
              sessionStorage.removeItem('authProvider');
              navigate('/', { replace: true });
              return;
            } else {
              throw new Error('Failed to establish session');
            }
          } else {
            throw new Error('No code found for social login');
          }
        }
        // Handle email verification flow (NOT social login)
        else if (searchParams.has('code') || hashParams.has('code')) {
          console.log('[AuthCallback] Code parameter detected in non-social login flow, treating as verification');
          
          // Sign out any existing session to prevent redirects
          await supabase.auth.signOut();
          
          // Done loading
          setLoading(false);
          return;
        } else {
          // Not a social login or verification flow with code
          console.log('[AuthCallback] No recognizable flow detected, returning to login');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };
    
    handleCallback();
  }, [navigate, location, setUser]);
  
  // If not loading and no error, show verification success
  if (!loading && !error) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <motion.div
            className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
          >
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Email Verified Successfully!
          </motion.h2>
          
          <motion.p 
            className="text-gray-600 mb-6 text-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {verifiedEmail 
              ? `Your email (${verifiedEmail}) has been verified.` 
              : 'Your email has been verified.'}
            <br />You can now log in to your account.
          </motion.p>
          
          <motion.div
            className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-8 text-base text-blue-700"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <p>
              <strong>Important:</strong> Your account is now verified and ready to use. Click the button below to sign in.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button 
              onClick={() => navigate(`/login?verified=true${verifiedEmail ? `&email=${encodeURIComponent(verifiedEmail)}` : ''}`)}
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Sign In Now
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <h3 className="text-lg font-medium mb-2">Authentication Error</h3>
          <p>{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <LoadingScreen message="Processing your authentication..." />;
};

export default AuthCallback; 