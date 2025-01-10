import React, { useState, useContext } from 'react';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      toast.success('Login successful');
      navigate('/profile');
    } catch (err) {
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
      }
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <input type="email" name="email" value={email} onChange={onChange} required />
        <input type="password" name="password" value={password} onChange={onChange} required />
        <button type="submit">Login</button>
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

export default Login;
