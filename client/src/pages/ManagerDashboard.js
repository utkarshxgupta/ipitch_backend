import React from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  VStack, 
  HStack,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  useColorModeValue,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import AssignmentList from './AssignmentList';
import { FaClipboardList, FaUserCheck, FaTasks, FaChartLine } from 'react-icons/fa';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.700');

  const handleCreateAssignment = () => {
    navigate('/assignments/create');
  };

  const StatCard = ({ title, value, icon }) => (
    <Box p={6} bg={bgColor} rounded="lg" boxShadow="sm">
      <Stat>
        <VStack spacing={2} align="start">
          <HStack spacing={4}>
            <Icon as={icon} w={6} h={6} color="brand.500" />
            <StatLabel fontSize="lg">{title}</StatLabel>
          </HStack>
          <StatNumber fontSize="3xl">{value}</StatNumber>
        </VStack>
      </Stat>
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justifyContent="space-between" wrap="wrap" spacing={4}>
          <Box>
            <Heading size="lg" mb={2}>Manager Dashboard</Heading>
            <Text color="gray.500">Manage assignments and view progress</Text>
          </Box>
          <HStack spacing={4}>
            <Button
              leftIcon={<Icon as={FaClipboardList} />}
              colorScheme="brand"
              onClick={handleCreateAssignment}
            >
              Create Assignment
            </Button>
            <Button
              leftIcon={<Icon as={FaChartLine} />}
              variant="outline"
              colorScheme="brand"
              onClick={() => navigate('/submissions')}
            >
              View Submissions
            </Button>
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard 
            title="Active Assignments" 
            value="12" 
            icon={FaTasks}
          />
          <StatCard 
            title="Total Submissions" 
            value="48" 
            icon={FaClipboardList}
          />
          <StatCard 
            title="Active Trainees" 
            value="24" 
            icon={FaUserCheck}
          />
          <StatCard 
            title="Completion Rate" 
            value="85%" 
            icon={FaChartLine}
          />
        </SimpleGrid>

        <Box 
          bg={bgColor} 
          p={6} 
          rounded="lg" 
          boxShadow="sm"
        >
          <Heading size="md" mb={6}>Assignment List</Heading>
          <AssignmentList />
        </Box>
      </VStack>
    </Container>
  );
};

export default ManagerDashboard;
