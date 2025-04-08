import { supabase } from './supabase';

/**
 * Auth utilities to handle password reset and authentication flows
 */

/**
 * Requests a password reset email for the specified email address
 */
export const requestPasswordReset = async (email: string) => {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address');
  }
  
  const resetPasswordURL = `${window.location.origin}/reset-password`;
  console.log('Reset password redirect URL:', resetPasswordURL);
  
  return supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: resetPasswordURL,
  });
};

/**
 * Handles password reset token validation from URL
 */
export const verifyPasswordResetToken = async () => {
  try {
    // First check for error parameters
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check for errors in URL search params
    if (searchParams.has('error')) {
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');
      
      if (errorCode === 'otp_expired') {
        throw new Error('The password reset link has expired. Please request a new one.');
      }
      
      throw new Error(errorDescription || 'Invalid reset link. Please request a new one.');
    }
    
    // Check for errors in URL hash
    if (hashParams.has('error')) {
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');
      
      if (errorCode === 'otp_expired') {
        throw new Error('The password reset link has expired. Please request a new one.');
      }
      
      throw new Error(errorDescription || 'Invalid reset link. Please request a new one.');
    }
    
    // Check if we have a code parameter (new Supabase flow)
    if (searchParams.has('code')) {
      const code = searchParams.get('code');
      if (!code) throw new Error('Invalid reset code');
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) throw error;
      console.log('Code exchange successful:', data);
      return { success: true, session: data.session };
    }
    
    // Check if we have an access token in the hash (old Supabase flow)
    if (hashParams.has('access_token')) {
      const accessToken = hashParams.get('access_token');
      if (!accessToken) throw new Error('Invalid access token');
      
      const refreshToken = hashParams.get('refresh_token') || '';
      
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      if (error) throw error;
      console.log('Session set from hash successful:', data);
      return { success: true, session: data.session };
    }
    
    // If we get here with no token params, check if user already has a session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      return { success: true, session };
    }
    
    // No valid token found
    throw new Error('No reset token found. Please use the link from your email.');
  } catch (error) {
    console.error('Token verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid reset link'
    };
  }
};

/**
 * Updates user password in Supabase
 */
export const updateUserPassword = async (password: string) => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  try {
    // Update password
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) throw error;
    
    // Sign out user and clear session
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    
    return { success: true };
  } catch (error) {
    console.error('Password update error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update password'
    };
  }
};

/**
 * Auth utility functions for verifying email, managing tokens, and checking status
 */

/**
 * Resend verification email to a user
 */
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      return { 
        success: false, 
        error: 'Please provide a valid email address' 
      };
    }
    
    // Get the site URL for proper redirects
    const siteUrl = window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback`;
    
    console.log(`[Auth] Resending verification email to ${email}`);
    console.log(`[Auth] Using redirect URL: ${redirectTo}`);
    
    // Ensure email is stored for verification success flow regardless of method used
    localStorage.setItem('verification_email', email);
    
    // Use Supabase's OTP method to trigger email verification flow
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      }
    });
    
    if (error) {
      console.error(`[Auth] Error sending verification email:`, error);
      
      // If that fails, try the signUp method as a fallback for users in inconsistent state
      if (error.message.includes('already registered') || error.message.includes('already taken')) {
        console.log('[Auth] User exists but OTP failed, trying alternate method');
        
        // Try refreshing the verification email via signup with a temp password
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: generateTempPassword(), // Use the existing function
          options: {
            emailRedirectTo: redirectTo,
            data: { resend_attempt: true }
          }
        });
        
        if (signUpError) {
          console.error('[Auth] All verification methods failed:', signUpError);
          return { 
            success: false, 
            error: 'Could not send verification email. Please contact support.'
          };
        }
      } else {
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
    
    // Store email for verification success flow
    localStorage.setItem('verification_email', email);
    sessionStorage.setItem('verification_email_pending', 'true');
    
    return { 
      success: true, 
      message: 'Verification email sent successfully. Please check your inbox and spam folder for an email from noreply@mail.app.supabase.io or no-reply@supabase.co.'
    };
  } catch (err) {
    console.error(`[Auth] Error in resendVerificationEmail:`, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Generate a temporary strong password
 * This is used only for the resend verification flow when we need to create a new account
 * The user will never use this password
 */
function generateTempPassword() {
  const length = 14;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  
  // Ensure at least one of each character type
  password += 'A'; // Uppercase
  password += 'a'; // Lowercase
  password += '1'; // Number
  password += '!'; // Special character
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if a user's email is verified
 */
export const checkEmailVerified = async (email: string) => {
  try {
    // We can check by trying to sign in with OTP
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Don't create a new user, just check existing
      },
    });

    if (error) {
      if (error.message.includes('not confirmed')) {
        return { 
          verified: false, 
          message: 'Email not verified yet'
        };
      }
      
      return { 
        verified: false, 
        message: error.message 
      };
    }

    return { 
      verified: true, 
      message: 'Email appears to be verified'
    };
  } catch (err) {
    console.error('[Auth] Error checking email verification:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { 
      verified: false, 
      message: errorMessage 
    };
  }
};

// Export existing functions
export * from './email-test';  // Re-export the email test functions

// Default export
export default {
  resendVerificationEmail,
  checkEmailVerified,
}; 