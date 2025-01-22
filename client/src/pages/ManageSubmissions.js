import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/authContext";
import {
  Box,
  Heading,
  Spinner,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

const ManageSubmissions = () => {
  const { token } = useContext(AuthContext);
  const toast = useToast();

  const [assignmentId, setAssignmentId] = useState("");
  const [traineeId, setTraineeId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/submissions?assignmentId=${assignmentId}&traineeId=${traineeId}&page=${page}&limit=${limit}`,
        { headers: { "x-auth-token": token } }
      );
      setSubmissions(res.data.submissions || []);
      setTotalPages(res.data.totalPages || 1);
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
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <Box p={4}>
      <Heading mb={4}>Manage Submissions</Heading>
      <Box as="form" onSubmit={handleSearch} mb={4}>
        <HStack spacing={4} mb={2}>
          <FormControl>
            <FormLabel>Assignment ID</FormLabel>
            <Input
              placeholder="Enter assignment ID"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Trainee ID</FormLabel>
            <Input
              placeholder="Enter trainee ID"
              value={traineeId}
              onChange={(e) => setTraineeId(e.target.value)}
            />
          </FormControl>
        </HStack>
        <HStack spacing={4} mb={2}>
          <FormControl w="150px">
            <FormLabel>Limit</FormLabel>
            <Select
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value);
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Select>
          </FormControl>
          <Button type="submit" colorScheme="brand" mt={6}>
            Filter
          </Button>
        </HStack>
      </Box>
      {loading ? (
        <Spinner size="xl" />
      ) : submissions.length > 0 ? (
        <Table variant="simple" mb={4}>
          <Thead>
            <Tr>
              <Th>Submission ID</Th>
              <Th>Assignment</Th>
              <Th>Challenge</Th>
              <Th>Trainee</Th>
              <Th>Submitted Date</Th>
              <Th>Transcript Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {submissions.map((sub) => (
              <Tr key={sub._id}>
                <Td>
                  <Link to={`/submissions/${sub._id}`}>{sub._id}</Link>
                </Td>
                <Td>{sub.assignment?.name || sub.assignment}</Td>
                <Td>{sub.challenge?.name || sub.challenge}</Td>
                <Td>{sub.trainee?.name || sub.trainee}</Td>
                <Td>
                  {new Date(sub.submittedDate).toLocaleString("en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </Td>
                <Td>{sub.transcriptionStatus}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>No submissions found.</Text>
      )}
      <HStack spacing={4}>
        <Button onClick={handlePrevPage} isDisabled={page === 1}>
          Prev
        </Button>
        <Text>
          Page {page} of {totalPages}
        </Text>
        <Button onClick={handleNextPage} isDisabled={page === totalPages}>
          Next
        </Button>
      </HStack>
    </Box>
  );
};

export default ManageSubmissions;