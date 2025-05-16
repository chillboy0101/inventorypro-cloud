import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
const VerificationSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [verificationStatus, setVerificationStatus] = useState('loading');
    const [error, setError] = useState(null);
    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Get the token and type from URL parameters
                const token_hash = searchParams.get('token_hash');
                const type = searchParams.get('type');
                if (!token_hash || !type) {
                    setError('Invalid verification link');
                    setVerificationStatus('error');
                    return;
                }
                // Verify the email with Supabase
                const { error } = await supabase.auth.verifyOtp({
                    token_hash,
                    type: type,
                });
                if (error) {
                    setError(error.message);
                    setVerificationStatus('error');
                    return;
                }
                setVerificationStatus('success');
                // Redirect to login after 5 seconds on success
                setTimeout(() => {
                    navigate('/login');
                }, 5000);
            }
            catch (err) {
                setError('An unexpected error occurred');
                setVerificationStatus('error');
            }
        };
        verifyEmail();
    }, [navigate, searchParams]);
    if (verificationStatus === 'loading') {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" }) }));
    }
    if (verificationStatus === 'error') {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg", children: [_jsxs("div", { className: "text-center", children: [_jsx(XCircleIcon, { className: "mx-auto h-16 w-16 text-red-500" }), _jsx("h2", { className: "mt-6 text-3xl font-extrabold text-gray-900", children: "Verification Failed" }), _jsx("p", { className: "mt-2 text-sm text-red-600", children: error || 'Unable to verify your email. Please try again.' })] }), _jsx("div", { className: "mt-8", children: _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/signup", className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: "Back to Sign Up" }) }) })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg", children: [_jsxs("div", { className: "text-center", children: [_jsx(CheckCircleIcon, { className: "mx-auto h-16 w-16 text-green-500" }), _jsx("h2", { className: "mt-6 text-3xl font-extrabold text-gray-900", children: "Email Verified!" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Your email has been successfully verified. You can now log in to your account." })] }), _jsxs("div", { className: "mt-8 space-y-4", children: [_jsx("div", { className: "text-center", children: _jsx("p", { className: "text-sm text-gray-500", children: "You will be automatically redirected to the login page in 5 seconds." }) }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/login", className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: "Go to Login" }) })] })] }) }));
};
export default VerificationSuccess;
