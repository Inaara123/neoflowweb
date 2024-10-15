// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, userStatus, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!userStatus.hasHospitalDetails) {
    return <Navigate to="/collect-details" replace />;
  }

  if (!userStatus.isPaidUser && window.location.pathname === '/home') {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};

export default ProtectedRoute;