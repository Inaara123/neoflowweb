// DoctorContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const DoctorContext = createContext();

export const useDoctor = () => useContext(DoctorContext);

export const DoctorProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([]);

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
          email: updatedValues.email || doctor.email,
          gender: updatedValues.gender || doctor.gender,
          name: updatedValues.name || doctor.name,
          specialization: updatedValues.specialization || doctor.specialization
        };
      }
      return doctor;
    }));
  }, []);

  return (
    <DoctorContext.Provider value={{ doctors, addDoctor, deleteDoctor,setDoctorList,updateDoctor }}>
      {children}
    </DoctorContext.Provider>
  );
};