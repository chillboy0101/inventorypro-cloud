import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import SocialLoginButton from '../components/SocialLoginButton';
import AppleSignInButton from '../components/AppleSignInButton';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Enhanced animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const floatAnimation = {
  initial: { y: 0 },
  animate: { 
    y: [-8, 0, -8], 
    transition: { 
      duration: 6, 
      repeat: Infinity, 
      ease: "easeInOut",
      times: [0, 0.5, 1] 
    } 
  }
};

const logoAnimation = {
  initial: { scale: 0.8, opacity: 0, rotateY: 90 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    rotateY: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, forceGlobalSignOut } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Check URL parameters for verification success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const email = params.get('email');
    const verificationEmail = localStorage.getItem('verification_email');
    
    // Check if this is a password reset return
    const isPasswordReset = window.location.href.includes('reset-password') || 
                           params.has('type') && params.get('type') === 'recovery';
    
    // Skip this entire effect for social logins or password reset flows
    if (sessionStorage.getItem('isSocialLogin') === 'true' || 
        sessionStorage.getItem('authProvider') ||
        isPasswordReset) {
      console.log('[Login] Social login or password reset detected, skipping verification handling');
      return;
    }
    
    if (verified === 'true' || sessionStorage.getItem('showing_verification_success') === 'true') {
      // Force logout on arrival from verification to ensure no lingering session
      const ensureLoggedOut = async () => {
        try {
          // Use our forceGlobalSignOut for maximum reliability
          await forceGlobalSignOut();
          console.log('[Login] Force signed out after verification redirect');
          
          // Clean up verification flags
          sessionStorage.removeItem('showing_verification_success');
        } catch (e) {
          console.error('[Login] Error ensuring logout:', e);
        }
      };
      
      ensureLoggedOut();
      
      // Set success message - prioritizing email from params, then localStorage
      const displayEmail = email || verificationEmail || '';
      setSuccessMessage(`Your account has been verified${displayEmail ? ` for ${displayEmail}` : ''}. Please sign in to continue.`);
      
      // If email was passed, pre-fill it
      if (email) {
        setEmail(email);
      } else if (verificationEmail) {
        setEmail(verificationEmail);
        // Clear stored email after using it
        localStorage.removeItem('verification_email');
      }
      
      // Remove the parameters from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [forceGlobalSignOut]);

  // Check for verification URLs that may have been missed
  useEffect(() => {
    const checkForVerificationParams = () => {
      // Look for verification indicators in URL that might have been redirected
      const url = window.location.href;
      if (url.includes('code=') && !url.includes('verified=true')) {
        console.log('[Login] Detected potential verification code, redirecting to callback handler');
        
        // Redirect to auth callback
        window.location.href = `/auth/callback${window.location.search}${window.location.hash}`;
        return true;
      }
      return false;
    };
    
    // If we detect verification params, handle them
    if (checkForVerificationParams()) {
      return;
    }
  }, []);

  // Check for pending verification that might have been redirected
  useEffect(() => {
    const hasPending = sessionStorage.getItem('verification_email_pending') === 'true';
    const verificationEmail = localStorage.getItem('verification_email');
    
    if (hasPending && verificationEmail && !successMessage) {
      console.log('[Login] Found pending verification, showing success message');
      
      // Set success message
      setSuccessMessage(`We've sent a verification email to ${verificationEmail}. Please check your inbox and spam folder.`);
      
      // Pre-fill the email
      setEmail(verificationEmail);
      
      // Clear the pending flag
      sessionStorage.removeItem('verification_email_pending');
    }
  }, [successMessage]);

  // Animation variants that respect reduced motion preferences
  const getAnimationVariants = () => {
    if (prefersReducedMotion) {
      return {
        fadeIn: {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: 0.3 } },
          exit: { opacity: 0 }
        },
        float: {}
      };
    }
    return { fadeIn, float: floatAnimation };
  };

  const animations = getAnimationVariants();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'github') => {
    try {
      setSocialLoading(provider);
      
      // Set a flag to identify this as a social login
      sessionStorage.setItem('authProvider', provider);
      sessionStorage.setItem('isSocialLogin', 'true');
      
      console.log(`[Login] Starting ${provider} social login flow`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            // Add special marker for social login detection
            provider_type: 'social',
            // Make it clearer that this is a social login
            social_auth: 'true'
          },
        },
      });

      if (error) {
        console.error(`[Login] ${provider} login error:`, error.message);
        throw error;
      }

      if (data?.url) {
        // Add social login marker to URL if not already present
        const url = new URL(data.url);
        if (!url.searchParams.has('social_auth')) {
          url.searchParams.append('social_auth', 'true');
        }
        console.log(`[Login] Redirecting to ${provider} auth URL`);
        window.location.href = url.toString();
      } else {
        console.error('[Login] No redirect URL provided by Supabase');
        throw new Error('Authentication service unavailable');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col md:flex-row overflow-hidden"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={staggerChildren}
    >
      {/* Left side - Decorative */}
      <motion.div 
        className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-500 to-purple-600 relative overflow-hidden"
        variants={animations.fadeIn}
      >
        {/* Background floating particles */}
        {!prefersReducedMotion && (
          <>
            <motion.div 
              className="absolute h-40 w-40 rounded-full bg-white/5 blur-xl"
              initial={{ x: '10%', y: '10%' }}
              animate={{ 
                x: ['10%', '15%', '10%'],
                y: ['10%', '15%', '10%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute h-64 w-64 rounded-full bg-indigo-400/10 blur-xl right-[-5%] bottom-[10%]"
              initial={{ x: '0%', y: '0%' }}
              animate={{ 
                x: ['0%', '-5%', '0%'],
                y: ['0%', '5%', '0%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        <div className="w-full flex flex-col items-center justify-center px-12 relative z-10">
          <motion.div 
            className="backdrop-blur-lg bg-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <motion.div
              variants={floatAnimation}
              className="flex justify-center"
            >
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
            <CubeTransparentIcon className="h-16 w-16 text-white mb-6" />
              </motion.div>
            </motion.div>
            <motion.h2 
              className="text-3xl font-bold text-white mb-4 text-center"
              variants={animations.fadeIn}
            >
              InventoryPro Cloud
            </motion.h2>
            <motion.p 
              className="text-white/90 text-lg mb-6 text-center"
              variants={animations.fadeIn}
            >
              Streamline your inventory management with our powerful cloud-based solution.
            </motion.p>
            <motion.div className="space-y-5" variants={staggerChildren}>
              {[
                { icon: "M5 13l4 4L19 7", text: "Real-time inventory tracking" },
                { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Automated stock alerts" },
                { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", text: "Advanced analytics" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center"
                  variants={animations.fadeIn}
                  custom={index}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div 
                    className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4 shadow-lg"
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  </motion.div>
                  <span className="text-white font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Login form */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-2 sm:p-8 bg-gray-50"
        variants={animations.fadeIn}
      >
        <motion.div 
          className="w-full max-w-xs sm:max-w-md"
          variants={staggerChildren}
        >
          <motion.div 
            className="text-center mb-8"
            variants={animations.fadeIn}
          >
            <motion.div 
              className="flex justify-center mb-5"
              variants={logoAnimation}
            >
              <svg 
                className="h-16 w-16 text-indigo-600" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-2"
              variants={animations.fadeIn}
            >
              Welcome back
            </motion.h2>
            <motion.p 
              className="text-gray-600"
              variants={animations.fadeIn}
            >
              Please sign in to your account
            </motion.p>
          </motion.div>

          <AnimatePresence mode="wait">
          {error && (
              <motion.div 
                className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200"
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  opacity: { duration: 0.2 } 
                }}
              >
              <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}
            
            {successMessage && (
              <motion.div 
                className="mb-5 p-4 rounded-lg bg-green-50 border border-green-200"
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  opacity: { duration: 0.2 } 
                }}
              >
                <div className="flex">
                  <svg className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-3 text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-3 text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <SocialLoginButton provider="google" loading={socialLoading === 'google'} onClick={() => handleSocialLogin('google')} />
            <SocialLoginButton provider="github" loading={socialLoading === 'github'} onClick={() => handleSocialLogin('github')} />
            <AppleSignInButton />
          </div>

          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">Forgot password?</Link>
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 