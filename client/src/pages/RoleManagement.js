import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Box, Button, FormControl, FormLabel, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Spinner, useToast } from "@chakra-ui/react";

const RoleManagementModal = ({ isOpen, onClose, userId, onRolesUpdated }) => {
  const { token } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}`, {
          headers: { 'x-auth-token': token }
        });
        setUser(res.data);
        setRoles(res.data.role);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Failed to fetch user',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [userId, token, isOpen, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}/roles`, { roles }, {
        headers: { 'x-auth-token': token }
      });
      toast({
        title: 'Roles updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      onRolesUpdated(); // Call the callback function to update the user list
    } catch (err) {
      console.error(err);
      toast({
        title: 'Failed to update roles',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <Spinner size="lg"/>;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Manage Roles for {user.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <FormControl mb={4}>
              <FormLabel>Roles:</FormLabel>
              <Box>
                {['admin', 'manager', 'trainer', 'trainee'].map(role => (
                  <Button
                    key={role}
                    onClick={() => {
                      setRoles(prevRoles =>
                        prevRoles.includes(role)
                          ? prevRoles.filter(r => r !== role)
                          : [...prevRoles, role]
                      );
                    }}
                    colorScheme={roles.includes(role) ? 'brand' : 'gray'}
                    m={1}
                  >
                    {role}
                  </Button>
                ))}
              </Box>
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="brand" mr={3} onClick={handleSubmit}>Update Roles</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RoleManagementModal;
