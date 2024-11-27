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
  const [discoverySettings, setDiscoverySettings] = useState(null);
  const [showReferralSources, setShowReferralSources] = useState(false);
  const [referralSearch, setReferralSearch] = useState('');
  const [filteredPartners, setFilteredPartners] = useState([]);
  const defaultSources = ["Friends & Family", "Google", "Facebook", "Instagram", "Others"];
  const sources = discoverySettings?.main_sources || defaultSources;

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
    const fetchDiscoverySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('hospitals')
          .select('discovery_settings')
          .eq('hospital_id', auth.currentUser.uid)
          .single();
        
        if (error) throw error;
        setDiscoverySettings(data.discovery_settings);
        
        if (data.discovery_settings?.partner_sources) {
          setFilteredPartners(data.discovery_settings.partner_sources);
        }
      } catch (error) {
        console.error('Error fetching discovery settings:', error);
      }
    };

    if (isOpen) {
      fetchDiscoverySettings();
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

  const handleReferralSearch = (searchTerm) => {
    setReferralSearch(searchTerm);
    if (discoverySettings?.partner_sources) {
      const filtered = discoverySettings.partner_sources.filter(partner =>
        partner.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPartners(filtered);
    }
  };

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
    let { name: targetField, value } = e.target;
    if (targetField === "name") {      
      const exists = searchResults.some(item => item.name.trim() === value.trim());
      if (exists) {
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
          throw patientError;
        }
        currentPatientId = newPatient.patient_id;
        
        const { data: update_data, error: update_error } = await supabase
          .rpc('update_main_area', {
            p_patient_id: currentPatientId,
            p_hospital_id: auth.currentUser.uid
          });

        if (update_error) {
          console.error('Error calling update_main_area:', update_error);
        }
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
          consultation_start_time: null,
          day_of_week: currentDayOfWeek,
          is_follow_up: formData.consultationType === 'follow-up'  
        }])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

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
                          {patient.gender} • {calculateAge(patient.date_of_birth)}
                          years
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
                      <div style={styles.customDropdown}>
                        {!showReferralSources ? (
                          <select
                            style={styles.select}
                            name="howDidYouKnowUs"
                            value={formData.howDidYouKnowUs}
                            onChange={(e) => {
                              if (e.target.value === "SHOW_REFERRAL") {
                                setShowReferralSources(true);
                              } else {
                                handleChange({
                                  target: {
                                    name: 'howDidYouKnowUs',
                                    value: e.target.value
                                  }
                                });
                              }
                            }}
                          >
                            <option value="">Select source</option>
                            {sources.map(source => (
                              <option key={source} value={source}>{source}</option>
                            ))}
                            {discoverySettings?.partner_sources?.length > 0 && (
                              <option value="SHOW_REFERRAL">Referral Sources ➜</option>
                            )}
                          </select>
                        ) : (
                          <div style={styles.referralSourcesContainer}>
                            <div style={styles.referralHeader}>
                              <button
                                style={styles.backButton}
                                onClick={() => {
                                  setShowReferralSources(false);
                                  setReferralSearch('');
                                }}
                              >
                                ← Back
                              </button>
                              <input
                                style={styles.searchInput}
                                type="text"
                                placeholder="Search referral sources..."
                                value={referralSearch}
                                onChange={(e) => handleReferralSearch(e.target.value)}
                              />
                            </div>
                            <div style={styles.referralList}>
                              {filteredPartners.map(partner => (
                                <div
                                  key={partner.name}
                                  style={styles.referralItem}
                                  onClick={() => {
                                    handleChange({
                                      target: {
                                        name: 'howDidYouKnowUs',
                                        value: `referralSource:${partner.name}`
                                      }
                                    });
                                    setShowReferralSources(false);
                                    setReferralSearch('');
                                  }}
                                >
                                  {partner.name} ({partner.specialty})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {formData.howDidYouKnowUs && (
                        <div style={{ marginTop: '4px', fontSize: '14px', color: '#4b5563' }}>
                          Selected: {formData.howDidYouKnowUs}
                        </div>
                      )}
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