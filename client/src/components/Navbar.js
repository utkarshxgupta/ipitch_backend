import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  console.log(user);
  const handleLogout = () => {
    logout(); // Perform logout
    toast.success("Logged out successfully");
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav>
      <Link to="/">Home</Link>
      {isAuthenticated && user ? (
        <>
          {user.role.includes("admin") && (
            <Link to="/admin">Admin Dashboard</Link>
          )}
          {user.role.includes("manager") && (
            <Link to="/manager">Manager Dashboard</Link>
          )}
          {user.role.includes("trainer") && (
            <Link to="/trainer">Trainer Dashboard</Link>
          )}
          {user.role.includes("trainee") && (
            <Link to="/trainee">Trainee Dashboard</Link>
          )}
          <Link to="/profile">Profile</Link>
          <Link to="/examples">Examples</Link>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
