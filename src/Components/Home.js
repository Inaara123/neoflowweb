import React, { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import DoctorList from './DoctorList';
import Shuffle from './Shuffle';
import SettingsList from './SettingsList'
import { useDoctor } from '../DoctorContext';
import PatientAppointmentInfo from './PatientAppointmentInfo';

import './Home.css';

const Home = () => {
  const { doctors } = useDoctor();
  console.log("the doctors list inside the context is : ", doctors)

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  const handleSignOut = async () => {
    const confirmSignOut = window.confirm("Are you sure you want to sign out?");
    
    if (confirmSignOut) {
      try {
        await signOut(auth);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Sign out error', error);
      }
    }
  };

  const styles = {
    container: {
    paddingTop: '60px', // To prevent content from being hidden behind the sticky bar
    },
    stickyBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#3865ad',
    //padding: '10px 0',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    },
    logo: {
    height: '90px',
    width : '140px',// Adjust as needed
    marginLeft: '30px',
    // Adjust as needed
    },
    nav: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    },
    link: {
    color: 'white',
    textDecoration: 'none',
    padding: '10px 20px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    },
    activeLink: {
    backgroundColor: '#2a4d82',
    borderRadius: '5px',
    },
    signout: {
    borderColor: 'white',
    borderWidth: '2px',
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    color: 'white',
    padding: '8px 16px',
    cursor: 'pointer',
    marginRight: '20px',
    },
    content: {
    padding: '20px',
    },
    emptyMessage: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#333',
    marginTop: '50px',
    padding: '20px',
    backgroundColor: '#f8f8f8',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div>
            {doctors.length === 0 ? (
              <div style={styles.emptyMessage} className="emptyMessage">
                Please go to settings and add a doctor to continue.
              </div>
            ) : (
              <DoctorList doctors={doctors} />
            )}
          </div>
        );
      case 'shuffle':
        return (
          <div>
            <Shuffle />
          </div>
        );
        case 'hospitalData': // Add this case
        return (
          <div>
            <PatientAppointmentInfo />
          </div>
        );
      case 'settings':
        return (
          <div>
            <SettingsList doctors={doctors} />
          </div>
        );
      default:
        return <h1>Home Content</h1>;
    }
  };

  return (
    <div style={styles.container} className="container">
      <div style={styles.stickyBar} className="stickyBar">
        <img src="/nobglogo.png" alt="Logo" style={styles.logo} className="logo" />
        <nav style={styles.nav} className="nav">
          <span
            onClick={() => setActiveTab('home')}
            style={{
              ...styles.link,
              ...(activeTab === 'home' ? styles.activeLink : {}),
            }}
            className={`link ${activeTab === 'home' ? 'activeLink' : ''}`}
          >
            Home
          </span>
          <span
            onClick={() => setActiveTab('shuffle')}
            style={{
              ...styles.link,
              ...(activeTab === 'shuffle' ? styles.activeLink : {}),
            }}
            className={`link ${activeTab === 'shuffle' ? 'activeLink' : ''}`}
          >
            Shuffle
          </span>
          <span
  onClick={() => setActiveTab('hospitalData')} // Ensure this matches
  style={{
    ...styles.link,
    ...(activeTab === 'hospitalData' ? styles.activeLink : {}),
  }}
  className={`link ${activeTab === 'hospitalData' ? 'activeLink' : ''}`}
>
  Patient Records
</span>
          <span
            onClick={() => setActiveTab('settings')}
            style={{
              ...styles.link,
              ...(activeTab === 'settings' ? styles.activeLink : {}),
            }}
            className={`link ${activeTab === 'settings' ? 'activeLink' : ''}`}
          >
            Settings
          </span>
        </nav>
        <button style={styles.signout} className="signout" onClick={handleSignOut}>Sign Out</button>
      </div>
      <div style={styles.content} className="content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Home;