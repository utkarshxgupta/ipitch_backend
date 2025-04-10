import React, { useContext, useState } from 'react';
import AuthContext from '../context/authContext';
import axios from 'axios';
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
  HStack,
  Avatar,
  IconButton,
  Divider,
  useColorModeValue,
  Grid,
  GridItem,
  Switch,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from "@chakra-ui/react";
import { FaCamera, FaUser, FaEnvelope, FaBell, FaTrash } from 'react-icons/fa';

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: user.name, email: user.email });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const bgColor = useColorModeValue('white', 'gray.700');
  const toast = useToast();

  const { name, email } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const config = {
      headers: { 'x-auth-token': token },
    };
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/update`, formData, config);
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
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8}>
        <Box
          w="100%"
          bg={bgColor}
          borderRadius="xl"
          boxShadow="lg"
          p={8}
        >
          <VStack spacing={6}>
            <Box position="relative">
              <Avatar
                size="2xl"
                name={user.name}
                src={avatar}
              />
              <IconButton
                aria-label="Change photo"
                icon={<FaCamera />}
                size="sm"
                colorScheme="brand"
                rounded="full"
                position="absolute"
                bottom={0}
                right={0}
                onClick={() => document.getElementById('avatar-input').click()}
              />
              <input
                id="avatar-input"
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setAvatar(URL.createObjectURL(e.target.files[0]))}
              />
            </Box>
            
            <Heading size="lg">{user.name}</Heading>
            <Text color="gray.500">{user.role}</Text>
          </VStack>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={8} w="100%">
          <GridItem>
            <Box bg={bgColor} borderRadius="xl" boxShadow="lg" p={8}>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Personal Information</Heading>
                <form onSubmit={onSubmit}>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Name</FormLabel>
                      <Input
                        name="name"
                        value={name}
                        onChange={onChange}
                        leftIcon={<FaUser />}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        name="email"
                        value={email}
                        onChange={onChange}
                        leftIcon={<FaEnvelope />}
                        isReadOnly
                      />
                    </FormControl>
                    
                    <Button
                      type="submit"
                      colorScheme="brand"
                      w="100%"
                      isLoading={isLoading}
                    >
                      Save Changes
                    </Button>
                  </VStack>
                </form>
              </VStack>
            </Box>
          </GridItem>

          <GridItem>
            <Box bg={bgColor} borderRadius="xl" boxShadow="lg" p={8}>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Preferences</Heading>
                <HStack justify="space-between">
                  <Text>Email Notifications</Text>
                  <Switch colorScheme="brand" />
                </HStack>
                
                <Divider />
                
                <Button
                  leftIcon={<FaTrash />}
                  colorScheme="red"
                  variant="outline"
                  onClick={onOpen}
                >
                  Delete Account
                </Button>
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </VStack>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Account?</AlertDialogHeader>
            <AlertDialogBody>
              This action cannot be undone. All your data will be permanently deleted.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default Profile;
