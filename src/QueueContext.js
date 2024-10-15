// src/contexts/QueueContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { auth, database } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const QueueContext = createContext();

export function QueueProvider({ children }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        const dbRef = ref(database, `/users/${user.uid}/realtime`);

        const unsubscribeDB = onValue(
          dbRef,
          (snapshot) => {
            const value = snapshot.val();
            console.log('Raw value from Firebase:', value);
            
            if (value) {
              try {
                const parsedData = typeof value === 'string' ? JSON.parse(value) : value;
                console.log('Parsed data:', parsedData);
                
                if (typeof parsedData === 'object' && parsedData !== null) {
                  const formattedData = Object.keys(parsedData).map((key) => ({
                    sno: key,
                    ...parsedData[key],
                  }));
                  console.log('Formatted data:', formattedData);
                  setData(formattedData);
                  setError(null);
                } else {
                  console.error('Parsed data is not an object');
                  setError('Data format is incorrect');
                  setData([]);
                }
              } catch (e) {
                console.error('Failed to parse data', e);
                setError('Failed to parse data');
                setData([]);
              }
            } else {
              console.log('No data found at specified path');
              setData([]);
              setError(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching data', error);
            setError(`Error fetching data: ${error.message}`);
            setData([]);
            setLoading(false);
          }
        );

        return () => unsubscribeDB();
      } else {
        console.log('No user authenticated');
        setLoading(false);
        setData([]);
        setError(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  console.log('Context value:', { data, loading, error });

  return (
    <QueueContext.Provider value={{ data, loading, error }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
// src/contexts/QueueContext.js
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { ref, onValue } from 'firebase/database';
// import { auth, database } from './firebase';

// const QueueContext = createContext();

// export function QueueProvider({ children }) {
//   const [data, setData] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const uid = auth.currentUser?.uid;
//     console.log('Current UID:', uid);

//     if (uid) {
//       console.log('Fetching data from firebase');
//       const dbRef = ref(database, `/users/${uid}/realtime`);

//       const unsubscribe = onValue(
//         dbRef,
//         (snapshot) => {
//           const value = snapshot.val();
//           console.log('Raw value from Firebase:', value);
          
//           if (value) {
//             try {
//               // Check if value is already an object
//               const parsedData = typeof value === 'string' ? JSON.parse(value) : value;
//               console.log('Parsed data:', parsedData);
              
//               if (typeof parsedData === 'object' && parsedData !== null) {
//                 const formattedData = Object.keys(parsedData).map((key) => ({
//                   sno: key,
//                   ...parsedData[key],
//                 }));
//                 console.log('Formatted data:', formattedData);
//                 setData(formattedData);
//                 setError(null);
//               } else {
//                 console.error('Parsed data is not an object');
//                 setError('Data format is incorrect');
//                 setData([]);
//               }
//             } catch (e) {
//               console.error('Failed to parse data', e);
//               setError('Failed to parse data');
//               setData([]);
//             }
//           } else {
//             console.log('No data found at specified path');
//             setData([]);
//             setError(null);
//           }
//           setLoading(false);
//         },
//         (error) => {
//           console.error('Error fetching data', error);
//           setError('Error fetching data');
//           setData([]);
//           setLoading(false);
//         }
//       );

//       return () => unsubscribe();
//     } else {
//       console.log('No user UID available');
//       setLoading(false);
//       setData([]);
//       setError(null);
//     }
//   }, [auth.currentUser]);

//   console.log('Context value:', { data, loading, error });

//   return (
//     <QueueContext.Provider value={{ data, loading, error }}>
//       {children}
//     </QueueContext.Provider>
//   );
// }

// export function useQueue() {
//   const context = useContext(QueueContext);
//   if (context === undefined) {
//     throw new Error('useQueue must be used within a QueueProvider');
//   }
//   return context;
// }