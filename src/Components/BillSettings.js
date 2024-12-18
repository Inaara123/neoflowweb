// BillSettings.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import {auth} from '../firebase'

const BillSettings = () => {
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');

  const navigate = useNavigate(); 

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Basic input validation
    if (!clinicName || !clinicAddress || !clinicPhone ) {
      toast.error('Please fill in all fields!');
      return;
    }

    try {
      const hospitalId = auth.currentUser.uid  
      // Update the hospitals table in Supabase
      const { error } = await supabase
        .from('hospitals')
        .update({ 
          bill_name: clinicName, 
          bill_address: clinicAddress, 
          bill_phone: clinicPhone, 
          bill_email: clinicEmail 
        })
        .eq('hospital_id', hospitalId); // Add the where clause here


      if (error) {
        throw error;
      }

      toast.success('Details submitted successfully!');
      // Navigate after a delay (e.g., the toast duration)
      setTimeout(() => {
        navigate('/home');
      }, 2000); // 2 seconds, same as your original toast duration
  

    } catch (error) {
      console.error('Error updating hospital details:', error);
      toast.error('Error submitting details. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(-1); 
  };


  return (
    <div style={styles.container}>
      {/* Toaster Component for react-hot-toast */}
      <Toaster position="top-right" reverseOrder={false} />

      <h2 style={styles.title}>These details will appear in your bill</h2>
      
      {/* Back Button */}
      <button onClick={handleBack} style={{ ...styles.button, marginBottom: '20px', backgroundColor: '#555' }}>
        Back
      </button>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="clinicName" style={styles.label}>Clinic Name:</label>
          <input
            type="text"
            id="clinicName"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="clinicAddress" style={styles.label}>Clinic Address:</label>
          <input
            type="text"
            id="clinicAddress"
            value={clinicAddress}
            onChange={(e) => setClinicAddress(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="clinicPhone" style={styles.label}>Clinic Phone:</label>
          <input
            type="text"
            id="clinicPhone"
            value={clinicPhone}
            onChange={(e) => setClinicPhone(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="clinicEmail" style={styles.label}>Clinic Email:</label>
          <input
            type="email"
            id="clinicEmail"
            value={clinicEmail}
            onChange={(e) => setClinicEmail(e.target.value)}
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>Submit</button>
      </form>
    </div>
  );
};

// Inline Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '400px',
    margin: '50px auto',
    padding: '30px',
    borderRadius: '10px',
    backgroundColor: 'white',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
  },
  title: {
    color: '#3865ad',
    marginBottom: '20px',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: '15px',
  },
  label: {
    marginBottom: '5px',
    color: '#3865ad',
    fontWeight: 'bold',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
  },
  button: {
    backgroundColor: '#3865ad',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
  },
};

export default BillSettings;
