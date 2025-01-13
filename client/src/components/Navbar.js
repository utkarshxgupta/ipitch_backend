import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";
import { Box, Button, Flex, HStack, Link as ChakraLink, useColorMode, Spacer, useToast, Menu, MenuButton, MenuList, MenuItem, IconButton } from "@chakra-ui/react";
import { SunIcon, MoonIcon, SettingsIcon } from '@chakra-ui/icons';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout(); // Perform logout
    toast({
      title: "Logged out successfully",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    navigate("/login"); // Redirect to login page
  };

  return (
    <Box px={4} shadow="md">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <ChakraLink as={Link} to="/" fontSize="2xl" fontWeight="bold">iPitch</ChakraLink>
        </HStack>
        <Spacer />
        <HStack spacing={4} alignItems="center">
          <HStack as="nav" spacing={4}>
            {user && isAuthenticated ? (
              <>
                {user.role && user.role.includes("admin") && (
                  <ChakraLink as={Link} to="/admin">Admin Dashboard</ChakraLink>
                )}
                {user.role && user.role.includes("manager") && (
                  <ChakraLink as={Link} to="/manager">Manager Dashboard</ChakraLink>
                )}
                {user.role && user.role.includes("trainer") && (
                  <ChakraLink as={Link} to="/trainer">Trainer Dashboard</ChakraLink>
                )}
                {user.role && user.role.includes("trainee") && (
                  <ChakraLink as={Link} to="/trainee">Trainee Dashboard</ChakraLink>
                )}
                <ChakraLink as={Link} to="/examples">Examples</ChakraLink>
                <ChakraLink as={Link} to="/challenges">Challenges</ChakraLink>
                <ChakraLink as={Link} to="/notifications">Notifications</ChakraLink>
              </>
            ) : (
              <>
                <ChakraLink as={Link} to="/login">Login</ChakraLink>
                <ChakraLink as={Link} to="/register">Register</ChakraLink>
              </>
            )}
          </HStack>
          {user && isAuthenticated && (
            <Menu>
              <MenuButton as={IconButton} icon={<SettingsIcon />} variant="ghost" />
              <MenuList>
                <MenuItem as={Link} to="/profile">Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          )}
          <Button onClick={toggleColorMode}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;