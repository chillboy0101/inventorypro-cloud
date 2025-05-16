import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkEmailConfig, testEmailDelivery } from '../lib/email-test';
import { resendVerificationEmail, checkEmailVerified } from '../lib/auth';
const EmailTest = () => {
    const [emailInput, setEmailInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [configStatus, setConfigStatus] = useState(null);
    // Check config on mount
    useEffect(() => {
        const status = checkEmailConfig();
        setConfigStatus(status);
    }, []);
    const handleSendTestEmail = async () => {
        if (!emailInput || !emailInput.includes('@')) {
            setResult({
                success: false,
                message: 'Please enter a valid email address',
            });
            return;
        }
        try {
            setLoading(true);
            setResult(null);
            const response = await testEmailDelivery(emailInput);
            setResult(response);
        }
        catch (err) {
            setResult({
                success: false,
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleResendVerification = async () => {
        if (!emailInput || !emailInput.includes('@')) {
            setResult({
                success: false,
                message: 'Please enter a valid email address',
            });
            return;
        }
        try {
            setLoading(true);
            setResult(null);
            const response = await resendVerificationEmail(emailInput);
            setResult(response);
        }
        catch (err) {
            setResult({
                success: false,
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleCheckVerification = async () => {
        if (!emailInput || !emailInput.includes('@')) {
            setResult({
                success: false,
                message: 'Please enter a valid email address',
            });
            return;
        }
        try {
            setLoading(true);
            setResult(null);
            const response = await checkEmailVerified(emailInput);
            setResult(response);
        }
        catch (err) {
            setResult({
                success: false,
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md", children: [_jsxs("div", { children: [_jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "Email Configuration Test" }), _jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Use this page to test email delivery and configuration" })] }), configStatus && (_jsx("div", { className: `p-4 rounded-md ${configStatus.success ? 'bg-green-50' : 'bg-red-50'}`, children: _jsxs("p", { className: `text-sm ${configStatus.success ? 'text-green-700' : 'text-red-700'}`, children: [_jsx("strong", { children: configStatus.success ? 'Configuration OK:' : 'Configuration Error:' }), ' ', configStatus.message] }) })), _jsxs("div", { className: "mt-8 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email-address", className: "block text-sm font-medium text-gray-700", children: "Email address" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "email-address", type: "email", required: true, className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm", placeholder: "your@email.com", value: emailInput, onChange: (e) => setEmailInput(e.target.value) }) })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsx("button", { onClick: handleSendTestEmail, disabled: loading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50", children: loading ? 'Sending...' : 'Test New Account' }), _jsx("button", { onClick: handleResendVerification, disabled: loading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50", children: loading ? 'Sending...' : 'Resend Verification' }), _jsx("button", { onClick: handleCheckVerification, disabled: loading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 col-span-1 sm:col-span-2", children: loading ? 'Checking...' : 'Check if Verified' })] }), result && (_jsxs("div", { className: `mt-4 p-4 rounded-md ${result.success || result.verified
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'}`, children: [_jsxs("p", { className: `text-sm font-medium ${result.success || result.verified ? 'text-green-800' : 'text-red-800'}`, children: [result.success || result.verified ? 'Success:' : 'Error:', " ", result.message] }), result.details && (_jsx("p", { className: "mt-2 text-sm text-gray-600", children: result.details }))] }))] }), _jsx("div", { className: "mt-6", children: _jsx(Link, { to: "/", className: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: "Back to Home" }) })] }) }));
};
export default EmailTest;
