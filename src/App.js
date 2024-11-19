import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Components/Login';
import Home from './Components/Home';
import TvSettings from './Components/TvSettings';
import CollectDetails from './Components/CollectDetails';
import PatientDetails from './Components/PatientDetails';
import SubscriptionPage from './Components/SubscriptionPage';
import { QueueProvider } from './QueueContext';
import { DoctorProvider } from './DoctorContext';
import { MediaProvider } from './MediaContext';
import { SubscriptionProvider } from './SubscriptionContext';
import ProtectedRoute from './ProtectedRoute';
import { supabase } from './supabaseClient';

function AppContent() {
  const [user, setUser] = useState(null);
  const [authIsReady, setAuthIsReady] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const updateUserStatus = (newStatus) => {
    setUserStatus(prevStatus => ({ ...prevStatus, ...newStatus }));
  };

  useEffect(() => {
    const checkUserStatus = async (currentUser) => {
      if (currentUser) {
        try {
          const [hospitalResponse, subscriptionResponse] = await Promise.all([
            supabase
              .from('hospitals')
              .select('hospital_id')
              .eq('hospital_id', currentUser.uid)
              .single(),
            supabase
              .from('subscriptions')
              .select('is_paid')
              .eq('hospital_id', currentUser.uid)
          ]);

          const hasDetails = !hospitalResponse.error && hospitalResponse.data;
          const isPaid = !subscriptionResponse.error && 
          subscriptionResponse.data && 
          subscriptionResponse.data.length > 0 &&
          subscriptionResponse.data[0].is_paid === true;
          console.log("this is the subscriptionresponse data : ",subscriptionResponse.data)
          console.log("the current user id is : ",currentUser.uid)
          console.log("this is hospital response error : ",subscriptionResponse.error)
          console.log("has details is : ", hasDetails);
          console.log("Is paid is : ", isPaid);

          return { hasHospitalDetails: hasDetails, isPaidUser: isPaid };
        } catch (error) {
          console.error('Error checking user status:', error);
          return { hasHospitalDetails: false, isPaidUser: false };
        }
      }
      return null;
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed. Current user:", currentUser);
      setUser(currentUser);
      setIsLoading(true);

      if (currentUser) {
        const status = await checkUserStatus(currentUser);
        setUserStatus(status);
      } else {
        setUserStatus(null);
        navigate('/');
      }

      setAuthIsReady(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (!authIsReady || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/home" replace /> : <Login />}
      />
      <Route
        path="/collect-details"
        element={
          <ProtectedRoute user={user} userStatus={userStatus}>
            <CollectDetails updateUserStatus={updateUserStatus} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute user={user} userStatus={userStatus}>
            <SubscriptionPage updateUserStatus={updateUserStatus} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute user={user} userStatus={userStatus}>
            <Home />
          </ProtectedRoute>
        }
      />
          <Route
      path="/tv"
      element={
        <ProtectedRoute user={user} userStatus={userStatus}>
          <TvSettings />
        </ProtectedRoute>
      }
    />
          <Route
          path="/patient-details/:doctorId"  element={
          <ProtectedRoute user={user} userStatus={userStatus}>
            <PatientDetails />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
    <MediaProvider>
    <SubscriptionProvider>
      <DoctorProvider>
        <QueueProvider>
          <AppContent />
        </QueueProvider>
      </DoctorProvider>
      </SubscriptionProvider>
      </MediaProvider>
    </BrowserRouter>
  );
}

export default App;
