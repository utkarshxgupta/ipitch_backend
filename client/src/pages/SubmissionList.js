import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import EvaluationForm from './EvaluationForm';
import { Box, Heading, List, ListItem, Spinner, Text, useToast } from "@chakra-ui/react";

const SubmissionList = () => {
  const { id } = useParams(); // Challenge ID
  const { token } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/submissions/${id}`, {
          headers: { 'x-auth-token': token }
        });
        setSubmissions(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Failed to fetch submissions',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [id, token, toast]);

  const handleEvaluation = (updatedSubmission) => {
    setSubmissions(
      submissions.map(sub =>
        sub._id === updatedSubmission._id ? updatedSubmission : sub
      )
    );
  };

  if (loading) {
    return <Spinner />;
  }

  if (!submissions.length) {
    return <Text>No submissions found</Text>;
  }

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>Submissions</Heading>
      <List spacing={3}>
        {submissions.map(submission => (
          <ListItem key={submission._id} p={4} borderWidth={1} borderRadius="lg">
            <Text><strong>Trainee:</strong> {submission.trainee.name}</Text>
            <Text><strong>Pitch:</strong> {submission.pitch}</Text>
            <Text><strong>Submitted Date:</strong> {new Date(submission.submittedDate).toLocaleDateString()}</Text>
            <EvaluationForm submissionId={submission._id} onEvaluation={handleEvaluation} />
            <Heading as="h3" size="md" mt={4}>Evaluations</Heading>
            <List spacing={2} mt={2}>
              {submission.evaluations.map(evaluation => (
                <ListItem key={evaluation._id}>
                  <Text><strong>Evaluator:</strong> {evaluation.evaluator.name}</Text>
                  <Text><strong>Score:</strong> {evaluation.score}</Text>
                  <Text><strong>Feedback:</strong> {evaluation.feedback}</Text>
                  <Text><strong>Date:</strong> {new Date(evaluation.evaluatedDate).toLocaleDateString()}</Text>
                </ListItem>
              ))}
            </List>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SubmissionList;
