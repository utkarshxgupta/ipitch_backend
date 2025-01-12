import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

const AssignmentForm = () => {
  const { token } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/challenges', {
          headers: { 'x-auth-token': token }
        });
        setChallenges(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch challenges');
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { 'x-auth-token': token }
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch users');
      }
    };

    fetchChallenges();
    fetchUsers();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/api/assignments', {
        name,
        challenges: selectedChallenges,
        assignedUsers: selectedUsers,
        startDate,
        endDate
      }, {
        headers: { 'x-auth-token': token }
      });

      toast.success('Assignment created successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create assignment');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Assignment</h2>
      <div>
        <label>Assignment Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
      </div>
      <div>
        <label>Select Challenges</label>
        <select 
          multiple 
          value={selectedChallenges} 
          onChange={(e) => setSelectedChallenges([...e.target.selectedOptions].map(option => option.value))}
        >
          {challenges.map(challenge => (
            <option key={challenge._id} value={challenge._id}>
              {challenge.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Select Users</label>
        <select 
          multiple 
          value={selectedUsers} 
          onChange={(e) => setSelectedUsers([...e.target.selectedOptions].map(option => option.value))}
        >
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Start Date</label>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)}
          required 
        />
      </div>
      <div>
        <label>End Date</label>
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>
      <button type="submit">Create Assignment</button>
    </form>
  );
};

export default AssignmentForm;
