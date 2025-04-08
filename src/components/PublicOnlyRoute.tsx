import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { user, forceGlobalSignOut } = useAuth();
  const location = useLocation();
  
  // Check if we're showing verification success page
  const isShowingVerificationSuccess = sessionStorage.getItem('showing_verification_success') === 'true' &&
                                       location.pathname.includes('/auth/callback');
  
  // Check if we're coming from email verification
  const isVerificationFlow = isShowingVerificationSuccess || 
                            location.search.includes('verified=true') || 
                            (location.pathname.includes('/auth/callback') && 
                             !sessionStorage.getItem('isSocialLogin'));
  
  // Check if this is a social login completion
  const isSocialLoginFlow = sessionStorage.getItem('isSocialLogin') === 'true';
  
  // For verification flows, ensure we're completely logged out
  useEffect(() => {
    if (isVerificationFlow && user && !isShowingVerificationSuccess) {
      const cleanupAuth = async () => {
        console.log('[PublicOnlyRoute] Verification flow detected with user, forcing logout');
        await forceGlobalSignOut();
      };
      
      cleanupAuth();
    }
    
    // For social login flows with a user, redirect to dashboard
    if (isSocialLoginFlow && user) {
      console.log('[PublicOnlyRoute] Social login flow detected with user, redirecting to dashboard');
      window.location.href = '/';
    }
  }, [isVerificationFlow, isSocialLoginFlow, user, forceGlobalSignOut, isShowingVerificationSuccess]);
  
  // Important: if showing verification success, always show the children
  if (isShowingVerificationSuccess) {
    console.log('[PublicOnlyRoute] Showing verification success page, bypassing redirect');
    return <>{children}</>;
  }
  
  // If user is logged in and this is not a verification flow, redirect to dashboard
  if (user && !isVerificationFlow) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the protected component
  return <>{children}</>;
};

export default PublicOnlyRoute; 