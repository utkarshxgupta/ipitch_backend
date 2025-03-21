import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import SearchableSelect from "../components/SearchableSelect";
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  Switch, // Add Switch import
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

const AssignmentForm = () => {
  const { token } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [challenges, setChallenges] = useState([]); // Only need this
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [users, setUsers] = useState([]); // Only need this
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enableHints, setEnableHints] = useState(false); // Add enableHints state
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.700');
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [challengesResponse, usersResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/challenges', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://localhost:5000/api/auth/users', {
            headers: { 'x-auth-token': token }
          })
        ]);

        setChallenges(challengesResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error loading data", 
          description: "Failed to load challenges and users",
          status: "error",
          duration: 3000
        });
      }
    };

    fetchInitialData();
  }, [token, toast]);

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
          assignedUsers: selectedUsers,
          startDate,
          endDate,
          enableHints, // Add enableHints field
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

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <VStack spacing={4} align="start" width="100%">
            <FormControl isRequired>
              <FormLabel>Assignment Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter assignment name"
                size="lg"
                bg={bgColor}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="enable-hints" mb="0">
                Enable Hints
              </FormLabel>
              <Switch 
                id="enable-hints" 
                colorScheme="brand"
                isChecked={enableHints}
                onChange={(e) => setEnableHints(e.target.checked)}
              />
            </FormControl>
          </VStack>
        );
      
      case 2:
        return (
          <FormControl isRequired>
            <FormLabel>Select Challenges</FormLabel>
            <SearchableSelect
              items={challenges}
              selectedItems={selectedChallenges}
              onSelect={setSelectedChallenges}
              searchPlaceholder="Search challenges..."
              displayKey="name"
              isLoading={!challenges.length}
            />
          </FormControl>
        );
      
      case 3:
        return (
          <FormControl isRequired>
            <FormLabel>Assign Users</FormLabel>
            <SearchableSelect
              items={users}
              selectedItems={selectedUsers}
              onSelect={setSelectedUsers}
              searchPlaceholder="Search users..."
              displayKey="name"
              secondaryKey="role"
              isLoading={!users.length}
            />
          </FormControl>
        );
      
      case 4:
        return (
          <SimpleGrid columns={2} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="lg"
                bg={bgColor}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="lg"
                bg={bgColor}
                min={startDate} // Prevent selecting end date before start date
              />
            </FormControl>
          </SimpleGrid>
        );
      
      default:
        return null;
    }
  };

  const renderSelectedItems = () => (
    <VStack align="start" spacing={4}>
      <Text>Please review the assignment details:</Text>
      <Box>
        <Text fontWeight="bold">Name:</Text>
        <Text>{name}</Text>
      </Box>
      <Box>
        <Text fontWeight="bold">Selected Challenges:</Text>
        <VStack align="start">
          {selectedChallenges.map(id => {
            const challenge = challenges.find(c => c._id === id);
            return challenge && <Text key={id}>• {challenge.name}</Text>;
          })}
        </VStack>
      </Box>
      <Box>
        <Text fontWeight="bold">Assigned Users:</Text>
        <VStack align="start">
          {selectedUsers.map(id => {
            const user = users.find(u => u._id === id);
            return user && <Text key={id}>• {user.name}</Text>;
          })}
        </VStack>
      </Box>
      <Box>
        <Text fontWeight="bold">Timeline:</Text>
        <Text>{new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</Text>
      </Box>
      <Box>
        <Text fontWeight="bold">Hints:</Text>
        <Text>{enableHints ? "Enabled" : "Disabled"}</Text>
      </Box>
    </VStack>
  );

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
            {renderSelectedItems()}
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
