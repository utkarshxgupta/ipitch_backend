import React, { useContext, useState } from 'react';
import AuthContext from '../context/authContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: user.name, email: user.email });
  const [message, setMessage] = useState('');

  const { name, email } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const config = {
      headers: { 'x-auth-token': token },
    };
    try {
      const res = await axios.put('http://localhost:5000/api/auth/update', formData, config);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Error updating profile');
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <form onSubmit={onSubmit}>
        <input type="text" name="name" value={name} onChange={onChange} required />
        <input type="email" name="email" value={email} onChange={onChange} required />
        <button type="submit">Update Profile</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Profile;
