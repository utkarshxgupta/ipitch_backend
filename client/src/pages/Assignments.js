import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Box, Heading, Text, List, ListItem, Spinner, Link as ChakraLink, useToast } from "@chakra-ui/react";

const Assignments = () => {
  const { token } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/assignments/user', {
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
    return <Spinner size="xl"/>;
  }

  if (!assignments.length) {
    return <Text>No assignments found</Text>;
  }

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>Your Assignments</Heading>
      <List spacing={3}>
        {assignments.map(assignment => (
          <ListItem key={assignment._id} p={4} borderWidth={1} borderRadius="lg">
            <Heading as="h3" size="md">{assignment.name}</Heading>
            <Text><strong>Start Date:</strong> {new Date(assignment.startDate).toLocaleDateString()}</Text>
            <Text><strong>End Date:</strong> {new Date(assignment.endDate).toLocaleDateString()}</Text>
            <List spacing={2} mt={2}>
              {assignment.challenges.map(challenge => (
                <ListItem key={challenge._id}>
                  <ChakraLink as={Link} to={`/challenges/${challenge._id}`}>{challenge.name}</ChakraLink>
                </ListItem>
              ))}
            </List>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Assignments;
