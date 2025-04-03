import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Account information (name, email, password)</li>
                <li>Business information</li>
                <li>Inventory and transaction data</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Provide and maintain the Service</li>
                <li>Improve and personalize user experience</li>
                <li>Send important notifications and updates</li>
                <li>Analyze usage patterns and optimize performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 