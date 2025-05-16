import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
const PublicOnlyRoute = ({ children }) => {
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
        return _jsx(_Fragment, { children: children });
    }
    // If user is logged in and this is not a verification flow, redirect to dashboard
    if (user && !isVerificationFlow) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    // Otherwise, render the protected component
    return _jsx(_Fragment, { children: children });
};
export default PublicOnlyRoute;
