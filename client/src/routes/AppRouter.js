import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ExampleList from "../components/ExampleList";
import Navbar from "../components/Navbar";
import AdminDashboard from "../pages/AdminDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import TrainerDashboard from "../pages/TrainerDashboard";
import TraineeDashboard from "../pages/TraineeDashboard";
import RoleManagement from "../pages/RoleManagement";
import ChallengeList from "../pages/ChallengeList";
import ChallengeDetail from "../pages/ChallengeDetail";
import ChallengeForm from "../pages/ChallengeForm";
import ManageSubmissions from "../pages/ManageSubmissions";
import SubmissionList from "../pages/SubmissionList";
import SubmissionDetail from "../pages/SubmissionDetail";
import Notifications from "../pages/Notifications";
import Assignments from "../pages/Assignments";
import AssignmentForm from "../pages/AssignmentForm";
import AssignmentDetail from "../pages/AssignmentDetail";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute"; // A new role-based route component
import { AuthProvider } from "../context/authContext";
import AssignmentAttempt from "../pages/AssignmentAttempt";
import ChallengeAttempt from "../pages/ChallengeAttempt";

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
            path="/admin/users/:id/roles"
            element={
              <RoleRoute element={<RoleManagement />} roles={["admin"]} />
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
          <Route path="/challenges" element={<ChallengeList />} />
          <Route path="/challenges/create" element={<PrivateRoute element={<ChallengeForm />} />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/challenges/:id/new" element={<ChallengeAttempt />} />
          <Route
            path="/submissions/challenge/:id"
            element={<PrivateRoute element={<SubmissionList />} />}
          />
          <Route
            path="/submissions"
            element={<PrivateRoute element={<ManageSubmissions />} />}
          />
          <Route
            path="/submissions/:id"
            element={<PrivateRoute element={<SubmissionDetail />} />}
          />
          <Route
            path="/notifications"
            element={<PrivateRoute element={<Notifications />} />}
          />
          <Route
            path="/assignments"
            element={<PrivateRoute element={<Assignments />} />}
          />
          <Route
            path="/assignments/create"
            element={
              <RoleRoute
                element={<AssignmentForm />}
                roles={["manager", "admin"]}
              />
            }
          />
          <Route
            path="/assignments/:id"
            element={<PrivateRoute element={<AssignmentDetail />} />}
          />
          <Route
            path="/assignments/:id/new"
            element={<PrivateRoute element={<AssignmentAttempt />} />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
