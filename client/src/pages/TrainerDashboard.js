import React from 'react';
import ChallengeForm from './ChallengeForm';
import { Box, Heading } from "@chakra-ui/react";

const TrainerDashboard = () => {
  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={4}>Trainer Dashboard</Heading>
      <ChallengeForm />
      {/* You can add more functionalities related to the trainer here */}
    </Box>
  );
};

export default TrainerDashboard;
