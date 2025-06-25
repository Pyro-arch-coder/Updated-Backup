import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRaw = localStorage.getItem("loggedInUser");
  let user = null;
  try {
    user = JSON.parse(userRaw);
  } catch (e) {
    user = null;
  }
  console.log("[ProtectedRoute] user from localStorage:", user); // Debug log

  // If user is not present, not an object, or missing role, force logout
  if (!user || typeof user !== 'object' || !user.role) {
    // Only remove user-related keys, not all of localStorage
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("UserId");
    localStorage.removeItem("id");
    localStorage.removeItem("barangay");
    sessionStorage.clear();
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Not authorized
    return <Navigate to="/not-authorized" />;
  }

  return children;
};

export default ProtectedRoute;
