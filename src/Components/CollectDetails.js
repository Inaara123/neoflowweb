import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { auth } from '../firebase';

const CollectDetails = ({ updateUserStatus }) => {
  const [hospitalDetails, setHospitalDetails] = useState({
    name: '',
    mobile: '',
    administrator: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDP6MAxHVZJQMeIT8LOG6q69AMnCRjxc8U&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeMap();
        initializeAutocomplete();
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const initializeMap = () => {
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: 5,
      center: defaultCenter,
      streetViewControl: false,
      mapTypeControl: false,
    });

    markerRef.current = new window.google.maps.Marker({
      map: mapInstance.current,
      draggable: true,
    });

    mapInstance.current.addListener('click', (e) => {
      updateMarkerPosition(e.latLng);
    });

    markerRef.current.addListener('dragend', (e) => {
      updateMarkerPosition(e.latLng);
    });
  };

  const updateMarkerPosition = (latLng) => {
    const latitude = latLng.lat();
    const longitude = latLng.lng();
    
    markerRef.current.setPosition(latLng);
    mapInstance.current.panTo(latLng);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        document.getElementById('address-input').value = address;
        
        const locationData = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };

        setHospitalDetails(prev => ({
          ...prev,
          address: address,
          latitude: latitude,
          longitude: longitude
        }));

        // Optionally update the location in real-time
        // updateHospitalLocation(address, locationData);
      }
    });
  };

  const updateHospitalLocation = async (address, location) => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .update({ 
          address: address,
          location: location
        })
        .eq('hospital_id', auth.currentUser.uid);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating hospital location:", error);
      setError("Failed to update hospital location. Please try again.");
    }
  };

  const initializeAutocomplete = () => {
    const input = document.getElementById('address-input');
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      fields: ['formatted_address', 'geometry', 'name']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const latLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        mapInstance.current.setZoom(17);
        updateMarkerPosition(place.geometry.location);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationData = {
        type: 'Point',
        coordinates: [hospitalDetails.longitude, hospitalDetails.latitude]
      };

      const { data, error } = await supabase
        .from('hospitals')
        .insert([{ 
          hospital_id: auth.currentUser.uid,
          name: hospitalDetails.name,
          contact_number: hospitalDetails.mobile,
          administrator: hospitalDetails.administrator,
          address: hospitalDetails.address,
          location: locationData
        }]);

      if (error) throw error;
      updateUserStatus({ hasHospitalDetails: true });
      navigate('/subscription');
    } catch (error) {
      setError("Failed to submit hospital details. Please try again.");
      console.error("Error submitting hospital details:", error);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Please Enter Your Hospital Details</h2>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Hospital Name</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter hospital name"
            value={hospitalDetails.name}
            onChange={(e) => setHospitalDetails({ ...hospitalDetails, name: e.target.value })}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Mobile Number</label>
          <input
            style={styles.input}
            type="tel"
            placeholder="Enter mobile number"
            value={hospitalDetails.mobile}
            onChange={(e) => setHospitalDetails({ ...hospitalDetails, mobile: e.target.value })}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Administrator Name</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter administrator name"
            value={hospitalDetails.administrator}
            onChange={(e) => setHospitalDetails({ ...hospitalDetails, administrator: e.target.value })}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Hospital Address</label>
          <input
            id="address-input"
            style={styles.input}
            type="text"
            placeholder="Search for your hospital/clinic like you would in Google Maps"
            required
          />
          <div ref={mapRef} style={styles.map}></div>
          <p style={styles.mapHelper}>You can either search for your location above or click on the map to set your exact location</p>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        
        <button type="submit" style={styles.button}>
          Submit Details
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f5f5f5'
  },
  form: {
    width: '100%',
    maxWidth: '600px',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    marginBottom: '10px'
  },
  map: {
    width: '100%',
    height: '300px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '10px'
  },
  mapHelper: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
    textAlign: 'center'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  error: {
    color: 'red',
    marginBottom: '20px'
  }
};

export default CollectDetails;
