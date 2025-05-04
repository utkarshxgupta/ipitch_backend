import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import AuthContext from "../context/authContext";
import RoleManagementModal from "./RoleManagement";
import {
  Box,
  Button,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Input,
  Select,
  HStack,
  useColorModeValue,
  Icon,
  Badge,
  VStack,
  Heading,
  useToast,
  Switch,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
  IconButton,
  Text,
  Flex,
  InputGroup,
  InputLeftElement,
  Divider,
  Card,
  CardBody,
  CardHeader,
} from "@chakra-ui/react";
import { 
  FaUsers, 
  FaUserTie, 
  FaChalkboardTeacher, 
  FaUserGraduate, 
  FaCog, 
  FaSearch, 
  FaFilter 
} from "react-icons/fa";

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const cancelRef = React.useRef();

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const switchTrackColor = useColorModeValue("gray.200", "gray.600");
  const iconColor = useColorModeValue("brand.500", "brand.300");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/users`,
        { headers: { "x-auth-token": token } }
      );
      setUsers(res.data);
    } catch (err) {
      toast({
        title: "Failed to fetch users",
        description: err.response?.data?.msg || "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/users/${userId}`,
        { isActive: !currentStatus },
        { headers: { "x-auth-token": token } }
      );
      
      toast({
        title: `User ${!currentStatus ? "activated" : "deactivated"} successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      fetchUsers(); // Refresh the users list
    } catch (err) {
      toast({
        title: "Failed to update user status",
        description: err.response?.data?.msg || "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStatusToggle = (userId, currentStatus) => {
    setPendingStatusChange({ userId, currentStatus });
    setIsConfirmOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange) {
      toggleUserStatus(pendingStatusChange.userId, pendingStatusChange.currentStatus);
    }
    setIsConfirmOpen(false);
    setPendingStatusChange(null);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (userId) => {
    setSelectedUserId(userId);
    onOpen();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role.includes(roleFilter);
    const isUserActive = user.isActive ?? true; // Consider user active if isActive is not present
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && isUserActive) || 
                         (statusFilter === "inactive" && !isUserActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const statsData = {
    total: users.length,
    managers: users.filter(u => u.role.includes("manager")).length,
    trainers: users.filter(u => u.role.includes("trainer")).length,
    trainees: users.filter(u => u.role.includes("trainee")).length,
  };

  const StatCard = ({ title, value, icon }) => (
    <Card shadow="sm" borderWidth="1px" borderColor={borderColor} borderRadius="lg">
      <CardBody>
        <Stat>
          <HStack spacing={3} mb={2}>
            <Icon as={icon} w={5} h={5} color={iconColor} />
            <StatLabel fontSize="md" fontWeight="medium">{title}</StatLabel>
          </HStack>
          <StatNumber fontSize="2xl">{value}</StatNumber>
        </Stat>
      </CardBody>
    </Card>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg" fontWeight="bold">Admin Dashboard</Heading>
          <Button
            leftIcon={<Icon as={FaUsers} />}
            colorScheme="brand"
            size="sm"
            onClick={fetchUsers}
            isLoading={loading}
          >
            Refresh Users
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard title="Total Users" value={statsData.total} icon={FaUsers} />
          <StatCard title="Managers" value={statsData.managers} icon={FaUserTie} />
          <StatCard title="Trainers" value={statsData.trainers} icon={FaChalkboardTeacher} />
          <StatCard title="Trainees" value={statsData.trainees} icon={FaUserGraduate} />
        </SimpleGrid>

        <Card shadow="md" borderRadius="lg">
          <CardHeader pb={0}>
            <Heading size="md" mb={4}>User Management</Heading>
            <HStack spacing={4} mb={6} wrap="wrap">
              <InputGroup maxW={{ base: "100%", md: "320px" }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="md"
                />
              </InputGroup>
              
              <HStack spacing={2} flex="1" justify="flex-end">
                <Icon as={FaFilter} color="gray.500" />
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  maxW={{ base: "100%", md: "160px" }}
                  borderRadius="md"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="trainer">Trainer</option>
                  <option value="trainee">Trainee</option>
                </Select>
                
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  maxW={{ base: "100%", md: "160px" }}
                  borderRadius="md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </HStack>
            </HStack>
            <Divider />
          </CardHeader>

          <CardBody pt={4}>
            {loading ? (
              <Flex justify="center" align="center" py={10}>
                <VStack spacing={3}>
                  <Spinner size="xl" thickness="4px" color="brand.500" />
                  <Text color="gray.500">Loading users...</Text>
                </VStack>
              </Flex>
            ) : filteredUsers.length === 0 ? (
              <Flex justify="center" align="center" py={10}>
                <Text color="gray.500">No users match your filters</Text>
              </Flex>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Roles</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr 
                        key={user._id} 
                        opacity={user.isActive ?? true ? 1 : 0.7}
                        _hover={{ bg: hoverBg }}
                        transition="background 0.2s"
                      >
                        <Td fontWeight="medium">{user.name}</Td>
                        <Td>{user.email}</Td>
                        <Td>
                          <HStack spacing={2} wrap="wrap">
                            {user.role.map((role) => (
                              <Badge
                                key={role}
                                colorScheme={
                                  role === "admin"
                                    ? "red"
                                    : role === "manager"
                                    ? "green"
                                    : role === "trainer"
                                    ? "blue"
                                    : "gray"
                                }
                                borderRadius="full"
                                px={2}
                                py={0.5}
                              >
                                {role}
                              </Badge>
                            ))}
                          </HStack>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={(user.isActive ?? true) ? "green" : "red"}
                            borderRadius="full"
                            px={2}
                            py={0.5}
                          >
                            {(user.isActive ?? true) ? "Active" : "Inactive"}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={4} justifyContent="flex-start">
                            <Tooltip label="Manage User Roles" hasArrow placement="top">
                              <IconButton
                                icon={<FaCog />}
                                aria-label="Manage Roles"
                                size="sm"
                                colorScheme="gray"
                                variant="outline"
                                onClick={() => handleOpenModal(user._id)}
                              />
                            </Tooltip>
                            
                            <Box>
                              <Tooltip 
                                label={`${user.isActive ?? true ? "Deactivate" : "Activate"} User`} 
                                hasArrow
                                placement="top"
                                closeOnClick={true}
                              >
                                <Switch
                                  colorScheme="green"
                                  isChecked={user.isActive ?? true}
                                  onChange={() => handleStatusToggle(user._id, user.isActive ?? true)}
                                  size="md"
                                  sx={{
                                    '& .chakra-switch__track': {
                                      bg: switchTrackColor
                                    }
                                  }}
                                />
                              </Tooltip>
                            </Box>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>

      {selectedUserId && (
        <RoleManagementModal
          isOpen={isOpen}
          onClose={onClose}
          userId={selectedUserId}
          onRolesUpdated={fetchUsers}
        />
      )}

      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {pendingStatusChange?.currentStatus ? 'Deactivate User' : 'Activate User'}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? {pendingStatusChange?.currentStatus 
                ? 'Deactivating a user will prevent them from accessing the system.' 
                : 'Activating a user will restore their access to the system.'}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme={pendingStatusChange?.currentStatus ? "red" : "green"}
                onClick={handleConfirmStatusChange}
                ml={3}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default AdminDashboard;