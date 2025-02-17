import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import CriteriaInput from '../components/CriteriaInput';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Heading,
  useToast,
  VStack,
  Container,
  Progress,
  Text,
  useColorModeValue,
  FormHelperText,
  HStack} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const ChallengeForm = () => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    idealPitch: ''
  });
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [criteriaInput, setCriteriaInput] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState([]);
  const bgColor = useColorModeValue('white', 'gray.700');
  const navigate = useNavigate();

  const { name, description, idealPitch } = formData;
  const toast = useToast();
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (evaluationCriteria.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one evaluation criterion',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = {
        ...formData,
        evaluationCriteria: evaluationCriteria.map(({ keyword, weight }) => ({
          keyword,
          weight
        }))
      };

      await axios.post(
        'http://localhost:5000/api/challenges',
        formDataToSend,
        { headers: { 'x-auth-token': token } }
      );
      
      toast({
        title: 'Challenge created successfully',
        status: 'success',
        duration: 3000,
      });
      
      navigate('/challenges');
    } catch (error) {
      toast({
        title: 'Error creating challenge',
        description: error.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCriteriaKeyDown = (e) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && criteriaInput.trim()) {
      e.preventDefault();
      if (!evaluationCriteria.includes(criteriaInput.trim())) {
        setEvaluationCriteria([...evaluationCriteria, criteriaInput.trim()]);
      }
      setCriteriaInput('');
    }
  };

  const removeCriteria = (indexToRemove) => {
    setEvaluationCriteria(evaluationCriteria.filter((_, index) => index !== indexToRemove));
  };

  const steps = [
    { title: 'Basic Info', fields: ['name', 'description'] },
    { title: 'Ideal Pitch', fields: ['idealPitch'] },
    { title: 'Evaluation', fields: ['evaluationCriteria'] }
  ];

  const renderFormFields = () => {
    switch(step) {
      case 1:
        return (
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Challenge Name</FormLabel>
              <Input
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Enter challenge name"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={description}
                onChange={onChange}
                placeholder="Describe the challenge"
                minH="200px"
              />
              <FormHelperText>
                Provide a clear overview of the challenge objectives
              </FormHelperText>
            </FormControl>
          </VStack>
        );
      case 2:
        return (
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Ideal Pitch</FormLabel>
              <Textarea
                name="idealPitch"
                value={idealPitch}
                onChange={onChange}
                placeholder="Describe the ideal pitch"
                minH="150px"
              />
              <FormHelperText>
                Provide an example of what a good pitch should look like
              </FormHelperText>
            </FormControl>
          </VStack>
        );
      case 3:
        return (
          <VStack spacing={4} align="stretch">
            <FormControl isRequired={evaluationCriteria.length === 0}>
              <FormLabel>Evaluation Criteria</FormLabel>
              <CriteriaInput
                criteria={evaluationCriteria}
                onAdd={(newCriteria) => {
                  setEvaluationCriteria([...evaluationCriteria, newCriteria]);
                }}
                onRemove={(index) => {
                  setEvaluationCriteria(
                    evaluationCriteria.filter((_, i) => i !== index)
                  );
                }}
              />
              {evaluationCriteria.length === 0 && (
                <FormHelperText color="red.500">
                  At least one evaluation criterion is required
                </FormHelperText>
              )}
            </FormControl>
          </VStack>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8}>
        <Box w="100%" p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
          <VStack spacing={6}>
            <Heading size="lg">Create Challenge</Heading>
            <Progress
              value={(step / steps.length) * 100}
              w="100%"
              colorScheme="brand"
              borderRadius="full"
            />
            <Text color="gray.500">
              Step {step} of {steps.length}: {steps[step-1].title}
            </Text>
          </VStack>
        </Box>

        <Box w="100%" p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
          <form onSubmit={onSubmit}>
            <VStack spacing={6}>
              {renderFormFields()}
              
              <HStack w="100%" justify="space-between">
                <Button
                  onClick={() => setStep(step - 1)}
                  isDisabled={step === 1}
                  leftIcon={<ChevronLeftIcon />}
                >
                  Previous
                </Button>
                {step < steps.length ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    colorScheme="brand"
                    rightIcon={<ChevronRightIcon />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    colorScheme="brand"
                    isLoading={isSubmitting}
                    loadingText="Creating..."
                  >
                    Create Challenge
                  </Button>
                )}
              </HStack>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default ChallengeForm;
