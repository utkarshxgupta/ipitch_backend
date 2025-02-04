import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Badge,
  List,
  ListItem,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  useColorModeValue,
  Icon,
  Button,
} from "@chakra-ui/react";
import { FaCalendar, FaUser, FaTasks, FaChevronRight } from 'react-icons/fa';
import MySubmissions from "./MySubmissions";

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/assignments/${id}`,
          {
            headers: { "x-auth-token": localStorage.getItem("token") },
          }
        );
        setAssignment(res.data);
      } catch (err) {
        setError(err.response ? err.response.data.msg : "Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  if (loading) return <Spinner size="xl" />;
  if (error)
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );

  const isActive =
    new Date() >= new Date(assignment.startDate) &&
    new Date() <= new Date(assignment.endDate);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between" wrap="wrap">
              <Heading>{assignment.name}</Heading>
              <Badge 
                colorScheme={isActive ? "green" : "red"}
                p={2}
                borderRadius="full"
                fontSize="sm"
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </HStack>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              <HStack>
                <Icon as={FaCalendar} color="brand.500" />
                <VStack align="start" spacing={0}>
                  <Text color="gray.500">Start Date</Text>
                  <Text fontWeight="medium">
                    {new Date(assignment.startDate).toLocaleDateString()}
                  </Text>
                </VStack>
              </HStack>

              <HStack>
                <Icon as={FaCalendar} color="brand.500" />
                <VStack align="start" spacing={0}>
                  <Text color="gray.500">End Date</Text>
                  <Text fontWeight="medium">
                    {new Date(assignment.endDate).toLocaleDateString()}
                  </Text>
                </VStack>
              </HStack>
            </Grid>

            <HStack>
              <Icon as={FaUser} color="brand.500" />
              <Text>Created by: {assignment.createdBy.name}</Text>
            </HStack>
          </VStack>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          <GridItem>
            <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Challenges</Heading>
                <Icon as={FaTasks} color="brand.500" />
              </HStack>
              <List spacing={3}>
                {assignment.challenges.map((challenge) => (
                  <ListItem
                    key={challenge._id}
                    p={4}
                    borderWidth={1}
                    borderColor={borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => navigate(`/challenges/${challenge._id}`, { 
                      state: { 
                        assignmentId: assignment._id, 
                        assignmentActive: isActive 
                      }
                    })}
                    _hover={{ 
                      bg: hoverBgColor,
                      borderColor: 'brand.500'
                    }}
                  >
                    <HStack justify="space-between">
                      <Text fontWeight="medium">{challenge.name}</Text>
                      <Icon as={FaChevronRight} color="gray.400" />
                    </HStack>
                  </ListItem>
                ))}
              </List>
            </Box>
          </GridItem>

          <GridItem>
            <VStack spacing={6}>
              {assignment.assignedUsers && (
                <Box p={6} bg={bgColor} rounded="lg" shadow="sm" w="100%">
                  <Heading size="md" mb={4}>Assigned Users</Heading>
                  <List spacing={3}>
                    {assignment.assignedUsers.map((user) => (
                      <ListItem 
                        key={user._id}
                        p={3}
                        borderWidth={1}
                        borderColor={borderColor}
                        borderRadius="md"
                      >
                        <HStack>
                          <Icon as={FaUser} color="brand.500" />
                          <Text>{user.name}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box p={6} bg={bgColor} rounded="lg" shadow="sm" w="100%">
                <MySubmissions assignmentId={assignment._id} />
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
};

export default AssignmentDetail;