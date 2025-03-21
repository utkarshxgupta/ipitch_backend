import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
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
  Progress,
  Flex,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  useMediaQuery,
  Tag,
  TagLabel,
  TagLeftIcon,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CircularProgress,
  CircularProgressLabel,
  Tooltip,
  Spacer,
} from "@chakra-ui/react";
import {
  FaCalendar,
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaExclamationCircle,
  FaMedal,
  FaTasks,
  FaTrophy,
  FaChevronRight,
  FaCode,
  FaUser,
  FaChartLine,
} from "react-icons/fa";

const AssignmentAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const [submissionsByChallenge, setSubmissionsByChallenge] = useState({});

  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBgColor = useColorModeValue("gray.50", "gray.600");
  const accentColor = useColorModeValue("brand.500", "brand.300");
  const progressTrackColor = useColorModeValue("gray.100", "gray.700");
  const progressFilledColor = useColorModeValue("green.400", "green.300");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch assignment data
      const assignmentRes = await axios.get(
        `http://localhost:5000/api/assignments/${id}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      setAssignment(assignmentRes.data);

      // Fetch submissions data
      const submissionsRes = await axios.get(
        `http://localhost:5000/api/submissions/user/assignment/${id}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      setSubmissions(submissionsRes.data);

      // Group submissions by challenge
      const groupedSubmissions = {};
      submissionsRes.data.forEach((submission) => {
        const challengeId = submission.challenge._id;
        if (!groupedSubmissions[challengeId]) {
          groupedSubmissions[challengeId] = [];
        }
        groupedSubmissions[challengeId].push(submission);
      });

      // Sort each challenge's submissions by date (newest first)
      Object.keys(groupedSubmissions).forEach((challengeId) => {
        groupedSubmissions[challengeId].sort(
          (a, b) => new Date(b.submittedDate) - new Date(a.submittedDate)
        );
      });

      setSubmissionsByChallenge(groupedSubmissions);
    } catch (err) {
      setError(err.response ? err.response.data.msg : "Server error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate time remaining 
  useEffect(() => {
    if (!assignment) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(assignment.endDate);
      
      if (now > endDate) {
        setTimeRemaining("Expired");
        return;
      }
      
      const timeDiff = endDate - now;
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [assignment]);

  // Calculate which challenges have been attempted
  const getAttemptedChallenges = () => {
    if (!submissions.length || !assignment) return new Set();
    
    return new Set(
      submissions.map((submission) => submission.challenge._id)
    );
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!assignment) return 0;
    const attempted = getAttemptedChallenges().size;
    const total = assignment.challenges.length;
    return total > 0 ? Math.round((attempted / total) * 100) : 0;
  };

  // Calculate random best score for each challenge (dummy data as requested)
  const getBestScore = (challengeId) => {
    return Math.floor(Math.random() * 41) + 60; // Random score between 60-100
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Spinner size="xl" thickness="4px" color="brand.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md" my={4}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  const isActive =
    new Date() >= new Date(assignment.startDate) &&
    new Date() <= new Date(assignment.endDate);

  const attemptedChallenges = getAttemptedChallenges();
  const completionPercentage = getCompletionPercentage();

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
          <CardHeader pb={0}>
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} wrap="wrap" gap={2}>
              <Heading size="lg" color={accentColor}>{assignment.name}</Heading>
              <HStack spacing={2}>
                <Badge
                  colorScheme={isActive ? "green" : "red"}
                  p={2}
                  borderRadius="full"
                  fontSize="sm"
                >
                  {isActive ? "Active" : "Inactive"}
                </Badge>
                {isActive && (
                  <Tag size="md" variant="subtle" colorScheme="blue" borderRadius="full">
                    <TagLeftIcon as={FaClock} />
                    <TagLabel>{timeRemaining}</TagLabel>
                  </Tag>
                )}
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <HStack>
                <Icon as={FaCalendar} color={accentColor} />
                <Text fontWeight="medium">
                  Starts: {new Date(assignment.startDate).toLocaleDateString()}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaCalendar} color={accentColor} />
                <Text fontWeight="medium">
                  Ends: {new Date(assignment.endDate).toLocaleDateString()}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaUser} color={accentColor} />
                <Text fontWeight="medium">By: {assignment.createdBy.name}</Text>
              </HStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Progress Summary */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
            <CardBody>
              <VStack>
                <Heading size="sm" textAlign="center">Overall Progress</Heading>
                <Box position="relative" mb={2} w="120px" h="120px">
                  <CircularProgress 
                    value={completionPercentage} 
                    size="120px" 
                    thickness="8px"
                    color={progressFilledColor}
                    trackColor={progressTrackColor}
                  >
                    <CircularProgressLabel fontWeight="bold" fontSize="xl">{completionPercentage}%</CircularProgressLabel>
                  </CircularProgress>
                </Box>
                <Text fontSize="sm" color="gray.500">
                  {attemptedChallenges.size} of {assignment.challenges.length} challenges attempted
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaTrophy} color="gold" />
                    <Text>Assignment Score</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="3xl" color={accentColor}>
                  {Math.floor(Math.random() * 21) + 80}/100
                </StatNumber>
                <StatHelpText>Based on your best submissions</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaMedal} color="bronze" />
                    <Text>Time Spent</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="3xl" color={accentColor}>
                  {Math.floor(Math.random() * 6) + 2}h {Math.floor(Math.random() * 60)}m
                </StatNumber>
                <StatHelpText>Total time on challenges</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Challenges Section */}
        <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
          <CardHeader>
            <HStack justify="space-between" mb={1}>
              <Heading size="md">Challenges</Heading>
              <Icon as={FaTasks} color={accentColor} />
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <List spacing={3}>
              {assignment.challenges.map((challenge) => {
                const isAttempted = attemptedChallenges.has(challenge._id);
                const bestScore = getBestScore(challenge._id);
                
                return (
                  <ListItem
                    key={challenge._id}
                    p={4}
                    borderWidth={1}
                    borderColor={isAttempted ? "green.200" : borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    position="relative"
                    transition="all 0.2s"
                    onClick={() =>
                      navigate(`/challenges/${challenge._id}/new`, {
                        state: {
                          assignmentId: assignment._id,
                          assignmentActive: isActive,
                          enableHints: assignment.enableHints,
                        },
                      })
                    }
                    _hover={{
                      bg: hoverBgColor,
                      borderColor: accentColor,
                      transform: "translateY(-2px)",
                      shadow: "md",
                    }}
                  >
                    <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                      <HStack spacing={3}>
                        <Icon 
                          as={isAttempted ? FaCheckCircle : FaCircle} 
                          color={isAttempted ? "green.500" : "gray.300"} 
                        />
                        <Text fontWeight="medium">{challenge.name}</Text>
                        {isAttempted && (
                          <Badge colorScheme="green" fontSize="xs">
                            Attempted
                          </Badge>
                        )}
                      </HStack>
                      
                      <HStack>
                        {isAttempted && (
                          <Tooltip label="Your best score">
                            <Tag size="md" colorScheme="blue" borderRadius="full">
                              <TagLeftIcon boxSize="12px" as={FaChartLine} />
                              <TagLabel>{bestScore}%</TagLabel>
                            </Tag>
                          </Tooltip>
                        )}
                        <Icon as={FaChevronRight} color="gray.400" />
                      </HStack>
                    </Flex>
                  </ListItem>
                );
              })}
            </List>
          </CardBody>
        </Card>

        {/* Submissions Section */}
        <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
          <CardHeader pb={2}>
            <HStack justify="space-between">
              <Heading size="md">My Submissions</Heading>
              <Icon as={FaCode} color={accentColor} />
            </HStack>
          </CardHeader>
          <CardBody pt={1}>
            {submissions.length === 0 ? (
              <Box py={4} textAlign="center">
                <Icon as={FaExclamationCircle} color="gray.400" boxSize={10} mb={2} />
                <Text color="gray.500">You haven't submitted any challenges yet</Text>
                <Button
                  colorScheme="brand"
                  size="sm"
                  mt={4}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Start a Challenge
                </Button>
              </Box>
            ) : (
              <Accordion allowMultiple defaultIndex={[0]}>
                {assignment.challenges.map(challenge => {
                  const challengeSubmissions = submissionsByChallenge[challenge._id] || [];
                  if (challengeSubmissions.length === 0) return null;
                  
                  return (
                    <AccordionItem key={challenge._id} borderWidth={1} borderRadius="md" mb={3} borderColor={borderColor}>
                      <AccordionButton py={3}>
                        <HStack flex="1" textAlign="left" spacing={3}>
                          <Icon as={FaCode} color={accentColor} />
                          <Text fontWeight="medium">{challenge.name}</Text>
                          <Badge colorScheme="blue" fontSize="xs">{challengeSubmissions.length} submissions</Badge>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <List spacing={2}>
                          {challengeSubmissions.map((submission) => (
                            <ListItem
                              key={submission._id}
                              p={3}
                              borderWidth={1}
                              borderColor={borderColor}
                              borderRadius="md"
                              cursor="pointer"
                              _hover={{
                                bg: hoverBgColor,
                                borderColor: accentColor,
                              }}
                              onClick={() => navigate(`/submissions/${submission._id}`)}
                            >
                              <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                                <Text fontSize="sm">
                                  Submitted: {new Date(submission.submittedDate).toLocaleString()}
                                </Text>
                                <HStack>
                                  {submission.transcriptionStatus === "completed" ? (
                                    submission.automaticEvaluation ? (
                                      <Badge
                                        colorScheme={submission.automaticEvaluation.score >= 70 ? "green" : "orange"}
                                        variant="subtle"
                                      >
                                        Score: {submission.automaticEvaluation.score}%
                                      </Badge>
                                    ) : (
                                      <Badge colorScheme="green" variant="subtle">Completed</Badge>
                                    )
                                  ) : submission.transcriptionStatus === "processing" ? (
                                    <Badge colorScheme="yellow" variant="subtle">Processing</Badge>
                                  ) : (
                                    <Badge colorScheme="red" variant="subtle">Failed</Badge>
                                  )}
                                  <Icon as={FaChevronRight} color="gray.400" size="sm" />
                                </HStack>
                              </Flex>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                }).filter(Boolean)}
              </Accordion>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default AssignmentAttempt;