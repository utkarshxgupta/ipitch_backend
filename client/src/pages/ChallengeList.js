import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/authContext";
import CustomListItem from "../components/ListItem";
import {
  Box,
  Heading,
  List,
  Spinner,
  useToast,
} from "@chakra-ui/react";

const ChallengeList = () => {
  const { token } = useContext(AuthContext);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
    return <Spinner />;
  }

  return (
    <Box p={5}>
      <Heading as="h2" size="lg" mb={6}>
        Challenge List
      </Heading>
      <List spacing={4}>
        {challenges.map((challenge) => (
          <CustomListItem 
          key={challenge._id}
          id={challenge._id}
          heading={challenge.name}
          subheading={`Created by: ${challenge.createdBy.name}`}
          badgeText="New"
          badgeColor="blue"
          link={`/challenges/${challenge._id}`}
        />
        ))}
      </List>
    </Box>
  );
};

export default ChallengeList;
