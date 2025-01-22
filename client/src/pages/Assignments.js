import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Box, Heading, Text, List, Spinner, useToast } from "@chakra-ui/react";
import CustomListItem from '../components/ListItem';

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

  const isActive = (startDate, endDate) => {
    const now = new Date();
    return new Date(startDate) <= now && now <= new Date(endDate);
  };

  return (
    <Box>
      <List spacing={3}>
        {assignments.map(assignment => (
          <CustomListItem
            key={assignment._id}
            id={assignment.id}
            heading={assignment.name}
            subheading={"Created on " + new Date(assignment.createdAt).toLocaleDateString()}
            badgeText={isActive(assignment.startDate, assignment.endDate) ? "Active" : "Inactive"}
            badgeColor={isActive(assignment.startDate, assignment.endDate) ? "green" : "red"}
            link={`/assignments/${assignment._id}`}
          />
        ))}
      </List>
    </Box>
  );
};

export default Assignments;
