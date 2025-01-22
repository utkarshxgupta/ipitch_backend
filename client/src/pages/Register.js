import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Heading,  
  Text, 
  useToast,
  Container,
  VStack,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Progress,
  Alert,
  AlertIcon,
  Link,
  useColorModeValue,
  RadioGroup,
  Radio,
  HStack,
} from "@chakra-ui/react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'trainee' });
  const [errors, setErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const navigate = useNavigate();
  const toast = useToast();

  const { name, email, password, role } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const progress = Object.values(formData).filter(Boolean).length * 25;
    setFormProgress(progress);
  }, [formData]);

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.800')}
      py={12}
    >
      <Container maxW="md">
        <Box
          bg={bgColor}
          p={8}
          borderRadius="xl"
          boxShadow="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6}>
            <Heading size="lg">Create Account</Heading>
            <Progress
              value={formProgress}
              w="100%"
              colorScheme="brand"
              borderRadius="full"
            />
            
            <form onSubmit={onSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <InputGroup>
                    <InputLeftElement children={<FaUser color="gray.500" />} />
                    <Input
                      name="name"
                      value={name}
                      onChange={onChange}
                      placeholder="Enter your name"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <InputGroup>
                    <InputLeftElement children={<FaEnvelope color="gray.500" />} />
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
                    <InputLeftElement children={<FaLock color="gray.500" />} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={onChange}
                      placeholder="Create a password"
                    />
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <RadioGroup
                    value={role}
                    onChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <HStack spacing={4}>
                      <Radio value="trainee">Trainee</Radio>
                      <Radio value="trainer">Trainer</Radio>
                      <Radio value="manager">Manager</Radio>
                    </HStack>
                  </RadioGroup>
                </FormControl>

                {errors.length > 0 && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start">
                      {errors.map((error, index) => (
                        <Text key={index}>{error.msg}</Text>
                      ))}
                    </VStack>
                  </Alert>
                )}

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="100%"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Register
                </Button>
              </VStack>
            </form>

            <Text>
              Already have an account?{' '}
              <Link as={RouterLink} to="/login" color="brand.500">
                Login here
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
