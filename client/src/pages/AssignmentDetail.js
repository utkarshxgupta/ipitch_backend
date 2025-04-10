import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Heading, Text, Badge, Spinner, Alert, AlertIcon,
  VStack, HStack, useColorModeValue, Icon, Flex, Table, Thead, Tbody, 
  Tr, Th, Td, Progress, Divider, Avatar, Tooltip, Grid, GridItem,
  Button, IconButton, Skeleton, useDisclosure, Collapse, InputGroup,
  Input, InputRightElement, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton
} from "@chakra-ui/react";
import { 
  FaCalendar, FaUser, FaTasks, FaChevronRight, FaTrophy, FaClock,
  FaLightbulb, FaRegLightbulb, FaChevronDown, FaChevronUp,
  FaMedal, FaSearch, FaTimes, FaEye
} from "react-icons/fa";
import AuthContext from "../context/authContext";

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [assignment, setAssignment] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [currentTraineeSubmissions, setCurrentTraineeSubmissions] = useState([]);
  const [currentTraineeName, setCurrentTraineeName] = useState("");
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const {
    isOpen: isSubmissionsModalOpen,
    onOpen: onSubmissionsModalOpen,
    onClose: onSubmissionsModalClose
  } = useDisclosure();

  // Color modes
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBgColor = useColorModeValue("gray.50", "gray.600");
  const accentColor = useColorModeValue("brand.500", "brand.300");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.800");
  
  // Gold, silver, bronze colors for top 3
  const medals = ["gold", "silver", "#CD7F32"];

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/assignments/${id}`,
          {
            headers: { "x-auth-token": token || localStorage.getItem("token") },
          }
        );
        setAssignment(res.data);
      } catch (err) {
        setError(err.response?.data?.msg || "Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id, token]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!id) return;
      
      const canViewLeaderboard = user?.role && 
        (user.role.includes("trainer") || 
         user.role.includes("manager") || 
         user.role.includes("admin"));
         
      if (!canViewLeaderboard) {
        setLeaderboardLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/progress/assignment/${id}/leaderboard`,
          {
            headers: { "x-auth-token": token || localStorage.getItem("token") },
          }
        );
        setLeaderboard(res.data);
        setFilteredLeaderboard(res.data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [id, token, user]);

  // Filter leaderboard based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLeaderboard(leaderboard);
      return;
    }
    
    const filtered = leaderboard.filter(entry => 
      entry.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLeaderboard(filtered);
  }, [searchQuery, leaderboard]);

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

  const fetchTraineeSubmissions = async (traineeId, traineeName) => {
    setSubmissionsLoading(true);
    setCurrentTraineeName(traineeName);
    
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/submissions/user/assignment/${id}`,
        {
          params: { traineeId },
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      setCurrentTraineeSubmissions(res.data);
      onSubmissionsModalOpen();
    } catch (err) {
      console.error("Error fetching trainee submissions:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  if (loading) return (
    <Flex justify="center" align="center" minHeight="80vh">
      <Spinner size="xl" thickness="4px" color="brand.500" />
    </Flex>
  );
  
  if (error) return (
    <Alert status="error" borderRadius="lg" my={8}>
      <AlertIcon />
      {error}
    </Alert>
  );

  const isActive =
    new Date() >= new Date(assignment.startDate) &&
    new Date() <= new Date(assignment.endDate);

  const formattedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const showAllLeaderboard = () => {
    setLeaderboardLimit(filteredLeaderboard.length);
  };

  const showLessLeaderboard = () => {
    setLeaderboardLimit(10);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align={{ base: "start", md: "center" }}
          gap={4}
          bg={bgColor}
          p={5}
          borderRadius="lg"
          shadow="sm"
          borderLeft={isActive ? "4px solid" : "none"}
          borderLeftColor={isActive ? "green.400" : "none"}
        >
          <Box>
            <Heading size="lg" color={accentColor} mb={2}>
              {assignment.name}
            </Heading>
            <HStack spacing={3} wrap="wrap">
              <Badge
                colorScheme={isActive ? "green" : "red"}
                p={2}
                borderRadius="full"
                fontSize="sm"
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
              
              <Tooltip label={assignment.enableHints ? "Hints are enabled for this assignment" : "Hints are disabled for this assignment"}>
                <Badge
                  colorScheme={assignment.enableHints ? "blue" : "gray"}
                  p={2}
                  borderRadius="full"
                  fontSize="sm"
                >
                  <Flex align="center" gap={1}>
                    <Icon as={assignment.enableHints ? FaLightbulb : FaRegLightbulb} />
                    <Text>{assignment.enableHints ? "Hints Enabled" : "Hints Disabled"}</Text>
                  </Flex>
                </Badge>
              </Tooltip>
            </HStack>
          </Box>
          
          {isActive && (
            <Flex 
              bg="blue.50" 
              color="blue.700" 
              p={3} 
              borderRadius="md" 
              align="center"
              fontWeight="bold"
              fontSize="md"
              borderWidth="1px"
              borderColor="blue.200"
              _dark={{ bg: "blue.900", color: "blue.200", borderColor: "blue.700" }}
            >
              <Icon as={FaClock} mr={2} />
              Time Remaining: {timeRemaining}
            </Flex>
          )}
        </Flex>

        {/* Compact Assignment Info */}
        <Grid 
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap={4} 
          bg={bgColor} 
          p={4} 
          borderRadius="lg" 
          shadow="sm"
        >
          <GridItem>
            <HStack spacing={3}>
              <Icon as={FaCalendar} color={accentColor} />
              <Text fontWeight="medium">Start:</Text>
              <Text>{formattedDate(assignment.startDate)}</Text>
            </HStack>
          </GridItem>
          
          <GridItem>
            <HStack spacing={3}>
              <Icon as={FaCalendar} color={accentColor} />
              <Text fontWeight="medium">End:</Text>
              <Text>{formattedDate(assignment.endDate)}</Text>
            </HStack>
          </GridItem>
          
          <GridItem>
            <HStack spacing={3}>
              <Icon as={FaUser} color={accentColor} />
              <Text fontWeight="medium">Created by:</Text>
              <Text>{assignment.createdBy.name}</Text>
              <Text color="gray.500" fontSize="sm">
                ({formattedDate(assignment.createdAt)})
              </Text>
            </HStack>
          </GridItem>
          
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <HStack spacing={3}>
              <Icon as={FaTasks} color={accentColor} />
              <Text fontWeight="medium">Challenges:</Text>
              <Text>{assignment.challenges.length} challenges available</Text>
            </HStack>
          </GridItem>
          
          <GridItem>
            <HStack spacing={3}>
              <Icon as={FaUser} color={accentColor} />
              <Text fontWeight="medium">Assigned to:</Text>
              <Text>{assignment.assignedUsers?.length || 0} users</Text>
            </HStack>
          </GridItem>
        </Grid>

        {/* Challenges List - Moved Above Leaderboard */}
        <Box bg={bgColor} p={5} borderRadius="lg" shadow="sm">
          <Flex 
            justify="space-between" 
            mb={isOpen ? 4 : 0} 
            align="center" 
            onClick={onToggle} 
            cursor="pointer"
          >
            <HStack>
              <Icon as={FaTasks} color={accentColor} />
              <Heading size="md">Challenges ({assignment.challenges.length})</Heading>
            </HStack>
            <IconButton
              icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
              variant="ghost"
              aria-label={isOpen ? "Collapse challenges" : "Expand challenges"}
              size="sm"
            />
          </Flex>
          
          <Collapse in={isOpen} animateOpacity>
            <Divider mb={4} />
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
              {assignment.challenges.map((challenge) => (
                <Box
                  key={challenge._id}
                  p={4}
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() =>
                    navigate(`/challenges/${challenge._id}`, {
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
                  transition="all 0.2s"
                >
                  <HStack justify="space-between">
                    <Text fontWeight="medium">{challenge.name}</Text>
                    <Icon as={FaChevronRight} color="gray.400" />
                  </HStack>
                </Box>
              ))}
            </Grid>
          </Collapse>
        </Box>

        {/* Leaderboard Section - Now Below Challenges */}
        <Box 
          bg={bgColor} 
          p={5} 
          borderRadius="lg" 
          shadow="sm" 
          borderTop="4px solid" 
          borderTopColor="yellow.400"
        >
          <HStack justify="space-between" mb={4}>
            <Heading size="lg" color={accentColor}>
              <Icon as={FaTrophy} color="yellow.400" mr={2} />
              Leaderboard
            </Heading>
            
            <HStack>
              {!leaderboardLoading && filteredLeaderboard.length > 10 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  colorScheme="yellow" 
                  onClick={leaderboardLimit < filteredLeaderboard.length ? showAllLeaderboard : showLessLeaderboard}
                  rightIcon={leaderboardLimit < filteredLeaderboard.length ? <FaChevronDown /> : <FaChevronUp />}
                >
                  {leaderboardLimit < filteredLeaderboard.length ? "Show All" : "Show Less"}
                </Button>
              )}
            </HStack>
          </HStack>
          
          {/* Search Input for Leaderboard */}
          {!leaderboardLoading && leaderboard.length > 0 && (
            <InputGroup size="md" mb={4} maxW="md">
              <Input
                placeholder="Search trainee by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pr="4.5rem"
                borderColor={borderColor}
                _focus={{ borderColor: accentColor }}
              />
              <InputRightElement width="4.5rem">
                {searchQuery ? (
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    icon={<FaTimes />}
                    onClick={clearSearch}
                    aria-label="Clear search"
                    variant="ghost"
                  />
                ) : (
                  <Icon as={FaSearch} color="gray.500" />
                )}
              </InputRightElement>
            </InputGroup>
          )}
          
          {leaderboardLoading ? (
            <VStack spacing={4} py={4}>
              <Skeleton height="50px" width="100%" />
              <Skeleton height="50px" width="100%" />
              <Skeleton height="50px" width="100%" />
              <Skeleton height="50px" width="100%" />
            </VStack>
          ) : filteredLeaderboard.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              {searchQuery ? "No trainees match your search." : "No trainees have made progress on this assignment yet."}
            </Alert>
          ) : (
            <Box overflowX="auto" maxHeight="500px" overflowY="auto">
              <Table variant="simple">
                <Thead position="sticky" top={0} bg={tableHeaderBg} zIndex={1}>
                  <Tr>
                    <Th width="70px">Rank</Th>
                    <Th>Trainee</Th>
                    <Th>Progress</Th>
                    <Th isNumeric width="100px">Score</Th>
                    <Th width="50px"></Th> {/* New column for view button */}
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredLeaderboard.slice(0, leaderboardLimit).map((entry, index) => {
                    // Find original rank if filtered
                    const originalRank = searchQuery 
                      ? leaderboard.findIndex(item => item._id === entry._id)
                      : index;
                    
                    return (
                      <Tr key={entry._id} 
                        bg={originalRank < 3 ? `rgba(${originalRank === 0 ? '255, 215, 0' : originalRank === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.05)` : undefined}
                        _hover={{ bg: hoverBgColor }}
                      >
                        <Td>
                          <Flex align="center" justify="center">
                            {originalRank < 3 ? (
                              <Icon as={FaMedal} color={medals[originalRank]} boxSize={5} />
                            ) : (
                              <Text fontWeight="bold">{originalRank + 1}</Text>
                            )}
                          </Flex>
                        </Td>
                        <Td>
                          <HStack>
                            <Avatar size="sm" name={entry.user.name} />
                            <Text fontWeight={originalRank < 3 ? "bold" : "medium"}>
                              {entry.user.name}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Progress 
                              value={(entry.completedChallenges / entry.totalChallenges) * 100} 
                              size="sm" 
                              width="100%" 
                              colorScheme={originalRank === 0 ? "yellow" : originalRank === 1 ? "blue" : originalRank === 2 ? "orange" : "green"} 
                              borderRadius="full"
                            />
                            <Flex justify="space-between" width="100%">
                              <Text fontSize="xs" color="gray.500">
                                {Math.round((entry.completedChallenges / entry.totalChallenges) * 100)}% complete
                              </Text>
                              <Text fontSize="xs" fontWeight="medium">
                                {entry.completedChallenges}/{entry.totalChallenges} challenges
                              </Text>
                            </Flex>
                          </VStack>
                        </Td>
                        <Td isNumeric>
                          <Badge 
                            colorScheme={originalRank === 0 ? "yellow" : originalRank === 1 ? "blue" : originalRank === 2 ? "orange" : "green"}
                            fontSize="md"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            {Math.round(entry.overallScore)}
                          </Badge>
                        </Td>
                        <Td>
                          <IconButton
                            icon={<FaEye />}
                            aria-label="View submissions"
                            size="sm"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchTraineeSubmissions(entry.user._id, entry.user.name);
                            }}
                          />
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </VStack>

      {/* Submissions Modal */}
      <Modal isOpen={isSubmissionsModalOpen} onClose={onSubmissionsModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {currentTraineeName}'s Submissions
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {submissionsLoading ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : currentTraineeSubmissions.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No submissions found for this trainee.
              </Alert>
            ) : (
              <VStack align="stretch" spacing={4}>
                {/* Group submissions by challenge */}
                {Object.entries(
                  currentTraineeSubmissions.reduce((acc, submission) => {
                    const challengeName = submission.challenge.name;
                    if (!acc[challengeName]) {
                      acc[challengeName] = [];
                    }
                    acc[challengeName].push(submission);
                    return acc;
                  }, {})
                ).map(([challengeName, submissions]) => (
                  <Box key={challengeName} borderWidth={1} borderRadius="md" p={4}>
                    <Heading size="sm" mb={3}>{challengeName}</Heading>
                    <VStack align="stretch">
                      {submissions.map((submission) => {
                        // Calculate score to display
                        let score = "Pending";
                        let scoreColor = "gray";
                        
                        if (submission.automaticEvaluation && submission.automaticEvaluation.score) {
                          score = `${submission.automaticEvaluation.score}%`;
                          scoreColor = submission.automaticEvaluation.score >= 70 ? "green" : "orange";
                        } else if (submission.evaluations && submission.evaluations.length > 0) {
                          // If there are manual evaluations, use the latest one
                          const latestEval = submission.evaluations.sort(
                            (a, b) => new Date(b.evaluatedDate) - new Date(a.evaluatedDate)
                          )[0];
                          score = `${latestEval.score}%`;
                          scoreColor = latestEval.score >= 70 ? "green" : "orange";
                        }
                        
                        return (
                          <Flex 
                            key={submission._id}
                            justify="space-between" 
                            align="center"
                            p={2}
                            _hover={{ bg: hoverBgColor }}
                            borderRadius="md"
                            cursor="pointer"
                            onClick={() => {
                              navigate(`/submissions/${submission._id}`);
                              onSubmissionsModalClose();
                            }}
                          >
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm">
                                Submitted: {new Date(submission.submittedDate).toLocaleString()}
                              </Text>
                              <Badge colorScheme={
                                submission.transcriptionStatus === "completed" ? "green" : 
                                submission.transcriptionStatus === "failed" ? "red" : 
                                "yellow"
                              }>
                                {submission.transcriptionStatus}
                              </Badge>
                            </VStack>
                            <Badge colorScheme={scoreColor} px={2} py={1}>
                              {score}
                            </Badge>
                          </Flex>
                        );
                      })}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onSubmissionsModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AssignmentDetail;