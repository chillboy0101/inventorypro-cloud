import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { verifyPasswordResetToken, updateUserPassword, requestPasswordReset } from '../lib/auth';
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
// Password strength indicator colors
const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
};
// Password requirements with regex patterns
const passwordRequirements = [
    { regex: /.{8,}/, label: 'At least 8 characters long' },
    { regex: /[A-Z]/, label: 'Contains uppercase letter' },
    { regex: /[a-z]/, label: 'Contains lowercase letter' },
    { regex: /[0-9]/, label: 'Contains number' },
    { regex: /[^A-Za-z0-9]/, label: 'Contains special character' }
];
const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [validatingToken, setValidatingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const [requestingNewLink, setRequestingNewLink] = useState(false);
    const [requestEmail, setRequestEmail] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('weak');
    const [validRequirements, setValidRequirements] = useState(new Array(passwordRequirements.length).fill(false));
    // Function to handle requesting a new password reset link
    const handleRequestNewLink = async (e) => {
        e.preventDefault();
        try {
            setRequestingNewLink(true);
            const { error } = await requestPasswordReset(requestEmail);
            if (error)
                throw error;
            setRequestSent(true);
        }
        catch (err) {
            console.error('Error requesting new link:', err);
            setError(err instanceof Error ? err.message : 'Failed to send reset link');
        }
        finally {
            setRequestingNewLink(false);
        }
    };
    useEffect(() => {
        const validateResetToken = async () => {
            try {
                setValidatingToken(true);
                setError('');
                const result = await verifyPasswordResetToken();
                if (!result.success) {
                    throw new Error(result.error);
                }
                console.log('Token is valid, user can reset password');
                setTokenValid(true);
            }
            catch (err) {
                console.error('Token verification failed:', err);
                setError(err instanceof Error ? err.message : 'Invalid reset link');
                setTokenValid(false);
            }
            finally {
                setValidatingToken(false);
            }
        };
        validateResetToken();
    }, []);
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
    // Show a loading spinner while validating token
    if (validatingToken) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center p-6 rounded-lg shadow-md bg-white max-w-md", children: [_jsx("div", { className: "inline-block animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4" }), _jsx("h2", { className: "text-xl font-bold text-gray-800 mb-2", children: "Verifying Reset Link" }), _jsx("p", { className: "text-gray-600 mb-4", children: "We're validating your password reset link. Please wait a moment..." })] }) }));
    }
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
    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        // Enhanced password validation
        if (passwordStrength === 'weak') {
            setError('Please create a stronger password');
            return;
        }
        const missingRequirements = passwordRequirements
            .filter((_, index) => !validRequirements[index])
            .map(req => req.label);
        if (missingRequirements.length > 0) {
            setError(`Password must: ${missingRequirements.join(', ')}`);
            return;
        }
        try {
            setError('');
            setLoading(true);
            // Update the password using our utility function
            const result = await updateUserPassword(password);
            if (!result.success) {
                throw new Error(result.error);
            }
            // Show success message
            setSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        }
        catch (err) {
            console.error('Password reset error:', err);
            setError(err instanceof Error
                ? err.message
                : 'Failed to reset password. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(motion.div, { className: "min-h-screen flex flex-col md:flex-row overflow-hidden", initial: "initial", animate: "animate", exit: "exit", variants: staggerChildren, children: [_jsxs(motion.div, { className: "hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-500 to-purple-600 relative overflow-hidden", variants: animations.fadeIn, children: [!prefersReducedMotion && (_jsxs(_Fragment, { children: [_jsx(motion.div, { className: "absolute h-40 w-40 rounded-full bg-white/5 blur-xl", initial: { x: '10%', y: '10%' }, animate: {
                                    x: ['10%', '15%', '10%'],
                                    y: ['10%', '15%', '10%'],
                                }, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } }), _jsx(motion.div, { className: "absolute h-64 w-64 rounded-full bg-indigo-400/10 blur-xl right-[-5%] bottom-[10%]", initial: { x: '0%', y: '0%' }, animate: {
                                    x: ['0%', '-5%', '0%'],
                                    y: ['0%', '5%', '0%'],
                                }, transition: { duration: 10, repeat: Infinity, ease: "easeInOut" } })] })), _jsx("div", { className: "w-full flex flex-col items-center justify-center px-12 relative z-10", children: _jsxs(motion.div, { className: "backdrop-blur-lg bg-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10", initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", duration: 0.8 }, children: [_jsx(motion.div, { variants: floatAnimation, className: "flex justify-center", children: _jsx(motion.div, { initial: { rotate: -180, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, transition: { duration: 0.8 }, children: _jsx(CubeTransparentIcon, { className: "h-16 w-16 text-white mb-6" }) }) }), _jsx(motion.h2, { className: "text-3xl font-bold text-white mb-4 text-center", variants: animations.fadeIn, children: "Reset Your Password" }), _jsx(motion.p, { className: "text-white/90 text-lg mb-6 text-center", variants: animations.fadeIn, children: "Create a new secure password for your InventoryPro Cloud account." }), _jsx(motion.div, { className: "space-y-5", variants: staggerChildren, children: [
                                        {
                                            icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                                            text: "Use a strong password"
                                        },
                                        {
                                            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                                            text: "At least 8 characters"
                                        },
                                        {
                                            icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                                            text: "Secure your account"
                                        }
                                    ].map((item, index) => (_jsxs(motion.div, { className: "flex items-center group", variants: animations.fadeIn, custom: index, whileHover: { x: 5 }, transition: { type: "spring", stiffness: 400 }, children: [_jsx(motion.div, { className: "h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4 shadow-lg group-hover:bg-white/30 transition-colors duration-200", whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 }, transition: { type: "spring", stiffness: 400 }, children: _jsx("svg", { className: "h-6 w-6 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: item.icon }) }) }), _jsx("span", { className: "text-white font-medium group-hover:text-white/90 transition-colors duration-200", children: item.text })] }, index))) })] }) })] }), _jsx(motion.div, { className: "flex-1 flex items-center justify-center p-8", variants: animations.fadeIn, children: _jsxs(motion.div, { className: "w-full max-w-md space-y-8", variants: staggerChildren, children: [_jsxs(motion.div, { className: "text-center", variants: animations.fadeIn, children: [_jsx(motion.div, { className: "flex justify-center mb-5", variants: logoAnimation, children: _jsx("svg", { className: "h-16 w-16 text-indigo-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("path", { d: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx(motion.h2, { className: "text-3xl font-bold text-gray-900 mb-2", variants: animations.fadeIn, children: !tokenValid
                                        ? "Reset Link Invalid"
                                        : !success
                                            ? "Reset Your Password"
                                            : "Password Reset Complete" }), _jsx(motion.p, { className: "text-gray-600", variants: animations.fadeIn, children: !tokenValid
                                        ? "Your reset link appears to be invalid or expired"
                                        : !success
                                            ? "Create a new secure password for your account"
                                            : "Your password has been updated successfully" })] }), _jsx(AnimatePresence, { mode: "wait", children: error && (_jsx(motion.div, { className: "mb-5 p-4 rounded-lg bg-red-50 border border-red-200", initial: { opacity: 0, y: -20, height: 0 }, animate: { opacity: 1, y: 0, height: 'auto' }, exit: { opacity: 0, y: -20, height: 0 }, transition: {
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                    opacity: { duration: 0.2 }
                                }, children: _jsx("p", { className: "text-sm text-red-600", children: error }) })) }), _jsx(AnimatePresence, { mode: "wait", children: !tokenValid ? (_jsxs(motion.div, { className: "text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100", initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: "spring", duration: 0.8 }, children: [_jsx(motion.div, { className: "mb-6 flex justify-center", initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", duration: 0.5, delay: 0.2 }, children: _jsx("div", { className: "h-16 w-16 rounded-full bg-red-100 flex items-center justify-center", children: _jsx("svg", { className: "h-8 w-8 text-red-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }) }), _jsx(motion.h3, { className: "text-xl font-semibold text-gray-900 mb-2", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3 }, children: error.includes("expired")
                                            ? "Reset Link Expired"
                                            : error.includes("No reset token")
                                                ? "Missing Reset Link"
                                                : "Invalid Reset Link" }), _jsx(motion.p, { className: "text-gray-600 mb-6", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.4 }, children: error.includes("expired")
                                            ? "Your password reset link has expired. Please request a new link below."
                                            : error.includes("No reset token")
                                                ? "Please use the link sent to your email to reset your password."
                                                : "The password reset link is invalid. Please request a new password reset link." }), !requestSent ? (_jsxs(motion.form, { onSubmit: handleRequestNewLink, className: "mb-4 space-y-4", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.5 }, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1 text-left", children: "Email address" }), _jsx("input", { id: "email", type: "email", required: true, className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200", placeholder: "Enter your email", value: requestEmail, onChange: (e) => setRequestEmail(e.target.value) })] }), _jsx("button", { type: "submit", disabled: requestingNewLink, className: "w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", children: requestingNewLink ? (_jsx("div", { className: "h-5 w-5 animate-spin", children: _jsxs("svg", { viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) })) : ('Send New Reset Link') })] })) : (_jsxs(motion.div, { className: "mb-4 p-4 bg-green-50 rounded-lg text-center", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, children: [_jsx("svg", { className: "h-6 w-6 text-green-500 mx-auto mb-2", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), _jsx("p", { className: "text-sm text-green-800 mb-1", children: "Reset link sent!" }), _jsx("p", { className: "text-xs text-green-700", children: "Check your email for instructions to reset your password." })] })), _jsx(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.6 }, children: _jsx(Link, { to: "/login", className: "text-sm font-medium text-indigo-600 hover:text-indigo-500", children: "Return to login" }) })] })) : success ? (_jsxs(motion.div, { className: "text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100", initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: "spring", duration: 0.8 }, children: [_jsx(motion.div, { className: "mb-6 flex justify-center", initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", duration: 0.5, delay: 0.2 }, children: _jsx("div", { className: "h-16 w-16 rounded-full bg-green-100 flex items-center justify-center", children: _jsx("svg", { className: "h-8 w-8 text-green-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }) }), _jsx(motion.h3, { className: "text-xl font-semibold text-gray-900 mb-2", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3 }, children: "Password Reset Complete" }), _jsxs(motion.p, { className: "text-gray-600 mb-6", initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.4 }, children: ["Your password has been successfully updated.", _jsx("br", {}), "You will be redirected to the login page in a moment."] }), _jsx(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.5 }, children: _jsx(Link, { to: "/login", className: "text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200", children: "Return to login now" }) })] })) : (_jsxs(motion.form, { onSubmit: handleSubmit, className: "space-y-6", variants: staggerChildren, initial: "initial", animate: "animate", exit: "exit", children: [_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }, className: "space-y-2", children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "password", type: showPassword ? "text" : "password", required: true, className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pr-10", placeholder: "Create a new password", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none", children: showPassword ? (_jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) : (_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }) })) })] }), _jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, className: "space-y-2 mt-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "h-2 flex-1 bg-gray-200 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full transition-all duration-300 ${strengthColors[passwordStrength]}`, style: { width: `${((validRequirements.filter(Boolean).length) / passwordRequirements.length) * 100}%` } }) }), _jsx("span", { className: `text-sm font-medium capitalize text-${strengthColors[passwordStrength].replace('bg-', '')}`, children: passwordStrength })] }), _jsx(motion.div, { variants: staggerChildren, className: "text-sm space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200", children: passwordRequirements.map((req, index) => (_jsxs(motion.div, { className: "flex items-center space-x-2", children: [_jsx("svg", { className: `h-4 w-4 ${validRequirements[index] ? 'text-green-500' : 'text-gray-400'}`, fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", stroke: "currentColor", children: validRequirements[index] ? (_jsx("path", { d: "M5 13l4 4L19 7" })) : (_jsx("path", { d: "M6 18L18 6M6 6l12 12" })) }), _jsx("span", { className: validRequirements[index] ? 'text-green-700' : 'text-gray-600', children: req.label })] }, req.label))) })] })] }), _jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }, children: [_jsx("label", { htmlFor: "confirm-password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm New Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "confirm-password", type: showConfirmPassword ? "text" : "password", required: true, className: "appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pr-10", placeholder: "Confirm your new password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none", children: showConfirmPassword ? (_jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) : (_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }) })) })] })] }), _jsx(motion.button, { type: "submit", disabled: loading, className: "w-full h-[50px] flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", variants: animations.fadeIn, whileHover: { scale: 1.02, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }, whileTap: { scale: 0.98 }, children: loading ? (_jsx("div", { className: "h-5 w-5 animate-spin", children: _jsxs("svg", { viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) })) : ('Reset Password') }), _jsx(motion.div, { className: "flex justify-center", variants: animations.fadeIn, children: _jsx(Link, { to: "/login", className: "text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200", children: "Return to login" }) })] })) })] }) })] }));
};
export default ResetPassword;
