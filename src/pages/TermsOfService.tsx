import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using InventoryPro Cloud ("the Service"), you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
              <p>InventoryPro Cloud is a cloud-based inventory management system that provides tools for tracking, managing, and analyzing inventory data.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Accounts</h2>
              <p>You must create an account to use the Service. You are responsible for maintaining the security of your account and password.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Usage</h2>
              <p>We collect and store the data you input into the Service. By using the Service, you grant us the right to use this data to provide and improve our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Service Availability</h2>
              <p>We strive to provide uninterrupted service but cannot guarantee the Service will be available at all times.</p>
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

export default TermsOfService; 