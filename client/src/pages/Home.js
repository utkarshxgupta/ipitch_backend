import React, { useContext } from 'react';
import AuthContext from '../context/authContext';
import { Box, Button, Heading, Text } from "@chakra-ui/react";

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  console.log(user);
  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={4}>Home Page</Heading>
      {user && (
        <Box>
          <Text fontSize="lg">Welcome, {user.name}</Text>
          <Button onClick={logout} colorScheme="brand" mt={2}>Logout</Button>
        </Box>
      )}
    </Box>
  );
};

export default Home;
