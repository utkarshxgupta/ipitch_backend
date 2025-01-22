import React, { useState, useContext } from 'react';
import AuthContext from '../context/authContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, Input, Heading, Text, useToast, Container, VStack, InputGroup, InputLeftElement, InputRightElement, IconButton, HStack, Checkbox, Link, Alert, AlertIcon, useColorModeValue } from "@chakra-ui/react";
import { EmailIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const { email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Container maxW="md" py={12}>
        <Box
          bg={useColorModeValue('white', 'gray.700')}
          p={8}
          borderRadius="xl"
          boxShadow="lg"
        >
          <VStack spacing={6} align="stretch">
            <Heading textAlign="center">Welcome Back</Heading>
            <form onSubmit={onSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <InputGroup>
                    <InputLeftElement children={<EmailIcon color="gray.500" />} />
                    <Input
                      type="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      placeholder="Enter your email"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={onChange}
                      placeholder="Enter your password"
                    />
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <HStack justify="space-between" width="100%">
                  <Checkbox>Remember me</Checkbox>
                  <Link color="brand.500">Forgot password?</Link>
                </HStack>

                <Button
                  type="submit"
                  colorScheme="brand"
                  width="100%"
                  isLoading={isLoading}
                  loadingText="Logging in..."
                >
                  Login
                </Button>
              </VStack>
            </form>

            {errors.length > 0 && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={2}>
                  {errors.map((error, index) => (
                    <Text key={index}>{error.msg}</Text>
                  ))}
                </VStack>
              </Alert>
            )}

            <Text textAlign="center">
              Don't have an account?{' '}
              <Link as={RouterLink} to="/register" color="brand.500">
                Sign up
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
