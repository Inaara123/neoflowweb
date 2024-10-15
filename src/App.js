import React, { useEffect, useState, useCallback } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Components/Login';
import Home from './Components/Home';
import CollectDetails from './Components/CollectDetails';
import SubscriptionPage from './Components/SubscriptionPage';
import { QueueProvider } from './QueueContext';
import { DoctorProvider } from './DoctorContext';
import ProtectedRoute from './ProtectedRoute';
import { supabase } from './supabaseClient';

function AppContent() {
  const [user, setUser] = useState(null);
  const [authIsReady, setAuthIsReady] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkSubscriptionValidity = useCallback(async (currentUser) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('payment_date, is_paid')
        .eq('hospital_id', currentUser.uid)
        .single();

      if (error) throw error;

      if (data && data.is_paid) {
        const paymentDate = new Date(data.payment_date);
        const currentDate = new Date();
        const oneYearLater = new Date(paymentDate.getFullYear() + 1, paymentDate.getMonth(), paymentDate.getDate());

        if (currentDate > oneYearLater) {
          // Subscription has expired
          await supabase
            .from('subscriptions')
            .update({ is_paid: false })
            .eq('hospital_id', currentUser.uid);

          await signOut(auth);
          navigate('/');
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking subscription validity:', error);
      return false;
    }
  }, [navigate]);

  const checkUserStatus = useCallback(async (currentUser) => {
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
            .single()
        ]);

        const hasDetails = !hospitalResponse.error && hospitalResponse.data;
        const isPaid = !subscriptionResponse.error && subscriptionResponse.data && subscriptionResponse.data.is_paid;

        if (isPaid) {
          const isValid = await checkSubscriptionValidity(currentUser);
          return { hasHospitalDetails: hasDetails, isPaidUser: isValid };
        }

        return { hasHospitalDetails: hasDetails, isPaidUser: isPaid };
      } catch (error) {
        console.error('Error checking user status:', error);
        return { hasHospitalDetails: false, isPaidUser: false };
      }
    }
    return null;
  }, [checkSubscriptionValidity]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed. Current user:", currentUser);
      setUser(currentUser);
      setIsLoading(true);

      if (currentUser) {
        const status = await checkUserStatus(currentUser);
        setUserStatus(status);

        if (status) {
          if (!status.hasHospitalDetails) {
            navigate('/collect-details');
          } else if (!status.isPaidUser) {
            navigate('/subscription');
          } else {
            navigate('/home');
          }
        }
      } else {
        setUserStatus(null);
        navigate('/');
      }

      setAuthIsReady(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, checkUserStatus]);

  // Periodic check for subscription validity
  useEffect(() => {
    let intervalId;

    if (user) {
      intervalId = setInterval(async () => {
        const isValid = await checkSubscriptionValidity(user);
        if (!isValid) {
          // If subscription is not valid, the user will be signed out in checkSubscriptionValidity
          console.log('Subscription expired. User signed out.');
        }
      }, 24 * 60 * 60 * 1000); // Check every 24 hours
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, checkSubscriptionValidity]);

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
            <CollectDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute user={user} userStatus={userStatus}>
            <SubscriptionPage />
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
    </Routes>
  );
}

function App() {
  return (
    <DoctorProvider>
      <QueueProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueueProvider>
    </DoctorProvider>
  );
}

export default App;
// // src/App.js
// import React, { useEffect, useState } from 'react';
// import { auth } from './firebase';
// import { onAuthStateChanged } from 'firebase/auth';
// import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// import Login from './Components/Login';
// import Home from './Components/Home';
// import CollectDetails from './Components/CollectDetails';
// import SubscriptionPage from './Components/SubscriptionPage';
// import { QueueProvider } from './QueueContext';
// import { DoctorProvider } from './DoctorContext';
// import ProtectedRoute from './ProtectedRoute';
// import { supabase } from './supabaseClient';

// function AppContent() {
//   const [user, setUser] = useState(null);
//   const [authIsReady, setAuthIsReady] = useState(false);
//   const [userStatus, setUserStatus] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const checkUserStatus = async (currentUser) => {
//       if (currentUser) {
//         try {
//           const [hospitalResponse, subscriptionResponse] = await Promise.all([
//             supabase
//               .from('hospitals')
//               .select('hospital_id')
//               .eq('hospital_id', currentUser.uid)
//               .single(),
//             supabase
//               .from('subscriptions')
//               .select('is_paid')
//               .eq('hospital_id', currentUser.uid)
//               .single()
//           ]);

//           const hasDetails = !hospitalResponse.error && hospitalResponse.data;
//           const isPaid = !subscriptionResponse.error && subscriptionResponse.data && subscriptionResponse.data.is_paid;

//           return { hasHospitalDetails: hasDetails, isPaidUser: isPaid };
//         } catch (error) {
//           console.error('Error checking user status:', error);
//           return { hasHospitalDetails: false, isPaidUser: false };
//         }
//       }
//       return null;
//     };

//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       console.log("Auth state changed. Current user:", currentUser);
//       setUser(currentUser);
//       setIsLoading(true);

//       if (currentUser) {
//         const status = await checkUserStatus(currentUser);
//         setUserStatus(status);

//         if (status) {
//           if (!status.hasHospitalDetails) {
//             navigate('/collect-details');
//           } else if (!status.isPaidUser) {
//             navigate('/subscription');
//           } else {
//             navigate('/home');
//           }
//         }
//       } else {
//         setUserStatus(null);
//         navigate('/');
//       }

//       setAuthIsReady(true);
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   if (!authIsReady || isLoading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <Routes>
//       <Route
//         path="/"
//         element={user ? <Navigate to="/home" replace /> : <Login />}
//       />
//       <Route
//         path="/collect-details"
//         element={
//           <ProtectedRoute user={user} userStatus={userStatus}>
//             <CollectDetails />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/subscription"
//         element={
//           <ProtectedRoute user={user} userStatus={userStatus}>
//             <SubscriptionPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/home"
//         element={
//           <ProtectedRoute user={user} userStatus={userStatus}>
//             <Home />
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// }

// function App() {
//   return (
//     <DoctorProvider>
//       <QueueProvider>
//         <BrowserRouter>
//           <AppContent />
//         </BrowserRouter>
//       </QueueProvider>
//     </DoctorProvider>
//   );
// }

// export default App;
// // // src/App.js
// // import React, { useEffect, useState } from 'react';
// // import { auth } from './firebase'; // Import your Firebase auth instance
// // import { onAuthStateChanged } from 'firebase/auth';
// // import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// // import Login from './Components/Login';
// // import Home from './Components/Home';
// // import { QueueProvider } from './QueueContext';
// // import { DoctorProvider } from './DoctorContext';
// // import ProtectedRoute from './ProtectedRoute';

// // function App() {
// //   const [user, setUser] = useState(null);
// //   const [authIsReady, setAuthIsReady] = useState(false);

// //   useEffect(() => {
// //     // Listen for auth changes
// //     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
// //       setUser(currentUser);
// //       setAuthIsReady(true);
// //     });

// //     // Clean up subscription
// //     return () => unsubscribe();
// //   }, []);

// //   if (!authIsReady) {
// //     return <div>Loading...</div>; // Or your custom loader component
// //   }

// //   return (
// //     <DoctorProvider>
// //     <QueueProvider>
// //     <BrowserRouter>
// //       <Routes>
// //         <Route
// //           path="/"
// //           element={
// //             user ? <Navigate to="/home" replace /> : <Login />

// //           }


// //         />
// //         <Route
// //           path="/home"
// //           element={
// //             <ProtectedRoute user={user}>
            
// //               <Home />
// //             </ProtectedRoute>
// //           }
// //         />
// //         {/* Define other routes as needed */}
// //       </Routes>
// //     </BrowserRouter>
// //     </QueueProvider>
// //     </DoctorProvider>
// //   );
// // }

// // export default App;
