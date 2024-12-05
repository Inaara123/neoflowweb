import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;

  @media (max-width: 600px) {
    margin: 10px;
    padding: 15px;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #202124;
  margin-bottom: 20px;
  text-align: center;
`;

const StarsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const Star = styled.span`
  font-size: 2rem;
  cursor: pointer;
  color: ${(props) => (props.selected ? "#ff9800" : "#d3d3d3")};
  transition: color 0.2s;
  &:hover {
    color: #ff9800;
  }
`;

const FeedbackBox = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  resize: none;
  margin-bottom: 20px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #ff9800;
  }
`;

const CountdownMessage = styled.div`
  margin-top: 10px;
  font-size: 1rem;
  color: #757575;
`;

const SuccessMessage = styled.div`
  text-align: center;
  color: #4CAF50;
  padding: 20px;
  border-radius: 8px;
  background-color: #E8F5E9;
  margin-bottom: 20px;
  width: 100%;
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: #3367d6;
  }
  &:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }
`;

const FeedbackForm = () => {
  const { placeId, hospitalId } = useParams();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [countdown, setCountdown] = useState(4);
  const [redirecting, setRedirecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (rating === 5 && redirecting && countdown > 0) {
      const interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (countdown === 0) {
      window.open(`https://search.google.com/local/writereview?placeid=${placeId}`, '_blank');
    }
  }, [countdown, redirecting, placeId, rating]);

  const handleStarClick = async (star) => {
    setRating(star);
    if (star === 5) {
      setRedirecting(true);
      try {
        await supabase.from('feedback').insert({
          hospital_id: hospitalId,
          number_of_stars: 5,
          feedback: ''
        });
      } catch (error) {
        console.error('Error submitting rating:', error);
      }
    } else {
      setRedirecting(false);
      setCountdown(4);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await supabase.from('feedback').insert({
        hospital_id: hospitalId,
        number_of_stars: rating,
        feedback: feedback
      });
      setIsSubmitted(true);
      setFeedback("");
      setRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Container>
        <SuccessMessage>
          <h2>Thank you for your feedback!</h2>
          <p>We appreciate you taking the time to share your experience with us.</p>
        </SuccessMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Your Feedback matters a lot to us</Title>
      <StarsContainer>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            selected={star <= (hoveredStar || rating)}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
          >
            ★
          </Star>
        ))}
      </StarsContainer>
      {rating > 0 && !redirecting && (
        <>
          <FeedbackBox
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Your experience matters to us! We're sorry it wasn't perfect. Share your feedback so we can make it right—and ensure it doesn't happen again!"
          />
          <SubmitButton 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </SubmitButton>
        </>
      )}
      {redirecting && rating === 5 && (
        <CountdownMessage>
          Thank you so much for your Trust in us! Please let the world know about your experience in {countdown} seconds...
        </CountdownMessage>
      )}
    </Container>
  );
};

export default FeedbackForm;