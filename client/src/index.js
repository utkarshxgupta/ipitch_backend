import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/authContext";
import "./index.css";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import customTheme from "./theme";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ChakraProvider theme={customTheme}>
        <ColorModeScript initialColorMode="light" />
        <ToastContainer position="top-right" autoClose={5000} />
        <AppRouter />
      </ChakraProvider>
    </AuthProvider>
  </React.StrictMode>
);
