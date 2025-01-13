import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Box, Button, FormControl, FormLabel, Input, Heading, useToast } from "@chakra-ui/react";

const SubmissionForm = ({ challengeId }) => {
  const { token } = useContext(AuthContext);
  const [pitch, setPitch] = useState('');
const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/submissions',
        { challengeId, pitch },
        { headers: { 'x-auth-token': token } }
      );
      toast.success('Pitch submitted successfully!');
      setPitch('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit pitch');
    }
  };

  return (
    <Box as="form" onSubmit={onSubmit} p={4} borderWidth={1} borderRadius="lg">
      <Heading as="h2" size="lg" mb={4}>Submit Your Pitch</Heading>
      <FormControl mb={4}>
        <FormLabel>Pitch (Video URL/ID):</FormLabel>
        <Input 
          type="text" 
          value={pitch} 
          onChange={(e) => setPitch(e.target.value)} 
          required 
        />
      </FormControl>
      <Button type="submit" colorScheme="brand">Submit</Button>
    </Box>
  );
};

export default SubmissionForm;
