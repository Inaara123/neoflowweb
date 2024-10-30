// AddPatient.js
import React, { useState, useEffect } from 'react';
import {auth} from '../firebase';
import { ref, update } from 'firebase/database';
import { database } from '../firebase';
import { supabase } from '../supabaseClient';
import { useQueue } from '../QueueContext';
import { useSubscription } from '../SubscriptionContext';

const styles = {
  popup: {
    position: 'fixed',
    top: '65%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  submitButton: {
    backgroundColor: '#4169E1',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
  },
  pophead: {
    fontSize: '12px',
    backgroundColor: "3865ad",
  }
};

const initialFormData = {
  name: '',
  mobile: '',
  address: '',
  gender: '',
  age: '',
  reasonForVisit: '',
  howDidYouKnowUs: '',
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
  const { data, loading, error } = useQueue();
  const { planName, loading: planLoading } = useSubscription();
  const [formData, setFormData] = useState(initialFormData);
  const [patientId, setpatientId] = useState(null);
  console.log("the current plan is : ",planName)
  

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    const { name, value } = e.target;
    setFormData((prevData) => {
    const updatedData = { ...prevData, [name]: value };
     // Update reason for visit if consultation type is 'follow-up'
     if (name === 'consultationType' && value === 'follow-up') {
      updatedData.reasonForVisit = 'Follow-Up'; // Set reason for visit
    }
    return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    console.log("i am trying to add a patient")
    e.preventDefault();
    if (formData.name.trim() === '') {
      alert('Patient Name is required');
      return;
    }
    try {
      const masterelement = {
        sno: data.length + 1,
        name: formData.name,
        docname: docName,
        docdept: docDept,
        docid: docId,
        waitno: getOrCreateWaitNumberForDocId(data, docId)
      };
      if (data.length === 0) {
        console.log("first patient being entered")
        await update(ref(database, 'users/' + auth.currentUser.uid), { realtime: JSON.stringify(transformData([masterelement])) });
      } else {
        const addData = [...data, masterelement]
        await update(ref(database, 'users/' + auth.currentUser.uid), { realtime: JSON.stringify(transformData(addData)) });
      }
      // Calculate date_of_birth based on age
function calculateDateOfBirth(age) {
  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - age);
  return currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// Calculate the date of birth from formData.age and assign to dob
const dob = calculateDateOfBirth(formData.age);
      // Supabase insertions

// Normalize the name in JavaScript by converting to lowercase and removing spaces
const normalizedName = formData.name.toLowerCase().replace(/\s+/g, '');
const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
const istTime = new Date(now.getTime() + istOffset).toISOString();
// Search for an existing patient by contact number and normalized name
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const currentDayOfWeek = daysOfWeek[new Date(now.getTime() + (330 * 60 * 1000)).getDay()];
console.log('day here is',currentDayOfWeek);

if (planName === 'Advanced') {
  console.log("The hospital has an 'Advanced' subscription plan.");
  // Add your logic for when the plan is 'Advanced'
const { data: existingPatient, error: searchError } = await supabase
  .from('patients')
  .select('patient_id')
  .eq('contact_number', formData.mobile)
  .filter('name', 'ilike', `%${normalizedName}%`) // Using `ilike` for case-insensitive search
  .single();

if (searchError && searchError.code !== 'PGRST116') { // 'PGRST116' is "No rows" error
    console.error("Error searching for existing patient:", searchError.message);
    throw new Error("Error searching for existing patient");
}
else{
  if (existingPatient) {
    // Patient found, retrieve patient_id
    setpatientId(existingPatient.patient_id);
    console.log("Existing patient ID:", patientId);
  } 
  else{
  const { data: patientData, error: patientError } = await supabase
  .from('patients')
  .insert([{ 
    name: formData.name,
    address: formData.address || 'Unknown',  // Provide actual value if available
    contact_number: formData.mobile || 'Unknown', // Provide actual value if available // Provide actual value if available
    gender: formData.gender || 'Unknown', // Provide actual value if available
    how_did_you_get_to_know_us: formData.howDidYouKnowUs || 'Unknown',
    date_of_birth: dob || null,
    created_at: istTime
  }])
  .select()  // Ensure the returned data includes the newly inserted record
  .single();

  if (patientError) {
    console.error("Error inserting patient data:", patientError.message);
    throw new Error("Error inserting patient data");
  } else {
    console.log("Patient data inserted successfully:", patientData);
    setpatientId(patientData.patient_id);  // Retrieve the patient_id
    console.log("Newly inserted patient ID:", patientId);
  }
}
 
const { data: appointmentData, error: appointmentError } = await supabase
  .from('appointments')
  .insert([{ 
    hospital_id: auth.currentUser.uid,
    patient_id: patientId, // Use returned patient ID
    doctor_id: docId,
    appointment_time: istTime,
    status: 'scheduled', // Modify as needed
    appointment_type: 'Walk-in', // Modify as needed
    reason_for_visit: formData.reasonForVisit || 'General Consultation',
    consultation_start_time: istTime,
    day_of_week:currentDayOfWeek
  }]);
  if (appointmentError) {
    console.error("Error inserting appointment data:", appointmentError.message);
    throw new Error("Error inserting appointment data");
  } else {
    console.log("Appointment data inserted successfully:", appointmentData);
  }

}
}
      onClose()
    } catch {
      console.log(error);
      console.log("Error in AddPatient.js")
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        <form style={styles.form} onSubmit={handleSubmit}>
          <h1 style={styles.pophead}>Add Patient for {docName}</h1>
          <input
            style={styles.input}
            type="text"
            name="name"
            placeholder="Patient Name (Required)"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {planName !== 'Essential' && (
            <>
              <input
                style={styles.input}
                type="tel"
                name="mobile"
                placeholder="Mobile"
                value={formData.mobile}
                onChange={handleChange}
              />
              <input
                style={styles.input}
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
              />
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
              <input
                style={styles.input}
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
              />
              <select
            style={styles.select}
            name="consultationType"
            value={formData.consultationType}
            onChange={handleChange}
          >
            <option value="new">New Consultation</option>
            <option value="follow-up">Follow-Up</option>
          </select>
              <input
                style={styles.input}
                type="text"
                name="reasonForVisit"
                placeholder="Reason for Visit"
                value={formData.reasonForVisit}
                onChange={handleChange}
              />
              <select
                style={styles.select}
                name="howDidYouKnowUs"
                value={formData.howDidYouKnowUs}
                onChange={handleChange}
              >
                <option value="">How did you know us?</option>
                <option value="Friends & Family">Friends & Family</option>
                <option value="Google">Google</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Others">Others</option>
              </select>
            </>
          )}
          <button style={styles.submitButton} type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;