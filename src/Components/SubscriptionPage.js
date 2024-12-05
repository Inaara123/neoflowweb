import React, { useState } from 'react';
import RazorpayButton from './RazorpayButton';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const SubscriptionPage = ({updateUserStatus}) => {
  const userId = auth.currentUser.uid;
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    { 
      name: 'Essential', 
      price: 15000, 
      description: 'Integrated Queue Management System',
      features: [
        'Use TV in clinic to drive patient satisfaction',
        'Your Personal Branding on your TV',
        'Upsell more of your services through our Integrated Technology',
        'Seamlessly Integrates with your existing EMR'
      ]
    },
    { 
      name: 'Advanced', 
      price: 20000, 
      description: 'Advanced Analytics to grow your business',
      features: [
        'Know Exactly where your patients are coming from',
        'Understand what is the profile of patients your clinic is attracting',
        'Validate if your growth strategies are working in real time',
        'Understand which channels work best for your clinic',
        'Advanced Analytic tools to grow your HealthCare practice now at your finger tips'
      ]
    },
    { 
      name: 'Pro', 
      price: 48000, 
      description: 'Talk to your data (Coming Soon)',
      features: [
        'Use the Power of AI to get a detailed understanding of your Business',
        'Discover Insights just by chatting with it',
        'Aida, your personal Assistant will answer any question about your business in seconds',
        'Simplify Decision making with Data driven insights'
      ]
    },
  ];

  const handleSuccessfulPayment = () => {
    updateUserStatus({ isPaidUser: true });
    navigate('/home');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Choose Your Subscription Plan</h1>
      <div style={styles.planContainer}>
        {plans.map((plan) => (
          <div key={plan.name} style={{
            ...styles.planCard,
            ...(plan.name === 'Pro' ? {
              backgroundColor: '#f5f6f7',
              opacity: 0.75
            } : {})
          }}>
            <div style={styles.planHeader}>
              <h2 style={styles.planName}>{plan.name}</h2>
              <p style={styles.price}>
                ₹{plan.price}<span style={styles.period}>/year</span>
              </p>
              <p style={styles.description}>{plan.description}</p>
            </div>
            
            <div style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <div key={index} style={styles.featureItem}>
                  <span style={styles.checkmark}>✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            {plan.name === 'Pro' ? (
              <button 
                style={{
                  ...styles.button,
                  backgroundColor: '#95a5a6',
                  cursor: 'not-allowed'
                }} 
                disabled
              >
                Coming Soon
              </button>
            ) : (
              <RazorpayButton 
                userId={userId} 
                amount={plan.price} 
                onSuccessfulPayment={handleSuccessfulPayment}
                planName={plan.name}
                style={styles.button}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: '#f8f9fa'
  },
  mainTitle: {
    textAlign: 'center',
    marginBottom: '50px',
    color: '#2c3e50',
    fontSize: '2.5em'
  },
  planContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap'
  },
  planCard: {
    width: '340px',
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'translateY(-5px)'
    }
  },
  planHeader: {
    textAlign: 'center',
    marginBottom: '25px',
    padding: '0 10px'
  },
  planName: {
    fontSize: '24px',
    color: '#2c3e50',
    marginBottom: '15px'
  },
  price: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: '15px'
  },
  period: {
    fontSize: '16px',
    color: '#7f8c8d'
  },
  description: {
    color: '#7f8c8d',
    fontSize: '16px',
    marginBottom: '20px'
  },
  featuresContainer: {
    flex: 1,
    marginBottom: '25px'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#2c3e50'
  },
  checkmark: {
    color: '#2ecc71',
    marginRight: '10px',
    fontWeight: 'bold'
  },
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
    transition: 'background-color 0.3s ease',
    ':hover': {
      backgroundColor: '#2980b9'
    }
  }
};

export default SubscriptionPage;