import React, { useState, useEffect, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/authContext";
import SubmissionForm from "./SubmissionForm";
import { useToast } from "@chakra-ui/react";
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useColorModeValue,
  Icon,
  Center,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Tag,
  TagLeftIcon,
  TagLabel,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { 
  FaClipboard, 
  FaTrophy, 
  FaUserGraduate, 
  FaClock, 
  FaUser, 
  FaPlus, 
  FaMinus,
  FaChartLine
} from 'react-icons/fa';
import { EditIcon } from '@chakra-ui/icons';

const ChallengeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { assignmentActive, assignmentId: stateAssignmentId } = location.state || {};
  const { token, user } = useContext(AuthContext);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const userRole = user?.role || [];

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/challenges/${id}`,
          {
            headers: { "x-auth-token": token },
          }
        );
        setChallenge(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to fetch challenge",
          status: "error",
          duration: 3000,
          isClosable: true
        });
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, token, toast]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');
  const accentColor = useColorModeValue('brand.500', 'brand.300');

  if (loading) {
    return (
      <Container maxW="container.xl" py={16}>
        <Center>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
        </Center>
      </Container>
    );
  }

  if (!challenge) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Challenge not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header Section */}
        <Box 
          p={8} 
          bg={bgColor} 
          rounded="lg" 
          shadow="sm" 
          borderWidth="1px" 
          borderColor={borderColor}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={1} flex="1">
              <Heading 
                size="xl" 
                bgGradient="linear(to-r, brand.400, purple.400)" 
                bgClip="text"
              >
                {challenge.name}
              </Heading>
              
              <HStack spacing={4} mt={1}>
                <HStack>
                  <Icon as={FaUser} color={accentColor} boxSize={3.5} />
                  <Text color="gray.500" fontSize="sm">
                    Created by {challenge.createdBy.name}
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={FaClock} color={accentColor} boxSize={3.5} />
                  <Text color="gray.500" fontSize="sm">
                    {new Date(challenge.createdDate).toLocaleDateString()}
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={FaChartLine} color={accentColor} boxSize={3.5} />
                  <Text color="gray.500" fontSize="sm">
                    {challenge.attempts || 0} attempts
                  </Text>
                </HStack>
              </HStack>
            </VStack>
            
            {(userRole.includes("admin") || userRole.includes("trainer")) && (
              <Button
                leftIcon={<EditIcon />}
                colorScheme="brand"
                variant="outline"
                size="md"
                onClick={() => navigate(`/challenges/edit/${challenge._id}`)}
                borderRadius="full"
              >
                Edit
              </Button>
            )}
          </Flex>
          
          <Text mt={6} fontSize="lg" color="gray.600" _dark={{ color: "gray.300" }}>
            {challenge.description}
          </Text>
          
          {/* Only show the Attempt button if assignmentActive is true */}
          {assignmentActive && (userRole.includes("trainee") || userRole.includes("trainer")) && (
            <Flex justify="center" mt={8}>
              <Button
                colorScheme="brand"
                size="lg"
                px={10}
                onClick={onOpen}
                leftIcon={<Icon as={FaClipboard} />}
                _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                transition="all 0.2s"
              >
                Attempt Challenge
              </Button>
            </Flex>
          )}
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "3fr 1fr" }} gap={8}>
          <GridItem>
            {/* Ideal Pitch Section */}
            <Box 
              p={8} 
              bg={bgColor} 
              rounded="lg" 
              shadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
              mb={8}
            >
              <HStack mb={6}>
                <Icon as={FaTrophy} color={accentColor} boxSize={5} />
                <Heading size="md">Ideal Pitch</Heading>
              </HStack>
              
              <Box 
                p={5}
                bg={highlightColor}
                borderRadius="md"
                borderLeftWidth="4px"
                borderLeftColor={accentColor}
              >
                <Text whiteSpace="pre-wrap" fontSize="md" lineHeight="tall">
                  {challenge.idealPitch}
                </Text>
              </Box>
            </Box>
            
            {/* Evaluation Criteria Section */}
            <Box 
              p={8} 
              bg={bgColor} 
              rounded="lg" 
              shadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack mb={6}>
                <Icon as={FaUserGraduate} color={accentColor} boxSize={5} />
                <Heading size="md">Evaluation Criteria</Heading>
              </HStack>
              
              <Text mb={4} color="gray.600" _dark={{ color: "gray.400" }}>
                Your pitch will be evaluated based on the following criteria:
              </Text>
              
              <List spacing={4}>
                {challenge.evaluationCriteria.map((criteria, index) => {
                  const isPositive = criteria.weight > 0;
                  return (
                    <ListItem key={index}>
                      <Flex 
                        p={4} 
                        borderRadius="md" 
                        bg={isPositive ? "green.50" : "red.50"}
                        borderLeftWidth="4px"
                        borderLeftColor={isPositive ? "green.400" : "red.400"}
                        _dark={{
                          bg: isPositive ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)",
                          borderLeftColor: isPositive ? "green.400" : "red.400",
                        }}
                      >
                        <HStack align="flex-start" spacing={3}>
                          <Icon 
                            as={isPositive ? FaPlus : FaMinus} 
                            color={isPositive ? "green.500" : "red.500"} 
                            boxSize={4}
                            mt={1}
                          />
                          <VStack align="start" spacing={1}>
                            <Badge 
                              colorScheme={isPositive ? "green" : "red"} 
                              variant="subtle"
                              px={2}
                              py={0.5}
                            >
                              {isPositive ? `+${criteria.weight}` : criteria.weight} points
                            </Badge>
                            <Text fontWeight="medium">
                              {criteria.keyword}
                            </Text>
                          </VStack>
                        </HStack>
                      </Flex>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </GridItem>
          
          <GridItem>
            {/* Challenge Statistics Section */}
            <Box 
              p={6} 
              bg={bgColor} 
              rounded="lg" 
              shadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
              position="sticky"
              top="20px"
            >
              <VStack align="stretch" spacing={6}>
                <Heading size="md">Challenge Insights</Heading>
                <Divider />
                
                <Stat>
                  <StatLabel color="gray.500">Total Attempts</StatLabel>
                  <StatNumber fontWeight="bold" fontSize="3xl" color={accentColor}>
                    {challenge.attempts || 0}
                  </StatNumber>
                  <StatHelpText>
                    From all trainees
                  </StatHelpText>
                </Stat>
                
                <Divider />
                
                <VStack align="start">
                  <Text fontWeight="medium">Difficulty Level</Text>
                  <Badge 
                    colorScheme={
                      challenge.evaluationCriteria.length > 5 ? "red" : 
                      challenge.evaluationCriteria.length > 3 ? "yellow" : 
                      "green"
                    }
                    py={1}
                    px={3}
                    borderRadius="full"
                  >
                    {challenge.evaluationCriteria.length > 5 ? "Advanced" : 
                     challenge.evaluationCriteria.length > 3 ? "Intermediate" : 
                     "Beginner"}
                  </Badge>
                </VStack>
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </VStack>

      {/* Submission Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Your Pitch</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SubmissionForm
              challengeId={challenge._id}
              assignmentId={stateAssignmentId}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ChallengeDetail;