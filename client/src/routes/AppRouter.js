import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ExampleList from "../components/ExampleList";
import Navbar from "../components/Navbar";
import AdminDashboard from "../components/AdminDashboard";
import ManagerDashboard from "../components/ManagerDashboard";
import TrainerDashboard from "../components/TrainerDashboard";
import TraineeDashboard from "../components/TraineeDashboard";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute"; // A new role-based route component
import { AuthProvider } from "../context/authContext";

const AppRouter = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/examples"
            element={<PrivateRoute element={<ExampleList />} />}
          />
          <Route
            path="/profile"
            element={<PrivateRoute element={<Profile />} />}
          />
          <Route
            path="/admin"
            element={
              <RoleRoute element={<AdminDashboard />} roles={["admin"]} />
            }
          />
          <Route
            path="/manager"
            element={
              <RoleRoute
                element={<ManagerDashboard />}
                roles={["manager", "admin"]}
              />
            }
          />
          <Route
            path="/trainer"
            element={
              <RoleRoute
                element={<TrainerDashboard />}
                roles={["trainer", "manager", "admin"]}
              />
            }
          />
          <Route
            path="/trainee"
            element={
              <RoleRoute
                element={<TraineeDashboard />}
                roles={["trainee", "trainer", "manager", "admin"]}
              />
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
