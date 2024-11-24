import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { ref, update } from 'firebase/database';
import { database } from '../firebase';
import { supabase } from '../supabaseClient';
import { useQueue } from '../QueueContext';
import { useSubscription } from '../SubscriptionContext';
import AddressAutocomplete from './AddressAutocomplete';
import { getResponsiveStyles, useWindowSize } from './responsiveStyles';
import { Search, User, Phone, MapPin, Calendar, X } from 'lucide-react';

const initialFormData = {
  name: '',
  mobile: '',
  address: '',
  gender: '',
  age: '',
  reasonForVisit: '',
  howDidYouKnowUs: '',
  consultationType: 'new',
  appointmentType: 'BOOKING',
  latitude: null,
  longitude: null,
  distance_travelled: null
};

function getOrCreateWaitNumberForDocId(data, docid) {
  let totalWaitNo = 0;
  let docExists = false;

  for (const key in data) {
    if (data[key].docid === docid) {
      totalWaitNo += 1;
      docExists = true;
    }
  }

  if (!docExists) {
    totalWaitNo = 0;
  }

  return totalWaitNo;
}

function transformData(data) {
  return data.reduce((acc, item, index) => {
    const { sno, ...rest } = item;
    acc[index + 1] = {
      ...rest,
      sno: (index + 1).toString()
    };
    return acc;
  }, {});
}

const AddPatient = ({ isOpen, onClose, docName, docDept, docId }) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const styles = getResponsiveStyles(isMobile);
  const { data, loading, error } = useQueue();
  const { planName, loading: planLoading } = useSubscription();
  const [patientId, setPatientId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(true);
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSearchResults([]);
      setSelectedPatient(null);
      setSearchPerformed(false);
      setIsNewPatient(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchHospitalLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('hospitals')
          .select('location')
          .eq('hospital_id', auth.currentUser.uid)
          .single();
        
        if (error) throw error;
        setHospitalLocation(data.location);
      } catch (error) {
        console.error('Error fetching hospital location:', error);
      }
    };
  
    fetchHospitalLocation();
  }, []);

  const searchPatients = async (mobile) => {
    if (!mobile || mobile.length < 10) return;

    try {
      const { data: hospitalAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('hospital_id', auth.currentUser.uid);

      if (appointmentError) throw appointmentError;

      const hospitalPatientIds = hospitalAppointments
        ?.map(appt => appt.patient_id)
        .filter(id => id !== null && id !== undefined);

      if (!hospitalPatientIds?.length) {
        setSearchResults([]);
        setSearchPerformed(true);
        return;
      }

      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select(`
          patient_id,
          name,
          contact_number,
          address,
          gender,
          date_of_birth,
          how_did_you_get_to_know_us,
          created_at
        `)
        .eq('contact_number', mobile)
        .in('patient_id', hospitalPatientIds);

      if (patientError) throw patientError;
      
      setSearchResults(patients || []);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleMobileChange = async (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, mobile: value }));
    
    if (value.length === 10) {
      await searchPatients(value);
    } else {
      setSearchResults([]);
      setSearchPerformed(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientId(patient.patient_id);
    setIsNewPatient(false);
    setFormData({
      name: patient.name,
      mobile: patient.contact_number,
      address: patient.address,
      gender: patient.gender,
      age: calculateAge(patient.date_of_birth),
      reasonForVisit: '',
      howDidYouKnowUs: patient.how_did_you_get_to_know_us,
      consultationType: 'new',
      appointmentType: 'BOOKING'
    });
  };

  const createNewFromExisting = (patient) => {
    setSelectedPatient(null);
    setPatientId(null);
    setIsNewPatient(true);
    setFormData({
      ...initialFormData,
      mobile: patient.contact_number,
      address: patient.address,
      howDidYouKnowUs: 'Friends & Family'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleChange = (e) => {
    let { name:targetField, value } = e.target;
    console.log("Handle change event:", e.target,searchResults);
    if(targetField === "name"){      
      const exists = searchResults.some(item => item.name.trim() == value.trim());
      if(exists) {
        value = "";
        alert("Patient Name already exist");                
      }
    }
    setFormData(prevData => {
      const updatedData = { ...prevData, [targetField]: value };
      if (targetField === 'consultationType' && value === 'follow-up') {
        updatedData.reasonForVisit = 'Follow-Up';
      }
      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    console.log('Handle Submit')
    e.preventDefault();
    if (formData.mobile.trim() === '') {
      alert('Mobile number is required');
      return;
    }
    else if (formData.name.trim() === '') {
      alert('Patient Name is required');
      return;
    }    

    try {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset).toISOString();
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayOfWeek = daysOfWeek[new Date(now.getTime() + (330 * 60 * 1000)).getDay()];

      let currentPatientId = patientId;

      if (isNewPatient) {
        const dob = formData.age ? calculateDateOfBirth(formData.age) : null;
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{
            name: formData.name,
            address: formData.address || 'Unknown',
            contact_number: formData.mobile || 'Unknown',
            gender: formData.gender || 'Unknown',
            how_did_you_get_to_know_us: formData.howDidYouKnowUs || 'Unknown',
            date_of_birth: dob,
            created_at: istTime,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            distance_travelled: formData.distance_travelled || null,
            duration_travelled: formData.duration_travelled || null,
          }])
          .select()
          .single();

        if (patientError) {
          console.log('partyn',patientError);
          throw patientError;
        }
        currentPatientId = newPatient.patient_id;
        console.log('New Patient ID',currentPatientId);
        
      } else {
       

        const { error: updateError } = await supabase
          .from('patients')
          .update({
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            distance_travelled: formData.distance_travelled || null
          })
          .eq('patient_id', currentPatientId);

        if (updateError) throw updateError;
      }

      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          hospital_id: auth.currentUser.uid,
          patient_id: currentPatientId,
          doctor_id: docId,
          appointment_time: istTime,
          status: 'scheduled',
          appointment_type: formData.appointmentType,
          reason_for_visit: formData.reasonForVisit || 'General Consultation',
          consultation_start_time: istTime,
          day_of_week: currentDayOfWeek
        }])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

       const { data: update_data, error: update_error } = await supabase
      .rpc('update_main_area', {
        p_patient_id: currentPatientId, // Matches the function parameter name
        p_hospital_id: auth.currentUser.uid
      });

    if (update_error) {
      console.error('Error calling update_main_area:', error);
    } 
    else {
      console.log('Function result:', update_data); // Logs `1` or `0`
      if (update_data === 1) {
        console.log('Update successful');
      } else {
      console.warn('No rows updated');
    }
    }

      const masterelement = {
        sno: data.length + 1,
        name: formData.name,
        docname: docName,
        docdept: docDept,
        docid: docId,
        waitno: getOrCreateWaitNumberForDocId(data, docId),
        appointment_id: appointmentData.appointment_id
      };

      if (data.length === 0) {
        await update(ref(database, 'users/' + auth.currentUser.uid), 
          { realtime: JSON.stringify(transformData([masterelement])) }
        );
      } else {
        const addData = [...data, masterelement];
        await update(ref(database, 'users/' + auth.currentUser.uid), 
          { realtime: JSON.stringify(transformData(addData)) }
        );
      }

      onClose();
    } catch (error) {
      console.error('Error in AddPatient.js:', error);
    }
  };

  function calculateDateOfBirth(age) {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() - age);
    return currentDate.toISOString().split('T')[0];
  }

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
    <div style={styles.popupWrapper}>
      <div style={styles.popup}>
        <div style={styles.header}>
          <h2 style={styles.title}>Add Patient for {docName}</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div style={styles.content}>
          <div style={styles.leftPanel}>
            <div style={styles.mobileNumberContainer}>
              <div style={styles.mobileInputWrapper}>
                <label style={styles.mobileInputLabel}>Mobile Number</label>
                <div style={styles.mobileInputContainer}>
                  <input
                    style={styles.mobileInputField}
                    type="tel"
                    maxLength="10"
                    name="mobile"
                    placeholder="Enter 10 digit mobile number"
                    value={formData.mobile}
                    onChange={handleMobileChange}
                  />
                  <Phone style={styles.mobileInputIcon} size={isMobile ? 20 : 16} />
                </div>
              </div>
            </div>

            {searchPerformed && (
              <div style={styles.searchResults}>
                <div style={styles.label}>
                  {searchResults.length > 0 ? 'Found Patients:' : 'No patients found with this number'}
                </div>
                
                {searchResults.map((patient) => (
                  <div key={patient.patient_id} style={{ marginBottom: '12px' }}>
                    <div
                      style={selectedPatient?.patient_id === patient.patient_id ? 
                        styles.patientCardSelected : styles.patientCard}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div style={{ fontWeight: '500' }}>{patient.name}</div>
                      <div style={{ fontSize: '14px', color: '#718096' }}>
                        {patient.gender} • {calculateAge(patient.date_of_birth)} years
                      </div>
                      {selectedPatient?.patient_id === patient.patient_id && (
                        <button
                          style={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            createNewFromExisting(patient);
                          }}
                        >
                          Add New Patient with Same Mobile
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.rightPanel}>
            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Patient Name</label>
                <input
                  style={styles.input}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {planName !== 'Essential' && (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Address</label>
                    <AddressAutocomplete
                      value={formData.address}
                      onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                      hospitalLocation={hospitalLocation}
                      onLocationSelect={(locationData) => {
                        setFormData(prev => ({
                          ...prev,
                          address: locationData.address,
                          latitude: locationData.latitude,
                          longitude: locationData.longitude,
                          distance_travelled: locationData.distanceInKm,
                          duration_travelled: locationData.formattedDuration
                        }));
                      }}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Gender</label>
                    <select
                      style={styles.select}
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Age</label>
                    <input
                      style={styles.input}
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Consultation Type</label>
                    <select
                      style={styles.select}
                      name="consultationType"
                      value={formData.consultationType}
                      onChange={handleChange}
                    >
                      <option value="new">Fresh Consultation</option>
                      <option value="follow-up">Follow-Up</option>
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Appointment Type</label>
                    <select
                      style={styles.select}
                      name="appointmentType"
                      value={formData.appointmentType}
                      onChange={handleChange}
                    >
                      <option value="BOOKING">Booking</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Reason for Visit</label>
                    <input
                      style={styles.input}
                      type="text"
                      name="reasonForVisit"
                      value={formData.reasonForVisit}
                      onChange={handleChange}
                      placeholder="Enter reason for visit"
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>How did you know us?</label>
                    <select
                      style={styles.select}
                      name="howDidYouKnowUs"
                      value={formData.howDidYouKnowUs}
                      onChange={handleChange}
                    >
                      <option value="">Select source</option>
                      <option value="Friends & Family">Friends & Family</option>
                      <option value="Google">Google</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </>
              )}

              <button 
                style={styles.submitButton}
                type="submit"
              >
                {isNewPatient ? 'Add New Patient' : 'Create New Appointment'}
              </button>
            </form>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPatient;
// import React, { useState, useEffect } from 'react';
// import { auth } from '../firebase';
// import { ref, update } from 'firebase/database';
// import { database } from '../firebase';
// import { supabase } from '../supabaseClient';
// import { useQueue } from '../QueueContext';
// import { useSubscription } from '../SubscriptionContext';
// import AddressAutocomplete from './AddressAutocomplete';
// import { getResponsiveStyles,useWindowSize } from './responsiveStyles';
// // import './AddPatient.css'

// import { Search, User, Phone, MapPin, Calenda,X } from 'lucide-react';

// // const styles = {
// //   popup: {
// //     position: 'fixed',
// //     top: '50%',
// //     left: '50%',
// //     transform: 'translate(-50%, -50%)',
// //     backgroundColor: 'white',
// //     padding: '24px',
// //     borderRadius: '12px',
// //     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
// //     zIndex: 1000,
// //     width: '90%',
// //     maxWidth: '1200px',
// //     maxHeight: '90vh',
// //     display: 'flex',
// //     flexDirection: 'column',
// //   },
// //   header: {
// //     display: 'flex',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: '20px',
// //   },
// //   title: {
// //     fontSize: '20px',
// //     fontWeight: '600',
// //     color: '#2d3748',
// //   },
// //   closeButton: {
// //     background: 'none',
// //     border: 'none',
// //     fontSize: '24px',
// //     cursor: 'pointer',
// //     color: '#4a5568',
// //   },
// //   content: {
// //     display: 'grid',
// //     gridTemplateColumns: '1fr 1fr',
// //     gap: '24px',
// //     overflowY: 'auto',
// //     padding: '4px',
// //   },
// //   leftPanel: {
// //     display: 'flex',
// //     flexDirection: 'column',
// //     gap: '16px',
// //   },
// //   rightPanel: {
// //     borderLeft: '1px solid #e2e8f0',
// //     paddingLeft: '24px',
// //   },
// //   searchResults: {
// //     display: 'flex',
// //     flexDirection: 'column',
// //     gap: '12px',
// //     marginTop: '16px',
// //   },
// //   patientCard: {
// //     padding: '16px',
// //     borderRadius: '8px',
// //     border: '1px solid #e2e8f0',
// //     cursor: 'pointer',
// //     transition: 'all 0.2s',
// //     backgroundColor: 'white',
// //   },
// //   patientCardSelected: {
// //     padding: '16px',
// //     borderRadius: '8px',
// //     border: '2px solid #4299e1',
// //     cursor: 'pointer',
// //     backgroundColor: '#ebf8ff',
// //   },
// //   actionButton: {
// //     backgroundColor: '#4299e1',
// //     color: 'white',
// //     border: 'none',
// //     padding: '8px 16px',
// //     borderRadius: '6px',
// //     cursor: 'pointer',
// //     fontSize: '14px',
// //     fontWeight: '500',
// //     marginTop: '8px',
// //   },
// //   form: {
// //     display: 'flex',
// //     flexDirection: 'column',
// //     gap: '16px',
// //   },
// //   inputGroup: {
// //     display: 'flex',
// //     flexDirection: 'column',
// //     gap: '4px',
// //   },
// //   label: {
// //     fontSize: '14px',
// //     color: '#4a5568',
// //     fontWeight: '500',
// //   },
// //   input: {
// //     padding: '8px 12px',
// //     borderRadius: '6px',
// //     border: '1px solid #e2e8f0',
// //     fontSize: '14px',
// //     width: '100%',
// //   },
// //   select: {
// //     padding: '8px 12px',
// //     borderRadius: '6px',
// //     border: '1px solid #e2e8f0',
// //     fontSize: '14px',
// //     width: '100%',
// //     backgroundColor: 'white',
// //   },
// //   submitButton: {
// //     backgroundColor: '#4169E1',
// //     color: 'white',
// //     border: 'none',
// //     padding: '12px',
// //     borderRadius: '6px',
// //     cursor: 'pointer',
// //     fontSize: '16px',
// //     fontWeight: '500',
// //     marginTop: '16px',
// //   },
// //   overlay: {
// //     position: 'fixed',
// //     top: 0,
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     backgroundColor: 'rgba(0, 0, 0, 0.5)',
// //     zIndex: 999,
// //   },
// // };

// const initialFormData = {
//   name: '',
//   mobile: '',
//   address: '',
//   gender: '',
//   age: '',
//   reasonForVisit: '',
//   howDidYouKnowUs: '',
//   consultationType: 'new',
// };

// function getOrCreateWaitNumberForDocId(data, docid) {
//   let totalWaitNo = 0;
//   let docExists = false;

//   for (const key in data) {
//     if (data[key].docid === docid) {
//       totalWaitNo += 1;
//       docExists = true;
//     }
//   }

//   if (!docExists) {
//     totalWaitNo = 0;
//   }

//   return totalWaitNo;
// }

// function transformData(data) {
//   return data.reduce((acc, item, index) => {
//     const { sno, ...rest } = item;
//     acc[index + 1] = {
//       ...rest,
//       sno: (index + 1).toString()
//     };
//     return acc;
//   }, {});
// }

// const AddPatient = ({ isOpen, onClose, docName, docDept, docId }) => {
//   const { width } = useWindowSize();
//   const isMobile = width < 768; // Define mobile breakpoint
//   const styles = getResponsiveStyles(isMobile);
//   const { data, loading, error } = useQueue();
//   const { planName, loading: planLoading } = useSubscription();
//   // const [formData, setFormData] = useState(initialFormData);
//   const [patientId, setPatientId] = useState(null);
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [searchPerformed, setSearchPerformed] = useState(false);
//   const [isNewPatient, setIsNewPatient] = useState(true);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [formData, setFormData] = useState({
//     ...initialFormData,
//     latitude: null,
//     longitude: null,
//     distance_travelled: null
//   });

//   useEffect(() => {
//     if (isOpen) {
//       setFormData(initialFormData);
//       setSearchResults([]);
//       setSelectedPatient(null);
//       setSearchPerformed(false);
//       setIsNewPatient(true);
//     }
//   }, [isOpen]);
//   useEffect(() => {
//     const fetchHospitalLocation = async () => {
//       try {
//         const { data, error } = await supabase
//           .from('hospitals')
//           .select('location')
//           .eq('hospital_id', auth.currentUser.uid)
//           .single();
        
//         if (error) throw error;
//         setHospitalLocation(data.location);
//       } catch (error) {
//         console.error('Error fetching hospital location:', error);
//       }
//     };
  
//     fetchHospitalLocation();
//   }, []);

//   const searchPatients = async (mobile) => {
//     if (!mobile || mobile.length < 10) return;

//     try {
//       const { data: hospitalAppointments, error: appointmentError } = await supabase
//         .from('appointments')
//         .select('patient_id')
//         .eq('hospital_id', auth.currentUser.uid);

//       if (appointmentError) throw appointmentError;

//       const hospitalPatientIds = hospitalAppointments
//         ?.map(appt => appt.patient_id)
//         .filter(id => id !== null && id !== undefined);

//       if (!hospitalPatientIds?.length) {
//         setSearchResults([]);
//         setSearchPerformed(true);
//         return;
//       }

//       const { data: patients, error: patientError } = await supabase
//         .from('patients')
//         .select(`
//           patient_id,
//           name,
//           contact_number,
//           address,
//           gender,
//           date_of_birth,
//           how_did_you_get_to_know_us,
//           created_at
//         `)
//         .eq('contact_number', mobile)
//         .in('patient_id', hospitalPatientIds);

//       if (patientError) throw patientError;
      
//       setSearchResults(patients || []);
//       setSearchPerformed(true);
//     } catch (error) {
//       console.error('Error searching patients:', error);
//     }
//   };

//   const handleMobileChange = async (e) => {
//     const { value } = e.target;
//     setFormData(prev => ({ ...prev, mobile: value }));
    
//     if (value.length === 10) {
//       await searchPatients(value);
//     } else {
//       setSearchResults([]);
//       setSearchPerformed(false);
//     }
//   };

//   const handlePatientSelect = (patient) => {
//     setSelectedPatient(patient);
//     setPatientId(patient.patient_id);
//     setIsNewPatient(false);
//     setFormData({
//       name: patient.name,
//       mobile: patient.contact_number,
//       address: patient.address,
//       gender: patient.gender,
//       age: calculateAge(patient.date_of_birth),
//       reasonForVisit: '',
//       howDidYouKnowUs: patient.how_did_you_get_to_know_us,
//       consultationType: 'new',
//     });
//   };

//   const createNewFromExisting = (patient) => {
//     setSelectedPatient(null);
//     setPatientId(null);
//     setIsNewPatient(true);
//     setFormData({
//       ...initialFormData,
//       mobile: patient.contact_number,
//       address: patient.address,
//       how_did_you_get_to_know_us: 'Friends & Family'
//     });
//   };

//   const calculateAge = (dob) => {
//     if (!dob) return '';
//     const birthDate = new Date(dob);
//     const today = new Date();
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const monthDiff = today.getMonth() - birthDate.getMonth();
//     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }
//     return age.toString();
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prevData => {
//       const updatedData = { ...prevData, [name]: value };
//       if (name === 'consultationType' && value === 'follow-up') {
//         updatedData.reasonForVisit = 'Follow-Up';
//       }
//       return updatedData;
//     });
//   };
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (formData.name.trim() === '') {
//       alert('Patient Name is required');
//       return;
//     }

//     try {
//       const now = new Date();
//       const istOffset = 5.5 * 60 * 60 * 1000;
//       const istTime = new Date(now.getTime() + istOffset).toISOString();
//       const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
//       const currentDayOfWeek = daysOfWeek[new Date(now.getTime() + (330 * 60 * 1000)).getDay()];

//       let currentPatientId = patientId;

//       // First: Handle patient data in Supabase
//       if (isNewPatient) {
//         const dob = formData.age ? calculateDateOfBirth(formData.age) : null;
//         const { data: newPatient, error: patientError } = await supabase
//           .from('patients')
//           .insert([{
//             name: formData.name,
//             address: formData.address || 'Unknown',
//             contact_number: formData.mobile || 'Unknown',
//             gender: formData.gender || 'Unknown',
//             how_did_you_get_to_know_us: formData.howDidYouKnowUs || 'Unknown',
//             date_of_birth: dob,
//             created_at: istTime,
//             latitude: formData.latitude || null,
//             longitude: formData.longitude || null,
//             distance_travelled: formData.distance_travelled || null,
//             duration_travelled: formData.duration_travelled || null,
//           }])
//           .select()
//           .single();

//         if (patientError) throw patientError;
//         currentPatientId = newPatient.patient_id;
//       } else {
//         const { error: updateError } = await supabase
//           .from('patients')
//           .update({
//             latitude: formData.latitude || null,
//             longitude: formData.longitude || null,
//             distance_travelled: formData.distance_travelled || null
//           })
//           .eq('patient_id', currentPatientId);

//         if (updateError) throw updateError;
//       }

//       // Second: Create appointment in Supabase and get the appointment_id
//       const { data: appointmentData, error: appointmentError } = await supabase
//         .from('appointments')
//         .insert([{
//           hospital_id: auth.currentUser.uid,
//           patient_id: currentPatientId,
//           doctor_id: docId,
//           appointment_time: istTime,
//           status: 'scheduled',
//           appointment_type: formData.appointmentType,
//           reason_for_visit: formData.reasonForVisit || 'General Consultation',
//           consultation_start_time: istTime,
//           day_of_week: currentDayOfWeek
//         }])
//         .select()  // Add this to return the inserted row
//         .single(); // Get the single inserted row

//       if (appointmentError) throw appointmentError;

//       // Third: Create master element with appointment_id and send to Firebase
//       const masterelement = {
//         sno: data.length + 1,
//         name: formData.name,
//         docname: docName,
//         docdept: docDept,
//         docid: docId,
//         waitno: getOrCreateWaitNumberForDocId(data, docId),
//         appointment_id: appointmentData.appointment_id  // Add the appointment_id here
//       };

//       // Update Firebase with the master element including appointment_id
//       if (data.length === 0) {
//         await update(ref(database, 'users/' + auth.currentUser.uid), 
//           { realtime: JSON.stringify(transformData([masterelement])) }
//         );
//       } else {
//         const addData = [...data, masterelement];
//         await update(ref(database, 'users/' + auth.currentUser.uid), 
//           { realtime: JSON.stringify(transformData(addData)) }
//         );
//       }

//       onClose();
//     } catch (error) {
//       console.error('Error in AddPatient.js:', error);
//     }
//   };


//   function calculateDateOfBirth(age) {
//     const currentDate = new Date();
//     currentDate.setFullYear(currentDate.getFullYear() - age);
//     return currentDate.toISOString().split('T')[0];
//   }

//   if (!isOpen) return null;

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.popup}>
//         <div style={styles.header}>
//           <h2 style={styles.title}>Add Patient for {docName}</h2>
//           <button style={styles.closeButton} onClick={onClose}>×</button>
//         </div>
        
//         <div style={styles.content}>
//         <div style={styles.leftPanel}>
//   <div style={styles.mobileNumberContainer}>
//     <div style={styles.mobileInputWrapper}>
//       <label style={styles.mobileInputLabel}>Mobile Number</label>
//       <div style={styles.mobileInputContainer}>
//         <input
//           style={styles.mobileInputField}
//           type="tel"
//           maxLength="10"
//           name="mobile"
//           placeholder="Enter 10 digit mobile number"
//           value={formData.mobile}
//           onChange={handleMobileChange}
//         />
//         <Phone style={styles.mobileInputIcon} size={isMobile ? 20 : 16} />
//       </div>
//     </div>
//   </div>



//             {searchPerformed && (
//               <div style={styles.searchResults}>
//                 <div style={styles.label}>
//                   {searchResults.length > 0 ? 'Found Patients:' : 'No patients found with this number'}
//                 </div>
                
//                 {searchResults.map((patient) => (
//                   <div key={patient.patient_id} style={{ marginBottom: '12px' }}>
//                     <div
//                       style={selectedPatient?.patient_id === patient.patient_id ? 
//                         styles.patientCardSelected : styles.patientCard}
//                       onClick={() => handlePatientSelect(patient)}
//                     >
//                       <div style={{ fontWeight: '500' }}>{patient.name}</div>
//                       <div style={{ fontSize: '14px', color: '#718096' }}>
//                         {patient.gender} • {calculateAge(patient.date_of_birth)} years
//                       </div>
//                       {selectedPatient?.patient_id === patient.patient_id && (
//                         <button
//                           style={styles.actionButton}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             createNewFromExisting(patient);
//                           }}
//                         >
//                           Add New Patient with Same Mobile
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}

//               </div>
//             )}
//           </div>
//           <div style={styles.rightPanel}>
//             <form style={styles.form} onSubmit={handleSubmit}>
//               <div style={styles.inputGroup}>
//                 <label style={styles.label}>Patient Name</label>
//                 <input
//                   style={styles.input}
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>

//               {planName !== 'Essential' && (
//                 <>
//               <div style={styles.inputGroup}>
//                 <label style={styles.label}>Address</label>
//                 <AddressAutocomplete
//                   value={formData.address}
//                   onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
//                   hospitalLocation={hospitalLocation}
//                   onLocationSelect={(locationData) => {
//                     setFormData(prev => ({
//                       ...prev,
//                       address: locationData.address,
//                       latitude: locationData.latitude,
//                       longitude: locationData.longitude,
//                       distance_travelled: locationData.distanceInKm,
//                       duration_travelled: locationData.formattedDuration
//                     }));
//                   }}
//                 />
//               </div>

//                   <div style={styles.inputGroup}>
//                     <label style={styles.label}>Gender</label>
//                     <select
//                       style={styles.select}
//                       name="gender"
//                       value={formData.gender}
//                       onChange={handleChange}
//                     >
//                       <option value="">Select Gender</option>
//                       <option value="Male">Male</option>
//                       <option value="Female">Female</option>
//                     </select>
//                   </div>

//                   <div style={styles.inputGroup}>
//                     <label style={styles.label}>Age</label>
//                     <input
//                       style={styles.input}
//                       type="number"
//                       name="age"
//                       value={formData.age}
//                       onChange={handleChange}
//                     />
//                   </div>

//                   <div style={styles.inputGroup}>
//                     <label style={styles.label}>Consultation Type</label>
//                     <select
//                       style={styles.select}
//                       name="consultationType"
//                       value={formData.consultationType}
//                       onChange={handleChange}
//                     >
//                       <option value="new">Fresh Consultation</option>
//                       <option value="follow-up">Follow-Up</option>
//                     </select>
//                   </div>
//                   <div style={styles.inputGroup}>
//                     <label style={styles.label}>Appointment Type</label>
//                     <select
//                       style={styles.select}
//                       name="appointmentType"
//                       value={formData.appointmentType}
//                       onChange={handleChange}
//                     >
//                       <option value="Booking">Booking</option>
//                       <option value="Walk-in">Walk-in</option>
//                       <option value="Emergency">Emergency</option>
//                     </select>
//                   </div>

//                   <div style={styles.inputGroup}>
//                     <label style={styles.label}>Reason for Visit</label>
//                     <input
//                       style={styles.input}
//                       type="text"
//                       name="reasonForVisit"
//                       value={formData.reasonForVisit}
//                       onChange={handleChange}
//                       placeholder="Enter reason for visit"
//                     />
//                   </div>

//                   <div style={styles.inputGroup}>
//                     <label style={styles.label}>How did you know us?</label>
//                     <select
//                       style={styles.select}
//                       name="howDidYouKnowUs"
//                       value={formData.howDidYouKnowUs}
//                       onChange={handleChange}
//                     >
//                       <option value="">Select source</option>
//                       <option value="Friends & Family">Friends & Family</option>
//                       <option value="Google">Google</option>
//                       <option value="Facebook">Facebook</option>
//                       <option value="Instagram">Instagram</option>
//                       <option value="Others">Others</option>
//                     </select>
//                   </div>
//                 </>
//               )}

//               <button 
//                 style={styles.submitButton}
//                 type="submit"
//               >
//                 {isNewPatient ? 'Add New Patient' : 'Create New Appointment'}
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddPatient;
