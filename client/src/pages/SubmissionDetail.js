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
  <Box
    p={4}
    borderWidth={1}
    borderRadius="md"
    mb={4}
    bg={useColorModeValue("white", "gray.700")}
  >
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
      toast({
        title: "Error fetching submission",
        status: "error",
        duration: 3000,
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
              </VStack>
            </Box>

            {/* Evaluations */}
            {submission.evaluations.length > 0 && (
              <Box p={6} bg={bgColor} borderRadius="lg" shadow="sm">
                <Heading size="md" mb={4}>
                  Evaluations
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
