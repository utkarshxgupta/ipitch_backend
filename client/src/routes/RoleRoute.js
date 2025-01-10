import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/authContext';
import LoadingSpinner from '../components/LoadingSpinner';

const RoleRoute = ({ element, roles }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner />;
  }

  const userRoles = user ? user.role : [];
  const hasAccess = roles.some(role => userRoles.includes(role));

  return isAuthenticated && hasAccess ? element : <Navigate to="/login" />;
};

export default RoleRoute;
