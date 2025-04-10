import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/authContext";
import {
  Box,
  Heading,
  Spinner,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Container,
  InputGroup,
  InputLeftElement,
  Collapse,
  IconButton,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { SearchIcon } from '@chakra-ui/icons';
import { FiFilter } from "react-icons/fi";
import AssignmentCard from "../components/AssignmentCard";

const ManageSubmissions = () => {
  const { token } = useContext(AuthContext);
  const toast = useToast();

  const [traineeId, setTraineeId] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [lastId, setLastId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter groups based on assignment name search
  const filteredGroups = groups.filter(group => 
    group.assignmentName.toLowerCase().includes(assignmentSearch.toLowerCase())
  );

  const fetchSubmissions = async (reset = false) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/submissions?${
          traineeId ? `traineeId=${traineeId}&` : ''
        }${!reset && lastId ? `lastId=${lastId}&` : ''}limit=10`,
        { headers: { "x-auth-token": token } }
      );
      
      if (reset) {
        setGroups(res.data.groups);
      } else {
        setGroups([...groups, ...res.data.groups]);
      }
      
      setHasMore(res.data.groups.some(group => group.hasMore));
      setLastId(res.data.groups[res.data.groups.length - 1]?.lastId);
    } catch (err) {
      toast({
        title: "Failed to fetch submissions",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLastId(null);
    fetchSubmissions(true);
  };

  const handleLoadMore = () => {
    fetchSubmissions();
  };

  const handleLoadMoreForAssignment = async (assignmentId, lastSubmissionId) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/submissions?${
          traineeId ? `traineeId=${traineeId}&` : ''
        }assignmentId=${assignmentId}&lastId=${lastSubmissionId}&limit=10`,
        { headers: { "x-auth-token": token } }
      );
      
      // Update the submissions for this specific assignment
      setGroups(prevGroups => prevGroups.map(group => {
        if (group.assignmentId === assignmentId) {
          return {
            ...group,
            submissions: [...group.submissions, ...res.data.groups[0].submissions],
            hasMore: res.data.groups[0].hasMore,
            lastId: res.data.groups[0].lastId
          };
        }
        return group;
      }));
    } catch (err) {
      toast({
        title: "Failed to load more submissions",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" p={4}>
      <VStack align="stretch" spacing={6}>
        <Heading>Manage Submissions</Heading>

        {/* Search Bar */}
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search assignments..."
            value={assignmentSearch}
            onChange={(e) => setAssignmentSearch(e.target.value)}
            borderRadius="full"
          />
          <IconButton
            ml={2}
            icon={<FiFilter />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "solid" : "outline"}
            colorScheme="blue"
            aria-label="Show filters"
            borderRadius="full"
          />
        </InputGroup>

        {/* Filters Section */}
        <Collapse in={showFilters} animateOpacity>
          <Box 
            p={4} 
            bg="gray.50" 
            borderRadius="lg"
            border="1px"
            borderColor="gray.200"
          >
            <form onSubmit={handleSearch}>
              <FormControl>
                <FormLabel>Trainee ID</FormLabel>
                <Input
                  placeholder="Enter trainee ID"
                  value={traineeId}
                  onChange={(e) => setTraineeId(e.target.value)}
                  bg="white"
                />
              </FormControl>
              <Button 
                mt={4} 
                type="submit" 
                colorScheme="blue" 
                width="full"
                borderRadius="full"
              >
                Apply Filters
              </Button>
            </form>
          </Box>
        </Collapse>

        {/* Results Section */}
        {loading && groups.length === 0 ? (
          <Box textAlign="center">
            <Spinner size="xl" />
          </Box>
        ) : filteredGroups.length > 0 ? (
          <VStack align="stretch" spacing={4}>
            {/* Stats Bar */}
            <HStack justify="space-between" px={2}>
              <Text color="gray.600">
                Showing {filteredGroups.length} {filteredGroups.length === 1 ? 'assignment' : 'assignments'}
              </Text>
              {traineeId && (
                <Badge colorScheme="blue">
                  Filtered by Trainee: {traineeId}
                </Badge>
              )}
            </HStack>

            {filteredGroups.map((group) => (
              <AssignmentCard 
                key={group.assignmentId} 
                group={group} 
                onLoadMore={handleLoadMoreForAssignment}
              />
            ))}
            
            {hasMore && !assignmentSearch && (
              <Button
                onClick={handleLoadMore}
                isLoading={loading}
                colorScheme="blue"
                variant="outline"
                borderRadius="full"
              >
                Load More
              </Button>
            )}
          </VStack>
        ) : (
          <Text textAlign="center" color="gray.600">
            {assignmentSearch 
              ? "No assignments match your search criteria."
              : "No submissions found."}
          </Text>
        )}
      </VStack>
    </Container>
  );
};

export default ManageSubmissions;