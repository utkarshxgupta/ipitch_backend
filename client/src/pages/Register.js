import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, Input, Heading, Select, Text, useToast } from "@chakra-ui/react";

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'trainee' });
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  const { name, email, password, role } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
        toast({
          title: 'Registration failed',
          description: err.response.data.errors.map(error => error.msg).join(', '),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Register</Heading>
      <form onSubmit={onSubmit}>
        <FormControl mb={4}>
          <FormLabel>Name</FormLabel>
          <Input type="text" name="name" value={name} onChange={onChange} />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" value={email} onChange={onChange} />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Password</FormLabel>
          <Input type="password" name="password" value={password} onChange={onChange} />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Role</FormLabel>
          <Select name="role" value={role} onChange={onChange}>
            <option value="trainee">Trainee</option>
            <option value="trainer">Trainer</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </FormControl>
        <Button type="submit" colorScheme="brand">Register</Button>
      </form>
      {errors.length > 0 && (
        <Box mt={4}>
          {errors.map((error, index) => (
            <Text key={index} color="red.500">{error.msg}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Register;
