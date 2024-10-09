// DoctorList.js
import React, { useState,useMemo } from 'react';
import { useQueue } from '../QueueContext';
import AddPatient from './AddPatient';
import { ref, update } from 'firebase/database';
import { database } from '../firebase';
import { auth } from '../firebase'
const styles = {
  doctorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    backgroundColor: 'white',
    minHeight: '100vh',
  },
  doctorCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '10px',
    padding: '16px',
    backgroundColor: '#3865ad',
  },
  doctorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: '1',
  },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '25px',
    overflow: 'hidden',
    backgroundColor: '#4A4A4A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    width: '40px',
    height: '40px',
    color: '#FFFFFF',
  },
  doctorDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  doctorName: {
    color: '#FFFFFF',
    margin: '0',
    fontSize: '18px',
  },
  doctorSpecialization: {
    color: '#B0B0B0',
    margin: '4px 0 0',
    fontSize: '14px',
  },
  patientSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: '2',
  },
  midarea: {
    display: 'flex',
    flexDirection: 'row',
    padding: '10px'
  },
  midsection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: '1',
  },
  lastsection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: '1',
  },
  currentPatient: {
    color: '#FFFFFF',
    margin: '0',
    fontSize: '12px',
  },
  noPatients: {
    color: '#B0B0B0',
    margin: '4px 0 0',
    fontSize: '12px',
  },
  addButton: {
    backgroundColor: '#FF69B4',
    color: '#FFFFFF',
    border: 'none',
    width: '30px',
    height: '30px',
    borderRadius: '15px',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '8px',
    marginLeft: '20px',
    transition: 'background-color 0.3s ease',
  },
  addButtonHover: {
    backgroundColor: '#FF1493',
  },
  addPatientButton: {
    backgroundColor: '#4169E1',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '5px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  addPatientButtonHover: {
    backgroundColor: '#0000CD',
  },
};
const getCurrentPatients = (queueData) => {
    const currentPatients = {};
    
    if (queueData && Array.isArray(queueData)) {
      queueData.forEach(patient => {
        if (patient.waitno === 0) {
          currentPatients[patient.docid] = patient.name;
        }
      });
    }
    
    return currentPatients;
  };
  function updateQueue(currentList, doctorName) {
    // Step 1: Remove the patient with waitno 0 for the specified doctor
    const filteredList = currentList.filter(
      patient => !(patient.docname === doctorName && patient.waitno === 0)
    );
  
    // Step 2: Update sno and waitno of the remaining patients
    let newSno = 1;
    const updatedList = filteredList.map(patient => {
      if (patient.docname === doctorName) {
        return { ...patient, sno: newSno.toString(), waitno: patient.waitno - 1 };
      }
      return { ...patient, sno: newSno.toString() };
    });
  
    return updatedList;
  }
  function transformData(data) {
    return data.reduce((acc, item, index) => {
      // Create a new object without the 'sno' property
      const { sno, ...rest } = item;
      
      // Use index + 1 as the key, and spread the rest of the properties
      acc[index + 1] = {
        ...rest,
        sno: (index + 1).toString() // Ensure sno is a string and matches the new key
      };
      
      return acc;
    }, {});
  }

  const onPlusClick = async (currentList, doctorName) => {
    const updatedRemovedList = updateQueue(currentList, doctorName);
    console.log("The updated list is:", updatedRemovedList);
    try {
        await update(ref(database, 'users/' + auth.currentUser.uid), { realtime: JSON.stringify(transformData(updatedRemovedList))})

        }catch{
            console.log('error found while updating + to firebase database')
        }
    return updatedRemovedList;
  };

const DoctorCard = ({ doctor }) => {
    console.log("this is inside doctor : ",doctor )
  const { data, loading, error } = useQueue();
  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [isAddPatientButtonHovered, setIsAddPatientButtonHovered] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const currentPatients = useMemo(() => getCurrentPatients(data), [data]);


  const handleAddPatient = () => {
    setShowAddPatient(true);
  };

  const handleCloseAddPatient = () => {
    setShowAddPatient(false);
  };
  const currentPatientName = currentPatients[doctor.doctor_id] || 'No Patients';
  console.log("the current patient Name is : ",currentPatientName)


  return (
    <div style={styles.doctorCard}>
      <div style={styles.doctorInfo}>
        <div style={styles.avatar}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={styles.avatarIcon}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div style={styles.doctorDetails}>
          <h3 style={styles.doctorName}>{doctor.name}</h3>
          <p style={styles.doctorSpecialization}>{doctor.specialization}</p>
        </div>
      </div>
      <div style={styles.patientSection}>
        <div style={styles.midarea}>
          <div style={styles.midsection}>
            <p style={styles.currentPatient}>Current Patient</p>
            <p style={currentPatients[doctor.doctor_id] ? styles.currentPatient : styles.noPatients}>
              {currentPatientName}
            </p>
          </div>
          <button 
            style={{
              ...styles.addButton,
              ...(isAddButtonHovered ? styles.addButtonHover : {})
            }}
            onClick={() => onPlusClick(data,doctor.name)}
            onMouseEnter={() => setIsAddButtonHovered(true)}
            onMouseLeave={() => setIsAddButtonHovered(false)}
          >
            +
          </button>
        </div>  
        <div style={styles.lastsection}>
          <button 
            style={{
              ...styles.addPatientButton,
              ...(isAddPatientButtonHovered ? styles.addPatientButtonHover : {})
            }}
            onClick={handleAddPatient}
            onMouseEnter={() => setIsAddPatientButtonHovered(true)}
            onMouseLeave={() => setIsAddPatientButtonHovered(false)}
          >
            Add Patient
          </button>
        </div>
      </div>
      <AddPatient 
        isOpen={showAddPatient}
        onClose={handleCloseAddPatient}
        docName={doctor.name}
        docDept = {doctor.specialization}
        docId = {doctor.doctor_id}
      
       
      />
    </div>
  );
};

const DoctorList = ({ doctors, onAddPatient }) => {
  return (
    <div style={styles.doctorList}>
      {doctors.map(doctor => (
        <DoctorCard key={doctor.id} doctor={doctor} onAddPatient={onAddPatient} />
      ))}
    </div>
  );
};

export default DoctorList;