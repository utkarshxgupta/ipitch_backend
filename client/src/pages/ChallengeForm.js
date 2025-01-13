import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Box, Button, FormControl, FormLabel, Input, Textarea, Heading, useToast } from "@chakra-ui/react";

const ChallengeForm = () => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompts: '',
    idealPitch: '',
    evaluationCriteria: ''
  });

  const { name, description, prompts, idealPitch, evaluationCriteria } = formData;
  const toast = useToast();
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/challenges',
        {
          name,
          description,
          prompts: prompts.split(',').map(prompt => prompt.trim()),
          idealPitch,
          evaluationCriteria: evaluationCriteria.split(',').map(criteria => criteria.trim())
        },
        { headers: { 'x-auth-token': token } }
      );
      toast({
        title: "Challenge created successfully!",
        status: "success",
        duration: 5000,
        isClosable: true
      });
      setFormData({
        name: '',
        description: '',
        prompts: '',
        idealPitch: '',
        evaluationCriteria: ''
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to create challenge",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
  };

  return (
    <Box as="form" onSubmit={onSubmit} p={4} borderWidth={1} borderRadius="lg">
      <Heading as="h2" size="lg" mb={4}>Create Challenge</Heading>
      <FormControl mb={4}>
        <FormLabel>Name</FormLabel>
        <Input type="text" name="name" value={name} onChange={onChange} required />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Description</FormLabel>
        <Textarea name="description" value={description} onChange={onChange} required />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Prompts (comma separated)</FormLabel>
        <Textarea name="prompts" value={prompts} onChange={onChange} />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Ideal Pitch (Video URL/ID)</FormLabel>
        <Input type="text" name="idealPitch" value={idealPitch} onChange={onChange} />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Evaluation Criteria (comma separated)</FormLabel>
        <Textarea name="evaluationCriteria" value={evaluationCriteria} onChange={onChange} required />
      </FormControl>
      <Button type="submit" colorScheme="brand">Create Challenge</Button>
    </Box>
  );
};

export default ChallengeForm;
