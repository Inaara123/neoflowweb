import React, { useState } from 'react';
import RazorpayButton from './RazorpayButton';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const SubscriptionPage = ({updateUserStatus}) => {
  const userId = auth.currentUser.uid;
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    { name: 'Essential', price: 12, description: 'Integrated Queue Management System' },
    { name: 'Advanced', price: 18, description: 'Advanced Analytics to grow your business' },
    { name: 'Pro', price: 25000, description: 'Talk to your data' },
  ];
  const handleSuccessfulPayment = () => {
    updateUserStatus({ isPaidUser: true });
    navigate('/home');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Choose Your Subscription Plan</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {plans.map((plan) => (
          <div key={plan.name} style={{
            width: '30%',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ marginTop: '0' }}>{plan.name}</h2>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                ₹{plan.price}/year
              </p>
              <p>{plan.description}</p>
            </div>
            <RazorpayButton 
              userId={userId} 
              amount={plan.price} 
              onSuccessfulPayment={handleSuccessfulPayment}
              planName={plan.name}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;