// SubscriptionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const SubscriptionContext = createContext({
  planName: null,
  loading: true,
});

export function SubscriptionProvider({ children }) {
  const [planName, setPlanName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('plan_name')
          .eq('hospital_id', user.uid)
          .single();

        if (error) {
          console.error('Error fetching subscription:', error);
          setPlanName(null);
        } else {
          console.log("Subscription plan name:", data.plan_name);
          setPlanName(data.plan_name);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setPlanName(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  const value = {
    planName,
    loading,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}