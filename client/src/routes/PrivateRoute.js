import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/authContext';
import LoadingSpinner from '../components/LoadingSpinner';

const PrivateRoute = ({ element }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return < LoadingSpinner/>; // Or a loading spinner, etc.
  }

  return isAuthenticated ? element : <Navigate to="/login" />;
};

export default PrivateRoute;
