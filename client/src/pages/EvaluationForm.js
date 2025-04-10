import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Box, Button, FormControl, FormLabel, Input, Textarea, Heading, useToast } from "@chakra-ui/react";

const EvaluationForm = ({ submissionId, onEvaluation }) => {
  const { token } = useContext(AuthContext);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/submissions/${submissionId}/evaluate`,
        { score, feedback },
        { headers: { 'x-auth-token': token } }
      );
      toast({
        title: 'Evaluation submitted successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onEvaluation(res.data); // Pass updated data back to parent
      setScore('');
      setFeedback('');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Failed to submit evaluation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Evaluation Form</Heading>
      <form onSubmit={onSubmit}>
        <FormControl mb={4}>
          <FormLabel>Score</FormLabel>
          <Input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Feedback</FormLabel>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </FormControl>
        <Button type="submit" colorScheme="brand">Submit Evaluation</Button>
      </form>
    </Box>
  );
};

export default EvaluationForm;
