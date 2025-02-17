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
} from "@chakra-ui/react";
import { FaUsers, FaUserTie, FaChalkboardTeacher, FaUserGraduate, FaCog } from "react-icons/fa";

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
  const bgColor = useColorModeValue("white", "gray.700");
  const buttonBgColor = useColorModeValue("gray.100", "gray.600");
  const buttonHoverBgColor = useColorModeValue("gray.200", "gray.500");
  const switchTrackColor = useColorModeValue("gray.200", "gray.600");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const cancelRef = React.useRef();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { "x-auth-token": token },
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to fetch users");
      setLoading(false);
    }
  }, [token]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}`,
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
    <Box p={6} bg={bgColor} rounded="lg" boxShadow="sm">
      <Stat>
        <VStack spacing={2} align="start">
          <HStack spacing={4}>
            <Icon as={icon} w={6} h={6} color="brand.500" />
            <StatLabel fontSize="lg">{title}</StatLabel>
          </HStack>
          <StatNumber fontSize="3xl">{value}</StatNumber>
        </VStack>
      </Stat>
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Admin Dashboard</Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard title="Total Users" value={statsData.total} icon={FaUsers} />
          <StatCard title="Managers" value={statsData.managers} icon={FaUserTie} />
          <StatCard title="Trainers" value={statsData.trainers} icon={FaChalkboardTeacher} />
          <StatCard title="Trainees" value={statsData.trainees} icon={FaUserGraduate} />
        </SimpleGrid>

        <Box bg={bgColor} rounded="lg" p={6} boxShadow="sm">
          <HStack spacing={4} mb={6}>
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              w="200px"
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
              w="200px"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </HStack>

          {loading ? (
            <Spinner size="xl" />
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
                    <Tr key={user._id} opacity={user.isActive ?? true ? 1 : 0.6}>
                      <Td fontWeight="medium">{user.name}</Td>
                      <Td>{user.email}</Td>
                      <Td>
                        <HStack spacing={2}>
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
                            >
                              {role}
                            </Badge>
                          ))}
                        </HStack>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={(user.isActive ?? true) ? "green" : "red"}
                        >
                          {(user.isActive ?? true) ? "Active" : "Inactive"}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={4} justifyContent="flex-start">
                          <Tooltip label="Manage User Roles" hasArrow>
                            <IconButton
                              icon={<FaCog />}
                              aria-label="Manage Roles"
                              size="sm"
                              variant="ghost"
                              backgroundColor={buttonBgColor}
                              _hover={{ bg: buttonHoverBgColor }}
                              onClick={() => handleOpenModal(user._id)}
                            />
                          </Tooltip>
                          
                          <Tooltip 
                            label={`${user.isActive ?? true ? "Deactivate" : "Activate"} User`} 
                            hasArrow
                          >
                            <Box>
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
                            </Box>
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
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
              Confirm Status Change
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to {pendingStatusChange?.currentStatus ? "deactivate" : "activate"} this user?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmStatusChange} ml={3}>
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

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
