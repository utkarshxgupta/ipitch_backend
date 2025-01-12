import React, { useState, useEffect, useContext } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

Modal.setAppElement('#root');  // Needed for accessibility

const RoleManagementModal = ({ isOpen, onRequestClose, userId }) => {
  const { token } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: { 'x-auth-token': token }
        });
        setUser(res.data);
        setRoles(res.data.role);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch user');
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [userId, token, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/roles`, { roles }, {
        headers: { 'x-auth-token': token }
      });
      toast.success('Roles updated successfully');
      onRequestClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update roles');
    }
  };

  const handleChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setRoles(value);
  };

  if (!isOpen || loading) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Manage Roles"
    >
      <h2>Manage Roles for {user.name}</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="roles">Roles:</label>
        <select id="roles" multiple={true} value={roles} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="trainer">Trainer</option>
          <option value="trainee">Trainee</option>
        </select>
        <div>
          <button type="submit">Update Roles</button>
          <button type="button" onClick={onRequestClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default RoleManagementModal;
