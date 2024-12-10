import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabaseClient';
import { auth } from '../firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// -------------------- Utility Functions -------------------- //
const getISTDate = (date) => {
  const istDate = new Date(date);
  // Convert to IST by adding 330 minutes (5.5 hours) to UTC
  istDate.setMinutes(istDate.getMinutes() + istDate.getTimezoneOffset() + 330);
  return istDate;
};

const getDefaultFromDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
};

const formatISTDateTime = (dateString, isEnd = false) => {
  const date = new Date(dateString);
  const istDate = getISTDate(date);
  if (isEnd) {
    istDate.setHours(23, 59, 59, 999);
  } else {
    istDate.setHours(0, 0, 0, 0);
  }
  return istDate.toISOString();
};

const formatDisplayDate = (dateString) => {
  const istDate = getISTDate(new Date(dateString));
  return istDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

// -------------------- Styled Components -------------------- //

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-weight: bold;
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #4285f4;
  }
`;

const DateDisplay = styled.span`
  font-size: 13px;
  color: #666;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  text-align: center;
  transition: box-shadow 0.2s ease;
  &:hover {
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }
`;

const MetricTitle = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: #202124;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #333;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 18px;
  color: #666;
`;

const ErrorState = styled.div`
  padding: 24px;
  text-align: center;
  color: #d32f2f;
  font-weight: 500;
`;

// -------------------- Component -------------------- //

const DoctorDashboard = () => {
  const [dateRange, setDateRange] = useState({
    from: getDefaultFromDate(),
    to: new Date().toISOString().split('T')[0]
  });

  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    feedback: [],
    loading: true,
    error: null
  });

  const hospitalId = auth.currentUser?.uid;

  useEffect(() => {
    if (!hospitalId) return;

    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));

        const fromDateTime = formatISTDateTime(dateRange.from);
        const toDateTime = formatISTDateTime(dateRange.to, true);

        const [appointmentsResponse, feedbackResponse] = await Promise.all([
          supabase
            .from('appointments')
            .select('appointment_id, appointment_time')
            .eq('hospital_id', hospitalId)
            .gte('appointment_time', fromDateTime)
            .lte('appointment_time', toDateTime)
            .order('appointment_time', { ascending: false }),
          
          supabase
            .from('feedback')
            .select('*')
            .eq('hospital_id', hospitalId)
            .gte('created_at', fromDateTime)
            .lte('created_at', toDateTime)
            .order('created_at', { ascending: false })
        ]);

        if (appointmentsResponse.error) {
          throw new Error(`Appointments error: ${appointmentsResponse.error.message}`);
        }
        if (feedbackResponse.error) {
          throw new Error(`Feedback error: ${feedbackResponse.error.message}`);
        }

        setDashboardData({
          appointments: appointmentsResponse.data || [],
          feedback: feedbackResponse.data || [],
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchDashboardData();
  }, [hospitalId, dateRange]);

  const metrics = useMemo(() => {
    const { feedback, appointments } = dashboardData;
    const totalReviews = feedback.length;
    const averageRating = totalReviews > 0 
      ? (feedback.reduce((acc, curr) => acc + (curr.number_of_stars || 0), 0) / totalReviews).toFixed(1)
      : '0.0';

    const fiveStarReviews = feedback.filter(f => f.number_of_stars === 5).length;

    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      rating: `${star}★`,
      count: feedback.filter(f => f.number_of_stars === star).length
    }));

    return {
      totalAppointments: appointments.length,
      totalReviews,
      averageRating,
      fiveStarReviews,
      ratingDistribution
    };
  }, [dashboardData]);

  if (!hospitalId) {
    return <ErrorState>Please log in to view the dashboard</ErrorState>;
  }

  if (dashboardData.loading) {
    return (
      <PageContainer>
        <LoadingState>Loading dashboard data...</LoadingState>
      </PageContainer>
    );
  }

  if (dashboardData.error) {
    return (
      <PageContainer>
        <ErrorState>Error loading dashboard: {dashboardData.error}</ErrorState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Date Filters */}
      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>From (IST):</FilterLabel>
          <DateInput
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          />
          <DateDisplay>{formatDisplayDate(dateRange.from)}</DateDisplay>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>To (IST):</FilterLabel>
          <DateInput
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          />
          <DateDisplay>{formatDisplayDate(dateRange.to)}</DateDisplay>
        </FilterGroup>
      </FiltersContainer>

      {/* Metrics */}
      <MetricsGrid>
        <MetricCard>
          <MetricTitle>Total Appointments</MetricTitle>
          <MetricValue>{metrics.totalAppointments}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>Total Reviews</MetricTitle>
          <MetricValue>{metrics.totalReviews}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>Average Rating</MetricTitle>
          <MetricValue>{metrics.averageRating}★</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>5-Star Reviews</MetricTitle>
          <MetricValue>{metrics.fiveStarReviews}</MetricValue>
        </MetricCard>
      </MetricsGrid>

      {/* Rating Distribution Chart */}
      <Card>
        <SectionTitle>Rating Distribution</SectionTitle>
        {metrics.totalReviews === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No reviews in the selected timeframe.
          </div>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart 
                data={metrics.ratingDistribution} 
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4285f4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default DoctorDashboard;
