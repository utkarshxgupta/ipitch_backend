import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  VStack,
  Heading,
  Text,
  Badge,
  Spinner,
  Button,
  Textarea,
  useToast,
  Container,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  HStack,
  useColorModeValue,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Tooltip,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Flex,
  IconButton,
  Spacer,
  Drawer,
  DrawerOverlay,
  DrawerBody,
  DrawerHeader,
  DrawerContent,
  DrawerCloseButton,
  Divider,
  Progress,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/react";
import { InfoIcon, AddIcon, CheckIcon, StarIcon } from "@chakra-ui/icons";
import { FaVideo, FaFileAlt, FaChartBar, FaComments, FaRobot } from "react-icons/fa";
import AuthContext from "../context/authContext";

const AutomaticEvaluationDisplay = ({ evaluation }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  
  if (!evaluation) return null;

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm" mb={6}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <Box>
          <HStack mb={2}>
            <Text fontWeight="bold" fontSize="lg">Overall Score:</Text>
            <Tooltip 
              label={
                <Box>
                  <Text>Normalization formula:</Text>
                  <Text fontFamily="mono" fontWeight="bold">
                    score = (rawScore - minScore) × 100 ÷ (maxScore - minScore)
                  </Text>
                </Box>
              }
              placement="top"
              hasArrow
            >
              <Badge 
                colorScheme={evaluation.score >= 70 ? "green" : "orange"}
                fontSize="md"
                px={2}
                py={1}
              >
                {evaluation.score}% <InfoIcon ml={1} boxSize={3} />
              </Badge>
            </Tooltip>
          </HStack>
          <SimpleGrid columns={2} spacing={3} pl={2}>
            <Text fontSize="sm">Raw Score: <b>{evaluation.rawScore}</b></Text>
            <Text fontSize="sm">Max Possible: <b>{evaluation.maxPossibleScore}</b></Text>
          </SimpleGrid>
        </Box>
        <Box>
          <Text fontWeight="bold" mb={2}>Evaluated On:</Text>
          <Text fontSize="sm" color="gray.500">
            {new Date(evaluation.evaluatedAt).toLocaleString()}
          </Text>
          {evaluation.semanticSimilarity && (
            <Text mt={2}>
              Overall Semantic Similarity: 
              <Badge ml={2} colorScheme={evaluation.semanticSimilarity.similarity > 0.7 ? "green" : 
                           evaluation.semanticSimilarity.similarity > 0.5 ? "yellow" : "red"}>
                {(evaluation.semanticSimilarity.similarity * 100).toFixed(1)}%
              </Badge>
            </Text>
          )}
        </Box>
      </SimpleGrid>

      <Divider mb={4} />

      <Text fontWeight="bold" fontSize="lg" mb={4}>Criteria Analysis</Text>
      <VStack spacing={3} align="stretch">
        {evaluation.details.map((detail, index) => {
          const isPositiveMatch = detail.matched && detail.weight > 0;
          const isNegativeMatch = detail.matched && detail.weight < 0;
          
          return (
            <Box 
              key={index}
              p={3}
              borderRadius="md"
              border="1px solid"
              borderColor={
                isPositiveMatch ? "green.200" : 
                isNegativeMatch ? "red.200" : 
                "gray.200"
              }
              bg={
                isPositiveMatch ? "green.50" : 
                isNegativeMatch ? "red.50" : 
                ""
              }
              _dark={{
                bg: isPositiveMatch ? "rgba(74, 222, 128, 0.1)" : 
                    isNegativeMatch ? "rgba(248, 113, 113, 0.1)" : 
                    "",
                borderColor: isPositiveMatch ? "green.600" : 
                            isNegativeMatch ? "red.600" : 
                            "gray.600"
              }}
            >
              <HStack justify="space-between" mb={1}>
                <Text fontWeight="semibold">{detail.keyword}</Text>
                <Badge 
                  colorScheme={
                    isPositiveMatch ? "green" : 
                    isNegativeMatch ? "red" : 
                    "gray"
                  }
                >
                  {detail.matched ? 
                    (detail.weight > 0 ? "Included (Good)" : "Included (Bad)") : 
                    (detail.weight > 0 ? "Missing" : "Avoided (Good)")
                  }
                </Badge>
              </HStack>
              
              {detail.matched && detail.matchedSentence && (
                <Text 
                  fontSize="sm" 
                  fontStyle="italic" 
                  color={detail.weight > 0 ? "green.600" : "red.600"}
                  mb={2}
                >
                  "{detail.matchedSentence}"
                </Text>
              )}
              
              <SimpleGrid columns={3} spacing={2}>
                <Text fontSize="sm">Weight: {detail.weight}</Text>
                <Text fontSize="sm">Similarity: {(detail.similarity * 100).toFixed(1)}%</Text>
                <Text 
                  fontSize="sm" 
                  fontWeight="medium" 
                  color={
                    detail.score > 0 ? "green.600" : 
                    detail.score < 0 ? "red.600" : 
                    "gray.600"
                  }
                >
                  Score: {detail.score > 0 ? `+${detail.score}` : detail.score}
                </Text>
              </SimpleGrid>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

const SpeechMetricsDisplay = ({ metrics }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  
  if (!metrics) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
        <Text color="gray.500">Speech analysis data not available</Text>
      </Box>
    );
  }

  const {
    averageSpeechRate = 0,
    conversationalSpeechRate = 0,
    longPauses = 0,
    speakingTimePercent = 0,
    pauseDurations = []
  } = metrics;

  const getSpeechRateStatus = (rate) => {
    if (!rate) return { color: "gray", text: "No Data" };
    if (rate < 120) return { color: "orange", text: "Slow" };
    if (rate > 180) return { color: "orange", text: "Fast" };
    return { color: "green", text: "Good" };
  };

  const getSpeakingTimeStatus = (percent) => {
    if (!percent && percent !== 0) return { color: "gray", text: "No Data" };
    if (percent < 60) return { color: "orange", text: "Low Talk Time" };
    if (percent > 90) return { color: "orange", text: "Few Pauses" };
    return { color: "green", text: "Balanced" };
  };

  const getLongPausesStatus = (count) => {
    if (!count && count !== 0) return { color: "gray", text: "No Data" };
    if (count > 5) return { color: "orange", text: "Many" };
    return { color: "green", text: "Few" };
  };

  const averagePauseDuration = pauseDurations.length 
    ? pauseDurations.reduce((sum, duration) => sum + duration, 0) / pauseDurations.length
    : 0;

  const avgRateStatus = getSpeechRateStatus(averageSpeechRate);
  const convRateStatus = getSpeechRateStatus(conversationalSpeechRate);
  const speakingTimeStatus = getSpeakingTimeStatus(speakingTimePercent);
  const longPausesStatus = getLongPausesStatus(longPauses);

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm" mb={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Speech Analysis</Heading>
        <Badge variant="subtle" colorScheme={avgRateStatus.color}>
          {avgRateStatus.text} Pace
        </Badge>
      </HStack>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={4}>
        <Box>
          <Text fontWeight="bold" mb={2}>Speaking Rate</Text>
          <SimpleGrid columns={2} spacing={4}>
            <Box 
              p={3} 
              borderRadius="md" 
              bg={`${avgRateStatus.color}.100`}
              border="1px solid"
              borderColor={`${avgRateStatus.color}.300`}
              textAlign="center"
              _dark={{
                bg: `${avgRateStatus.color}.900`,
                borderColor: `${avgRateStatus.color}.700`,
              }}
            >
              <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>Average</Text>
              <Text fontSize="2xl" fontWeight="bold">{averageSpeechRate ? averageSpeechRate.toFixed(0) : '--'}</Text>
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>words per minute</Text>
            </Box>
            
            <Box 
              p={3} 
              borderRadius="md" 
              bg={`${convRateStatus.color}.100`}
              border="1px solid"
              borderColor={`${convRateStatus.color}.300`}
              textAlign="center"
              _dark={{
                bg: `${convRateStatus.color}.900`,
                borderColor: `${convRateStatus.color}.700`,
              }}
            >
              <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>Conversational</Text>
              <Text fontSize="2xl" fontWeight="bold">{conversationalSpeechRate ? conversationalSpeechRate.toFixed(0) : '--'}</Text>
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>words per minute</Text>
            </Box>
          </SimpleGrid>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Speaking Time</Text>
          <Box 
            p={3} 
            borderRadius="md" 
            bg={`${speakingTimeStatus.color}.100`}
            border="1px solid"
            borderColor={`${speakingTimeStatus.color}.300`}
            _dark={{
              bg: `${speakingTimeStatus.color}.900`,
              borderColor: `${speakingTimeStatus.color}.700`,
            }}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm">Speaking vs Pausing</Text>
              <Text fontWeight="medium">{speakingTimePercent ? speakingTimePercent.toFixed(0) : '--'}%</Text>
            </HStack>
            <Box w="100%" h="8px" bg="gray.200" borderRadius="full" overflow="hidden" _dark={{ bg: "gray.600" }}>
              <Box 
                h="100%" 
                w={`${speakingTimePercent}%`} 
                bg={`${speakingTimeStatus.color}.500`} 
                borderRadius="full"
              />
            </Box>
            <HStack justify="space-between" mt={1}>
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>0%</Text>
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>100%</Text>
            </HStack>
          </Box>
        </Box>
      </SimpleGrid>
      
      <Box mt={4}>
        <Text fontWeight="bold" mb={2}>Pauses Analysis</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box 
            p={3} 
            borderRadius="md" 
            bg={`${longPausesStatus.color}.100`}
            border="1px solid"
            borderColor={`${longPausesStatus.color}.300`}
            _dark={{
              bg: `${longPausesStatus.color}.900`,
              borderColor: `${longPausesStatus.color}.700`,
            }}
          >
            <HStack justify="space-between">
              <Text>Long Pauses</Text>
              <Badge colorScheme={longPausesStatus.color}>{longPauses || 0}</Badge>
            </HStack>
            <Text fontSize="xs" mt={1} color="gray.500" _dark={{ color: "gray.400" }}>Extended pauses detected during the speech</Text>
          </Box>
          
          <Box 
            p={3} 
            borderRadius="md" 
            bg="gray.100"
            border="1px solid"
            borderColor="gray.300"
            _dark={{
              bg: "gray.700",
              borderColor: "gray.600",
            }}
          >
            <HStack justify="space-between">
              <Text>Avg Pause Duration</Text>
              <Text fontWeight="bold">{averagePauseDuration.toFixed(1)}s</Text>
            </HStack>
            <Text fontSize="xs" mt={1} color="gray.500" _dark={{ color: "gray.400" }}>Average length of pauses in seconds</Text>
          </Box>
        </SimpleGrid>
      </Box>
      
      {pauseDurations.length > 0 && (
        <Box mt={4} p={3} borderRadius="md" border="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.600" }}>
          <Text fontWeight="bold" mb={2}>Pause Pattern</Text>
          <HStack h="40px" spacing={1} align="flex-end">
            {pauseDurations.map((duration, index) => {
              const height = Math.min(Math.max(duration * 10, 5), 40);
              return (
                <Box 
                  key={index} 
                  h={`${height}px`} 
                  w="full" 
                  bg={duration > 2 ? "orange.400" : "blue.400"}
                  borderRadius="sm"
                />
              );
            })}
          </HStack>
          <Text fontSize="xs" mt={1} color="gray.500" _dark={{ color: "gray.400" }}>
            Each bar represents a pause (orange for long pauses {'>'}2s)
          </Text>
        </Box>
      )}
    </Box>
  );
};

const Comment = ({ comment }) => {
  const bgColor = useColorModeValue("gray.50", "gray.700");
  
  return (
    <Box 
      p={4} 
      borderRadius="lg" 
      bg={bgColor}
      borderWidth="1px"
      borderColor={useColorModeValue("gray.200", "gray.600")}
      transition="all 0.2s"
      _hover={{ boxShadow: "sm" }}
    >
      <HStack mb={3} spacing={3}>
        <Avatar 
          size="sm" 
          name={comment.commenter?.name || comment.commenter} 
        />
        <Box>
          <Text fontWeight="bold" fontSize="sm">
            {comment.commenter?.name || comment.commenter}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {new Date(comment.createdAt).toLocaleString()}
          </Text>
        </Box>
      </HStack>
      <Text ml={10} fontSize="md">
        {comment.text}
      </Text>
    </Box>
  );
};

const VideoPlayer = ({ url }) => (
  <Box
    maxW="800px"
    mx="auto"
    borderRadius="lg"
    overflow="hidden"
    boxShadow="lg"
  >
    <video controls width="100%" style={{ aspectRatio: "16/9" }}>
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </Box>
);

const EvaluationCard = ({ evaluation }) => (
  <Box p={4} borderWidth={1} borderRadius="md" mb={4} bg={useColorModeValue("white", "gray.700")}>
    <HStack justify="space-between" mb={2}>
      <Text fontWeight="bold" fontSize="lg">
        Score: {evaluation.score}
      </Text>
      <Badge colorScheme={evaluation.score >= 70 ? "green" : "orange"}>
        {evaluation.score >= 70 ? "Pass" : "Needs Improvement"}
      </Badge>
    </HStack>
    <Text mb={2}>Feedback: {evaluation.feedback}</Text>
    <Text fontSize="sm" color="gray.500">
      Evaluated on: {new Date(evaluation.evaluatedDate).toLocaleString()}
    </Text>
  </Box>
);

const EvaluationForm = ({ submissionId, onEvaluationAdded }) => {
  const [score, setScore] = useState(70);
  const [feedback, setFeedback] = useState("");
  const toast = useToast();
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide feedback for your evaluation",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/submissions/${submissionId}/evaluate`,
        { score, feedback },
        { headers: { "x-auth-token": token } }
      );
      onEvaluationAdded(response.data);
    } catch (error) {
      toast({
        title: "Error submitting evaluation",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <VStack spacing={6} as="form" onSubmit={handleSubmit}>
      <Box w="100%">
        <Text mb={2} fontWeight="medium">Score: {score}</Text>
        <Flex align="center">
          <Text mr={3} fontSize="sm">0</Text>
          <Slider
            flex="1"
            colorScheme="brand"
            value={score}
            onChange={(val) => setScore(val)}
            min={0}
            max={100}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6}>
              <Box color="brand.500">
                <StarIcon />
              </Box>
            </SliderThumb>
          </Slider>
          <Text ml={3} fontSize="sm">100</Text>
        </Flex>
      </Box>

      <Box w="100%">
        <Text mb={2} fontWeight="medium">Detailed Feedback</Text>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide thorough feedback about the submission..."
          size="md"
          h="200px"
          resize="vertical"
        />
      </Box>

      <Button
        type="submit"
        colorScheme="brand"
        isFullWidth
        size="lg"
        leftIcon={<CheckIcon />}
      >
        Submit Evaluation
      </Button>
    </VStack>
  );
};

const SubmissionDetail = () => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const evaluationBg = useColorModeValue("white", "gray.800");
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const toast = useToast();
  const { 
    isOpen: isCommentOpen, 
    onOpen: onCommentOpen, 
    onClose: onCommentClose 
  } = useDisclosure();
  const {
    isOpen: isEvalOpen,
    onOpen: onEvalOpen,
    onClose: onEvalClose
  } = useDisclosure();
  const [commentText, setCommentText] = useState("");

  const fetchSubmission = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/submissions/${id}`,
        {
          headers: { "x-auth-token": token },
        }
      );
      setSubmission(response.data);
    } catch (error) {
      const errorMessage = error.response?.status === 401 
        ? "Session expired. Please login again"
        : "Error fetching submission details";
        
      toast({
        title: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const handleAddComment = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/submissions/${submission._id}/comment`,
        { text: commentText },
        { headers: { "x-auth-token": token } }
      );
      submission.comments.push(res.data);
      setCommentText("");
      onCommentClose();
      toast({
        title: "Comment added successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Failed to add comment",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) return (
    <Flex justify="center" align="center" h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
        <Text>Loading submission details...</Text>
      </VStack>
    </Flex>
  );
  
  if (!submission) return <Text>Submission not found</Text>;

  const averageManualScore = submission.evaluations.length > 0
    ? submission.evaluations.reduce((acc, evaluation) => acc + evaluation.score, 0) / submission.evaluations.length
    : null;

  return (
    <Box>
      <Box 
        py={4} 
        px={6} 
        bg={bgColor} 
        borderBottom="1px" 
        borderColor="gray.200"
        position="sticky"
        top="0"
        zIndex="sticky"
        boxShadow="sm"
        _dark={{
          borderColor: "gray.700"
        }}
      >
        <Container maxW="container.xl">
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={4}>
            <GridItem>
              <Heading size="lg">{submission.assignment?.name || "Pitch Submission"}</Heading>
              <HStack mt={2} flexWrap="wrap">
                <Badge colorScheme="purple">{submission.challenge?.name || "Challenge"}</Badge>
                <Badge 
                  colorScheme={
                    submission.transcriptionStatus === "completed" ? "green" :
                    submission.transcriptionStatus === "failed" ? "red" : "yellow"
                  }
                >
                  {submission.transcriptionStatus}
                </Badge>
                
                {submission.automaticEvaluation && (
                  <Tooltip 
                    label="Score is normalized: (score - lower limit)*100/(upper limit - lower limit)"
                    placement="top"
                    hasArrow
                  >
                    <Badge colorScheme={submission.automaticEvaluation.score >= 70 ? "green" : "orange"}>
                      Auto Score: {submission.automaticEvaluation.score}%
                      <InfoIcon ml={1} boxSize={3} />
                    </Badge>
                  </Tooltip>
                )}
                
                {averageManualScore && (
                  <Badge colorScheme={averageManualScore >= 70 ? "green" : "orange"}>
                    Manual Score: {averageManualScore.toFixed(0)}%
                  </Badge>
                )}
              </HStack>
            </GridItem>
            <GridItem>
              <HStack justifyContent="flex-end" spacing={4}>
                <VStack align="flex-end" spacing={0}>
                  <HStack>
                    <Text fontWeight="medium">Submitted by:</Text>
                    <Text>{submission.trainee?.name || "Unknown"}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(submission.submittedDate).toLocaleString()}
                  </Text>
                </VStack>
                <Avatar size="md" name={submission.trainee?.name || "Unknown"} />
              </HStack>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          <GridItem>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
                <CardHeader pb={2}>
                  <Heading size="md">Pitch Video</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VideoPlayer url={submission.pitch} />
                </CardBody>
              </Card>
              
              <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
                <Tabs isFitted variant="enclosed" onChange={(index) => setTabIndex(index)}>
                  <TabList>
                    <Tab>
                      <HStack>
                        <Icon as={FaFileAlt} />
                        <Text>Transcript</Text>
                      </HStack>
                    </Tab>
                    <Tab>
                      <HStack>
                        <Icon as={FaRobot} />
                        <Text>Auto Evaluation</Text>
                      </HStack>
                    </Tab>
                    <Tab>
                      <HStack>
                        <Icon as={FaChartBar} />
                        <Text>Speech Metrics</Text>
                      </HStack>
                    </Tab>
                    <Tab>
                      <HStack>
                        <Icon as={FaComments} />
                        <Text>Comments ({submission.comments?.length || 0})</Text>
                      </HStack>
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel>
                      {submission.transcript ? (
                        <Box py={2}>
                          <Text whiteSpace="pre-wrap" fontSize="md" lineHeight="tall">
                            {submission.transcript}
                          </Text>
                        </Box>
                      ) : (
                        <Box py={8} textAlign="center">
                          <Text color="gray.500">Transcript not available</Text>
                        </Box>
                      )}
                    </TabPanel>

                    <TabPanel>
                      {submission.automaticEvaluation ? (
                        <AutomaticEvaluationDisplay evaluation={submission.automaticEvaluation} />
                      ) : (
                        <Box py={8} textAlign="center">
                          <Text color="gray.500">Automatic evaluation not available</Text>
                        </Box>
                      )}
                    </TabPanel>

                    <TabPanel>
                      {submission.transcriptionStatus === 'completed' ? (
                        <SpeechMetricsDisplay metrics={submission.speechMetrics} />
                      ) : submission.transcriptionStatus === 'processing' ? (
                        <Box py={8} textAlign="center">
                          <Spinner size="md" mb={4} />
                          <Text color="gray.500">Analyzing speech metrics...</Text>
                        </Box>
                      ) : (
                        <Box py={8} textAlign="center">
                          <Text color="gray.500">Speech metrics not available</Text>
                        </Box>
                      )}
                    </TabPanel>

                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        {submission.comments && submission.comments.length > 0 ? (
                          submission.comments.map((comment) => (
                            <Comment key={comment._id} comment={comment} />
                          ))
                        ) : (
                          <Box py={8} textAlign="center">
                            <Text color="gray.500">No comments yet</Text>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Card>
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
                <CardHeader pb={0}>
                  <Heading size="md">Submission Overview</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Auto Score</StatLabel>
                      <StatNumber>
                        {submission.automaticEvaluation ? 
                          `${submission.automaticEvaluation.score}%` : 
                          "N/A"}
                      </StatNumber>
                      <StatHelpText>
                        AI-generated
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Manual Reviews</StatLabel>
                      <StatNumber>{submission.evaluations.length}</StatNumber>
                      <StatHelpText>
                        {averageManualScore ? `${averageManualScore.toFixed(0)}% avg` : "No reviews yet"}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Words per Min</StatLabel>
                      <StatNumber>
                        {submission.speechMetrics?.averageSpeechRate ? 
                          submission.speechMetrics.averageSpeechRate.toFixed(0) : 
                          "N/A"}
                      </StatNumber>
                      <StatHelpText>Speaking rate</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Speaking Time</StatLabel>
                      <StatNumber>
                        {submission.speechMetrics?.speakingTimePercent ? 
                          `${submission.speechMetrics.speakingTimePercent.toFixed(0)}%` : 
                          "N/A"}
                      </StatNumber>
                      <StatHelpText>vs. pauses</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
                <CardHeader pb={1}>
                  <Flex align="center">
                    <Heading size="md">Manual Evaluations</Heading>
                    <Spacer />
                    <Text fontSize="sm" color="gray.500">
                      {submission.evaluations.length} {submission.evaluations.length === 1 ? 'review' : 'reviews'}
                    </Text>
                  </Flex>
                </CardHeader>
                <CardBody>
                  {submission.evaluations.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {submission.evaluations.map((evaluation, idx) => (
                        <Box 
                          key={idx} 
                          p={4} 
                          borderWidth="1px" 
                          borderRadius="md" 
                          bg={evaluationBg}
                        >
                          <Flex align="center" mb={2}>
                            <HStack>
                              <Badge 
                                colorScheme={evaluation.score >= 70 ? "green" : "orange"}
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {evaluation.score}%
                              </Badge>
                              {evaluation.evaluator && (
                                <Text fontSize="sm" fontWeight="medium">
                                  by {evaluation.evaluator.name || "Evaluator"}
                                </Text>
                              )}
                            </HStack>
                            <Spacer />
                            <Text fontSize="xs" color="gray.500">
                              {new Date(evaluation.evaluatedDate).toLocaleDateString()}
                            </Text>
                          </Flex>
                          <Text fontSize="sm">{evaluation.feedback}</Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Box py={4} textAlign="center">
                      <Text color="gray.500">No manual evaluations yet</Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
              
              {tabIndex !== 3 && submission.comments && submission.comments.length > 0 && (
                <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
                  <CardHeader pb={1}>
                    <Flex align="center">
                      <Heading size="md">Recent Comments</Heading>
                      <Spacer />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="brand"
                        onClick={() => setTabIndex(3)}
                      >
                        View All
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {submission.comments.slice(0, 2).map((comment) => (
                        <HStack key={comment._id} spacing={3}>
                          <Avatar size="sm" name={comment.commenter?.name || "User"} />
                          <Box flex="1">
                            <Text fontSize="sm" fontWeight="bold">
                              {comment.commenter?.name || comment.commenter || "User"}
                            </Text>
                            <Text fontSize="sm" noOfLines={1}>
                              {comment.text}
                            </Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </GridItem>
        </Grid>
      </Container>

      {(user.role.includes("trainer") || user.role.includes("manager")) && (
        <Tooltip label="Add evaluation">
          <IconButton
            icon={<AddIcon />}
            colorScheme="brand"
            size="lg"
            isRound
            position="fixed"
            bottom="6"
            right="6"
            boxShadow="lg"
            onClick={onEvalOpen}
            aria-label="Add evaluation"
            zIndex="tooltip"
          />
        </Tooltip>
      )}

      {user.role !== "trainee" && tabIndex === 3 && (
        <Tooltip label="Add comment">
          <IconButton
            icon={<FaComments />}
            colorScheme="brand"
            size="lg"
            isRound
            position="fixed"
            bottom={user.role.includes("trainer") || user.role.includes("manager") ? "20" : "6"}
            right="6"
            boxShadow="lg"
            onClick={onCommentOpen}
            aria-label="Add comment"
            zIndex="tooltip"
          />
        </Tooltip>
      )}

      <Modal isOpen={isCommentOpen} onClose={onCommentClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Comment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              placeholder="Enter your comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              h="150px"
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={handleAddComment}>
              Post Comment
            </Button>
            <Button variant="ghost" onClick={onCommentClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Drawer
        isOpen={isEvalOpen}
        placement="right"
        onClose={onEvalClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Add Evaluation
          </DrawerHeader>

          <DrawerBody py={6}>
            <EvaluationForm
              submissionId={submission._id}
              onEvaluationAdded={(updated) => {
                setSubmission(updated);
                onEvalClose();
                toast({
                  title: "Evaluation added",
                  status: "success",
                  duration: 3000,
                });
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default SubmissionDetail;
