import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/authContext";
import { toast } from "react-toastify";
import RoleManagementModal from "./RoleManagement";

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { "x-auth-token": token },
        });
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const openModal = (userId) => {
    setSelectedUserId(userId);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setSelectedUserId(null);
    setModalIsOpen(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Manage User Roles</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role.join(", ")}</td>
              <td>
                <button onClick={() => openModal(user._id)}>Edit Roles</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RoleManagementModal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        userId={selectedUserId}
      />
    </div>
  );
};

export default AdminDashboard;
