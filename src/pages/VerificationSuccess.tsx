import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';

const VerificationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

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
          type: type as any,
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
      } catch (err) {
        setError('An unexpected error occurred');
        setVerificationStatus('error');
      }
    };

    verifyEmail();
  }, [navigate, searchParams]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-sm text-red-600">
              {error || 'Unable to verify your email. Please try again.'}
            </p>
          </div>
          <div className="mt-8">
            <div className="text-center">
              <Link
                to="/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verified!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your email has been successfully verified. You can now log in to your account.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              You will be automatically redirected to the login page in 5 seconds.
            </p>
          </div>
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess; 