import React, { useContext, useState } from 'react';
import AuthContext from '../context/authContext';
import axios from 'axios';
import { Box, Button, FormControl, FormLabel, Input, Heading, Text, useToast } from "@chakra-ui/react";

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: user.name, email: user.email });
  const [message, setMessage] = useState('');
  const toast = useToast();

  const { name, email } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const config = {
      headers: { 'x-auth-token': token },
    };
    try {
      const res = await axios.put('http://localhost:5000/api/auth/update', formData, config);
      toast({
        title: 'Profile updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setMessage('Profile updated successfully');
    } catch (err) {
      toast({
        title: 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Profile</Heading>
      <form onSubmit={onSubmit}>
        <FormControl mb={4}>
          <FormLabel>Name</FormLabel>
          <Input type="text" name="name" value={name} onChange={onChange} />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" value={email} onChange={onChange} />
        </FormControl>
        <Button type="submit" colorScheme="brand">Update Profile</Button>
      </form>
      {message && (
        <Box mt={4}>
          <Text color="green.500">{message}</Text>
        </Box>
      )}
    </Box>
  );
};

export default Profile;
