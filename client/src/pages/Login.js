import React, { useState, useContext } from 'react';
import AuthContext from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, Input, Heading, Text, useToast } from "@chakra-ui/react";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  const { email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/profile');
    } catch (err) {
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
        toast({
          title: 'Login failed',
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
      <Heading mb={6}>Login</Heading>
      <form onSubmit={onSubmit}>
        <FormControl mb={4}>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" value={email} onChange={onChange} />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Password</FormLabel>
          <Input type="password" name="password" value={password} onChange={onChange} />
        </FormControl>
        <Button type="submit" colorScheme="brand">Login</Button>
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

export default Login;
