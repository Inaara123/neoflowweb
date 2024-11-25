import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInMinutes } from 'date-fns';
import { supabase } from '../supabaseClient';
import { auth } from '../firebase';
import { useQueue } from '../QueueContext';
import { toast,Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import { Calendar, Clock, MapPin, User, Users, Share2, BookOpen, ArrowRight, X } from 'lucide-react';


const Container = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 20px;
  @media (min-width: 768px) {
    padding: 40px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  @media (min-width: 768px) {
    font-size: 32px;
  }
`;

const SubTitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const IconWrapper = styled.div`
  background-color: #eff6ff;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 20px;
    height: 20px;
    color: #3b82f6;
  }
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardLabel = styled.p`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
`;

const CardValue = styled.p`
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
`;

const NotesSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const NotesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const NotesTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#3b82f6' : 'white'};
  color: ${props => props.primary ? 'white' : '#3b82f6'};
  border: 1px solid ${props => props.primary ? '#3b82f6' : '#e2e8f0'};
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.primary ? '#2563eb' : '#f8fafc'};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;

  @media (min-width: 768px) {
    width: 500px;
  }
`;

const TimelineEvent = styled.div`
  position: relative;
  padding-bottom: 24px;

  &:before {
    content: '';
    position: absolute;
    left: 16px;
    top: 32px;
    bottom: 0;
    width: 2px;
    background-color: #e2e8f0;
  }

  &:last-child:before {
    display: none;
  }
`;

const TimelineEventContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const TimelineIconWrapper = styled.div`
  background-color: #eff6ff;
  padding: 8px;
  border-radius: 50%;
  z-index: 1;

  svg {
    width: 16px;
    height: 16px;
    color: #3b82f6;
  }
`;

const TimelineDetails = styled.div`
  flex: 1;
`;

const TimelineText = styled.p`
  font-size: 14px;
  color: #64748b;

  span {
    color: #1e293b;
    font-weight: 500;
  }
`;

const TimelineDate = styled.p`
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 200px auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #ef4444;
`;


const PatientDetails = () => {
    const navigate = useNavigate();
    const { doctorId } = useParams();  // Now only getting doctorId from URL
    const { data: queueData } = useQueue();
    const [patientData, setPatientData] = useState(null);
    const [visitHistory, setVisitHistory] = useState([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    // Get current patient from queue data
    const getCurrentPatient = useCallback(() => {
      if (!queueData || !doctorId) return null;
      return queueData.find(patient => 
        patient.docid === doctorId && 
        patient.waitno === 0
      );
    }, [queueData, doctorId]);
    
  
    const fetchPatientDetails = async (currentAppointmentId) => {
      try {
        setLoading(true);
        setError(null);
        const hospitalId = auth.currentUser.uid;
  
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            *,
            patients (*),
            doctors (name)
          `)
          .eq('appointment_id', currentAppointmentId)
          .single();
  
        if (appointmentError) throw appointmentError;
  
        if (appointmentData) {
          setPatientData(appointmentData);
          setReasonForVisit(appointmentData.reason_for_visit || '');
  
          const { data: historyData } = await supabase
            .from('appointments')
            .select(`
              appointment_time,
              doctors (name)
            `)
            .eq('patient_id', appointmentData.patient_id)
            .eq('hospital_id', hospitalId)
            .order('appointment_time', { ascending: false });
  
          setVisitHistory(historyData || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load patient details');
      } finally {
        setLoading(false);
      }
    };
  
    // Effect to handle queue updates
    useEffect(() => {
      const currentPatient = getCurrentPatient();
      
      if (!currentPatient) {
        // No current patient for this doctor
        setPatientData({
          patients: {
            name: 'No Patient',
            address: '-',
            distance_travelled: '-',
            duration_travelled: '-',
            how_did_you_get_to_know_us: '-'
          },
          doctors: { name: 'No Patient' },
          appointment_time: new Date(),
          appointment_type: '-',
          reason_for_visit: ''
        });
        setVisitHistory([]);
        setLoading(false);
        return;
      }
  
      // Fetch details using the appointment_id from queue data
      fetchPatientDetails(currentPatient.appointment_id);
    }, [queueData, doctorId, getCurrentPatient]);
  
    const updateReasonForVisit = async () => {
      const currentPatient = getCurrentPatient();
      if (!currentPatient || patientData?.patients?.name === 'No Patient') return;
  
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ reason_for_visit: reasonForVisit })
          .eq('appointment_id', currentPatient.appointment_id);
          toast.success('Reason for visit updated successfully');

  
        if (error) throw error;
      } catch (error) {
        toast.error('Failed to update reason for visit');

        console.error('Error updating reason:', error);
      }
    };
  
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage>{error}</ErrorMessage>;
    if (!patientData) return null;




  
    const waitTime = patientData.consultation_start_time 
    ? differenceInMinutes(
        new Date(patientData.consultation_start_time),
        new Date(patientData.appointment_time)
      )
    : differenceInMinutes(
        new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })),
        new Date(patientData.appointment_time)
      );
  
    const formatWaitTime = (minutes) => {
      if (minutes < 60) return `${minutes} minutes`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };
  
    const renderPatientCard = (title, value, Icon) => (
      <Card>
        <IconWrapper>
          <Icon />
        </IconWrapper>
        <CardContent>
          <CardLabel>{title}</CardLabel>
          <CardValue>{value || '-'}</CardValue>
        </CardContent>
      </Card>
    );
  
    const isNoPatient = patientData.patients.name === 'No Patient';
    const currentPatient = getCurrentPatient();


  
    return (
      <Container>
        <Toaster/>
        <PageHeader>
          <Title>Patient Details</Title>
          <SubTitle>
            {isNoPatient ? 'No Current Patient' : `Appointment ID: ${currentPatient?.appointment_id}`}
          </SubTitle>
        </PageHeader>
  
        <CardGrid>
          {renderPatientCard("Patient Name", patientData.patients.name, User)}
          {renderPatientCard("Doctor Name", patientData.doctors.name, Users)}
          
          {!isNoPatient && (
            <>
              {renderPatientCard("Location", patientData.patients.address, MapPin)}
              {renderPatientCard(
                "Distance Travelled", 
                patientData.patients.distance_travelled 
                  ? `${patientData.patients.distance_travelled} km` 
                  : '-', 
                ArrowRight
              )}
              {renderPatientCard(
                "Time Travelled", 
                patientData.patients.duration_travelled, 
                Clock
              )}
              {renderPatientCard(
                "Visit Time", 
                format(new Date(patientData.appointment_time), 'h:mm a'), 
                Clock
              )}
              {renderPatientCard("Wait Time", formatWaitTime(waitTime), Clock)}
              {renderPatientCard(
                "Discovery Source", 
                patientData.patients.how_did_you_get_to_know_us, 
                Share2
              )}
              {renderPatientCard("Booking Type", patientData.appointment_type, BookOpen)}
            </>
          )}
        </CardGrid>
  
        {!isNoPatient && (
          <>
        <NotesSection>
          <NotesHeader>
            <NotesTitle>Update Reason for Visit for accurate Analytics</NotesTitle>
            <Button primary onClick={updateReasonForVisit}>
              Update Reason for Visit
            </Button>
          </NotesHeader>
          <TextArea
            value={reasonForVisit}
            onChange={(e) => setReasonForVisit(e.target.value)}
            placeholder="Enter reason for visit..."
          />
        </NotesSection>
  
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsHistoryOpen(true)}>
                <Calendar size={16} />
                View Visit History
              </Button>
            </div>
  
            {isHistoryOpen && (
              <Modal onClick={() => setIsHistoryOpen(false)}>
                <ModalContent onClick={e => e.stopPropagation()}>
                  <NotesHeader>
                    <NotesTitle>Visit History</NotesTitle>
                    <Button onClick={() => setIsHistoryOpen(false)}>
                      <X size={16} />
                    </Button>
                  </NotesHeader>
                  {visitHistory.map((visit, index) => (
                    <TimelineEvent key={index}>
                      <TimelineEventContent>
                        <TimelineIconWrapper>
                          <Calendar />
                        </TimelineIconWrapper>
                        <TimelineDetails>
                          <TimelineText>
                            Visit with <span>{visit.doctors.name}</span>
                          </TimelineText>
                          <TimelineDate>
                            {format(new Date(visit.appointment_time), 'MMM d, yyyy')}
                          </TimelineDate>
                        </TimelineDetails>
                      </TimelineEventContent>
                    </TimelineEvent>
                  ))}
                </ModalContent>
              </Modal>
            )}
          </>
        )}
      </Container>
    );
  };
  
  export default PatientDetails;