import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import SubmissionForm from './SubmissionForm';
import { toast } from 'react-toastify';
import { Box, Heading, Text, Spinner, VStack, HStack, Divider } from "@chakra-ui/react";

const ChallengeDetail = () => {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role || [];
  console.log(userRole);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/challenges/${id}`, {
          headers: { 'x-auth-token': token }
        });
        setChallenge(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch challenge');
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, token]);

  if (loading) {
    return <Spinner />;
  }

  if (!challenge) {
    return <Text>Challenge not found</Text>;
  }

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
      <Heading as="h2" size="lg" mb={4}>{challenge.name}</Heading>
      <VStack align="start" spacing={4}>
        <HStack>
          <Text fontWeight="bold">Description:</Text>
          <Text>{challenge.description}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="bold">Prompts:</Text>
          <Text>{challenge.prompts.join(', ')}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="bold">Ideal Pitch:</Text>
          <Text>{challenge.idealPitch}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="bold">Evaluation Criteria:</Text>
          <Text>{challenge.evaluationCriteria.join(', ')}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="bold">Created By:</Text>
          <Text>{challenge.createdBy.name}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="bold">Created Date:</Text>
          <Text>{new Date(challenge.createdDate).toLocaleDateString()}</Text>
        </HStack>
        <Divider />
        {userRole.includes('trainee') && (
          <Box w="100%">
            <Heading as="h3" size="md" mb={4}>Submit Your Solution</Heading>
            <SubmissionForm challengeId={challenge._id} />
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ChallengeDetail;
