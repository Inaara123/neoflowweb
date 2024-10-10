import React, { useState,useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import DoctorList from './DoctorList';
import Shuffle from './Shuffle';
import SettingsList from './SettingsList'
import { supabase } from '../supabaseClient';
import { useDoctor } from '../DoctorContext';



const Home = () => {
  const { doctors } = useDoctor();
  console.log("the doctors list inside the context is : ",doctors)

  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
 
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/', { replace: true }); // Redirect to login page after sign out
    } catch (error) {
      console.error('Sign out error', error);
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
      padding: '10px 0',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
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
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
        <div>
        <DoctorList doctors={doctors}  />
        </div>);
      case 'shuffle':
        return (
          <div>
            <Shuffle/>
          </div>
        );
      case 'settings':
        return (
          <div>
            <SettingsList doctors={doctors}/>
          </div>
        )
      default:
        return <h1>Home Content</h1>;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.stickyBar}>
        <nav style={styles.nav}>
          <span
            onClick={() => setActiveTab('home')}
            style={{
              ...styles.link,
              ...(activeTab === 'home' ? styles.activeLink : {}),
            }}
          >
            Home
          </span>
          <span
            onClick={() => setActiveTab('shuffle')}
            style={{
              ...styles.link,
              ...(activeTab === 'shuffle' ? styles.activeLink : {}),
            }}
          >
            Shuffle
          </span>
          <span
            onClick={() => setActiveTab('settings')}
            style={{
              ...styles.link,
              ...(activeTab === 'settings' ? styles.activeLink : {}),
            }}
          >
            Settings
          </span>
        </nav>
        <button style={styles.signout} onClick={handleSignOut}>Sign Out</button>
      </div>
      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default Home;