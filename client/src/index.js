import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/authContext";
import "./index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} />
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
