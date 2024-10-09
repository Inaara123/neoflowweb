// src/App.js
import React, { useEffect, useState } from 'react';
import { auth } from './firebase'; // Import your Firebase auth instance
import { onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/Login';
import Home from './Components/Home';
import { QueueProvider } from './QueueContext';
import { DoctorProvider } from './DoctorContext';
import ProtectedRoute from './ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);
  const [authIsReady, setAuthIsReady] = useState(false);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthIsReady(true);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  if (!authIsReady) {
    return <div>Loading...</div>; // Or your custom loader component
  }

  return (
    <DoctorProvider>
    <QueueProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/home" replace /> : <Login />
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute user={user}>
            
              <Home />
            </ProtectedRoute>
          }
        />
        {/* Define other routes as needed */}
      </Routes>
    </BrowserRouter>
    </QueueProvider>
    </DoctorProvider>
  );
}

export default App;
