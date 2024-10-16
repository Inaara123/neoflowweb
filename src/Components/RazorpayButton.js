import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Adjust the import path as needed
import { useNavigate } from 'react-router-dom';

const RazorpayButton = ({ userId, amount,onSuccessfulPayment,planName }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const navigate = useNavigate(); // Use this if you're using React Router


  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      alert('Payment system is still loading. Please try again in a moment.');
      return;
    }

    const options = {
      key: 'rzp_live_HxQPdBDt5NSByY', // Replace with your actual Razorpay key
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Inaara Ai solutions Pvt Ltd',
      description: 'Payment for your service',
      handler: async function (response) {
        try {
          // Update Supabase database
          const { data, error } = await supabase
            .from('subscriptions')
            .upsert({ 
              hospital_id: userId, 
              plan_name: planName, 
              subscription_id: response.razorpay_payment_id,
              amount: amount,
              payment_date: new Date().toISOString(),
              is_paid : true,
            });

          if (error) {
            throw error;
          }

          onSuccessfulPayment()
          navigate('/home');


        } catch (error) {
          console.error('Error processing payment:', error);
          alert('Payment failed. Please try again.');
        }
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <button onClick={handlePayment} disabled={!scriptLoaded}>
      {scriptLoaded ? 'Pay Now' : 'Loading...'}
    </button>
  );
};

export default RazorpayButton;