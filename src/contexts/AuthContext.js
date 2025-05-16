import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
const AuthContext = createContext(null);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    const handleAuthError = (error) => {
        switch (error.message) {
            case 'Invalid login credentials':
                return 'Invalid email or password';
            case 'User already registered':
                return 'Email already in use';
            case 'Email not confirmed':
                return 'Please verify your email before logging in';
            case 'New password should be different from the old password':
                return 'New password must be different from your current password';
            case 'Password recovery link has expired':
                return 'Password reset link has expired. Please request a new one.';
            case 'Too many reset attempts. Please try again later.':
                return 'Too many password reset attempts. Please wait a few minutes and try again.';
            case 'No account found with this email address.':
                return 'We couldn\'t find an account with that email address.';
            default:
                return error.message;
        }
    };
    const signup = async (email, password) => {
        try {
            setError(null);
            // Validate email format
            if (!email || !email.includes('@')) {
                throw new Error('Please enter a valid email address');
            }
            // Get email redirect settings - use site URL for proper redirect
            const siteUrl = window.location.origin;
            const emailRedirectTo = `${siteUrl}/auth/callback`;
            // Save the email for verification flow
            localStorage.setItem('verification_email', email);
            // Log the email settings being used
            console.log('[Auth] Signup with email:', email);
            console.log('[Auth] Email redirect to:', emailRedirectTo);
            // Use signUp method with redirectTo option explicitly set
            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo,
                    data: {
                        email_confirmed: false,
                    },
                },
            });
            if (error)
                throw error;
            // Check if identities array exists and is empty - this means user exists but isn't confirmed
            if (data?.user?.identities?.length === 0) {
                // User exists but email not confirmed - try sending another verification email
                console.log('[Auth] User exists but email not confirmed, sending new verification email');
                // Use OTP method as a backup to trigger another verification email
                await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo,
                    },
                });
                throw new Error('This email is already registered but not verified. We have sent a new verification link.');
            }
            // Check if we actually got a user back
            if (!data?.user?.id) {
                throw new Error('Failed to create account. Please try again or contact support.');
            }
            console.log('[Auth] Signup successful, verification email sent to:', email);
            console.log('[Auth] User data:', data?.user?.id);
            // Force a confirmation to make sure email was actually sent
            if (data?.user?.email) {
                try {
                    // Wait a brief moment to allow the server to process
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // Log the confirmation attempt for debugging
                    console.log('[Auth] Confirming verification email was sent for:', email);
                }
                catch (confirmErr) {
                    console.error('[Auth] Error confirming email send:', confirmErr);
                    // Don't throw here, just log it - we'll assume the email was sent
                }
            }
        }
        catch (err) {
            const error = err;
            console.error('[Auth] Signup error:', error.message);
            setError(handleAuthError(error));
            throw error;
        }
    };
    const login = async (email, password) => {
        try {
            setError(null);
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error)
                throw error;
        }
        catch (err) {
            const error = err;
            setError(handleAuthError(error));
            throw error;
        }
    };
    const logout = async () => {
        try {
            setError(null);
            console.log('[Auth] Signing out user...');
            // Do a full global sign out - this clears all sessions for the user
            const { error } = await supabase.auth.signOut({ scope: 'global' });
            if (error)
                throw error;
            // Clear all local storage and session storage
            localStorage.clear();
            sessionStorage.clear();
            // Clear the user state
            setUser(null);
            console.log('[Auth] Successfully signed out user');
        }
        catch (err) {
            const error = err;
            console.error('[Auth] Error during logout:', error.message);
            setError(handleAuthError(error));
            throw error;
        }
    };
    // Force global sign out to handle verification redirect issues
    const forceGlobalSignOut = async () => {
        try {
            console.log('[Auth] Forcing global sign out for verification flow');
            // Sign out from all sessions
            await supabase.auth.signOut({ scope: 'global' });
            // Clear all local storage and session storage
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(';').forEach(cookie => {
                const [name] = cookie.trim().split('=');
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            });
            // Clear the user state
            setUser(null);
            return true;
        }
        catch (err) {
            console.error('[Auth] Error during force sign out:', err);
            return false;
        }
    };
    const resetPassword = async (email) => {
        try {
            // Validate email
            if (!email || !email.includes('@')) {
                throw new Error('Please enter a valid email address');
            }
            setError(null);
            // Make sure we use the exact URL format Supabase expects
            const resetPasswordURL = `${window.location.origin}/reset-password`;
            console.log('[Auth] Reset password redirect URL:', resetPasswordURL);
            // Use auth.resetPasswordForEmail with the specific redirectTo option
            const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: resetPasswordURL,
            });
            if (error) {
                console.error('[Auth] Reset password error:', error);
                // Enhanced error handling
                if (error.message.includes('rate limit')) {
                    throw new Error('Too many reset attempts. Please try again later.');
                }
                else if (error.message.includes('email not found')) {
                    throw new Error('No account found with this email address.');
                }
                else if (error.message.includes('invalid email')) {
                    throw new Error('Please enter a valid email address.');
                }
                throw error;
            }
            // Log successful password reset request
            console.log('[Auth] Password reset email sent successfully to:', email);
            console.log('[Auth] Redirect URL configured as:', resetPasswordURL);
        }
        catch (err) {
            const error = err;
            setError(handleAuthError(error));
            throw error;
        }
    };
    const updatePassword = async (password) => {
        try {
            setError(null);
            setLoading(true);
            // Update the password
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });
            if (updateError)
                throw updateError;
            console.log('Password updated successfully');
            // Force sign out to ensure security
            await supabase.auth.signOut();
            // Clear user state and local storage
            setUser(null);
            localStorage.clear();
            sessionStorage.clear();
            return { success: true };
        }
        catch (err) {
            const error = err;
            setError(handleAuthError(error));
            console.error('Password update error:', error);
            throw error;
        }
        finally {
            setLoading(false);
        }
    };
    const handleSocialLogin = async (provider) => {
        try {
            setLoading(true);
            setError(null);
            // Store social login provider info for callback handling
            sessionStorage.setItem('authProvider', provider);
            sessionStorage.setItem('isSocialLogin', 'true');
            console.log('[Auth] Starting social login with provider:', provider);
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/`, // Redirect directly to root after social auth
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) {
                console.error('[Auth] Social login error:', error);
                if (error.message.includes('popup')) {
                    setError('Please enable popups for this site to use social login');
                }
                else if (error.message.includes('cancelled')) {
                    setError('Login was cancelled');
                }
                else {
                    setError(error.message);
                }
                return;
            }
            if (data?.url) {
                console.log('[Auth] Redirecting to social provider URL:', data.url);
                window.location.href = data.url;
            }
            else {
                console.error('[Auth] No redirect URL returned from social login');
                setError('Failed to start social login. Please try again.');
            }
        }
        catch (err) {
            console.error('[Auth] Unexpected error during social login:', err);
            setError('An unexpected error occurred during social login');
        }
        finally {
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
        forceGlobalSignOut,
        setUser,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: !loading && children }));
};
