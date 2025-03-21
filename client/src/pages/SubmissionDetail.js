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
} from "@chakra-ui/react";
import AuthContext from "../context/authContext";

// Add this new component after the existing imports and before other components

const AutomaticEvaluationDisplay = ({ evaluation }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  
  if (!evaluation) return null;

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm" mb={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Automatic Evaluation</Heading>
        <Badge 
          colorScheme={evaluation.score >= 70 ? "green" : "orange"}
          fontSize="md"
        >
          Score: {evaluation.score}%
        </Badge>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <Box>
          <Text fontWeight="bold" mb={2}>Raw Score: {evaluation.rawScore}</Text>
          <Text fontSize="sm" color="gray.500">
            Out of maximum {evaluation.maxPossibleScore} points
          </Text>
        </Box>
        <Box>
          <Text fontWeight="bold" mb={2}>Evaluated On:</Text>
          <Text fontSize="sm" color="gray.500">
            {new Date(evaluation.evaluatedAt).toLocaleString()}
          </Text>
        </Box>
      </SimpleGrid>

      {evaluation.semanticSimilarity && (
        <Box mb={4} p={3} borderRadius="md" border="1px solid" borderColor="gray.200">
          <Text fontWeight="bold" mb={2}>Overall Semantic Similarity</Text>
          <HStack justify="space-between">
            <Text>Similarity Score:</Text>
            <Badge colorScheme={evaluation.semanticSimilarity.similarity > 0.7 ? "green" : 
                           evaluation.semanticSimilarity.similarity > 0.5 ? "yellow" : "red"}>
              {(evaluation.semanticSimilarity.similarity * 100).toFixed(1)}%
            </Badge>
          </HStack>
        </Box>
      )}

      <Box>
        <Text fontWeight="bold" mb={3}>Criteria Analysis</Text>
        <VStack spacing={3} align="stretch">
          {evaluation.details.map((detail, index) => {
            // Determine if this is a positive or negative match
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
    </Box>
  );
};

const SpeechMetricsDisplay = ({ metrics }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  
  // Comprehensive null checks
  if (!metrics || !metrics.overallMetrics || !metrics.thresholds) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
        <Text color="gray.500">Speech analysis data not available</Text>
      </Box>
    );
  }

  const {
    averageRate = 0
  } = metrics.overallMetrics;

  const {
    slow = 120,
    optimal = 150,
    fast = 180
  } = metrics.thresholds;

  const getRateStatus = (rate) => {
    if (!rate) return { color: "gray", text: "No Data" };
    if (rate < slow) return { color: "red", text: "Too Slow" };
    if (rate > fast) return { color: "yellow", text: "Too Fast" };
    return { color: "green", text: "Optimal" };
  };

  const status = getRateStatus(averageRate);

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm" mb={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Speech Analysis</Heading>
        <Badge variant="subtle" colorScheme={status.color}>
          {status.text}
        </Badge>
      </HStack>
      
      <Box 
        textAlign="center" 
        p={4} 
        borderRadius="md" 
        bg={`${status.color}.100`}
        border="1px solid"
        borderColor={`${status.color}.300`}
        maxW="300px"
        mx="auto"
      >
        <Text fontWeight="bold" color={`${status.color}.700`}>Speaking Rate</Text>
        <Text fontSize="3xl">{averageRate ? averageRate.toFixed(0) : '--'}</Text>
        <Text fontSize="sm" color="gray.600">words per minute</Text>
      </Box>
    </Box>
  );
};

// Separate Comment component to fix the Hook error
const Comment = ({ comment }) => {
  const bgColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" bg={bgColor}>
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
          {comment.commenter?.name || comment.commenter}
        </Text>
        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
          {new Date(comment.createdAt).toLocaleString()}
        </Text>
      </HStack>
      <Text fontSize={{ base: "sm", md: "md" }}>{comment.text}</Text>
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
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const toast = useToast();
  const { token } = useContext(AuthContext);
  const bgColor = useColorModeValue("white", "gray.700");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:5000/api/submissions/${submissionId}/evaluate`,
        { score, feedback },
        { headers: { "x-auth-token": token } }
      );
      onEvaluationAdded(response.data);
      toast({
        title: "Evaluation submitted",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error submitting evaluation",
        status: "error",
        duration: 3000,
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
      bg={bgColor}
    >
      <VStack spacing={4}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
          <Box>
            <Text mb={2}>Score (0-100)</Text>
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #E2E8F0",
              }}
            />
          </Box>
          <Box>
            <Text mb={2}>Feedback</Text>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter detailed feedback..."
            />
          </Box>
        </SimpleGrid>
        <Button type="submit" colorScheme="brand" width="100%">
          Submit Evaluation
        </Button>
      </VStack>
    </Box>
  );
};

const AutoEvaluationCard = ({ automaticEvaluation }) => {
  if (!automaticEvaluation) return null;

  return (
    <Box p={4} borderWidth={1} borderRadius="md" mb={4}>
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontWeight="bold">Overall Score:</Text>
          <Badge colorScheme={automaticEvaluation.score >= 70 ? "green" : "orange"}>
            {automaticEvaluation.score}%
          </Badge>
        </HStack>
        
        {automaticEvaluation.semanticSimilarity && (
          <HStack justify="space-between">
            <Text fontWeight="bold">Semantic Similarity:</Text>
            <Text>{(automaticEvaluation.semanticSimilarity.similarity * 100).toFixed(1)}%</Text>
          </HStack>
        )}

        <Text fontWeight="bold" mt={2}>Keyword Analysis:</Text>
        {automaticEvaluation.details.map((detail, index) => (
          <HStack key={index} justify="space-between">
            <Text>{detail.keyword}</Text>
            <Text>
              {detail.occurrences} occurrences (Score: {detail.score})
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

const SubmissionDetail = () => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const bgColor = useColorModeValue("white", "gray.800");
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [commentText, setCommentText] = useState("");

  const fetchSubmission = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/submissions/${id}`,
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
        `http://localhost:5000/api/submissions/${submission._id}/comment`,
        { text: commentText },
        { headers: { "x-auth-token": token } }
      );
      submission.comments.push(res.data);
      setCommentText("");
      onClose();
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

  if (loading) return <Spinner size="xl" />;
  if (!submission) return <Text>Submission not found</Text>;

  return (
    <Container maxW="container.xl" py={8}>
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
        {/* Left Column */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
              <Heading size="lg" mb={4}>
                Pitch Submission
              </Heading>
              <VideoPlayer url={submission.pitch} />
            </Box>

            {submission.transcript && (
              <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
                <Heading size="md" mb={4}>
                  Transcript
                </Heading>
                <Text whiteSpace="pre-wrap">{submission.transcript}</Text>
              </Box>
            )}

            {submission.transcriptionStatus === 'completed' ? (
              <SpeechMetricsDisplay metrics={submission.speechMetrics} />
            ) : submission.transcriptionStatus === 'processing' ? (
              <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
                <HStack spacing={4}>
                  <Spinner size="sm" />
                  <Text>Analyzing speech metrics...</Text>
                </HStack>
              </Box>
            ) : submission.transcriptionStatus === 'failed' ? (
              <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
                <Text color="red.500">Failed to analyze speech metrics</Text>
              </Box>
            ) : null}

            {/* Automatic Evaluation Display */}
            {submission.automaticEvaluation && (
              <AutomaticEvaluationDisplay evaluation={submission.automaticEvaluation} />
            )}
          </VStack>
        </GridItem>

        {/* Right Column */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
              <Heading size="md" mb={4}>
                Details
              </Heading>
              <VStack align="stretch" spacing={4}>
                {/* Add Challenge and Assignment info */}
                <HStack justify="space-between">
                  <Text fontWeight="bold">Challenge</Text>
                  <Text>{submission.challenge?.name || "N/A"}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Assignment</Text>
                  <Text>{submission.assignment?.name || "N/A"}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Transcription Status</Text>
                  <Badge
                    colorScheme={
                      submission.transcriptionStatus === "completed"
                        ? "green"
                        : submission.transcriptionStatus === "failed"
                        ? "red"
                        : "yellow"
                    }
                  >
                    {submission.transcriptionStatus}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Submitted by</Text>
                  <Text>{submission.trainee?.name || "N/A"}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Submitted on</Text>
                  <Text>
                    {new Date(submission.submittedDate).toLocaleString()}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Auto Evaluation</Text>
                  {submission.automaticEvaluation ? (
                    <Badge 
                      colorScheme={submission.automaticEvaluation.score >= 70 ? "green" : "orange"}
                    >
                      {submission.automaticEvaluation.score}%
                    </Badge>
                  ) : (
                    <Text>Pending</Text>
                  )}
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Manual Evaluations</Text>
                  <Text>
                    {submission.evaluations.length} {submission.evaluations.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Manual Evaluations */}
            {submission.evaluations.length > 0 && (
              <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
                <Heading size="md" mb={4}>
                  Manual Evaluations
                </Heading>
                <VStack spacing={4}>
                  {submission.evaluations.map((evaluation, idx) => (
                    <EvaluationCard key={idx} evaluation={evaluation} />
                  ))}
                </VStack>
              </Box>
            )}

            {/* Comments Section */}
            <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Comments</Heading>
                {user.role !== "trainee" && (
                  <Button size="sm" colorScheme="brand" onClick={onOpen}>
                    Add Comment
                  </Button>
                )}
              </HStack>
              <VStack spacing={4} align="stretch">
                {submission.comments?.map((comment) => (
                  <Comment key={comment._id} comment={comment} />
                ))}
              </VStack>
            </Box>

            {/* Evaluation Form for authorized users */}
            {(user.role.includes("trainer") ||
              user.role.includes("manager")) && (
              <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
                <Heading size="md" mb={4}>
                  Add Evaluation
                </Heading>
                <EvaluationForm
                  submissionId={submission._id}
                  onEvaluationAdded={(updated) => setSubmission(updated)}
                />
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>

      {/* Comment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Comment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              placeholder="Enter your comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={handleAddComment}>
              Post Comment
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default SubmissionDetail;
