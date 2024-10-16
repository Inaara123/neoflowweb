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
    return <div>Loading...</div>;
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