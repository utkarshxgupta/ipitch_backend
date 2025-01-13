import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  Text,
  Grid,
  GridItem,
  useToast,
  Divider
} from "@chakra-ui/react";
import SelectModal from "../components/SelectModal";

const AssignmentForm = () => {
  const { token, user } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/challenges", {
          headers: { "x-auth-token": token },
        });
        setChallenges(res.data);
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to fetch challenges",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/users", {
          headers: { "x-auth-token": token },
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to fetch users",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchChallenges();
    fetchUsers();
  }, [token, toast]);

  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedChallenges.length === 0) {
      toast({
        title: "Please select at least one challenge",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Please select at least one user",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/assignments",
        {
          name,
          challenges: selectedChallenges,
          assignedUsers: selectedUsers,
          startDate,
          endDate,
        },
        {
          headers: { "x-auth-token": token },
        }
      );

      toast({
        title: "Assignment created successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      if (user.role === "manager") {
        navigate("/manager");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to create assignment",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Heading as="h2" size="lg" mb={4} textAlign="center">
        Create Assignment
      </Heading>
      <Text mb={6} textAlign="center">
        Fill out the form below to create a new assignment.
      </Text>
      <VStack spacing={6} align="stretch">
        <FormControl isRequired>
          <FormLabel>Assignment Name</FormLabel>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormControl>

        <Divider />

        <Box>
          <Text fontWeight="bold" mb={2}>
            Select Challenges
          </Text>
          <Button onClick={() => setShowChallengesModal(true)} mb={3}>
            Choose Challenges
          </Button>
          {selectedChallenges.length > 0 && (
            <Box p={2} borderWidth={1} borderRadius="md">
              {challenges
                .filter((ch) => selectedChallenges.includes(ch._id))
                .map((ch) => (
                  <Text key={ch._id}>{ch.name}</Text>
                ))}
            </Box>
          )}
        </Box>

        <Divider />

        <Box>
          <Text fontWeight="bold" mb={2}>
            Select Users
          </Text>
          <Button onClick={() => setShowUsersModal(true)} mb={3}>
            Choose Users
          </Button>
          {selectedUsers.length > 0 && (
            <Box p={2} borderWidth={1} borderRadius="md">
              {users
                .filter((u) => selectedUsers.includes(u._id))
                .map((u) => (
                  <Text key={u._id}>{u.name}</Text>
                ))}
            </Box>
          )}
        </Box>

        {showChallengesModal && (
          <SelectModal
            title="Select Challenges"
            items={challenges}
            selectedItems={selectedChallenges}
            setSelectedItems={setSelectedChallenges}
            onClose={() => setShowChallengesModal(false)}
          />
        )}

        {showUsersModal && (
          <SelectModal
            title="Select Users"
            items={users}
            selectedItems={selectedUsers}
            setSelectedItems={setSelectedUsers}
            onClose={() => setShowUsersModal(false)}
          />
        )}

        <Divider />

        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <GridItem>
            <FormControl isRequired>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl isRequired>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormControl>
          </GridItem>
        </Grid>

        <Button type="submit" colorScheme="brand" w="100%" mt={4}>
          Create Assignment
        </Button>
      </VStack>
    </Box>
  );
};

export default AssignmentForm;
