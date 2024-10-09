// AddPatient.js
import React, { useState, useEffect } from 'react';
import {auth} from '../firebase';
import { ref, update } from 'firebase/database';
import { database } from '../firebase';
import { useQueue } from '../QueueContext';
import { wait } from '@testing-library/user-event/dist/utils';

const styles = {
  popup: {
    position: 'fixed',
    top: '50%',
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

const AddPatient = ({ isOpen, onClose, docName,docDept,docId}) => {
  const { data, loading,error } = useQueue();
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim() === '') {
      alert('Patient Name is required');
      return;
    }
    try {
        const masterelement = {
            sno : data.length +1,
            name: formData.name,
            docname: docName,
            docdept: docDept,
            docid : docId,
            waitno : getOrCreateWaitNumberForDocId(data,docId)

          };
        if (data.length ===0) {
            console.log("first patient being entered")
            await update(ref(database, 'users/' + auth.currentUser.uid), { realtime: JSON.stringify(transformData([masterelement])) });


        }else{
            const addData = [...data,masterelement]
            await update(ref(database, 'users/' + auth.currentUser.uid), { realtime: JSON.stringify(transformData(addData)) });


        }onClose()


    }catch {
        console.log("Error in AddPatient.js")

    }


 
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            name="name"
            placeholder="Patient Name (Required)"
            value={formData.name}
            onChange={handleChange}
            required
          />
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
          <button style={styles.submitButton} type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;