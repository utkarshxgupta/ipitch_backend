import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  List,
  ListItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaClipboardCheck, FaUsers, FaChartLine, FaClock } from 'react-icons/fa';
import Assignments from './Assignments';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.700');

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
        <HStack justify="space-between" wrap="wrap">
          <Box>
            <Heading size="lg" mb={2}>Trainer Dashboard</Heading>
            <Text color="gray.500">Monitor and evaluate trainee progress</Text>
          </Box>
          <Button
            leftIcon={<Icon as={FaClipboardCheck} />}
            colorScheme="brand"
            onClick={() => navigate('/evaluations')}
          >
            View All Evaluations
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard 
            title="Pending Evaluations" 
            value="8" 
            icon={FaClock}
          />
          <StatCard 
            title="Evaluated Today" 
            value="12" 
            icon={FaClipboardCheck}
          />
          <StatCard 
            title="Active Trainees" 
            value="24" 
            icon={FaUsers}
          />
          <StatCard 
            title="Avg Rating Given" 
            value="4.2" 
            icon={FaChartLine}
          />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Box p={6} bg={bgColor} rounded="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Pending Evaluations</Heading>
            <List spacing={3}>
              {/* Pending evaluations list */}
              <ListItem p={4} borderWidth={1} borderRadius="md">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">Pitch Submission #123</Text>
                    <Text fontSize="sm" color="gray.500">From: John Doe</Text>
                  </VStack>
                  <Button size="sm" colorScheme="brand">
                    Evaluate
                  </Button>
                </HStack>
              </ListItem>
            </List>
          </Box>

          <Box p={6} bg={bgColor} rounded="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Recent Activity</Heading>
            <List spacing={3}>
              {/* Recent activity list */}
              <ListItem p={4} borderWidth={1} borderRadius="md">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Evaluated Pitch #456</Text>
                  <Text fontSize="sm" color="gray.500">2 hours ago</Text>
                </VStack>
              </ListItem>
            </List>
          </Box>
        </SimpleGrid>

        <Box p={6} bg={bgColor} rounded="lg" boxShadow="sm">
          <Heading size="md" mb={6}>Assigned Challenges</Heading>
          <Assignments />
        </Box>
      </VStack>
    </Container>
  );
};

export default TrainerDashboard;
