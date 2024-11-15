import { useState, useEffect } from 'react';

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export const getResponsiveStyles = (isMobile) => ({
  popup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: isMobile ? '16px' : '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    width: isMobile ? '95%' : '90%',
    maxWidth: '1200px',
    maxHeight: isMobile ? '95vh' : '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '16px' : '20px',
  },
  title: {
    fontSize: isMobile ? '18px' : '20px',
    fontWeight: '600',
    color: '#2d3748',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#4a5568',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '16px' : '24px',
    overflowY: 'auto',
    padding: '4px',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '12px' : '16px',
    padding: isMobile ? '16px' : '20px',
    backgroundColor: 'white',
  },
  rightPanel: {
    borderLeft: isMobile ? 'none' : '1px solid #e2e8f0',
    paddingLeft: isMobile ? '0' : '24px',
    marginTop: isMobile ? '16px' : '0',
  },
// Mobile number specific styles
mobileNumberContainer: {
    width: 'calc(100% + 40px)', // Adjust this to account for the negative margin
    backgroundColor: '#f7fafc',
    padding: '16px',
    borderRadius: '8px',
    marginTop: isMobile ? '80px' : '60px',
    border: '1px solid #e2e8f0',
    marginLeft: '-20px',
    boxSizing: 'border-box', // Add this to include padding in width calculation
  },
  mobileInputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box', // Add this
  },
  mobileInputLabel: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '500',
    marginBottom: '4px',
  },
  mobileInputField: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: isMobile ? '16px' : '14px',
    width: '100%',
    backgroundColor: 'white',
    '-webkit-appearance': 'none',
    outline: 'none',
    boxSizing: 'border-box', // Add this
  },
  mobileInputIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#718096',
    pointerEvents: 'none',
  },
  mobileInputContainer: {
    position: 'relative',
    width: '100%',
    marginTop: '4px',
    boxSizing: 'border-box', // Add this
  },
  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '8px' : '12px',
    marginTop: isMobile ? '12px' : '16px',
  },
  patientCard: {
    padding: isMobile ? '12px' : '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  patientCardSelected: {
    padding: isMobile ? '12px' : '16px',
    borderRadius: '8px',
    border: '2px solid #4299e1',
    cursor: 'pointer',
    backgroundColor: '#ebf8ff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '12px' : '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px', // Added margin bottom
  },
  label: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '500',
  },
  input: {
    padding: isMobile ? '8px 10px' : '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: isMobile ? '16px' : '14px',
    width: '100%',
    '-webkit-appearance': 'none',
  },
  select: {
    padding: isMobile ? '8px 10px' : '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: isMobile ? '16px' : '14px',
    width: '100%',
    backgroundColor: 'white',
    '-webkit-appearance': 'none',
  },
  submitButton: {
    backgroundColor: '#4169E1',
    color: 'white',
    border: 'none',
    padding: isMobile ? '14px' : '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: isMobile ? '16px' : '14px',
    fontWeight: '500',
    marginTop: isMobile ? '20px' : '16px',
    width: '100%',
    '-webkit-tap-highlight-color': 'transparent',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  actionButton: {
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    padding: isMobile ? '10px 14px' : '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: isMobile ? '14px' : '14px',
    fontWeight: '500',
    marginTop: '8px',
  },
});