// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import CollectDetails from './Components/CollectDetails';

const ProtectedRoute = ({ user, userStatus, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If userStatus is null, we're still loading, so don't redirect
  if (userStatus === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // For CollectDetails, we want to render it even if hasHospitalDetails is false
  if (children.type === CollectDetails) {
    return children;
  }

  if (!userStatus.hasHospitalDetails) {
    return <Navigate to="/collect-details" replace />;
  }

  if (!userStatus.isPaidUser && window.location.pathname !== '/subscription') {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};

export default ProtectedRoute;