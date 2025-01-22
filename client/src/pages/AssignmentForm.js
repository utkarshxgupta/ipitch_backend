import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  SimpleGrid,
  Progress,
  Text,
  Heading,
  HStack,
  useColorModeValue,
  IconButton,
  Checkbox,
  Avatar,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Grid,
  GridItem,
  useToast,
  Divider,
  InputGroup,
  InputLeftElement,
  Center,
  Spinner
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import SelectModal from "../components/SelectModal";
import _ from 'lodash';

const AssignmentForm = () => {
  const { token, user } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const toast = useToast();

  const searchUsers = (query) => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleChallengeSelect = (challengeId) => {
    setSelectedChallenges(prev => 
      prev.includes(challengeId)
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.700');

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
    setIsSubmitting(true);

    if (selectedChallenges.length === 0) {
      toast({
        title: "Please select at least one challenge",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Please select at least one user",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/assignments",
        {
          name,
          challenges: selectedChallenges,
          users: selectedUsers,
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
        duration: 3000,
        isClosable: true,
      });

      onClose(); // Close any open modal
      navigate('/manager'); // Navigate to manager dashboard
      
    } catch (error) {
      toast({
        title: "Error creating assignment",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: 'Basic Info', fields: ['name'] },
    { title: 'Select Challenges', fields: ['challenges'] },
    { title: 'Assign Users', fields: ['users'] },
    { title: 'Set Timeline', fields: ['dates'] }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useCallback(
    _.debounce((query, type) => {
      setIsSearching(true);
      if (type === 'challenges') {
        const results = challenges.filter(challenge => 
          challenge.name.toLowerCase().includes(query.toLowerCase()) ||
          challenge.description.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredChallenges(results);
      } else {
        const results = users.filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredUsers(results);
      }
      setIsSearching(false);
    }, 300),
    [challenges, users]
  );

  const renderChallengeSelection = () => (
    <VStack spacing={4} align="stretch">
      <InputGroup>
        <InputLeftElement children={<SearchIcon color="gray.400" />} />
        <Input
          placeholder="Search challenges..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            debouncedSearch(e.target.value, 'challenges');
          }}
        />
      </InputGroup>

      {isSearching ? (
        <Center p={8}><Spinner /></Center>
      ) : filteredChallenges.length === 0 ? (
        <Text textAlign="center" color="gray.500">No challenges found</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {filteredChallenges.map(challenge => (
            <Box
              key={challenge._id}
              p={4}
              borderWidth={1}
              borderRadius="lg"
              cursor="pointer"
              bg={selectedChallenges.includes(challenge._id) ? 'brand.50' : bgColor}
              onClick={() => handleChallengeSelect(challenge._id)}
              _hover={{ borderColor: 'brand.500' }}
            >
              <HStack justify="space-between">
                <VStack align="start">
                  <Heading size="sm">{challenge.name}</Heading>
                  <Text noOfLines={2} color="gray.500">
                    {challenge.description}
                  </Text>
                </VStack>
                <Checkbox 
                  isChecked={selectedChallenges.includes(challenge._id)}
                  onChange={() => {}}
                />
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );

  const renderUserSelection = () => (
    <VStack spacing={4} align="stretch">
      <InputGroup>
        <InputLeftElement children={<SearchIcon color="gray.400" />} />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            debouncedSearch(e.target.value, 'users');
          }}
        />
      </InputGroup>

      {isSearching ? (
        <Center p={8}><Spinner /></Center>
      ) : filteredUsers.length === 0 ? (
        <Text textAlign="center" color="gray.500">No users found</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {filteredUsers.map(user => (
            <HStack
              key={user._id}
              p={4}
              borderWidth={1}
              borderRadius="lg"
              justify="space-between"
              _hover={{ borderColor: 'brand.500' }}
            >
              <HStack>
                <Avatar size="sm" name={user.name} />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">{user.name}</Text>
                  <Text fontSize="sm" color="gray.500">{user.email}</Text>
                </VStack>
              </HStack>
              <Checkbox
                isChecked={selectedUsers.includes(user._id)}
                onChange={() => handleUserSelect(user._id)}
              />
            </HStack>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <FormControl isRequired>
            <FormLabel>Assignment Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter assignment name"
            />
          </FormControl>
        );
      
      case 2:
        return renderChallengeSelection();
      
      case 3:
        return renderUserSelection();
      
      case 4:
        return (
          <SimpleGrid columns={2} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormControl>
          </SimpleGrid>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8}>
        <Box w="100%" p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
          <VStack spacing={6}>
            <Heading size="lg">Create Assignment</Heading>
            <Progress
              value={(step / steps.length) * 100}
              w="100%"
              colorScheme="brand"
              borderRadius="full"
            />
            <Text>Step {step} of {steps.length}: {steps[step-1].title}</Text>
          </VStack>
        </Box>

        <Box w="100%" p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
          <form onSubmit={handleSubmit}>
            <VStack spacing={6}>
              {renderStep()}
              
              <HStack w="100%" justify="space-between">
                <Button
                  onClick={() => setStep(step - 1)}
                  isDisabled={step === 1}
                  leftIcon={<ChevronLeftIcon />}
                >
                  Previous
                </Button>
                {step < steps.length ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    colorScheme="brand"
                    rightIcon={<ChevronRightIcon />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={onOpen}
                    colorScheme="brand"
                    isLoading={isSubmitting}
                  >
                    Create Assignment
                  </Button>
                )}
              </HStack>
            </VStack>
          </form>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Assignment Creation</ModalHeader>
          <ModalBody>
            <VStack align="start" spacing={4}>
              <Text>Please review the assignment details:</Text>
              <Box>
                <Text fontWeight="bold">Name:</Text>
                <Text>{name}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Selected Challenges:</Text>
                <Text>{selectedChallenges.length} challenges</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Assigned Users:</Text>
                <Text>{selectedUsers.length} users</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Timeline:</Text>
                <Text>{startDate} to {endDate}</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Confirm & Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AssignmentForm;
