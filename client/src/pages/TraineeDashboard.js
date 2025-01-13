import React from 'react';
import Assignments from './Assignments';
import { Box, Heading } from "@chakra-ui/react";

const TraineeDashboard = () => {
  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={4}>Trainee Dashboard</Heading>
      <Assignments />
      {/* You can add more functionalities related to the trainee here */}
    </Box>
  );
};

export default TraineeDashboard;
