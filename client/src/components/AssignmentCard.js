import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Collapse,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Button,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

const AssignmentCard = ({ group, onLoadMore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleLoadMore = async () => {
    setLoading(true);
    await onLoadMore(group.assignmentId, group.lastId);
    setLoading(false);
  };

  return (
    <Box
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
      bg={bgColor}
      shadow="sm"
    >
      <HStack justify="space-between" mb={2}>
        <Box>
          <Heading size="md" mb={2}>{group.assignmentName}</Heading>
          <HStack spacing={4}>
            <Badge colorScheme="blue">
              {group.submissions.length} Submissions
            </Badge>
            <Badge colorScheme={group.hasMore ? "green" : "gray"}>
              {group.hasMore ? "More available" : "All loaded"}
            </Badge>
          </HStack>
        </Box>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        >
          {isOpen ? "Hide" : "Show"} Submissions
        </Button>
      </HStack>

      <Collapse in={isOpen}>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Submission ID</Th>
              <Th>Challenge</Th>
              <Th>Trainee</Th>
              <Th>Submitted Date</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {group.submissions.map((sub) => (
              <Tr key={sub._id}>
                <Td>
                  <Link to={`/submissions/${sub._id}`}>
                    <Text color="blue.500" textDecoration="underline">
                      {sub._id.slice(-6)}
                    </Text>
                  </Link>
                </Td>
                <Td>{sub.challenge?.name}</Td>
                <Td>{sub.trainee?.name}</Td>
                <Td>
                  {new Date(sub.submittedDate).toLocaleString('en-US', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </Td>
                <Td>
                  <Badge
                    colorScheme={
                      sub.transcriptionStatus === 'completed'
                        ? 'green'
                        : sub.transcriptionStatus === 'pending'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    {sub.transcriptionStatus}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        
        {group.hasMore && (
          <Box textAlign="center" mt={4}>
            <Button
              size="sm"
              onClick={handleLoadMore}
              isLoading={loading}
              loadingText="Loading..."
              colorScheme="blue"
              variant="outline"
            >
              Load More Submissions
            </Button>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

export default AssignmentCard;