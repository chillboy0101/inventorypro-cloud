/**
 * Email Configuration Test Utility
 *
 * This file contains utilities to help diagnose email delivery issues.
 * It logs configuration and helps pinpoint potential problems.
 */
import { supabase } from './supabase';
/**
 * Get environment configuration status for email settings
 */
export const checkEmailConfig = () => {
    // Check environment variables without exposing actual values
    const config = {
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        siteUrl: !!window.location.origin,
        origin: window.location.origin,
    };
    console.log('[Email Config] Status:', config);
    // Check for any missing configuration
    const missingConfig = Object.entries(config)
        .filter(([_, value]) => value === false)
        .map(([key]) => key);
    if (missingConfig.length > 0) {
        console.error('[Email Config] Missing required settings:', missingConfig);
        return {
            success: false,
            message: `Missing configuration: ${missingConfig.join(', ')}`
        };
    }
    return { success: true, message: 'Configuration appears to be valid' };
};
/**
 * Test sending a verification email (development use only)
 */
export const testEmailDelivery = async (email) => {
    if (process.env.NODE_ENV === 'production') {
        console.error('[Email Test] This utility should not be used in production');
        return { success: false, message: 'Email testing disabled in production' };
    }
    try {
        console.log('[Email Test] Sending test verification email to:', email);
        // First check if the configuration is valid
        const configCheck = checkEmailConfig();
        if (!configCheck.success) {
            return configCheck;
        }
        // Use Supabase's OTP method to send a verification email
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });
        if (error) {
            console.error('[Email Test] Error sending test email:', error.message);
            return { success: false, message: error.message };
        }
        console.log('[Email Test] Test email sent. Check spam folder if not received.');
        console.log('[Email Test] Emails will come from noreply@mail.app.supabase.io or no-reply@supabase.co');
        return {
            success: true,
            message: 'Test email sent successfully. Check inbox and spam folder.',
            details: 'Email will be sent from Supabase (noreply@mail.app.supabase.io or no-reply@supabase.co)'
        };
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error sending test email';
        console.error('[Email Test] Exception:', errorMessage);
        return { success: false, message: errorMessage };
    }
};
export default {
    checkEmailConfig,
    testEmailDelivery,
};
