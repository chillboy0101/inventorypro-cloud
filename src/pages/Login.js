import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [socialLoading, setSocialLoading] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();
    const { login, forceGlobalSignOut } = useAuth();
    const prefersReducedMotion = useReducedMotion();
    // Check URL parameters for verification success
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const verified = params.get('verified');
        const email = params.get('email');
        const verificationEmail = localStorage.getItem('verification_email');
        if (verified === 'true' || sessionStorage.getItem('showing_verification_success') === 'true') {
            // Force logout on arrival from verification to ensure no lingering session
            const ensureLoggedOut = async () => {
                try {
                    // Use our forceGlobalSignOut for maximum reliability
                    await forceGlobalSignOut();
                    console.log('[Login] Force signed out after verification redirect');
                    // Clean up verification flags
                    sessionStorage.removeItem('showing_verification_success');
                }
                catch (e) {
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
            }
            else if (verificationEmail) {
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
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSocialLogin = async (provider) => {
        try {
            setSocialLoading(provider);
            // Set a flag to identify this as a social login
            sessionStorage.setItem('authProvider', provider);
            sessionStorage.setItem('isSocialLogin', 'true');
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                        // Add special marker for social login detection
                        provider_type: 'social'
                    },
                },
            });
            if (error) {
                throw error;
            }
            if (data?.url) {
                // Add social login marker to URL
                const url = new URL(data.url);
                url.searchParams.append('social_auth', 'true');
                window.location.href = url.toString();
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        }
        finally {
            setSocialLoading(null);
        }
    };
    return (_jsxs(motion.div, { className: "min-h-screen flex flex-col md:flex-row overflow-hidden", initial: "initial", animate: "animate", exit: "exit", variants: staggerChildren, children: [_jsxs(motion.div, { className: "hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-500 to-purple-600 relative overflow-hidden", variants: animations.fadeIn, children: [!prefersReducedMotion && (_jsxs(_Fragment, { children: [_jsx(motion.div, { className: "absolute h-40 w-40 rounded-full bg-white/5 blur-xl", initial: { x: '10%', y: '10%' }, animate: {
                                    x: ['10%', '15%', '10%'],
                                    y: ['10%', '15%', '10%'],
                                }, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } }), _jsx(motion.div, { className: "absolute h-64 w-64 rounded-full bg-indigo-400/10 blur-xl right-[-5%] bottom-[10%]", initial: { x: '0%', y: '0%' }, animate: {
                                    x: ['0%', '-5%', '0%'],
                                    y: ['0%', '5%', '0%'],
                                }, transition: { duration: 10, repeat: Infinity, ease: "easeInOut" } })] })), _jsx("div", { className: "w-full flex flex-col items-center justify-center px-12 relative z-10", children: _jsxs(motion.div, { className: "backdrop-blur-lg bg-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10", initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", duration: 0.8 }, children: [_jsx(motion.div, { variants: floatAnimation, className: "flex justify-center", children: _jsx(motion.div, { initial: { rotate: -180, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, transition: { duration: 0.8 }, children: _jsx(CubeTransparentIcon, { className: "h-16 w-16 text-white mb-6" }) }) }), _jsx(motion.h2, { className: "text-3xl font-bold text-white mb-4 text-center", variants: animations.fadeIn, children: "InventoryPro Cloud" }), _jsx(motion.p, { className: "text-white/90 text-lg mb-6 text-center", variants: animations.fadeIn, children: "Streamline your inventory management with our powerful cloud-based solution." }), _jsx(motion.div, { className: "space-y-5", variants: staggerChildren, children: [
                                        { icon: "M5 13l4 4L19 7", text: "Real-time inventory tracking" },
                                        { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Automated stock alerts" },
                                        { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", text: "Advanced analytics" }
                                    ].map((item, index) => (_jsxs(motion.div, { className: "flex items-center", variants: animations.fadeIn, custom: index, whileHover: { x: 5 }, transition: { type: "spring", stiffness: 400 }, children: [_jsx(motion.div, { className: "h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4 shadow-lg", whileHover: { scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }, whileTap: { scale: 0.95 }, transition: { type: "spring", stiffness: 400 }, children: _jsx("svg", { className: "h-6 w-6 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: item.icon }) }) }), _jsx("span", { className: "text-white font-medium", children: item.text })] }, index))) })] }) })] }), _jsx(motion.div, { className: "flex-1 flex items-center justify-center p-8 bg-gray-50", variants: animations.fadeIn, children: _jsxs(motion.div, { className: "w-full max-w-md", variants: staggerChildren, children: [_jsxs(motion.div, { className: "text-center mb-8", variants: animations.fadeIn, children: [_jsx(motion.div, { className: "flex justify-center mb-5", variants: logoAnimation, children: _jsx("svg", { className: "h-16 w-16 text-indigo-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("path", { d: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx(motion.h2, { className: "text-3xl font-bold text-gray-900 mb-2", variants: animations.fadeIn, children: "Welcome back" }), _jsx(motion.p, { className: "text-gray-600", variants: animations.fadeIn, children: "Please sign in to your account" })] }), _jsxs(AnimatePresence, { mode: "wait", children: [error && (_jsx(motion.div, { className: "mb-5 p-4 rounded-lg bg-red-50 border border-red-200", initial: { opacity: 0, y: -20, height: 0 }, animate: { opacity: 1, y: 0, height: 'auto' }, exit: { opacity: 0, y: -20, height: 0 }, transition: {
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                        opacity: { duration: 0.2 }
                                    }, children: _jsx("p", { className: "text-sm text-red-600", children: error }) })), successMessage && (_jsx(motion.div, { className: "mb-5 p-4 rounded-lg bg-green-50 border border-green-200", initial: { opacity: 0, y: -20, height: 0 }, animate: { opacity: 1, y: 0, height: 'auto' }, exit: { opacity: 0, y: -20, height: 0 }, transition: {
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                        opacity: { duration: 0.2 }
                                    }, children: _jsxs("div", { className: "flex", children: [_jsx("svg", { className: "h-5 w-5 text-green-600 mr-2 flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) }), _jsx("p", { className: "text-sm text-green-700", children: successMessage })] }) }))] }), _jsxs(motion.div, { className: "space-y-3 mb-6", variants: staggerChildren, children: [_jsx(motion.div, { variants: animations.fadeIn, children: _jsx(SocialLoginButton, { provider: "google", onClick: () => handleSocialLogin('google'), loading: socialLoading === 'google' }) }), _jsx(motion.div, { variants: animations.fadeIn, children: _jsx(AppleSignInButton, {}) }), _jsx(motion.div, { variants: animations.fadeIn, children: _jsx(SocialLoginButton, { provider: "github", onClick: () => handleSocialLogin('github'), loading: socialLoading === 'github' }) })] }), _jsxs(motion.div, { className: "relative mb-6", variants: animations.fadeIn, children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-4 bg-gray-50 text-gray-500", children: "Or continue with" }) })] }), _jsxs(motion.form, { onSubmit: handleLogin, className: "space-y-5", variants: staggerChildren, children: [_jsxs(motion.div, { variants: animations.fadeIn, children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email address" }), _jsx(motion.input, { id: "email", type: "email", required: true, className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), whileFocus: { scale: 1.005, boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)" }, transition: { type: "spring", stiffness: 300, damping: 20 } })] }), _jsxs(motion.div, { variants: animations.fadeIn, children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsx(motion.input, { id: "password", type: "password", required: true, className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200", placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), whileFocus: { scale: 1.005, boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)" }, transition: { type: "spring", stiffness: 300, damping: 20 } })] }), _jsxs(motion.div, { className: "flex items-center justify-between", variants: animations.fadeIn, children: [_jsxs("div", { className: "flex items-center", children: [_jsx(motion.input, { id: "remember-me", name: "remember-me", type: "checkbox", className: "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } }), _jsx("label", { htmlFor: "remember-me", className: "ml-2 block text-sm text-gray-700 cursor-pointer", children: "Remember me" })] }), _jsx(motion.div, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.98 }, children: _jsx(Link, { to: "/forgot-password", className: "text-sm font-medium text-indigo-600 hover:text-indigo-500", children: "Forgot password?" }) })] }), _jsx(motion.button, { type: "submit", disabled: loading, className: "w-full h-[50px] flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", variants: animations.fadeIn, whileHover: { scale: 1.02, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }, whileTap: { scale: 0.98 }, children: loading ? (_jsxs(motion.svg, { className: "h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: "linear" }, children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })) : ('Sign in') }), _jsxs(motion.div, { className: "text-center mt-4", variants: animations.fadeIn, children: [_jsx("span", { className: "text-sm text-gray-600", children: "Don't have an account? " }), _jsx(motion.span, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.98 }, children: _jsx(Link, { to: "/signup", className: "text-sm font-medium text-indigo-600 hover:text-indigo-500", children: "Sign up" }) })] })] })] }) })] }));
}
