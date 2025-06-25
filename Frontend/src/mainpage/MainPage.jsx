import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/Hero"; 
import Announcements from "../components/Announcements";
import About from "../components/About";
import Contacts from "../components/Contacts";
import "./MainPage.css";

const MainPage = () => {
  const location = useLocation();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    // Check if user is coming from submission success page
    const fromSubmission = sessionStorage.getItem("applicationSubmitted");
    if (fromSubmission === "true") {
      setShowWelcomeMessage(true);
      // Clear the flag after showing the message
      setTimeout(() => {
        sessionStorage.removeItem("applicationSubmitted");
      }, 1000);
    }
  }, [location]);

  const handleCloseWelcomeMessage = () => {
    setShowWelcomeMessage(false);
  };

  return (
    <>
      {showWelcomeMessage && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <div className="welcome-icon">✓</div>
            <div className="welcome-text">
              <h3>Application Submitted Successfully!</h3>
              <p>Your Solo Parent ID application is now pending approval. Please check your email for updates.</p>
            </div>
            <button className="close-welcome-btn" onClick={handleCloseWelcomeMessage}>×</button>
          </div>
        </div>
      )}
      <Hero />
      <Announcements />
      <About />
      <Contacts />
    </>
  );
};

export default MainPage;
