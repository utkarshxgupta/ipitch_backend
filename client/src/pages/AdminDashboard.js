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
} from "@chakra-ui/react";
import { FaUsers, FaUserTie, FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa";
const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("white", "gray.700");

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
    return matchesSearch && matchesRole;
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
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map((user) => (
                    <Tr key={user._id}>
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
                        <Button
                          colorScheme="brand"
                          size="sm"
                          onClick={() => handleOpenModal(user._id)}
                        >
                          Manage Roles
                        </Button>
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
    </Container>
  );
};

export default AdminDashboard;
