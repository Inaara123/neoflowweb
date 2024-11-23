import React from 'react';
import styled from 'styled-components';
import { Info, ImageIcon, ArrowRight, ExternalLink } from 'lucide-react';

const GuidanceContainer = styled.div`
  padding: 16px;
  margin-bottom: 24px;
  background-color: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  color: #1E40AF;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const Title = styled.span`
  font-weight: 500;
  font-size: 16px;
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GuidelineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SecondaryText = styled.div`
  font-size: 14px;
  color: #3B82F6;
  margin-top: 4px;
`;

const StyledLink = styled.a`
  color: #1E40AF;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: #1E3A8A;
  }
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  color: currentColor;
`;

const UploadGuidance = () => {
  return (
    <GuidanceContainer>
      <HeaderSection>
        <IconWrapper>
          <Info size={20} />
        </IconWrapper>
        <Title>Image Upload Guidelines</Title>
      </HeaderSection>
      
      <ContentSection>
        <GuidelineRow>
          <IconWrapper>
            <ImageIcon size={16} />
          </IconWrapper>
          <span>Please upload images in landscape orientation for optimal TV display</span>
        </GuidelineRow>

        <SecondaryText>
          Need to adjust your image? Visit{' '}
          <StyledLink 
            href="https://resizepixel.com" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            ResizePixel.com
            <IconWrapper>
              <ExternalLink size={12} />
            </IconWrapper>
          </StyledLink>
          {' '}to convert or resize your images for free.
        </SecondaryText>
      </ContentSection>
    </GuidanceContainer>
  );
};

export default UploadGuidance;