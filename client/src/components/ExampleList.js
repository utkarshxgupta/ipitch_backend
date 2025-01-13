import React, { useEffect, useState } from 'react';
import { getExamples } from '../services/apiService';
import { Box, Heading, List, ListItem, Text } from "@chakra-ui/react";

const ExampleList = () => {
  const [examples, setExamples] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const result = await getExamples();
      setExamples(result);
    }
    fetchData();
  }, []);

  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={4}>Examples</Heading>
      <List spacing={3}>
        {examples.map(example => (
          <ListItem key={example._id} p={4} borderWidth={1} borderRadius="lg">
            <Text fontSize="lg" fontWeight="bold">{example.name}</Text>
            <Text>{example.description}</Text>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ExampleList;
