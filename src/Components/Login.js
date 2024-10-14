// src/Login.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useDoctor } from '../DoctorContext';
import { supabase } from '../supabaseClient';

const Login = () => {
  const {doctors, setDoctorList} = useDoctor();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'signup', or 'forgot'

  const navigate = useNavigate();

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
      // Reset any other state as necessary
    }
  }, [auth.currentUser]);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      const { user } = response;

      // Check if UID exists in Supabase
      const { data: hospitalId, error: hospitalIdError } = await supabase
        .from('hospitals')
        .select('hospital_id')
        .eq('hospital_id', user.uid)
        .single();

      if (hospitalIdError) {
        if (hospitalIdError.code !== 'PGRST116') {
          throw new Error(hospitalIdError.message);
        } else {
          console.log('UID does not exist in Supabase. Navigating to Settings');
          navigate('/settings', { 
            state: { 
              uid: user.uid,
              email: user.email,
            }
          });
          return;
        }
      }

      // UID exists in Supabase
      console.log('UID exists in Supabase:', hospitalId);
      
      // Fetch doctor data
      const { data: docData, error } = await supabase
        .from('doctors')
        .select('name, specialization, gender, email, doctor_id')
        .eq('hospital_id', user.uid);

      if (error) throw error;

      console.log('The data from supabase in Signin is : ', docData);
      setDoctorList(docData)

      navigate('/home');
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
      // After successful signup, you might want to create a new entry in your Supabase database
      // This depends on your app's logic
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
    app: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
    },
    form: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '400px',
    },
    title: {
      fontSize: '24px',
      marginBottom: '20px',
      textAlign: 'center',
      color: '#333',
    },
    input: {
      display: 'block',
      width: '100%',
      padding: '10px',
      marginBottom: '15px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'background-color 0.3s',
      marginBottom: '10px',
    },
    buttonSecondary: {
      backgroundColor: '#6c757d',
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
    errorMessage: {
      color: 'red',
      marginTop: '10px',
      textAlign: 'center',
    },
    loader: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      animation: 'spin 1s linear infinite',
      margin: '20px auto',
    },
    link: {
      color: '#007bff',
      textDecoration: 'underline',
      cursor: 'pointer',
      marginTop: '10px',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.app}>
      <div style={styles.form}>
        <h2 style={styles.title}>
          {mode === 'login' ? 'NeoFlow Login' : mode === 'signup' ? 'Sign Up' : 'Forgot Password'}
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
    </div>
  );
};

// Add keyframes for the loader animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default Login;