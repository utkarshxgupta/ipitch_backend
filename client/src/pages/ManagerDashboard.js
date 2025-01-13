import React from 'react';
import { Box, Heading, Button, VStack, HStack } from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import AssignmentList from './AssignmentList';

const ManagerDashboard = () => {
  const navigate = useNavigate();

  const handleCreateAssignment = () => {
    navigate('/assignments/create');
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between">
          <Heading as="h1" size="xl">Manager Dashboard</Heading>
          <Button colorScheme="brand" onClick={handleCreateAssignment}>
            Create Assignment
          </Button>
        </HStack>
        <Box>
          <AssignmentList />
        </Box>
      </VStack>
    </Box>
  );
};

export default ManagerDashboard;
