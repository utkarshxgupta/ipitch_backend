import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  List,
  useColorModeValue,
  Skeleton,
  Spinner,
  Center,
  useToast
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { 
  FaTasks, 
  FaChartLine, 
  FaCheck, 
  FaClock, 
  FaCalendarAlt, 
  FaExclamationTriangle
} from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import AuthContext from '../context/authContext';
import axios from 'axios';
import CustomListItem from '../components/ListItem';

// Register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TraineeDashboard = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('brand.50', 'gray.600');
  const toast = useToast();
  
  // Colors for tab styling
  const activeTabBg = useColorModeValue("brand.500", "brand.200");
  const activeTabColor = useColorModeValue("white", "gray.800");
  const inactiveTabBg = useColorModeValue("gray.100", "gray.700");
  const tabBorderColor = useColorModeValue("gray.200", "gray.600");
  
  const [dashboardData, setDashboardData] = useState({
    activeAssignments: 0,
    completedAssignments: 0,
    averageScore: 0,
    hoursLogged: 0,
    improvementRate: 0,
    loading: true
  });
  
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch assignments data
        const assignmentsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/assignments/user`, {
          headers: { 'x-auth-token': token }
        });
        
        const assignmentsData = assignmentsRes.data;
        setAssignments(assignmentsData);
        setAssignmentsLoading(false);
        
        // Calculate dashboard metrics from assignments data
        const now = new Date();
        const active = assignmentsData.filter(a => 
          new Date(a.startDate) <= now && now <= new Date(a.endDate)
        ).length;
        
        const completed = 8; // This would come from submissions data in real implementation
        const averageScore = 85; // This would be calculated from real submissions
        const hoursLogged = 24.5; // This would come from practice logs
        
        // Set dashboard data
        setDashboardData({
          activeAssignments: active,
          completedAssignments: completed,
          averageScore: averageScore,
          hoursLogged: hoursLogged,
          improvementRate: 12,
          loading: false
        });
        
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to fetch dashboard data.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setAssignmentsLoading(false);
        setDashboardData(prev => ({...prev, loading: false}));
      }
    };

    fetchAllData();
  }, [token, toast]);

  const StatCard = ({ title, value, icon, subtitle, trend }) => (
    <Box p={6} bg={bgColor} rounded="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
      <Stat>
        <VStack align="start" spacing={2}>
          <HStack spacing={4}>
            <Icon as={icon} w={6} h={6} color="brand.500" />
            <StatLabel fontSize="lg">{title}</StatLabel>
          </HStack>
          <StatNumber fontSize="3xl">{value}</StatNumber>
          {subtitle && (
            <HStack>
              {trend && (
                <StatArrow 
                  type={trend > 0 ? "increase" : "decrease"} 
                  color={trend > 0 ? "green.500" : "red.500"} 
                />
              )}
              <Text fontSize="sm" color="gray.500">
                {subtitle}
              </Text>
            </HStack>
          )}
        </VStack>
      </Stat>
    </Box>
  );

  // Calculate upcoming deadlines from assignments
  const getUpcomingDeadlines = () => {
    const now = new Date();
    return assignments
      .filter(assignment => new Date(assignment.endDate) >= now)
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
      .slice(0, 3)
      .map(assignment => {
        const daysLeft = Math.ceil((new Date(assignment.endDate) - now) / (1000 * 60 * 60 * 24));
        return {
          id: assignment._id,
          name: assignment.name,
          dueDate: assignment.endDate,
          daysLeft
        };
      });
  };

  // Create performance chart data from assignments
  // In a real implementation this would use actual submission scores
  const getPerformanceChartData = () => {
    // For demo purposes - would be replaced with actual submission scores
    const demoScores = {
      "Sales Pitch Challenge": 78,
      "Product Demo Pitch": 82,
      "Elevator Pitch": 85,
      "Introduction Pitch": 92,
      "Persuasive Pitch": 81
    };
    
    // Sort assignments by end date
    const sortedAssignments = [...assignments]
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
      .slice(0, 6); // Limit to 6 for readability
    
    return {
      labels: sortedAssignments.map(a => a.name),
      datasets: [
        {
          label: 'Assignment Score',
          data: sortedAssignments.map(a => demoScores[a.name] || Math.floor(Math.random() * 25) + 70),
          backgroundColor: 'rgba(79, 209, 197, 0.6)',
          borderColor: 'rgba(79, 209, 197, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          display: true,
        },
        title: {
          display: true,
          text: 'Score'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
    },
    maintainAspectRatio: false,
  };

  const isActive = (startDate, endDate) => {
    const now = new Date();
    return new Date(startDate) <= now && now <= new Date(endDate);
  };
  
  if (dashboardData.loading || assignmentsLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Skeleton height="60px" width="300px" />
          
          <Skeleton height="300px" borderRadius="lg" />
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} height="140px" borderRadius="lg" />
            ))}
          </SimpleGrid>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <Skeleton height="300px" borderRadius="lg" />
            <Skeleton height="300px" borderRadius="lg" />
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }
  
  // Sort and separate assignments into active and inactive
  const activeAssignments = assignments
    .filter(assignment => isActive(assignment.startDate, assignment.endDate))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
  const inactiveAssignments = assignments
    .filter(assignment => !isActive(assignment.startDate, assignment.endDate))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const upcomingDeadlines = getUpcomingDeadlines();
  const chartData = getPerformanceChartData();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Trainee Dashboard</Heading>
          <Text color="gray.500">Track your assignments and progress</Text>
        </Box>

        {/* My Assignments - Now as the main section */}
        <Box p={6} bg={bgColor} rounded="lg" shadow="sm" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={6}>My Assignments</Heading>
          
          <Tabs variant="unstyled" animation="ease-in-out" isLazy>
            <Center mb={6}>
              <TabList 
                borderRadius="full" 
                bg={inactiveTabBg} 
                p={1.5}
                border="1px" 
                borderColor={tabBorderColor}
                width={{ base: "80%", sm: "70%", md: "50%", lg: "35%" }}
                maxWidth="320px"
                overflow="hidden"
                boxShadow="sm"
              >
                <Tab 
                  _selected={{ 
                    bg: activeTabBg, 
                    color: activeTabColor 
                  }}
                  borderRadius="full"
                  fontWeight="semibold"
                  py={2}
                  px={5}
                  fontSize={{ base: "sm", md: "md" }}
                  flex={1}
                  transition="all 0.3s"
                >
                  Active
                </Tab>
                <Tab 
                  _selected={{ 
                    bg: activeTabBg, 
                    color: activeTabColor 
                  }}
                  borderRadius="full"
                  fontWeight="semibold"
                  py={2}
                  px={5}
                  fontSize={{ base: "sm", md: "md" }}
                  flex={1}
                  transition="all 0.3s"
                >
                  Inactive
                </Tab>
              </TabList>
            </Center>
            
            <TabPanels>
              {/* Active Assignments Panel */}
              <TabPanel p={0}>
                {activeAssignments.length > 0 ? (
                  <List spacing={3}>
                    {activeAssignments.map(assignment => (
                      <CustomListItem
                        key={assignment._id}
                        id={assignment.id || assignment._id}
                        heading={assignment.name}
                        subheading={"Due by " + new Date(assignment.endDate).toLocaleDateString()}
                        badgeText="Active"
                        badgeColor="green"
                        link={`/assignments/${assignment._id}/new`}
                      />
                    ))}
                  </List>
                ) : (
                  <Box py={10} textAlign="center">
                    <Text color="gray.500">No active assignments</Text>
                  </Box>
                )}
              </TabPanel>
              
              {/* Inactive Assignments Panel */}
              <TabPanel p={0}>
                {inactiveAssignments.length > 0 ? (
                  <List spacing={3}>
                    {inactiveAssignments.map(assignment => (
                      <CustomListItem
                        key={assignment._id}
                        id={assignment.id || assignment._id}
                        heading={assignment.name}
                        subheading={"Ended on " + new Date(assignment.endDate).toLocaleDateString()}
                        badgeText="Inactive"
                        badgeColor="red"
                        link={`/assignments/${assignment._id}/new`}
                      />
                    ))}
                  </List>
                ) : (
                  <Box py={10} textAlign="center">
                    <Text color="gray.500">No inactive assignments</Text>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* Top Stats Row */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Active Assignments"
            value={dashboardData.activeAssignments}
            icon={FaTasks}
            subtitle={`${Math.min(dashboardData.activeAssignments, 2)} due this week`}
          />
          <StatCard
            title="Completed"
            value={dashboardData.completedAssignments}
            icon={FaCheck}
            subtitle="Last completed 2 days ago"
            trend={3}
          />
          <StatCard
            title="Average Score"
            value={`${dashboardData.averageScore}%`}
            icon={FaChartLine}
            subtitle="Last 30 days"
            trend={dashboardData.improvementRate}
          />
          <StatCard
            title="Hours Practiced"
            value={dashboardData.hoursLogged.toFixed(1)}
            icon={FaClock}
            subtitle="This month"
          />
        </SimpleGrid>

        {/* Middle Row - Performance Chart and Upcoming Deadlines */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Performance Chart - Modified to show scores by assignment name */}
          <Box p={6} bg={bgColor} rounded="lg" shadow="sm" borderWidth="1px" borderColor={borderColor}>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Assignment Performance</Heading>
              <Box h="250px">
                <Bar data={chartData} options={chartOptions} />
              </Box>
            </VStack>
          </Box>

          {/* Upcoming Deadlines - Now calculated from assignment end dates */}
          <Box p={6} bg={bgColor} rounded="lg" shadow="sm" borderWidth="1px" borderColor={borderColor}>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Heading size="md">Upcoming Deadlines</Heading>
                <Icon as={FaCalendarAlt} color="brand.500" />
              </HStack>
              
              {upcomingDeadlines.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={4}>No upcoming deadlines</Text>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Assignment</Th>
                      <Th isNumeric>Due In</Th>
                      <Th width="80px"></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {upcomingDeadlines.map((deadline) => (
                      <Tr 
                        key={deadline.id}
                        bg={deadline.daysLeft <= 3 ? highlightColor : undefined}
                      >
                        <Td fontWeight={deadline.daysLeft <= 3 ? "medium" : "normal"}>
                          {deadline.name}
                        </Td>
                        <Td isNumeric>
                          <HStack justify="flex-end">
                            {deadline.daysLeft <= 3 && (
                              <Icon as={FaExclamationTriangle} color="orange.500" />
                            )}
                            <Text>{deadline.daysLeft} days</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Button 
                            size="xs" 
                            colorScheme="brand" 
                            onClick={() => navigate(`/assignments/${deadline.id}/new`)}
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default TraineeDashboard;
