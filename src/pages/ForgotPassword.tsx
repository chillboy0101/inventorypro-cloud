import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

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

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      await resetPassword(email);
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
      setSuccess(false);
    } finally {
      setLoading(false);
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
              Reset Your Password
            </motion.h2>
            <motion.p 
              className="text-white/90 text-lg mb-6 text-center"
              variants={animations.fadeIn}
            >
              Enter your email and we'll send you a link to reset your password
            </motion.p>
            <motion.div className="space-y-5" variants={staggerChildren}>
              {[
                { 
                  icon: "M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207", 
                  text: "Secure password reset" 
                },
                { 
                  icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", 
                  text: "Check your email" 
                },
                { 
                  icon: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4", 
                  text: "Create a new password" 
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center group"
                  variants={animations.fadeIn}
                  custom={index}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div 
                    className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4 shadow-lg group-hover:bg-white/30 transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </motion.div>
                  <span className="text-white font-medium group-hover:text-white/90 transition-colors duration-200">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-8"
        variants={animations.fadeIn}
      >
        <motion.div 
          className="w-full max-w-md space-y-8"
          variants={staggerChildren}
        >
          <motion.div 
            className="text-center"
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
              Reset Your Password
            </motion.h2>
            <motion.p 
              className="text-gray-600"
              variants={animations.fadeIn}
            >
              Enter your email and we'll send you a link to reset your password
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
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
              >
                <motion.div 
                  className="mb-6 flex justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5, delay: 0.2 }}
                >
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
                <motion.h3 
                  className="text-xl font-semibold text-gray-900 mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Reset Link Sent
                </motion.h3>
                <motion.p 
                  className="text-gray-600 mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  We've sent a password reset link to <strong>{email}</strong>.<br />
                  Please check your email and click the link to reset your password.
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link 
                    to="/login" 
                    className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200"
                  >
                    Return to login
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-6"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  variants={animations.fadeIn}
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <motion.div
                      className="h-5 w-5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </motion.div>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>

                <motion.div 
                  className="flex justify-center"
                  variants={animations.fadeIn}
                >
                  <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                    Return to login
                  </Link>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword; 