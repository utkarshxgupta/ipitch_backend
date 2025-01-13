import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Badge,
  List,
  ListItem,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <Box p={5} shadow="md" borderWidth="1px">
      <Heading mb={4}>{assignment.name}</Heading>
      <Badge colorScheme={isActive ? "green" : "red"} mb={4}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
      <Text mb={2}>
        Start Date: {new Date(assignment.startDate).toLocaleDateString()}
      </Text>
      <Text mb={2}>
        End Date: {new Date(assignment.endDate).toLocaleDateString()}
      </Text>
      <Text mb={4}>Created By: {assignment.createdBy}</Text>
      <Heading size="md" mb={2}>
        Challenges
      </Heading>
      <List spacing={3} mb={4}>
        {assignment.challenges.map((challenge) => (
          <ListItem
            key={challenge._id}
            cursor="pointer"
            onClick={() => navigate(`/challenges/${challenge._id}`)}
            _hover={{ textDecoration: "underline" }}
          >
            {challenge.name}
          </ListItem>
        ))}
      </List>
      <Heading size="md" mb={2}>
        Assigned Users
      </Heading>
      <List spacing={3}>
        {assignment.assignedUsers.map((user) => (
          <ListItem key={user._id}>{user.name}</ListItem>
        ))}
      </List>
    </Box>
  );
};

export default AssignmentDetail;
