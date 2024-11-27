import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { auth } from '../firebase';

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 15px;
  background-color: #3865ad;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    background-color: #2d5293;
  }
`;
// Styled Components
const Container = styled.div`
  padding: 20px;
  padding-top: 60px; /* Add extra padding to account for back button */
  font-family: Arial, sans-serif;
  position: relative;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const AddButton = styled.button`
  display: block;
  padding: 10px 20px;
  background-color: #3865ad;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #45a049;
    transform: scale(1.05);
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
`;

const Card = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CardInfo = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #333;
`;

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666;
`;

const ActionButton = styled.button`
  padding: 8px 15px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 10px;
  background-color: ${props => props.delete ? '#ff4d4d' : '#3865ad'};

  &:hover {
    transform: scale(1.1);
  }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  position: relative;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 300px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

const Select = styled.select`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

const SubmitButton = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #45a049;
  }
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 15px;
`;

const DiscoverySettings = () => {
    const [mainSources, setMainSources] = useState([]);
    const [partnerSources, setPartnerSources] = useState([]);
    const [showAddSource, setShowAddSource] = useState(false);
    const [showAddPartner, setShowAddPartner] = useState(false);
    const [newSource, setNewSource] = useState('');
    const [newPartner, setNewPartner] = useState({ name: '', specialty: '' });
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      fetchDiscoverySettings();
    }, []);
    const handleBack = () => {
        window.history.back();
    };
  
    const fetchDiscoverySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('hospitals')
          .select('discovery_settings')
          .eq('hospital_id', auth.currentUser.uid)
          .single();
  
        if (data?.discovery_settings) {
          setMainSources(data.discovery_settings.main_sources);
          setPartnerSources(data.discovery_settings.partner_sources);
        } else {
          setMainSources(['Friends & Family', 'Google', 'Facebook', 'Instagram', 'Others']);
          setPartnerSources([]);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
  
    const saveSettings = async (updatedMainSources = mainSources, updatedPartnerSources = partnerSources) => {
      try {
        const { error } = await supabase
          .from('hospitals')
          .update({
            discovery_settings: {
              main_sources: updatedMainSources,
              partner_sources: updatedPartnerSources
            }
          })
          .eq('hospital_id', auth.currentUser.uid);
  
        if (error) throw error;
        setMainSources(updatedMainSources);
        setPartnerSources(updatedPartnerSources);
        toast.success('Settings saved successfully');
      } catch (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save settings');
      }
    };
  
    const handleAddSource = async () => {
      if (!newSource.trim()) {
        toast.error('Please enter a source name');
        return;
      }
      const updatedSources = [...mainSources, newSource.trim()];
      await saveSettings(updatedSources, partnerSources);
      setNewSource('');
      setShowAddSource(false);
    };
  
    const handleAddPartner = async () => {
      if (!newPartner.name.trim() || !newPartner.specialty.trim()) {
        toast.error('Please fill all partner details');
        return;
      }
      const updatedPartners = [...partnerSources, newPartner];
      await saveSettings(mainSources, updatedPartners);
      setNewPartner({ name: '', specialty: '' });
      setShowAddPartner(false);
    };
  
    const handleDeleteSource = async (index) => {
      const updatedSources = mainSources.filter((_, i) => i !== index);
      await saveSettings(updatedSources, partnerSources);
    };
  
    const handleDeletePartner = async (index) => {
      const updatedPartners = partnerSources.filter((_, i) => i !== index);
      await saveSettings(mainSources, updatedPartners);
    };


  if (isLoading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container>
            <BackButton onClick={handleBack}>
                ← Back
            </BackButton>
      <ButtonContainer>
        <AddButton onClick={() => setShowAddSource(true)}>
          Add Source
        </AddButton>
        <AddButton onClick={() => setShowAddPartner(true)}>
          Add Referral Partner
        </AddButton>
      </ButtonContainer>

      <Section>
        <SectionTitle>Discovery Sources</SectionTitle>
        {mainSources.map((source, index) => (
          <Card key={index}>
            <CardInfo>
              <CardTitle>{source}</CardTitle>
            </CardInfo>
            <ActionButton delete onClick={() => handleDeleteSource(index)}>
              Delete
            </ActionButton>
          </Card>
        ))}
      </Section>

      <Section>
        <SectionTitle>Referral Partners</SectionTitle>
        {partnerSources.map((partner, index) => (
          <Card key={index}>
            <CardInfo>
              <CardTitle>{partner.name}</CardTitle>
              <CardSubtitle>{partner.specialty}</CardSubtitle>
            </CardInfo>
            <ActionButton delete onClick={() => handleDeletePartner(index)}>
              Delete
            </ActionButton>
          </Card>
        ))}
      </Section>

      {showAddSource && (
        <PopupOverlay>
          <PopupContent>
            <CloseButton onClick={() => setShowAddSource(false)}>X</CloseButton>
            <Form onSubmit={(e) => { e.preventDefault(); handleAddSource(); }}>
              <h3>Add New Source</h3>
              <Input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Enter source name"
                required
              />
              <SubmitButton type="submit">Add Source</SubmitButton>
            </Form>
          </PopupContent>
        </PopupOverlay>
      )}

      {showAddPartner && (
        <PopupOverlay>
          <PopupContent>
            <CloseButton onClick={() => setShowAddPartner(false)}>X</CloseButton>
            <Form onSubmit={(e) => { e.preventDefault(); handleAddPartner(); }}>
              <h3>Add Referral Partner</h3>
              <Input
                type="text"
                value={newPartner.name}
                onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                placeholder="Partner name"
                required
              />
              <Input
                type="text"
                value={newPartner.specialty}
                onChange={(e) => setNewPartner({ ...newPartner, specialty: e.target.value })}
                placeholder="Specialty"
                required
              />
              <SubmitButton type="submit">Add Partner</SubmitButton>
            </Form>
          </PopupContent>
        </PopupOverlay>
      )}
    </Container>
  );
};

export default DiscoverySettings;