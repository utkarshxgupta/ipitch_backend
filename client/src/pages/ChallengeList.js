import React, { useState, useEffect, useContext } from "react";
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
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

const ChallengeList = () => {
  const { token, user } = useContext(AuthContext);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.700");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/challenges", {
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

  if (loading) {
    return (
      <Container maxW="container.lg" centerContent py={8}>
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Box>
            <Heading size="lg" mb={2}>Challenges</Heading>
            <Text color="gray.500">
              Browse through available pitch challenges
            </Text>
          </Box>
          {user?.role && !user.role.includes('trainee') && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              onClick={() => navigate('/challenges/create')}
            >
              Create Challenge
            </Button>
          )}
        </HStack>

        {challenges.length === 0 ? (
          <Box
            p={8}
            bg={bgColor}
            borderRadius="lg"
            textAlign="center"
            shadow="sm"
          >
            <Text>No challenges available at the moment.</Text>
          </Box>
        ) : (
          <List spacing={4}>
            {challenges.map((challenge) => (
              <CustomListItem
                key={challenge._id}
                id={challenge._id}
                heading={challenge.name}
                subheading={`Created by: ${challenge.createdBy.name}`}
                badgeText={challenge.isNew ? "New" : null}
                badgeColor="blue"
                link={`/challenges/${challenge._id}`}
              />
            ))}
          </List>
        )}
      </VStack>
    </Container>
  );
};

export default ChallengeList;
