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
  const [progress, setProgress] = useState(null);

  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBgColor = useColorModeValue("gray.50", "gray.600");
  const accentColor = useColorModeValue("brand.500", "brand.300");
  const progressTrackColor = useColorModeValue("gray.100", "gray.700");
  const progressFilledColor = useColorModeValue("green.400", "green.300");
  const infoBgColor = useColorModeValue("gray.50", "gray.800");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch assignment data
      const assignmentRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/assignments/${id}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      setAssignment(assignmentRes.data);

      // Fetch submissions data
      const submissionsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/submissions/user/assignment/${id}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      setSubmissions(submissionsRes.data);

      // NEW: Fetch progress data
      const progressRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/progress/assignment/${id}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      console.log("Progress data:", progressRes.data);
      setProgress(progressRes.data);

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

  // Replace these frontend calculations
  // const getAttemptedChallenges = () => { ... }
  // const getCompletionPercentage = () => { ... }
  // const getBestScore = (challengeId) => { ... }

  // With data from the server
  const completionPercentage = progress ? Math.round((progress.completedChallenges / progress.totalChallenges) * 100) : 0;

  // Get best score for a specific challenge from the server data
  const getBestScore = (challengeId) => {
    if (!progress || !progress.challengeProgress) return 0;
    const challengeProgress = progress.challengeProgress.find(cp => cp.challenge._id === challengeId);
    return challengeProgress ? challengeProgress.bestScore : 0;
  };

  // Get attempts for a challenge
  const getAttempts = (challengeId) => {
    if (!progress || !progress.challengeProgress) return 0;
    const challengeProgress = progress.challengeProgress.find(cp => cp.challenge._id === challengeId);
    return challengeProgress ? challengeProgress.attempts : 0;
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

  // Fix the undefined property error by adding another check
  const attemptedChallenges = new Set(
    progress && progress.challengeProgress 
      ? progress.challengeProgress.map(cp => cp.challenge._id) 
      : []
  );

  // Format date to DD Month 'YY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        {/* Header Section - Redesigned */}
        <Card 
          bg={cardBg} 
          shadow="md" 
          borderRadius="lg" 
          overflow="hidden"
          borderLeft={isActive ? "4px solid" : "none"}
          borderLeftColor={isActive ? "green.400" : "none"}
        >
          <CardBody py={4}>
            <VStack spacing={4} align="stretch">
              {/* Title Row */}
              <Flex 
                direction={{ base: "column", md: "row" }} 
                justify="space-between" 
                align={{ base: "flex-start", md: "center" }} 
                gap={3}
              >
                <Heading size="lg" color={accentColor}>{assignment.name}</Heading>
                <Badge
                  colorScheme={isActive ? "green" : "red"}
                  p={2}
                  borderRadius="full"
                  fontSize="sm"
                  variant="solid"
                >
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </Flex>
              
              {/* Time Remaining - More Visible */}
              {isActive && (
                <Flex 
                  bg="blue.50" 
                  color="blue.700" 
                  p={3} 
                  borderRadius="md" 
                  align="center"
                  justify="center"
                  fontWeight="bold"
                  fontSize="lg"
                  borderWidth="1px"
                  borderColor="blue.200"
                >
                  <Icon as={FaClock} mr={2} />
                  Time Remaining: {timeRemaining}
                </Flex>
              )}
              
              {/* Info Row */}
              <Flex 
                direction={{ base: "column", sm: "row" }} 
                align="flex-start"
                gap={4} 
                bg={infoBgColor}
                p={3}
                borderRadius="md"
              >
                <HStack spacing={2}>
                  <Icon as={FaCalendar} color={accentColor} boxSize={4} />
                  <Text fontWeight="medium" fontSize="sm">
                    {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                  </Text>
                </HStack>
                <Spacer />
                <HStack spacing={2}>
                  <Icon as={FaUser} color={accentColor} boxSize={4} />
                  <Text fontWeight="medium" fontSize="sm">
                    Created by {assignment.createdBy.name}
                  </Text>
                </HStack>
              </Flex>

              {/* Progress Metrics Row - Redesigned without redundant challenges card */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={2}>
                {/* Progress Card - Enhanced with combined info */}
                <Flex 
                  bg={infoBgColor} 
                  p={4} 
                  borderRadius="md" 
                  direction="column" 
                  align="stretch" 
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <HStack>
                      <Icon as={FaChartLine} color={accentColor} boxSize={5} />
                      <Text fontSize="md" fontWeight="bold">CHALLENGE PROGRESS</Text>
                    </HStack>
                    <Text fontWeight="bold" fontSize="xl" color={accentColor}>
                      {completionPercentage}%
                    </Text>
                  </Flex>
                  <Progress 
                    value={completionPercentage} 
                    size="sm" 
                    colorScheme="green" 
                    borderRadius="full"
                    mb={3}
                  />
                  <Flex justify="space-between">
                    <Text fontWeight="medium" fontSize="sm">
                      {progress ? progress.completedChallenges : 0}/{progress ? progress.totalChallenges : 0} challenges completed
                    </Text>
                    <Text fontWeight="medium" fontSize="sm">
                      {attemptedChallenges.size} attempted
                    </Text>
                  </Flex>
                </Flex>

                {/* Score Card - Enhanced */}
                <Flex 
                  bg={infoBgColor} 
                  p={4} 
                  borderRadius="md" 
                  direction="row" 
                  align="center" 
                  justify="space-between"
                >
                  <VStack align="flex-start" spacing={1}>
                    <HStack>
                      <Icon as={FaTrophy} color="gold" boxSize={5} />
                      <Text fontSize="md" fontWeight="bold">PERFORMANCE</Text>
                    </HStack>
                    <Text fontSize="sm">Average Score</Text>
                    <Text fontWeight="bold" fontSize="xl" color={accentColor}>
                      {progress ? Math.round(progress.overallScore/progress.totalChallenges) : 0}/100
                    </Text>
                  </VStack>
                  <CircularProgress 
                    value={progress ? Math.round(progress.overallScore/progress.totalChallenges) : 0} 
                    color="green.400" 
                    size="80px"
                  >
                    <CircularProgressLabel fontWeight="bold">
                      {progress ? Math.round(progress.overallScore/progress.totalChallenges) : 0}%
                    </CircularProgressLabel>
                  </CircularProgress>
                </Flex>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

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
                        {getBestScore(challenge._id) > 0 && (
                          <Tooltip label="Your best score">
                            <Tag size="md" colorScheme="blue" borderRadius="full">
                              <TagLeftIcon boxSize="12px" as={FaChartLine} />
                              <TagLabel>{getBestScore(challenge._id)}%</TagLabel>
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