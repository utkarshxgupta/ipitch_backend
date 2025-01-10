import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
};

const AuthContext = createContext(initialState);

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        user: action.payload.user,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user: decoded.user },
      });
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const login = async (formData) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', formData);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { token: res.data.token, user: jwtDecode(res.data.token).user },
    });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
