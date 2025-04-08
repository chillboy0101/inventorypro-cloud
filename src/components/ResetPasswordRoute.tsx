import React from 'react';

interface ResetPasswordRouteProps {
  children: React.ReactNode;
}

// This route component will always render the reset password page,
// regardless of authentication status
const ResetPasswordRoute: React.FC<ResetPasswordRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default ResetPasswordRoute; 