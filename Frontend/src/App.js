import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from "./components/Navbar";
import MainPage from "./mainpage/MainPage";
import Login from "./login/Login";
import ForgotPassword from "./login/ForgotPassword";
import ResetPassword from "./login/ResetPassword";
import MultiStepForm from "./user/MultiStepForm";
import AdminPage from "./adminpage/AdminPage";
import User from "./user/User"; 
import SuperAdminPage from "./superadminpage/SuperAdminPage"; 
import SubmissionSuccess from "./user/SubmissionSuccess"; 
import Profile from "./user/Profile"; 
import ForumPage from "./user/ForumPage"; 
import ProtectedRoute from "./components/ProtectedRoute";
import NotAuthorized from "./pages/NotAuthorized";
import { AdminProvider } from './contexts/AdminContext';
import './App.css';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AdminProvider>
        <Router>
          <MainContent />
        </Router>
      </AdminProvider>
    </ThemeProvider>
  );
}

const MainContent = () => {
  const location = useLocation();
  const hideNavbar = [
    "/adminpage", 
    "/user", 
    "/login", 
    "/signup", 
    "/form",
    "/profile",
    "/forgot-password",
    "/submission-success",
    "/forum"
  ].some(path => location.pathname.startsWith(path)) 
  || location.pathname.startsWith("/superadminpage");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/signup" element={<MultiStepForm />} />
        <Route path="/submission-success" element={<SubmissionSuccess />} /> 
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/adminpage/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <User />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <ForumPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadminpage/*"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/not-authorized" element={<NotAuthorized />} />
      </Routes>
    </>
  );
};

export default App;
