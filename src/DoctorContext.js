// DoctorContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth } from './firebase';
import { supabase } from './supabaseClient';

const DoctorContext = createContext();

export const useDoctor = () => useContext(DoctorContext);

const supabaseDocData = async () => {
  try {
    const { data: docData, error } = await supabase
      .from('doctors')
      .select('name, specialization, gender, email, doctor_id')
      .eq('hospital_id', auth.currentUser?.uid);

    if (error) throw error;

    return docData;
  } catch (error) {
    console.error("Error fetching doctor data:", error);
    throw error;
  }
};

export const DoctorProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const interDoctorData = await supabaseDocData();
        setDoctors(interDoctorData);
      } catch (error) {
        console.error("Failed to fetch doctor data:", error);
        // Handle the error appropriately, maybe set an error state
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const addDoctor = useCallback((doctor) => {
    setDoctors(prevDoctors => [...prevDoctors, doctor]);
  }, []);

  const deleteDoctor = useCallback((doctorId) => {
    setDoctors(prevDoctors => prevDoctors.filter(doctor => doctor.doctor_id !== doctorId));
  }, []);

  const setDoctorList = useCallback((doctorList) => {
    setDoctors(doctorList);
  }, []);

  const updateDoctor = useCallback((doctorId, updatedValues) => {
    setDoctors(prevDoctors => prevDoctors.map(doctor => {
      if (doctor.doctor_id === doctorId) {
        return {
          ...doctor,
          ...updatedValues
        };
      }
      return doctor;
    }));
  }, []);

  return (
    <DoctorContext.Provider value={{ doctors, addDoctor, deleteDoctor, setDoctorList, updateDoctor, loading }}>
      {children}
    </DoctorContext.Provider>
  );
};
// // DoctorContext.js
// import React, { createContext, useContext, useState, useCallback } from 'react';
// import {auth} from './firebase'
// import { supabase } from './supabaseClient';

// const supabaseDocData = async () => {
//     try {
//       const { data: docData, error } = await supabase
//         .from('doctors')
//         .select('name, specialization, gender, email, doctor_id')
//         .eq('hospital_id', auth.currentUser.uid);
  
//       if (error) throw error;
  
//       return docData; // Return the docData
//     } catch (error) {
//       console.error("Error fetching doctor data:", error);
//       throw error; // Re-throw the error to be handled by the caller
//     }
//   };


// try {
//   const interDoctorData = await supabaseDocData();
//   // Do something with doctorData
// } catch (error) {
//   console.error("Failed to fetch doctor data:", error);
//   // Handle the error appropriately
// }

// const DoctorContext = createContext();

// export const useDoctor = () => useContext(DoctorContext);

// export const DoctorProvider = ({ children }) => {
    
//   const [doctors, setDoctors] = useState(interDoctorData);

//   const addDoctor = useCallback((doctor) => {
//     setDoctors(prevDoctors => [...prevDoctors, doctor]);
//   }, []);

//   const deleteDoctor = useCallback((doctorId) => {
//     setDoctors(prevDoctors => prevDoctors.filter(doctor => doctor.doctor_id !== doctorId));
//   }, []);
//   const setDoctorList = useCallback((doctorList) => {
//     setDoctors(doctorList);
//   }, []);
//   const updateDoctor = useCallback((doctorId, updatedValues) => {
//     setDoctors(prevDoctors => prevDoctors.map(doctor => {
//       if (doctor.doctor_id === doctorId) {
//         return {
//           ...doctor,
//           email: updatedValues.email || doctor.email,
//           gender: updatedValues.gender || doctor.gender,
//           name: updatedValues.name || doctor.name,
//           specialization: updatedValues.specialization || doctor.specialization
//         };
//       }
//       return doctor;
//     }));
//   }, []);

//   return (
//     <DoctorContext.Provider value={{ doctors, addDoctor, deleteDoctor,setDoctorList,updateDoctor }}>
//       {children}
//     </DoctorContext.Provider>
//   );
// };