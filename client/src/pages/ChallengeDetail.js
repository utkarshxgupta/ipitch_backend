import React, { useState, useEffect, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/authContext";
import SubmissionForm from "./SubmissionForm";
import { toast } from "react-toastify";
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
  Divider,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useColorModeValue,
  Icon,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  Center,
  Alert,
  AlertIcon,
  SimpleGrid,
} from "@chakra-ui/react";
import { FaClipboard, FaTrophy, FaUserGraduate, FaClock, FaUser } from 'react-icons/fa';

const ChallengeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { assignmentActive, assignmentId: stateAssignmentId } = location.state || {};
  const { token, user } = useContext(AuthContext);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const userRole = user?.role || [];
  console.log(userRole);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/challenges/${id}`,
          {
            headers: { "x-auth-token": token },
          }
        );
        setChallenge(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch challenge");
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, token]);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {loading ? (
          <Center h="200px">
            <Spinner size="xl" />
          </Center>
        ) : !challenge ? (
          <Alert status="error">
            <AlertIcon />
            Challenge not found
          </Alert>
        ) : (
          <>
            <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between" wrap="wrap">
                  <Heading size="lg">{challenge.name}</Heading>
                  <Badge 
                    colorScheme={assignmentActive ? "green" : "red"}
                    p={2}
                    borderRadius="full"
                  >
                    {assignmentActive ? "Active" : "Inactive"}
                  </Badge>
                </HStack>
                <Text color="gray.500">{challenge.description}</Text>
              </VStack>
            </Box>

            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
              <GridItem>
                <VStack spacing={6} align="stretch">
                  <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
                    <Heading size="md" mb={4}>Challenge Details</Heading>
                    <VStack align="stretch" spacing={4}>
                      <HStack>
                        <Icon as={FaClipboard} color="brand.500" />
                        <Text fontWeight="bold">Prompts:</Text>
                        <Text>{challenge.prompts.join(", ")}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaTrophy} color="brand.500" />
                        <Text fontWeight="bold">Ideal Pitch:</Text>
                        <Text>{challenge.idealPitch}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaUserGraduate} color="brand.500" />
                        <Text fontWeight="bold">Evaluation Criteria:</Text>
                        <Text>{challenge.evaluationCriteria.join(", ")}</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
                    <Heading size="md" mb={4}>Additional Information</Heading>
                    <VStack align="stretch" spacing={4}>
                      <HStack>
                        <Icon as={FaUser} color="brand.500" />
                        <Text fontWeight="bold">Created By:</Text>
                        <Text>{challenge.createdBy.name}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaClock} color="brand.500" />
                        <Text fontWeight="bold">Created Date:</Text>
                        <Text>{new Date(challenge.createdDate).toLocaleDateString()}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </GridItem>

              <GridItem>
                <VStack spacing={6} align="stretch">
                  {(userRole.includes("trainee") || userRole.includes("trainer")) && (
                    <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
                      <VStack spacing={4}>
                        <Button
                          colorScheme="brand"
                          size="lg"
                          width="100%"
                          onClick={onOpen}
                          isDisabled={!assignmentActive}
                          leftIcon={<Icon as={FaClipboard} />}
                        >
                          Attempt Challenge
                        </Button>
                      </VStack>
                    </Box>
                  )}

                  <Box p={6} bg={bgColor} rounded="lg" shadow="sm">
                    <Heading size="md" mb={4}>Challenge Statistics</Heading>
                    <SimpleGrid columns={2} spacing={4}>
                      <Stat>
                        <StatLabel>Total Attempts</StatLabel>
                        <StatNumber>24</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Avg. Score</StatLabel>
                        <StatNumber>78%</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Your Solution</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SubmissionForm
              challengeId={challenge?._id}
              assignmentId={stateAssignmentId}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ChallengeDetail;