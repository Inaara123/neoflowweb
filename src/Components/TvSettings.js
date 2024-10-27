import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GeneralSettings from './GeneralSettings';
import ShuffleMediaOrder from './ShuffleMediaOrder';
import './TvSettings.css';

const TvSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const styles = {
    container: {
      paddingTop: '60px',
    },
    stickyBar: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#3865ad',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      height: '90px',
      width: '140px',
      marginLeft: '30px',
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
    backButton: {
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
      case 'general':
        return (
          <div>
            <GeneralSettings />
          </div>
        );
      case 'shuffleMediaOrder':
        return (
          <div>
            <ShuffleMediaOrder />
          </div>
        );
      default:
        return <h1>General Settings</h1>;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={styles.container} className="container">
      <div style={styles.stickyBar} className="stickyBar">
        <img src="/nobglogo.png" alt="Logo" style={styles.logo} className="logo" />
        <nav style={styles.nav} className="nav">
          <span
            onClick={() => setActiveTab('general')}
            style={{
              ...styles.link,
              ...(activeTab === 'general' ? styles.activeLink : {}),
            }}
            className={`link ${activeTab === 'general' ? 'activeLink' : ''}`}
          >
            General
          </span>
          <span
            onClick={() => setActiveTab('shuffleMediaOrder')}
            style={{
              ...styles.link,
              ...(activeTab === 'shuffleMediaOrder' ? styles.activeLink : {}),
            }}
            className={`link ${activeTab === 'shuffleMediaOrder' ? 'activeLink' : ''}`}
          >
            Shuffle Media Order
          </span>
        </nav>
        <button style={styles.backButton} className="backButton" onClick={handleBack}>
          Back
        </button>
      </div>
      <div style={styles.content} className="content">
        {renderContent()}
      </div>
    </div>
  );
};

export default TvSettings;