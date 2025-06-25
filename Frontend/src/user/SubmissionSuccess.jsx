import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SubmissionSuccess.css";

const SubmissionSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Set flag in session storage to show welcome message on main page
    sessionStorage.setItem("applicationSubmitted", "true");
    
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      navigate("/");
    }
  }, [countdown, navigate]);

  return (
    <div className="submission-success-container">
      <div className="success-card">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#40916c" />
            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        
        <h1 className="success-title">Application Submitted Successfully!</h1>
        
        <div className="success-message">
          <p>Thank you for submitting your Solo Parent ID application.</p>
          <p>Your application is now pending approval.</p>
          <p className="email-note">Please check both your inbox and spam folders for updates on your application status.</p>
        </div>
        
        <div className="redirect-message">
          <p>You will be redirected to the homepage in <span className="countdown">{countdown}</span> seconds</p>
          <button 
            className="redirect-now-btn"
            onClick={() => navigate("/")}
          >
            Go to Homepage Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
