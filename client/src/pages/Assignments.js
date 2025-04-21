import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { 
  Box, 
  Heading, 
  Text, 
  List, 
  Spinner, 
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Center
} from "@chakra-ui/react";
import CustomListItem from '../components/ListItem';

const Assignments = () => {
  const { token } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Colors for tab styling
  const activeTabBg = useColorModeValue("brand.500", "brand.200");
  const activeTabColor = useColorModeValue("white", "gray.800");
  const inactiveTabBg = useColorModeValue("gray.100", "gray.700");
  const tabBorderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/assignments/user`, {
          headers: { 'x-auth-token': token }
        });
        setAssignments(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to fetch assignments.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [token, toast]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
      <Spinner size="xl" thickness="4px" color="brand.500" />
    </Box>;
  }

  if (!assignments.length) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.500">No assignments found</Text>
      </Box>
    );
  }

  const isActive = (startDate, endDate) => {
    const now = new Date();
    return new Date(startDate) <= now && now <= new Date(endDate);
  };
  
  // Sort and separate assignments into active and inactive
  const activeAssignments = assignments
    .filter(assignment => isActive(assignment.startDate, assignment.endDate))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
  const inactiveAssignments = assignments
    .filter(assignment => !isActive(assignment.startDate, assignment.endDate))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <Box>
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
                    subheading={"Created on " + new Date(assignment.createdAt).toLocaleDateString()}
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
                    subheading={"Created on " + new Date(assignment.createdAt).toLocaleDateString()}
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
  );
};

export default Assignments;
