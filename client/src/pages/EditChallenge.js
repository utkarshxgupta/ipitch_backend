import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/authContext";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
  HStack,
  useToast,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  FormErrorMessage,
  Spinner,
  Switch,
  useColorModeValue,
  Divider,
  Badge,
  Flex,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Tooltip,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { 
  ChevronRightIcon, 
  ArrowBackIcon, 
  AddIcon, 
  DeleteIcon, 
  InfoIcon,
  WarningIcon,
  CheckIcon,
  CloseIcon
} from "@chakra-ui/icons";
import { FaPlus, FaMinus, FaGripVertical, FaEdit } from "react-icons/fa";

const EditChallenge = () => {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const theadBgColor = useColorModeValue("gray.50", "gray.700");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    idealPitch: "",
    evaluationCriteria: [],
    isNew: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // For new criteria
  const [newCriterion, setNewCriterion] = useState({ keyword: "", weight: 1 });
  const [criteriaError, setCriteriaError] = useState(null);
  
  // For confirmation modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [criterionToDelete, setCriterionToDelete] = useState(null);

  // Add new state variables for editing criteria in place
  const [editingCriterionIndex, setEditingCriterionIndex] = useState(null);
  const [editingCriterionValue, setEditingCriterionValue] = useState({ keyword: "", weight: 0 });
  
  // Add state variables for drag and drop
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const dragOverItemIndex = useRef(null);

  useEffect(() => {
    // Check if user has permission to edit
    if (user && !(user.role.includes('admin') || user.role.includes('trainer'))) {
      toast({
        title: "Access denied",
        description: "You don't have permission to edit challenges",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      navigate('/challenges');
      return;
    }

    const fetchChallenge = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/challenges/${id}`, {
          headers: { "x-auth-token": token },
        });
        
        const { name, description, idealPitch, evaluationCriteria, isNew } = res.data;
        setFormData({ 
          name, 
          description, 
          idealPitch: idealPitch || "", 
          evaluationCriteria: evaluationCriteria || [],
          isNew: isNew || false 
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to fetch challenge",
          description: err.response?.data?.msg || "Something went wrong",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        navigate('/challenges');
      }
    };

    fetchChallenge();
  }, [id, token, user, navigate, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleNewCriterionChange = (name, value) => {
    setNewCriterion({
      ...newCriterion,
      [name]: value,
    });
    setCriteriaError(null);
  };

  const addCriterion = () => {
    if (!newCriterion.keyword.trim()) {
      setCriteriaError("Keyword is required");
      return;
    }
    
    // Check if keyword already exists
    if (formData.evaluationCriteria.some(c => 
      c.keyword.toLowerCase() === newCriterion.keyword.toLowerCase())
    ) {
      setCriteriaError("This keyword already exists");
      return;
    }
    
    setFormData({
      ...formData,
      evaluationCriteria: [...formData.evaluationCriteria, { ...newCriterion }],
    });
    
    // Reset the form
    setNewCriterion({ keyword: "", weight: 1 });
    setCriteriaError(null);
  };

  const confirmDeleteCriterion = (index) => {
    setCriterionToDelete(index);
    onOpen();
  };

  const deleteCriterion = () => {
    const updatedCriteria = [...formData.evaluationCriteria];
    updatedCriteria.splice(criterionToDelete, 1);
    
    setFormData({
      ...formData,
      evaluationCriteria: updatedCriteria,
    });
    
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.idealPitch.trim()) newErrors.idealPitch = "Ideal pitch is required";
    if (formData.evaluationCriteria.length === 0) {
      newErrors.evaluationCriteria = "At least one evaluation criterion is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/challenges/${id}`,
        formData,
        { headers: { "x-auth-token": token } }
      );
      
      toast({
        title: "Challenge updated",
        description: "The challenge has been successfully updated",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      navigate(`/challenges/${id}`);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to update challenge",
        description: err.response?.data?.msg || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add function to start editing a criterion
  const startEditingCriterion = (index) => {
    setEditingCriterionIndex(index);
    setEditingCriterionValue({...formData.evaluationCriteria[index]});
  };

  // Add function to save edited criterion
  const saveEditedCriterion = () => {
    if (!editingCriterionValue.keyword.trim()) {
      toast({
        title: "Invalid input",
        description: "Keyword cannot be empty",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if keyword already exists in other criteria
    const keywordExists = formData.evaluationCriteria.some(
      (c, idx) => idx !== editingCriterionIndex && 
      c.keyword.toLowerCase() === editingCriterionValue.keyword.toLowerCase()
    );

    if (keywordExists) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword already exists in another criterion",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updatedCriteria = [...formData.evaluationCriteria];
    updatedCriteria[editingCriterionIndex] = {...editingCriterionValue};
    
    setFormData({
      ...formData,
      evaluationCriteria: updatedCriteria,
    });
    
    // Reset editing state
    setEditingCriterionIndex(null);
    setEditingCriterionValue({ keyword: "", weight: 0 });
  };

  // Add functions for drag and drop
  const handleDragStart = (index) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    dragOverItemIndex.current = index;
  };

  const handleDragEnd = () => {
    if (draggedItemIndex === null || dragOverItemIndex.current === null || 
        draggedItemIndex === dragOverItemIndex.current) {
      setDraggedItemIndex(null);
      return;
    }
    
    const updatedCriteria = [...formData.evaluationCriteria];
    const draggedItem = updatedCriteria[draggedItemIndex];
    
    // Remove dragged item from array
    updatedCriteria.splice(draggedItemIndex, 1);
    
    // Insert item at the drop position
    updatedCriteria.splice(dragOverItemIndex.current, 0, draggedItem);
    
    setFormData({
      ...formData,
      evaluationCriteria: updatedCriteria,
    });
    
    // Reset drag state
    setDraggedItemIndex(null);
  };

  if (loading) {
    return (
      <Container maxW="container.md" centerContent py={16}>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Breadcrumb separator={<ChevronRightIcon color="gray.500" />}>
            <BreadcrumbItem>
              <BreadcrumbLink href="/challenges" color="gray.500">Challenges</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/challenges/${id}`} color="gray.500">Challenge Details</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink color="brand.500" fontWeight="medium">Edit Challenge</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          <Heading size="lg" mt={4} mb={1}>Edit Challenge</Heading>
          <Text color="gray.500">Update challenge details and evaluation criteria</Text>
        </Box>

        <Box 
          as="form" 
          onSubmit={handleSubmit} 
          bg={bgColor} 
          p={8} 
          borderRadius="lg" 
          shadow="base"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={errors.name}>
              <FormLabel htmlFor="name" fontWeight="medium">Challenge Name</FormLabel>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter challenge name"
                focusBorderColor="brand.400"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.description}>
              <FormLabel htmlFor="description" fontWeight="medium">Description</FormLabel>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter challenge description"
                rows={4}
                focusBorderColor="brand.400"
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={errors.idealPitch}>
              <FormLabel htmlFor="idealPitch" fontWeight="medium">
                Ideal Pitch
                <Tooltip hasArrow label="Define what an ideal pitch for this challenge should contain">
                  <InfoIcon ml={2} color="gray.500" boxSize={4} />
                </Tooltip>
              </FormLabel>
              <Textarea
                id="idealPitch"
                name="idealPitch"
                value={formData.idealPitch}
                onChange={handleChange}
                placeholder="Describe what an ideal pitch should contain"
                rows={4}
                focusBorderColor="brand.400"
              />
              <FormErrorMessage>{errors.idealPitch}</FormErrorMessage>
            </FormControl>

            <Box>
              <FormControl isInvalid={errors.evaluationCriteria}>
                <FormLabel fontWeight="medium">
                  Evaluation Criteria
                  <Tooltip hasArrow label="Keywords to look for in submissions, with positive or negative weights">
                    <InfoIcon ml={2} color="gray.500" boxSize={4} />
                  </Tooltip>
                </FormLabel>
                {errors.evaluationCriteria && (
                  <FormErrorMessage mb={2}>{errors.evaluationCriteria}</FormErrorMessage>
                )}
                
                {/* Existing criteria */}
                {formData.evaluationCriteria.length > 0 ? (
                  <TableContainer mb={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                    <Table>
                      <Thead bg={theadBgColor}>
                        <Tr>
                          <Th width="50px"></Th>
                          <Th>Keyword</Th>
                          <Th isNumeric>Weight</Th>
                          <Th width="120px">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {formData.evaluationCriteria.map((criterion, index) => (
                          <Tr 
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            bg={draggedItemIndex === index ? "gray.100" : "transparent"}
                            cursor="move"
                            _hover={{ bg: "gray.50" }}
                          >
                            <Td width="50px" p={2}>
                              <Icon 
                                as={FaGripVertical} 
                                color="gray.400"
                                cursor="grab" 
                                aria-label="Drag to reorder"
                              />
                            </Td>
                            <Td>
                              {editingCriterionIndex === index ? (
                                <Input
                                  value={editingCriterionValue.keyword}
                                  onChange={(e) => setEditingCriterionValue({
                                    ...editingCriterionValue, 
                                    keyword: e.target.value
                                  })}
                                  size="sm"
                                />
                              ) : (
                                <Tag
                                  size="md"
                                  variant="subtle"
                                  colorScheme={criterion.weight > 0 ? "green" : "red"}
                                >
                                  <TagLabel>{criterion.keyword}</TagLabel>
                                </Tag>
                              )}
                            </Td>
                            <Td isNumeric>
                              {editingCriterionIndex === index ? (
                                <NumberInput 
                                  value={editingCriterionValue.weight} 
                                  onChange={(valueStr) => setEditingCriterionValue({
                                    ...editingCriterionValue, 
                                    weight: parseInt(valueStr)
                                  })}
                                  min={-10}
                                  max={10}
                                  size="sm"
                                  width="80px"
                                  ml="auto"
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              ) : (
                                <Text fontWeight="medium" color={criterion.weight > 0 ? "green.500" : "red.500"}>
                                  {criterion.weight > 0 ? `+${criterion.weight}` : criterion.weight}
                                </Text>
                              )}
                            </Td>
                            <Td>
                              {editingCriterionIndex === index ? (
                                <HStack spacing={1}>
                                  <IconButton
                                    aria-label="Save changes"
                                    icon={<CheckIcon />}
                                    size="sm"
                                    colorScheme="green"
                                    onClick={saveEditedCriterion}
                                  />
                                  <IconButton
                                    aria-label="Cancel editing"
                                    icon={<CloseIcon />}
                                    size="sm"
                                    colorScheme="gray"
                                    onClick={() => setEditingCriterionIndex(null)}
                                  />
                                </HStack>
                              ) : (
                                <HStack spacing={1}>
                                  <IconButton
                                    aria-label="Edit criterion"
                                    icon={<FaEdit />}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => startEditingCriterion(index)}
                                  />
                                  <IconButton
                                    aria-label="Delete criterion"
                                    icon={<DeleteIcon />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => confirmDeleteCriterion(index)}
                                  />
                                </HStack>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert status="info" mb={4} borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>No evaluation criteria defined yet. Add some below.</AlertDescription>
                  </Alert>
                )}
                
                {/* Add new criterion */}
                <Box borderWidth="1px" borderRadius="md" p={4} borderColor={borderColor}>
                  <Heading size="sm" mb={3}>Add New Criterion</Heading>
                  <HStack spacing={4} align="flex-end">
                    <FormControl isInvalid={criteriaError !== null}>
                      <FormLabel fontSize="sm">Keyword</FormLabel>
                      <Input 
                        placeholder="e.g., Clarity, Enthusiasm"
                        value={newCriterion.keyword}
                        onChange={(e) => handleNewCriterionChange("keyword", e.target.value)}
                        size="md"
                      />
                      {criteriaError && <FormErrorMessage>{criteriaError}</FormErrorMessage>}
                    </FormControl>
                    
                    <FormControl w="150px">
                      <FormLabel fontSize="sm">Weight</FormLabel>
                      <NumberInput 
                        value={newCriterion.weight} 
                        onChange={(valueStr) => handleNewCriterionChange("weight", parseInt(valueStr))}
                        min={-10}
                        max={10}
                        size="md"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="brand"
                      onClick={addCriterion}
                      size="md"
                    >
                      Add
                    </Button>
                  </HStack>
                  <Flex mt={2} align="center">
                    <Icon as={FaPlus} color="green.500" mr={1} />
                    <Text fontSize="sm" color="gray.500">Positive values are rewarded</Text>
                    <Icon as={FaMinus} color="red.500" ml={3} mr={1} />
                    <Text fontSize="sm" color="gray.500">Negative values are penalized</Text>
                  </Flex>
                </Box>
              </FormControl>
            </Box>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="isNew" mb="0" fontWeight="medium">
                Mark as new challenge
              </FormLabel>
              <Switch
                id="isNew"
                name="isNew"
                isChecked={formData.isNew}
                onChange={handleChange}
                colorScheme="brand"
              />
            </FormControl>

            <Divider my={2} />

            <Flex mt={4} justify="space-between">
              <Button
                leftIcon={<ArrowBackIcon />}
                variant="outline"
                onClick={() => navigate(`/challenges/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={submitting}
                loadingText="Updating"
                px={8}
                rightIcon={<CheckIcon />}
              >
                Update Challenge
              </Button>
            </Flex>
          </VStack>
        </Box>
      </VStack>
      
      {/* Confirmation modal for deleting criteria */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this evaluation criterion?
            {criterionToDelete !== null && (
              <Alert status="warning" mt={3} borderRadius="md">
                <AlertIcon />
                <Text fontWeight="medium">
                  {formData.evaluationCriteria[criterionToDelete]?.keyword} 
                  ({formData.evaluationCriteria[criterionToDelete]?.weight > 0 ? 
                    '+' + formData.evaluationCriteria[criterionToDelete]?.weight :
                    formData.evaluationCriteria[criterionToDelete]?.weight})
                </Text>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={deleteCriterion} leftIcon={<DeleteIcon />}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default EditChallenge;