import React, { useState, useEffect } from 'react';
import ForumRoom from './ForumRoom';
import './ForumPage.css';
import { Navigate } from 'react-router-dom';

const ForumPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  // Fetch user data to check status
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUserId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }),
        });

        const data = await response.json();

        if (response.ok) {
          setCurrentUser(data);
        } else {
          setError("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("An error occurred while fetching user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [loggedInUserId, API_BASE_URL]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // Check if user has access to forum
  const hasAccess = currentUser && currentUser.status === 'Verified';
  
  // Redirect to profile page if user doesn't have access
  if (!hasAccess) {
    return <Navigate to="/profile" />;
  }

  return (
    <div className="forum-page-container">
      <div className="forum-page-content">
        <ForumRoom />
      </div>
    </div>
  );
};

export default ForumPage;
