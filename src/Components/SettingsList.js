import React, { useState } from 'react'
import { useDoctor } from '../DoctorContext';
import { supabase } from '../supabaseClient';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './SettingsList.css'
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
  },
  doctorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  doctorCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    margin: '0 0 5px 0',
    fontSize: '18px',
    color: '#333',
  },
  doctorSpecialization: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  button: {
    padding: '8px 15px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    marginRight : "10px"
  },
  modifyButton: {
    backgroundColor: '#3865ad',
  },
  buttonHover: {
    transform: 'scale(1.1)',
  },
  confirmationPopup: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#ff4d4d',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    marginRight: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modifyPopup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    width: '300px',
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
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  addButton: {
    display: 'block',
    margin: '20px auto',
    padding: '10px 20px',
    backgroundColor: '#3865ad',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease',
  },
  addButtonHover: {
    backgroundColor: '#45a049',
    transform: 'scale(1.05)',
  },
  addPopup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    width: '300px',
  },
  // Add these to your existing styles object
buttonContainer: {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  marginBottom: '20px',
},
accountInfoPopup: {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  zIndex: 1000,
  width: '300px',
},
accountInfoContent: {
  marginTop: '20px',
  textAlign: 'center',
},

};

const DoctorCard = ({ doctor, deleteDoctor, updateDoctor }) => {
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [isModifyHovered, setIsModifyHovered] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [modifiedDoctor, setModifiedDoctor] = useState({ ...doctor });

  const handleDeleteClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    console.log("the hospital_id is  : ",doctor.hospital_id )
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('doctor_id', doctor.doctor_id)
        .eq('hospital_id', auth.currentUser.uid);

     

    if (error) {
    console.log('Supabase error:', error);
    throw error;
    }

      deleteDoctor(doctor.doctor_id);
      setShowConfirmation(false);
    } catch (error) {
      console.log('Error deleting doctor:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
  };

  const handleModifyClick = () => {
    setShowModifyForm(true);
  };

  const handleCloseModifyForm = () => {
    setShowModifyForm(false);
    setModifiedDoctor({ ...doctor });
  };

  const handleInputChange = (e) => {
    setModifiedDoctor({ ...modifiedDoctor, [e.target.name]: e.target.value });
  };

  const handleSubmitModify = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('doctors')
        .update({
          name: modifiedDoctor.name,
          specialization: modifiedDoctor.specialization,
          contact_number: modifiedDoctor.contact_number,
          email: modifiedDoctor.email,
          gender: modifiedDoctor.gender,
        })
        .eq('doctor_id', doctor.doctor_id)
        .eq('hospital_id', auth.currentUser.uid)
        .select();
  
      if (error) {
        console.error('Error updating doctor:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Handle the error (e.g., show an error message to the user)
        return;
      }
  
      if (data && data.length > 0) {
        console.log('Updated doctor data:', data[0]);
        updateDoctor(doctor.doctor_id, data[0]);
        setShowModifyForm(false);
      } else {
        console.error('No data returned after update');
        // Handle the case where no data is returned (e.g., show an error message to the user)
      }
    } catch (error) {
      console.error('Unexpected error during doctor update:', error);
      // Handle unexpected errors
    }
  };

  return (
    <div style={styles.doctorCard} className="doctorCard">
      <div style={styles.doctorInfo} className="doctorInfo">
        <h3 style={styles.doctorName} className="doctorName">{doctor.name}</h3>
        <p style={styles.doctorSpecialization} className="doctorSpecialization">{doctor.specialization}</p>
      </div>
      <button 
        style={{
          ...styles.button, 
          ...styles.deleteButton, 
          ...(isDeleteHovered ? styles.buttonHover : {})
        }}
        className="button deleteButton"
        onClick={handleDeleteClick}
        onMouseEnter={() => setIsDeleteHovered(true)}
        onMouseLeave={() => setIsDeleteHovered(false)}
      >
        Delete
      </button>
      <button 
        style={{
          ...styles.button, 
          ...styles.modifyButton, 
          ...(isModifyHovered ? styles.buttonHover : {})
        }}
        className="button modifyButton"
        onClick={handleModifyClick}
        onMouseEnter={() => setIsModifyHovered(true)}
        onMouseLeave={() => setIsModifyHovered(false)}
      >
        Modify
      </button>
      {showConfirmation && (
        <div style={styles.confirmationPopup} className="confirmationPopup">
          <p>Are you sure you want to delete {doctor.name}?</p>
          <div>
            <button style={styles.confirmButton} className="confirmButton" onClick={handleConfirmDelete}>Yes</button>
            <button style={styles.cancelButton} className="cancelButton" onClick={handleCancelDelete}>No</button>
          </div>
        </div>
      )}
      {showModifyForm && (
        <div style={styles.modifyPopup} className="modifyPopup">
          <button style={styles.closeButton} className="closeButton" onClick={handleCloseModifyForm}>X</button>
          <form style={styles.form} className="form" onSubmit={handleSubmitModify}>
            <input
              style={styles.input}
              className="input"
              type="text"
              name="name"
              value={modifiedDoctor.name}
              onChange={handleInputChange}
              placeholder="Name"
            />
            <input
              style={styles.input}
              className="input"
              type="text"
              name="specialization"
              value={modifiedDoctor.specialization}
              onChange={handleInputChange}
              placeholder="Specialization"
            />
            <input
              style={styles.input}
              className="input"
              type="email"
              name="email"
              value={modifiedDoctor.email}
              onChange={handleInputChange}
              placeholder="Email"
            />
            <select
              style={styles.select}
              className="select"
              name="gender"
              value={modifiedDoctor.gender}
              onChange={handleInputChange}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <button style={styles.submitButton} className="submitButton" type="submit">Submit</button>
          </form>
        </div>
      )}
    </div>
  );
};


const AddDoctorForm = ({ onClose, addDoctor }) => {
  const [newDoctor, setNewDoctor] = useState({
    name: 'Dr...',
    specialization: '',
    email: '',
    gender: 'male',
    contact_number: ''
  });

  const handleInputChange = (e) => {
    setNewDoctor({ ...newDoctor, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
        const { error: newDoctorError } = await supabase
          .from('doctors')
          .insert([
            {
              hospital_id: auth.currentUser.uid,
              name: newDoctor.name,
              specialization: newDoctor.specialization,
              contact_number: newDoctor.contact_number,
              email: newDoctor.email,
              gender: newDoctor.gender,
              created_at: new Date().toISOString(),
            },
          ]);
  
          if (newDoctorError) {
            if (newDoctorError.code === '23503' && newDoctorError.details.includes('Key (hospital_id)')) {
              // Insert the hospital into the hospitals table
              console.log("new hospital to be added here")
              const { error: newHospitalError } = await supabase
                .from('hospitals')
                .insert([
                  {
                    hospital_id: auth.currentUser.uid,
                    // Add other necessary fields for the hospital here
  // Example field
                  },
                ]);
      
              if (newHospitalError) {
                throw newHospitalError;
              }
      
              // Retry inserting the doctor
              const { error: retryDoctorError } = await supabase
                .from('doctors')
                .insert([
                  {
                    hospital_id: auth.currentUser.uid,
                    name: newDoctor.name,
                    specialization: newDoctor.specialization,
                    contact_number: newDoctor.contact_number,
                    email: newDoctor.email,
                    gender: newDoctor.gender,
                    created_at: new Date().toISOString(),
                  },
                ]);
      
              if (retryDoctorError) {
                throw retryDoctorError;
              }
            } else {
              throw newDoctorError;
            }
          }
  
        // Fetch the newly added doctor to get the complete data including the ID
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('hospital_id', auth.currentUser.uid)
          .eq('name', newDoctor.name)
          .order('created_at', { ascending: false })
          .limit(1);
  
        if (error) {
          throw error;
        }
  
        addDoctor(data[0]);
        console.log("the new doctor updated in supabase is : ",data[0])
        onClose();
      } catch (error) {
        console.error('Error adding doctor:', error);
        // Handle error (e.g., show an error message to the user)
      }
    };
//     addDoctor(newDoctor);
//     onClose();
//   };

return (
  <div style={styles.addPopup} className="addPopup">
    <button style={styles.closeButton} className="closeButton" onClick={onClose}>X</button>
    <form style={styles.form} className="form" onSubmit={handleSubmit}>
      <input
        style={styles.input}
        className="input"
        type="text"
        name="name"
        value={newDoctor.name}
        onChange={handleInputChange}
        placeholder="Name"
        required
      />
      <input
        style={styles.input}
        className="input"
        type="text"
        name="specialization"
        value={newDoctor.specialization}
        onChange={handleInputChange}
        placeholder="Specialization"
        required
      />
      <input
        style={styles.input}
        className="input"
        type="email"
        name="email"
        value={newDoctor.email}
        onChange={handleInputChange}
        placeholder="Email"
        required
      />
      <select
        style={styles.select}
        className="select"
        name="gender"
        value={newDoctor.gender}
        onChange={handleInputChange}
        required
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <button style={styles.submitButton} className="submitButton" type="submit">Submit</button>
    </form>
  </div>
);
};

const SettingsList = () => {
  const { doctors, deleteDoctor, updateDoctor, addDoctor } = useDoctor();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [isAccountButtonHovered, setIsAccountButtonHovered] = useState(false);
  const [isTvButtonHovered, setIsTvButtonHovered] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const navigate = useNavigate();
  const fetchAccountDetails = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('payment_date')
        .eq('hospital_id', user.uid)
        .single();

      if (error) throw error;

      if (data) {
        const paymentDate = new Date(data.payment_date);
        const currentDate = new Date();
        const endDate = new Date(paymentDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const isActive = currentDate < endDate;

        const formatDate = (date) => {
          return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        };

        setAccountDetails({
          status: isActive ? 'Active' : 'Expired',
          startDate: formatDate(paymentDate),
          endDate: formatDate(endDate),
          email: user.email
        });
      }
    } catch (error) {
      console.error("Error fetching account details:", error);
    }
  };

  const handleAccountClick = () => {
    if (!showAccountInfo) {
      fetchAccountDetails();
    }
    setShowAccountInfo(!showAccountInfo);
  };

  const handleAddClick = () => {
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
  };
  const handleTvClick = () => {
    navigate('/tv');
  };
  
  
  return (
      <div style={styles.container} className="container">
                  <div style={styles.buttonContainer}>

          <button 
            style={{
              ...styles.addButton,
              ...(isAddButtonHovered ? styles.addButtonHover : {})
            }}
            className="addButtonS"
            onClick={handleAddClick}
            onMouseEnter={() => setIsAddButtonHovered(true)}
            onMouseLeave={() => setIsAddButtonHovered(false)}
          >
            Add Doctor
          </button>
          <button 
                style={{
                  ...styles.addButton,
                  ...(isAccountButtonHovered ? styles.addButtonHover : {})
                }}
                onClick={handleAccountClick}
                onMouseEnter={() => setIsAccountButtonHovered(true)}
                onMouseLeave={() => setIsAccountButtonHovered(false)}
              >
                Account Info
              </button>
              <button 
                style={{
                  ...styles.addButton,
                  ...(isTvButtonHovered ? styles.addButtonHover : {})
                }}
                onClick={handleTvClick}
                onMouseEnter={() => setIsTvButtonHovered(true)}
                onMouseLeave={() => setIsTvButtonHovered(false)}
              >
                TV Settings
              </button>
              </div>
          {doctors.length === 0 ? (
              <p>Doctors list is empty</p>
          ) : (
              <div>
                  <p>Number of doctors: {doctors.length}</p>
                  <div style={styles.doctorsList} className="doctorsList">
                      {doctors.map(doctor => (
                          <DoctorCard 
                            key={doctor.doctor_id} 
                            doctor={doctor} 
                            deleteDoctor={deleteDoctor} 
                            updateDoctor={updateDoctor}
                          />
                      ))}
                  </div>
              </div>
          )}
          {showAddForm && (
            <AddDoctorForm onClose={handleCloseAddForm} addDoctor={addDoctor} />
          )}
      {showAccountInfo && (
        <div style={styles.modifyPopup}>
          <button style={styles.closeButton} onClick={() => setShowAccountInfo(false)}>X</button>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h3>Account Information</h3>
            {accountDetails ? (
              <>
                <p>Account Status: <span style={{
                  color: accountDetails.status === 'Active' ? 'green' : 'red',
                  fontWeight: 'bold'
                }}>{accountDetails.status}</span></p>
                <p>Subscription Start Date: {accountDetails.startDate}</p>
                <p>Subscription End Date: {accountDetails.endDate}</p>
                <p>Login ID: {accountDetails.email}</p>
                <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
                  For customer support, reach out to us at support@inaara.ai
                </p>
              </>
            ) : (
              <p>Loading account details...</p>
            )}
          </div>
        </div>
      )}
      </div>
  )
}

export default SettingsList