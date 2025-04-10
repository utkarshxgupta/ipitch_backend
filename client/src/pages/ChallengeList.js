import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/authContext";
import CustomListItem from "../components/ListItem";
import {
  Box,
  Heading,
  List,
  Spinner,
  useToast,
  Container,
  Button,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  InputGroup,
  Input,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Flex,
  IconButton,
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Checkbox,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Tag,
  Wrap,
  WrapItem,
  Alert,
  AlertIcon
} from "@chakra-ui/react";
import { 
  AddIcon, 
  SearchIcon, 
  ChevronDownIcon, 
  EditIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TimeIcon,
  AtSignIcon,
  ViewIcon,
  DeleteIcon,
  WarningIcon
} from "@chakra-ui/icons";

const ChallengeList = () => {
  const { token, user } = useContext(AuthContext);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("createdDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/challenges`, {
          headers: { "x-auth-token": token },
        });
        setChallenges(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to fetch challenges",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [token, toast]);

  // Calculate filtered and sorted challenges
  const filteredChallenges = useMemo(() => {
    // First filter by search query
    let result = challenges.filter(challenge => 
      challenge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.createdBy.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Then sort according to selected field and direction
    return result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "createdDate") {
        comparison = new Date(a.createdDate) - new Date(b.createdDate);
      } else if (sortField === "attempts") {
        comparison = a.attempts - b.attempts;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [challenges, searchQuery, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field is clicked
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDownIcon boxSize={3} opacity={0.5} />;
    return sortDirection === "asc" ? 
      <ArrowUpIcon boxSize={3} color="brand.500" /> : 
      <ArrowDownIcon boxSize={3} color="brand.500" />;
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    // Clear selections when exiting selection mode
    if (isSelectionMode) {
      setSelectedChallenges([]);
    }
  };

  const toggleChallengeSelection = (challengeId) => {
    setSelectedChallenges(prev => 
      prev.includes(challengeId)
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChallenges.length === filteredChallenges.length) {
      // If all are selected, deselect all
      setSelectedChallenges([]);
    } else {
      // Otherwise select all
      setSelectedChallenges(filteredChallenges.map(c => c._id));
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      // Send delete request to the backend
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/challenges`, {
        headers: { 'x-auth-token': token },
        data: { challengeIds: selectedChallenges }
      });
      
      // Update the local state to remove deleted challenges
      setChallenges(prev => prev.filter(c => !selectedChallenges.includes(c._id)));
      setSelectedChallenges([]);
      
      toast({
        title: `${selectedChallenges.length} challenge${selectedChallenges.length > 1 ? 's' : ''} deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (err) {
      console.error(err);
      setDeleteError(
        err.response?.data?.msg || 
        "Failed to delete challenges. Some may be part of active assignments."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" centerContent py={16}>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
          <Box>
            <Heading size="xl" fontWeight="bold" bgGradient="linear(to-r, brand.400, purple.400)" bgClip="text">
              Challenges
            </Heading>
            <Text color="gray.500" fontSize="lg" mt={1}>
              Browse through available pitch challenges
            </Text>
          </Box>
          
          {user?.role && !user.role.includes('trainee') && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              size="md"
              onClick={() => navigate('/challenges/create')}
              rounded="full"
              px={6}
              fontWeight="bold"
              shadow="md"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.2s"
            >
              Create Challenge
            </Button>
          )}
        </HStack>

        <StatGroup bg={bgColor} p={4} rounded="lg" shadow="sm" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel color="gray.500">Total Challenges</StatLabel>
            <StatNumber fontWeight="bold" fontSize="2xl">{challenges.length}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel color="gray.500">New This Week</StatLabel>
            <StatNumber fontWeight="bold" fontSize="2xl">
              {challenges.filter(c => c.isNew).length}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel color="gray.500">Most Attempted</StatLabel>
            <StatNumber fontWeight="bold" fontSize="2xl">
              {challenges.length > 0 ? 
                Math.max(...challenges.map(c => c.attempts || 0)) : 
                0}
            </StatNumber>
          </Stat>
        </StatGroup>

        <Box>
          <HStack spacing={4} mb={6}>
            <InputGroup size="md">
              <Input
                placeholder="Search challenges by name or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="full"
                borderColor={borderColor}
                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px brand.400" }}
              />
              <InputRightElement>
                <SearchIcon color="gray.400" />
              </InputRightElement>
            </InputGroup>
            
            {/* Only show selection toggle for admin/trainer */}
            {user?.role && (user.role.includes('admin') || user.role.includes('trainer')) && (
              <Button
                colorScheme={isSelectionMode ? "red" : "gray"}
                borderRadius="full"
                variant="outline"
                onClick={toggleSelectionMode}
              >
                {isSelectionMode ? "Cancel" : "Select"}
              </Button>
            )}
            
            {isSelectionMode && selectedChallenges.length > 0 && (
              <Button
                colorScheme="red"
                leftIcon={<DeleteIcon />}
                borderRadius="full"
                onClick={onOpen}
              >
                Delete ({selectedChallenges.length})
              </Button>
            )}
            
            {!isSelectionMode && (
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  borderRadius="full"
                  variant="outline"
                  borderColor={borderColor}
                  _hover={{ bg: hoverBgColor }}
                >
                  Sort by
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => handleSort("name")} fontWeight={sortField === "name" ? "bold" : "normal"}>
                    <HStack justify="space-between" width="100%">
                      <Text>Name</Text>
                      {renderSortIcon("name")}
                    </HStack>
                  </MenuItem>
                  <MenuItem onClick={() => handleSort("createdDate")} fontWeight={sortField === "createdDate" ? "bold" : "normal"}>
                    <HStack justify="space-between" width="100%">
                      <Text>Date Created</Text>
                      {renderSortIcon("createdDate")}
                    </HStack>
                  </MenuItem>
                  <MenuItem onClick={() => handleSort("attempts")} fontWeight={sortField === "attempts" ? "bold" : "normal"}>
                    <HStack justify="space-between" width="100%">
                      <Text>Number of Attempts</Text>
                      {renderSortIcon("attempts")}
                    </HStack>
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
            
            {isSelectionMode && (
              <Button
                borderRadius="full"
                variant="outline"
                onClick={handleSelectAll}
              >
                {selectedChallenges.length === filteredChallenges.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </HStack>

          {filteredChallenges.length === 0 ? (
            <Box
              p={8}
              bg={bgColor}
              borderRadius="lg"
              textAlign="center"
              shadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Text fontSize="lg">No challenges found matching your search criteria.</Text>
            </Box>
          ) : (
            <List spacing={4}>
              {filteredChallenges.map((challenge) => (
                <Box
                  key={challenge._id}
                  p={5}
                  bg={bgColor}
                  borderRadius="lg"
                  shadow="sm"
                  borderWidth="1px"
                  borderColor={selectedChallenges.includes(challenge._id) ? "brand.500" : borderColor}
                  _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                >
                  <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <HStack>
                        {isSelectionMode && (
                          <Checkbox 
                            isChecked={selectedChallenges.includes(challenge._id)}
                            onChange={() => toggleChallengeSelection(challenge._id)}
                            colorScheme="brand"
                            size="lg"
                          />
                        )}
                        <Heading size="md">{challenge.name}</Heading>
                        {challenge.isNew && (
                          <Badge colorScheme="blue" borderRadius="full" px={2}>
                            New
                          </Badge>
                        )}
                      </HStack>
                      <Text color="gray.500">Created by: {challenge.createdBy.name}</Text>
                      <HStack spacing={4} mt={2}>
                        <HStack spacing={1}>
                          <TimeIcon color="gray.400" />
                          <Text fontSize="sm" color="gray.500">
                            {new Date(challenge.createdDate).toLocaleDateString()}
                          </Text>
                        </HStack>
                        <HStack spacing={1}>
                          <ViewIcon color="gray.400" />
                          <Text fontSize="sm" color="gray.500">
                            {challenge.attempts || 0} attempts
                          </Text>
                        </HStack>
                      </HStack>
                    </VStack>
                    
                    {!isSelectionMode ? (
                      <Button
                        variant="solid"
                        colorScheme="brand"
                        size="sm"
                        onClick={() => navigate(`/challenges/${challenge._id}`)}
                        borderRadius="full"
                      >
                        View Details
                      </Button>
                    ) : null}
                  </Flex>
                </Box>
              ))}
            </List>
          )}
          
          <Text mt={4} color="gray.500" fontSize="sm" textAlign="center">
            Showing {filteredChallenges.length} of {challenges.length} challenges
          </Text>
        </Box>
      </VStack>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Challenges
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {selectedChallenges.length} selected 
              challenge{selectedChallenges.length > 1 ? 's' : ''}? This action cannot be undone.
              
              {deleteError && (
                <Alert status="error" mt={4}>
                  <AlertIcon />
                  {deleteError}
                </Alert>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteSelected} 
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default ChallengeList;
