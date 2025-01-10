import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'trainee' });
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  const { name, email, password, role } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      toast.success('Registration successful');
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
      }
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          name="name"
          value={name}
          onChange={onChange}
          required
        />
        <input
          type="email"
          name="email"
          value={email}
          onChange={onChange}
          required
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={onChange}
          required
        />
        <select name="role" value={role} onChange={onChange} required>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="trainer">Trainer</option>
          <option value="trainee">Trainee</option>
        </select>
        <button type="submit">Register</button>
      </form>
      {errors.length > 0 && (
        <div>
          {errors.map((error, index) => (
            <p key={index} style={{ color: 'red' }}>
              {error.msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default Register;
