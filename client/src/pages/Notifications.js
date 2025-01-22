import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Box, Heading, List, ListItem, Spinner, Text, useToast } from "@chakra-ui/react";

const Notifications = () => {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/notifications', {
          headers: { 'x-auth-token': token }
        });
        setNotifications(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Failed to fetch notifications',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token, toast]);

  return (
    <Box p={2} maxW="md" mx="auto">
      <Heading size="md" mb={6}>Notifications</Heading>
      {loading ? (
        <Spinner size="xl" />
      ) : notifications.length === 0 ? (
        <Box textAlign="center" py={10} px={6}>
          <Heading as="h2" size="md" mb={2}>
            You're all caught up!
          </Heading>
          <Text>No new notifications.</Text>
        </Box>
      ) : (
        <List spacing={3}>
          {notifications.map((notification) => (
            <ListItem key={notification._id}>
              <Text fontSize="xl">{notification.message}</Text>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default Notifications;
