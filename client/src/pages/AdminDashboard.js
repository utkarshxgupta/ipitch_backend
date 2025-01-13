import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import AuthContext from "../context/authContext";
import { toast } from "react-toastify";
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
} from "@chakra-ui/react";

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  return (
    <Box p={4}>
      {loading ? (
        <Spinner size="xl" />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Role</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user._id}>
                <Td>{user.role.join(", ")}</Td>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <Button onClick={() => handleOpenModal(user._id)}>
                    Manage Roles
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      {selectedUserId && (
        <RoleManagementModal
          isOpen={isOpen}
          onClose={onClose}
          userId={selectedUserId}
          onRolesUpdated={fetchUsers} // Pass the fetchUsers function as a prop
        />
      )}
    </Box>
  );
};

export default AdminDashboard;
