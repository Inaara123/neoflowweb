// src/Components/CollectDetails.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { auth } from '../firebase';

const CollectDetails = () => {
  const [hospitalDetails, setHospitalDetails] = useState({
    name: '',
    mobile: '',
    administrator: '',
    address: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .insert([
          { 
            hospital_id: auth.currentUser.uid,
            name: hospitalDetails.name,
            contact_number: hospitalDetails.mobile,
            administrator: hospitalDetails.administrator,
            address: hospitalDetails.address
          }
        ]);

      if (error) throw error;

      // If successful, navigate to home
      navigate('/home');
    } catch (error) {
      setError("Failed to submit hospital details. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Enter Hospital Details</h2>
      <input
        type="text"
        placeholder="Hospital Name"
        value={hospitalDetails.name}
        onChange={(e) => setHospitalDetails({ ...hospitalDetails, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Mobile Number"
        value={hospitalDetails.mobile}
        onChange={(e) => setHospitalDetails({ ...hospitalDetails, mobile: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Administrator Name"
        value={hospitalDetails.administrator}
        onChange={(e) => setHospitalDetails({ ...hospitalDetails, administrator: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Hospital Address"
        value={hospitalDetails.address}
        onChange={(e) => setHospitalDetails({ ...hospitalDetails, address: e.target.value })}
        required
      />
      <button type="submit">Submit</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default CollectDetails;