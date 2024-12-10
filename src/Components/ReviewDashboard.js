import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabaseClient'; // Adjust the import as needed
import { auth } from '../firebase';           // Adjust the import as needed
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// -------------------- Styled Components -------------------- //
const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  box-sizing: border-box;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #4285f4;
  }
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
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #333;
  text-align: left;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 18px;
  color: #666;
`;

// -------------------- Component -------------------- //

const DoctorDashboard = () => {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const [appointmentsCount, setAppointmentsCount] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);

  const hospitalId = auth.currentUser?.uid;

  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        // Fetch Appointments Count
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id')
          .eq('hospital_id', hospitalId)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);

        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError);
        }

        // Fetch Feedback
        const { data: feedback, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
          .eq('hospital_id', hospitalId)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);

        if (feedbackError) {
          console.error('Error fetching feedback:', feedbackError);
        }

        setAppointmentsCount(appointments?.length || 0);
        setFeedbackData(feedback || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hospitalId, fromDate, toDate]);

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading dashboard data...</LoadingState>
      </Container>
    );
  }

  // Metrics
  const totalReviews = feedbackData.length;
  const averageRating = totalReviews > 0 
    ? (feedbackData.reduce((acc, curr) => acc + curr.number_of_stars, 0) / totalReviews).toFixed(1)
    : 0;

  const fiveStarReviews = feedbackData.filter(f => f.number_of_stars === 5).length;

  // Rating distribution (1 to 5)
  const ratingDistribution = [1, 2, 3, 4, 5].map(star => {
    const count = feedbackData.filter(f => f.number_of_stars === star).length;
    return { rating: `${star}★`, count };
  });

  return (
    <Container>
      <FiltersContainer>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>From:</label>
          <DateInput
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>To:</label>
          <DateInput
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </FiltersContainer>

      <MetricsGrid>
        <MetricCard>
          <MetricTitle>Total Appointments</MetricTitle>
          <MetricValue>{appointmentsCount}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>Total Reviews</MetricTitle>
          <MetricValue>{totalReviews}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>Average Rating</MetricTitle>
          <MetricValue>{averageRating}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>5-Star Reviews</MetricTitle>
          <MetricValue>{fiveStarReviews}</MetricValue>
        </MetricCard>
      </MetricsGrid>

      <Card>
        <SectionTitle>Rating Distribution</SectionTitle>
        {totalReviews === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No reviews in the selected timeframe.
          </div>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={ratingDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
    </Container>
  );
};

export default DoctorDashboard;

// import React, { useState, useEffect } from 'react';
// import styled from 'styled-components';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { auth } from '../firebase';
// import { supabase } from '../supabaseClient';

// // Styled Components
// const DashboardContainer = styled.div`
//   padding: 24px;
//   max-width: 1200px;
//   margin: 0 auto;
//   font-family: Arial, sans-serif;
// `;

// const FiltersContainer = styled.div`
//   display: flex;
//   gap: 16px;
//   margin-bottom: 24px;
//   align-items: center;
//   flex-wrap: wrap;
//   @media (max-width: 768px) {
//     flex-direction: column;
//     align-items: stretch;
//   }
// `;

// const DateInput = styled.input`
//   padding: 8px 12px;
//   border: 1px solid #e0e0e0;
//   border-radius: 4px;
//   font-size: 14px;
//   &:focus {
//     outline: none;
//     border-color: #4285f4;
//   }
// `;

// const Select = styled.select`
//   padding: 8px 12px;
//   border: 1px solid #e0e0e0;
//   border-radius: 4px;
//   font-size: 14px;
//   background: white;
//   cursor: pointer;
// `;

// const MetricsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//   gap: 16px;
//   margin-bottom: 24px;
// `;

// const MetricCard = styled.div`
//   background: white;
//   padding: 20px;
//   border-radius: 8px;
//   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
// `;

// const MetricTitle = styled.div`
//   font-size: 14px;
//   color: #666;
//   margin-bottom: 8px;
// `;

// const MetricValue = styled.div`
//   font-size: 24px;
//   font-weight: bold;
//   color: ${props => props.color || '#202124'};
// `;

// const Card = styled.div`
//   background: white;
//   border-radius: 8px;
//   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//   margin-bottom: 24px;
//   padding: 20px;
// `;

// const ChartContainer = styled.div`
//   height: 300px;
//   width: 100%;
// `;

// const Table = styled.table`
//   width: 100%;
//   border-collapse: collapse;
// `;

// const Th = styled.th`
//   text-align: left;
//   padding: 12px;
//   border-bottom: 2px solid #e0e0e0;
//   cursor: pointer;
// `;

// const Td = styled.td`
//   padding: 12px;
//   border-bottom: 1px solid #e0e0e0;
// `;

// const RatingBadge = styled.span`
//   padding: 4px 8px;
//   border-radius: 12px;
//   font-size: 12px;
//   font-weight: 500;
//   background-color: ${props => props.rating <= 2 ? '#ffebee' : '#e8f5e9'};
//   color: ${props => props.rating <= 2 ? '#d32f2f' : '#2e7d32'};
// `;

// const LoadingState = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   min-height: 400px;
//   font-size: 18px;
//   color: #666;
// `;

// const ReviewDashboard = () => {
//   const [dateRange, setDateRange] = useState({
//     from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//     to: new Date().toISOString().split('T')[0]
//   });
//   const [feedbackData, setFeedbackData] = useState([]);
//   const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
//   const [filterRating, setFilterRating] = useState('all');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchFeedback = async () => {
//       try {
//         let query = supabase
//           .from('feedback')
//           .select('*')
//           .eq('hospital_id', auth.currentUser.uid)
//           .gte('created_at', dateRange.from)
//           .lte('created_at', dateRange.to);

//         if (filterRating !== 'all') {
//           query = query.eq('number_of_stars', parseInt(filterRating));
//         }

//         const { data } = await query;
//         setFeedbackData(data || []);
//       } catch (error) {
//         console.error('Error fetching feedback:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (auth.currentUser) {
//       fetchFeedback();
//     }
//   }, [dateRange, filterRating]);

//   const metrics = {
//     totalReviews: feedbackData.length,
//     averageRating: feedbackData.reduce((acc, curr) => acc + curr.number_of_stars, 0) / feedbackData.length || 0,
//     googleReviews: feedbackData.filter(d => d.number_of_stars === 5).length,
//     criticalReviews: feedbackData.filter(d => d.number_of_stars <= 2).length
//   };

//   const timeSeriesData = feedbackData.reduce((acc, curr) => {
//     const date = new Date(curr.created_at).toLocaleDateString();
//     if (!acc[date]) {
//       acc[date] = { date, avgRating: 0, count: 0 };
//     }
//     acc[date].avgRating = ((acc[date].avgRating * acc[date].count) + curr.number_of_stars) / (acc[date].count + 1);
//     acc[date].count += 1;
//     return acc;
//   }, {});

//   const handleSort = (key) => {
//     setSortConfig({
//       key,
//       direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
//     });
//   };

//   if (loading) return <LoadingState>Loading dashboard data...</LoadingState>;

//   return (
//     <DashboardContainer>
//       <FiltersContainer>
//         <DateInput
//           type="date"
//           value={dateRange.from}
//           onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
//         />
//         <DateInput
//           type="date"
//           value={dateRange.to}
//           onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
//         />
//         <Select
//           value={filterRating}
//           onChange={e => setFilterRating(e.target.value)}
//         >
//           <option value="all">All Ratings</option>
//           {[1, 2, 3, 4, 5].map(rating => (
//             <option key={rating} value={rating}>{rating} Stars</option>
//           ))}
//         </Select>
//       </FiltersContainer>

//       <MetricsGrid>
//         <MetricCard>
//           <MetricTitle>Total Reviews</MetricTitle>
//           <MetricValue>{metrics.totalReviews}</MetricValue>
//         </MetricCard>
//         <MetricCard>
//           <MetricTitle>Average Rating</MetricTitle>
//           <MetricValue>{metrics.averageRating.toFixed(1)}</MetricValue>
//         </MetricCard>
//         <MetricCard>
//           <MetricTitle>Google Reviews</MetricTitle>
//           <MetricValue>{metrics.googleReviews}</MetricValue>
//         </MetricCard>
//         <MetricCard>
//           <MetricTitle>Critical Reviews</MetricTitle>
//           <MetricValue color="#d32f2f">{metrics.criticalReviews}</MetricValue>
//         </MetricCard>
//       </MetricsGrid>

//       <Card>
//         <ChartContainer>
//           <ResponsiveContainer>
//             <LineChart data={Object.values(timeSeriesData)}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis domain={[0, 5]} />
//               <Tooltip />
//               <Legend />
//               <Line type="monotone" dataKey="avgRating" stroke="#4285f4" name="Average Rating" />
//               <Line type="monotone" dataKey="count" stroke="#34a853" name="Review Count" />
//             </LineChart>
//           </ResponsiveContainer>
//         </ChartContainer>
//       </Card>

//       <Card>
//         <Table>
//           <thead>
//             <tr>
//               <Th onClick={() => handleSort('created_at')}>Date</Th>
//               <Th onClick={() => handleSort('number_of_stars')}>Rating</Th>
//               <Th onClick={() => handleSort('feedback')}>Feedback</Th>
//             </tr>
//           </thead>
//           <tbody>
//             {feedbackData
//               .sort((a, b) => {
//                 const aValue = a[sortConfig.key];
//                 const bValue = b[sortConfig.key];
//                 return sortConfig.direction === 'asc' 
//                   ? aValue > bValue ? 1 : -1
//                   : aValue < bValue ? 1 : -1;
//               })
//               .map((feedback) => (
//                 <tr key={feedback.id}>
//                   <Td>{new Date(feedback.created_at).toLocaleDateString()}</Td>
//                   <Td>
//                     <RatingBadge rating={feedback.number_of_stars}>
//                       {feedback.number_of_stars} ★
//                     </RatingBadge>
//                   </Td>
//                   <Td>{feedback.feedback || 'Redirected to Google'}</Td>
//                 </tr>
//               ))}
//           </tbody>
//         </Table>
//       </Card>
//     </DashboardContainer>
//   );
// };

// export default ReviewDashboard;