import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SocialLoginButton from '../components/SocialLoginButton';
import AppleSignInButton from '../components/AppleSignInButton';
import { supabase } from '../lib/supabase';
import { resendVerificationEmail } from '../lib/auth';
// Enhanced animation variants
const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.1
        }
    },
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
        transition: {
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2
        }
    }
};
const inputAnimation = {
    initial: { opacity: 0, x: -20 },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};
// Add these after the existing animation variants
const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
};
const passwordRequirements = [
    { regex: /.{8,}/, label: 'At least 8 characters long' },
    { regex: /[A-Z]/, label: 'Contains uppercase letter' },
    { regex: /[a-z]/, label: 'Contains lowercase letter' },
    { regex: /[0-9]/, label: 'Contains number' },
    { regex: /[^A-Za-z0-9]/, label: 'Contains special character' }
];
const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signup } = useAuth();
    const prefersReducedMotion = useReducedMotion();
    const [passwordStrength, setPasswordStrength] = useState('weak');
    const [validRequirements, setValidRequirements] = useState(new Array(passwordRequirements.length).fill(false));
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
    // Add password strength checker
    useEffect(() => {
        const checkPasswordStrength = () => {
            const newValidRequirements = passwordRequirements.map(req => req.regex.test(password));
            setValidRequirements(newValidRequirements);
            const strengthScore = newValidRequirements.filter(Boolean).length;
            if (strengthScore <= 2)
                setPasswordStrength('weak');
            else if (strengthScore <= 4)
                setPasswordStrength('medium');
            else
                setPasswordStrength('strong');
        };
        checkPasswordStrength();
    }, [password]);
    useEffect(() => {
        // Check for verification email in localStorage to determine if we should show success screen
        const verificationEmail = localStorage.getItem('verification_email');
        const hasPending = sessionStorage.getItem('verification_email_pending') === 'true';
        if (verificationEmail && hasPending) {
            setEmail(verificationEmail);
            setSubmitted(true);
        }
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        // Enhanced password validation
        if (passwordStrength === 'weak') {
            return setError('Please create a stronger password');
        }
        const missingRequirements = passwordRequirements
            .filter((_, index) => !validRequirements[index])
            .map(req => req.label);
        if (missingRequirements.length > 0) {
            return setError(`Password must: ${missingRequirements.join(', ')}`);
        }
        try {
            setError('');
            setLoading(true);
            // Store the email for verification flow
            localStorage.setItem('verification_email', email);
            sessionStorage.setItem('verification_email_pending', 'true');
            await signup(email, password);
            setSubmitted(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create an account');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSocialSignup = async (provider) => {
        try {
            setSocialLoading(provider);
            setError('');
            // Set flag for social login
            sessionStorage.setItem('isSocialLogin', 'true');
            sessionStorage.setItem('authProvider', provider);
            // Configure provider-specific options
            const providerOptions = {
                google: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent select_account',
                    },
                    scopes: 'email profile',
                },
                github: {
                    queryParams: {
                        scope: 'read:user user:email',
                    },
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
                apple: {
                    // Apple-specific options if needed
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            };
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: providerOptions[provider]?.redirectTo || `${window.location.origin}/auth/callback`,
                    ...(providerOptions[provider] || {}),
                },
            });
            if (error) {
                throw error;
            }
            if (!data?.url) {
                throw new Error('No redirect URL received from authentication provider');
            }
            // Store additional information in session storage
            sessionStorage.setItem('authRedirectTime', Date.now().toString());
            // Log the authentication attempt
            console.log(`Initiating ${provider} authentication...`);
            // Redirect to the authentication URL
            window.location.href = data.url;
        }
        catch (err) {
            console.error('Social signup error:', err);
            setError(err instanceof Error
                ? err.message
                : `Failed to sign up with ${provider}. Please try again.`);
            // Additional error logging
            if (err instanceof Error) {
                console.error('Detailed error:', {
                    message: err.message,
                    stack: err.stack,
                    provider,
                });
            }
        }
        finally {
            setSocialLoading(null);
        }
    };
    return (_jsxs(motion.div, { className: "min-h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50", initial: "initial", animate: "animate", exit: "exit", variants: staggerChildren, children: [_jsxs(motion.div, { className: "hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-500 to-purple-600 relative overflow-hidden", variants: animations.fadeIn, children: [!prefersReducedMotion && (_jsxs(_Fragment, { children: [_jsx(motion.div, { className: "absolute h-40 w-40 rounded-full bg-white/5 blur-xl", initial: { x: '10%', y: '10%' }, animate: {
                                    x: ['10%', '15%', '10%'],
                                    y: ['10%', '15%', '10%'],
                                }, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } }), _jsx(motion.div, { className: "absolute h-64 w-64 rounded-full bg-indigo-400/10 blur-xl right-[-5%] bottom-[10%]", initial: { x: '0%', y: '0%' }, animate: {
                                    x: ['0%', '-5%', '0%'],
                                    y: ['0%', '5%', '0%'],
                                }, transition: { duration: 10, repeat: Infinity, ease: "easeInOut" } })] })), _jsx("div", { className: "w-full flex flex-col items-center justify-center px-12 relative z-10", children: _jsxs(motion.div, { className: "backdrop-blur-lg bg-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10", initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", duration: 0.8 }, children: [_jsx(motion.div, { variants: floatAnimation, className: "flex justify-center", children: _jsx(motion.div, { initial: { rotate: -180, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, transition: { duration: 0.8 }, children: _jsx(CubeTransparentIcon, { className: "h-16 w-16 text-white mb-6" }) }) }), _jsx(motion.h2, { className: "text-3xl font-bold text-white mb-4 text-center", variants: animations.fadeIn, children: "Join InventoryPro Cloud" }), _jsx(motion.p, { className: "text-white/90 text-lg mb-6 text-center", variants: animations.fadeIn, children: "Start managing your inventory smarter with our powerful cloud-based solution." }), _jsx(motion.div, { className: "space-y-5", variants: staggerChildren, children: [
                                        { icon: "M5 13l4 4L19 7", text: "Free trial available" },
                                        { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "No credit card required" },
                                        { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", text: "Secure & reliable" }
                                    ].map((item, index) => (_jsxs(motion.div, { className: "flex items-center group", variants: animations.fadeIn, custom: index, whileHover: { x: 5 }, transition: { type: "spring", stiffness: 400 }, children: [_jsx(motion.div, { className: "h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4 shadow-lg group-hover:bg-white/30 transition-colors duration-200", whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 }, transition: { type: "spring", stiffness: 400 }, children: _jsx("svg", { className: "h-6 w-6 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: item.icon }) }) }), _jsx("span", { className: "text-white font-medium group-hover:text-white/90 transition-colors duration-200", children: item.text })] }, index))) })] }) })] }), _jsx(motion.div, { className: "flex-1 flex items-center justify-center p-8", variants: animations.fadeIn, children: _jsxs(motion.div, { className: "w-full max-w-md space-y-8", variants: staggerChildren, children: [_jsxs(motion.div, { className: "text-center", variants: animations.fadeIn, children: [_jsx(motion.div, { className: "flex justify-center mb-5", variants: logoAnimation, children: _jsx("svg", { className: "h-16 w-16 text-indigo-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("path", { d: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx(motion.h2, { className: "text-3xl font-bold text-gray-900 mb-2", variants: animations.fadeIn, children: "Create your account" }), _jsx(motion.p, { className: "text-gray-600", variants: animations.fadeIn, children: "Start your free trial today" })] }), _jsx(AnimatePresence, { mode: "wait", children: error && (_jsx(motion.div, { className: "mb-5 p-4 rounded-lg bg-red-50 border border-red-200", initial: { opacity: 0, y: -20, height: 0 }, animate: { opacity: 1, y: 0, height: 'auto' }, exit: { opacity: 0, y: -20, height: 0 }, transition: {
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                    opacity: { duration: 0.2 }
                                }, children: _jsx("p", { className: "text-sm text-red-600", children: error }) })) }), !submitted ? (_jsxs(_Fragment, { children: [_jsxs(motion.div, { className: "space-y-3 mb-6", variants: staggerChildren, children: [_jsx(motion.div, { variants: animations.fadeIn, children: _jsx(SocialLoginButton, { provider: "google", onClick: () => handleSocialSignup('google'), loading: socialLoading === 'google' }) }), _jsx(motion.div, { variants: animations.fadeIn, children: _jsx(AppleSignInButton, {}) }), _jsx(motion.div, { variants: animations.fadeIn, children: _jsx(SocialLoginButton, { provider: "github", onClick: () => handleSocialSignup('github'), loading: socialLoading === 'github' }) })] }), _jsxs(motion.div, { className: "relative mb-6", variants: animations.fadeIn, children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-4 bg-gray-50 text-gray-500", children: "Or sign up with email" }) })] }), _jsxs(motion.form, { onSubmit: handleSubmit, className: "space-y-5", variants: staggerChildren, children: [_jsxs(motion.div, { variants: inputAnimation, children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email address" }), _jsx(motion.input, { id: "email", type: "email", required: true, className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), whileFocus: { scale: 1.005, boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)" }, transition: { type: "spring", stiffness: 300, damping: 20 } })] }), _jsxs(motion.div, { className: "space-y-2", variants: staggerChildren, children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(motion.input, { id: "password", variants: inputAnimation, type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200", placeholder: "Create a password", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800", children: showPassword ? (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: [_jsx("path", { d: "M10 12a2 2 0 100-4 2 2 0 000 4z" }), _jsx("path", { fillRule: "evenodd", d: "M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z", clipRule: "evenodd" })] })) : (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: [_jsx("path", { fillRule: "evenodd", d: "M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z", clipRule: "evenodd" }), _jsx("path", { d: "M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" })] })) })] }), _jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, className: "space-y-2 mt-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "h-2 flex-1 bg-gray-200 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full transition-all duration-300 ${strengthColors[passwordStrength]}`, style: { width: `${((validRequirements.filter(Boolean).length) / passwordRequirements.length) * 100}%` } }) }), _jsx("span", { className: `text-sm font-medium capitalize text-${strengthColors[passwordStrength].replace('bg-', '')}`, children: passwordStrength })] }), _jsx(motion.div, { variants: staggerChildren, className: "text-sm space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200", children: passwordRequirements.map((req, index) => (_jsxs(motion.div, { variants: inputAnimation, className: "flex items-center space-x-2", children: [_jsx("svg", { className: `h-4 w-4 ${validRequirements[index] ? 'text-green-500' : 'text-gray-400'}`, fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", stroke: "currentColor", children: validRequirements[index] ? (_jsx("path", { d: "M5 13l4 4L19 7" })) : (_jsx("path", { d: "M6 18L18 6M6 6l12 12" })) }), _jsx("span", { className: validRequirements[index] ? 'text-green-700' : 'text-gray-600', children: req.label })] }, req.label))) })] })] }), _jsxs(motion.div, { variants: inputAnimation, children: [_jsx("label", { htmlFor: "confirm-password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm password" }), _jsxs("div", { className: "relative", children: [_jsx(motion.input, { id: "confirm-password", type: showConfirmPassword ? "text" : "password", required: true, className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pr-10", placeholder: "Confirm your password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), whileFocus: { scale: 1.005, boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)" }, transition: { type: "spring", stiffness: 300, damping: 20 } }), _jsx(motion.button, { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, children: showConfirmPassword ? (_jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) : (_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }) })) })] })] }), _jsxs(motion.div, { className: "flex items-center", variants: animations.fadeIn, children: [_jsx(motion.input, { id: "terms", name: "terms", type: "checkbox", required: true, className: "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } }), _jsxs("label", { htmlFor: "terms", className: "ml-2 block text-sm text-gray-700 cursor-pointer", children: ["I agree to the", ' ', _jsx(Link, { to: "/terms-of-service", className: "text-indigo-600 hover:text-indigo-500 transition-colors duration-200", children: "Terms of Service" }), ' ', "and", ' ', _jsx(Link, { to: "/privacy-policy", className: "text-indigo-600 hover:text-indigo-500 transition-colors duration-200", children: "Privacy Policy" })] })] }), _jsx(motion.button, { type: "submit", disabled: loading, className: "w-full h-[50px] flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", variants: animations.fadeIn, whileHover: { scale: 1.02, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }, whileTap: { scale: 0.98 }, children: loading ? (_jsx(motion.div, { className: "h-5 w-5", animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: "linear" }, children: _jsxs("svg", { className: "animate-spin", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) })) : ('Create account') })] })] })) : (_jsxs(motion.div, { className: "text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100", initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: "spring", duration: 0.8 }, children: [_jsx(motion.div, { className: "mb-6 flex justify-center", initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", duration: 0.5, delay: 0.2 }, children: _jsx("div", { className: "h-16 w-16 rounded-full bg-green-100 flex items-center justify-center", children: _jsx("svg", { className: "h-8 w-8 text-green-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }) }), _jsx(motion.h3, { className: "text-xl font-semibold text-gray-900 mb-2", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3 }, children: "Verify your email" }), _jsxs(motion.p, { className: "text-gray-600 mb-4", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.4 }, children: ["We've sent a verification link to ", _jsx("strong", { children: email }), ".", _jsx("br", {}), "Please check your email and verify your account to continue."] }), _jsx(motion.div, { className: "mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.5 }, children: _jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("strong", { children: "Important:" }), " If you don't see the email, please check your spam or junk folder. The email will be from ", _jsx("strong", { children: "noreply@mail.app.supabase.io" }), " or ", _jsx("strong", { children: "no-reply@supabase.co" }), "."] }) }), _jsx(motion.div, { className: "mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.55 }, children: _jsxs("p", { className: "text-sm text-yellow-800", children: [_jsx("strong", { children: "Note:" }), " Verification emails can take up to 5 minutes to arrive. If you still don't receive it, try clicking the button below."] }) }), _jsx(motion.div, { className: "mb-4", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.6 }, children: _jsx("button", { onClick: async () => {
                                            try {
                                                setLoading(true);
                                                setError('');
                                                // Use the dedicated function to resend verification
                                                const result = await resendVerificationEmail(email);
                                                if (!result.success) {
                                                    throw new Error(result.error);
                                                }
                                                // Show success message
                                                alert(result.message || 'Verification email resent. Please check your inbox and spam folder.');
                                            }
                                            catch (err) {
                                                setError(err instanceof Error ? err.message : 'Failed to resend verification email');
                                            }
                                            finally {
                                                setLoading(false);
                                            }
                                        }, disabled: loading, className: "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50", children: loading ? 'Sending...' : 'Resend Verification Email' }) }), _jsx(motion.div, { className: "mb-4", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.65 }, children: _jsx("button", { onClick: () => window.location.href = '/email-test', className: "w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: "Go to Email Test Page" }) }), _jsx(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.7 }, children: _jsx(Link, { to: "/login", className: "text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200", children: "Return to login" }) })] })), _jsxs(motion.div, { className: "text-center", variants: animations.fadeIn, children: [_jsx("span", { className: "text-sm text-gray-600", children: "Already have an account? " }), _jsx(motion.span, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.98 }, className: "inline-block", children: _jsx(Link, { to: "/login", className: "text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200", children: "Sign in" }) })] })] }) })] }));
};
export default Signup;
