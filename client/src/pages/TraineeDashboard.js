import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  useColorModeValue
} from "@chakra-ui/react";
import { FaTasks, FaChartLine, FaCheck, FaClock } from 'react-icons/fa';
import Assignments from './Assignments';

const TraineeDashboard = () => {
  const bgColor = useColorModeValue('white', 'gray.700');

  const StatCard = ({ title, value, icon, subtitle }) => (
    <Box p={6} bg={bgColor} rounded="lg" boxShadow="sm">
      <Stat>
        <VStack align="start" spacing={2}>
          <HStack spacing={4}>
            <Icon as={icon} w={6} h={6} color="brand.500" />
            <StatLabel fontSize="lg">{title}</StatLabel>
          </HStack>
          <StatNumber fontSize="3xl">{value}</StatNumber>
          {subtitle && (
            <Text fontSize="sm" color="gray.500">
              {subtitle}
            </Text>
          )}
        </VStack>
      </Stat>
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Trainee Dashboard</Heading>
          <Text color="gray.500">Track your assignments and progress</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Active Assignments"
            value="3"
            icon={FaTasks}
            subtitle="2 due this week"
          />
          <StatCard
            title="Completed"
            value="8"
            icon={FaCheck}
            subtitle="Last completed 2 days ago"
          />
          <StatCard
            title="Average Score"
            value="85%"
            icon={FaChartLine}
            subtitle="Last 30 days"
          />
          <StatCard
            title="Hours Practiced"
            value="24"
            icon={FaClock}
            subtitle="This month"
          />
        </SimpleGrid>

        <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">Current Progress</Heading>
              <Text color="brand.500" fontWeight="bold">75% Complete</Text>
            </HStack>
            <Progress value={75} colorScheme="brand" borderRadius="full" size="sm" />
          </VStack>
        </Box>

        <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
          <Heading size="md" mb={6}>My Assignments</Heading>
          <Assignments />
        </Box>
      </VStack>
    </Container>
  );
};

export default TraineeDashboard;
