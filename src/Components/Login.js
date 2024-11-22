import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useDoctor } from '../DoctorContext';
import { supabase } from '../supabaseClient';

const Login = () => {
  const {doctors, setDoctorList} = useDoctor();
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [hospitalDetails, setHospitalDetails] = useState({
    name: '',
    mobile: '',
    administrator: '',
    address: '',
  });
  const [canNavigateToHome, setCanNavigateToHome] = useState(false);

  const navigate = useNavigate();

  // Keep all your existing useEffect and handler functions the same
  useEffect(() => {
    if (auth.currentUser) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!auth.currentUser) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [auth.currentUser]);

  useEffect(() => {
    if (canNavigateToHome) {
      navigate('/home', { 
        state: { 
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
        }
      });
    }
  }, [canNavigateToHome, navigate]);

  const handleHospitalFormSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .insert([
          { 
            hospital_id: auth.currentUser.uid,
            name: hospitalDetails.name,
            mobile: hospitalDetails.mobile,
            administrator: hospitalDetails.administrator,
            address: hospitalDetails.address
          }
        ]);
      if (error) throw error;

      setShowHospitalForm(false);
      setCanNavigateToHome(true);
    } catch (error) {
      console.error("Error submitting hospital details:", error);
      setErrorMessage("Failed to submit hospital details. Please try again.");
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      const { user } = response;

      const { data: hospitalId, error: hospitalIdError } = await supabase
        .from('hospitals')
        .select('hospital_id')
        .eq('hospital_id', user.uid)
        .single();

      if (hospitalIdError) {
        if (hospitalIdError.code !== 'PGRST116') {
          throw new Error(hospitalIdError.message);
        } else {
          setShowHospitalForm(true);
          return;
        }
      }
      
      const { data: docData, error } = await supabase
        .from('doctors')
        .select('name, specialization, gender, email, doctor_id')
        .eq('hospital_id', user.uid);

      if (error) throw error;
      setDoctorList(docData);
      setCanNavigateToHome(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMode('login');
      setErrorMessage('Account created successfully. Please log in.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setErrorMessage('Password reset email sent. Check your inbox.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'white',
    },
    imageSection: {
      width: '100%',
      height: '40vh', // Occupies the full viewport height
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#3865ad',
    },
    
    
    logo: {
      width: '70%',
      height: '100%',
      objectFit: 'contain',
    },
    formSection: {
      width: '100%',
      height: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px',
      backgroundColor: 'white',
    },
    form: {
      width: '100%',
      maxWidth: '400px',
    },
    title: {
      fontSize: '24px',
      marginBottom: '24px',
      textAlign: 'center',
      color: '#3b5998',
      fontWeight: '600',
    },
    inaaratitle: {
      fontSize: '20px',
      marginBottom: '24px',
      textAlign: 'center',
      color: '#3b5998',
      fontWeight: '300',
      letterSpacing: '0.3em', // Adjust this value to control spacing

    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '16px',
      border: '1px solid #e1e4e8',
      borderRadius: '8px',
      fontSize: '20px',
      transition: 'border-color 0.2s',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#3865ad',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      marginBottom: '16px',
    },
    buttonDisabled: {
      backgroundColor: '#e1e4e8',
      cursor: 'not-allowed',
    },
    link: {
      color: '#3b5998',
      fontSize: '14px',
      textAlign: 'center',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'block',
      marginTop: '12px',
    },
    errorMessage: {
      color: '#dc3545',
      fontSize: '14px',
      textAlign: 'center',
      marginTop: '16px',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      padding: '32px',
      borderRadius: '16px',
      width: '90%',
      maxWidth: '400px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
    },
    loader: {
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #3b5998',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      animation: 'spin 1s linear infinite',
      margin: '20px auto',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.imageSection}>
        <img src="/login2.png" alt="NeoFlow" style={styles.logo} />
      </div>
      
      <div style={styles.formSection}>
        <div style={styles.form}>
          <h2 style={styles.title}>
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          
          <input
            type="text"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          
          {mode !== 'forgot' && (
            <input
              type="password"
              placeholder="Password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          )}
          
          {mode === 'signup' && (
            <input
              type="password"
              placeholder="Confirm Password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          )}

          <button
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            onClick={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgotPassword}
            disabled={loading}
          >
            {loading 
              ? 'Processing...' 
              : mode === 'login' 
                ? 'Sign In' 
                : mode === 'signup' 
                  ? 'Sign Up' 
                  : 'Reset Password'}
          </button>
  

          {mode === 'login' && (
            <>
              <p style={styles.link} onClick={() => setMode('signup')}>Don't have an account? Sign up</p>
              <p style={styles.link} onClick={() => setMode('forgot')}>Forgot password?</p>
            </>
          )}
          
          {mode !== 'login' && (
            <p style={styles.link} onClick={() => setMode('login')}>Back to login</p>
          )}

          {loading && <div style={styles.loader}></div>}
          
          {errorMessage && (
            <p style={styles.errorMessage}>{errorMessage}</p>
          )}
        </div>
        <h2 style={styles.inaaratitle}> A   product   of   inaara.ai</h2>
      </div>

      {showHospitalForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.title}>Enter Hospital Details</h3>
            <input
              type="text"
              placeholder="Hospital Name"
              style={styles.input}
              value={hospitalDetails.name}
              onChange={(e) => setHospitalDetails({ ...hospitalDetails, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Mobile Number"
              style={styles.input}
              value={hospitalDetails.mobile}
              onChange={(e) => setHospitalDetails({ ...hospitalDetails, mobile: e.target.value })}
            />
            <input
              type="text"
              placeholder="Administrator Name"
              style={styles.input}
              value={hospitalDetails.administrator}
              onChange={(e) => setHospitalDetails({ ...hospitalDetails, administrator: e.target.value })}
            />
            <input
              type="text"
              placeholder="Hospital Address"
              style={styles.input}
              value={hospitalDetails.address}
              onChange={(e) => setHospitalDetails({ ...hospitalDetails, address: e.target.value })}
            />
            <button
              style={styles.button}
              onClick={handleHospitalFormSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default Login;

