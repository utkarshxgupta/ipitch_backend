import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/authContext";
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorMode,
  useColorModeValue,
  Link as ChakraLink,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Avatar,
  Text,
  Divider,
  Badge,
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const NavLink = ({ to, children }) => {
    const activeBg = useColorModeValue("gray.200", "gray.600");
    const hoverBg = useColorModeValue("gray.100", "gray.700");
    return (
      <ChakraLink
        as={Link}
        to={to}
        px={3}
        py={2}
        rounded="md"
        _hover={{
          textDecoration: "none",
          bg: hoverBg,
        }}
        bg={location.pathname === to ? activeBg : "transparent"}
      >
        {children}
      </ChakraLink>
    );
  };

  const MobileNavItem = ({ to, children, onClose }) => (
    <ChakraLink
      as={Link}
      to={to}
      w="full"
      px={3}
      py={2}
      rounded="md"
      _hover={{
        textDecoration: "none",
        bg: useColorModeValue("gray.100", "gray.700"),
      }}
      onClick={onClose}
    >
      {children}
    </ChakraLink>
  );

  return (
    <Box
      px={4}
      position="sticky"
      top={0}
      zIndex="sticky"
      bg={bgColor}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
      shadow="sm"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        {/* Left section */}
        <HStack spacing={8} alignItems="center">
          <ChakraLink
            as={Link}
            to="/"
            fontSize="2xl"
            fontWeight="bold"
            color="brand.500"
            _hover={{ textDecoration: "none" }}
          >
            iPitch
          </ChakraLink>
        </HStack>

        {/* Center section - Desktop */}
        <HStack
          spacing={4}
          display={{ base: "none", md: "flex" }}
        >
          {isAuthenticated && (
            <>
              {user?.role?.includes("admin") && <NavLink to="/admin">Admin</NavLink>}
              {(user?.role?.includes("admin") || user?.role?.includes("manager")) && <NavLink to="/manager">Manager</NavLink>}
              {user?.role?.includes("trainer") && <NavLink to="/trainer">Trainer</NavLink>}
              {user?.role?.includes("trainee") && <NavLink to="/trainee">Dashboard</NavLink>}
              <NavLink to="/challenges">Challenges</NavLink>
            </>
          )}
        </HStack>

        {/* Right section */}
        <HStack spacing={4}>
          {isAuthenticated ? (
            <>
              <Menu>
                <MenuButton
                  as={IconButton}
                  variant="ghost"
                  icon={<BellIcon />}
                  aria-label="Notifications"
                >
                  <Badge
                    position="absolute"
                    top={1}
                    right={1}
                    colorScheme="red"
                    variant="solid"
                    borderRadius="full"
                    boxSize="1.25em"
                  >
                    3
                  </Badge>
                </MenuButton>
                <MenuList>
                  <MenuItem>New Assignment</MenuItem>
                  <MenuItem>Evaluation Complete</MenuItem>
                  <MenuItem>New Comment</MenuItem>
                </MenuList>
              </Menu>

              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  rightIcon={<ChevronDownIcon />}
                >
                  <Avatar size="sm" name={user.name} mr={2} />
                </MenuButton>
                <MenuList>
                  <MenuItem as={Link} to="/profile">Profile</MenuItem>
                  <MenuItem as={Link} to="/settings">Settings</MenuItem>
                  <Divider />
                  <MenuItem onClick={logout} color="red.500">Logout</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <HStack spacing={2}>
              <Button as={Link} to="/login" variant="ghost">
                Login
              </Button>
              <Button as={Link} to="/register" colorScheme="brand">
                Sign Up
              </Button>
            </HStack>
          )}

          <IconButton
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />

          <IconButton
            display={{ base: "flex", md: "none" }}
            onClick={onOpen}
            icon={<HamburgerIcon />}
            variant="ghost"
          />
        </HStack>
      </Flex>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {isAuthenticated ? (
                <>
                  {user?.role?.includes("admin") && (
                    <MobileNavItem to="/admin" onClose={onClose}>
                      Admin Dashboard
                    </MobileNavItem>
                  )}
                  {(user?.role?.includes("admin") || user?.role?.includes("manager")) && (
                    <MobileNavItem to="/manager" onClose={onClose}>
                      Manager Dashboard
                    </MobileNavItem>
                  )}
                  {user?.role?.includes("trainer") && (
                    <MobileNavItem to="/trainer" onClose={onClose}>
                      Trainer Dashboard
                    </MobileNavItem>
                  )}
                  {user?.role?.includes("trainee") && (
                    <MobileNavItem to="/trainee" onClose={onClose}>
                      Trainee Dashboard
                    </MobileNavItem>
                  )}
                  <MobileNavItem to="/challenges" onClose={onClose}>
                    Challenges
                  </MobileNavItem>
                  <Divider />
                  <MobileNavItem to="/profile" onClose={onClose}>
                    Profile
                  </MobileNavItem>
                  <Button onClick={logout} colorScheme="red" variant="ghost" w="full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="ghost" w="full">
                    Login
                  </Button>
                  <Button as={Link} to="/register" colorScheme="brand" w="full">
                    Sign Up
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;