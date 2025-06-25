import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    // Verify the token is valid when component mounts
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/verify-reset-token/${token}`);
        const data = await response.json();
        
        if (data.valid) {
          setTokenValid(true);
        } else {
          setError("This password reset link is invalid or has expired.");
        }
      } catch (err) {
        console.error("Error verifying token:", err);
        setError("Error verifying reset link. Please try again or request a new link.");
      } finally {
        setTokenChecked(true);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setError("No reset token provided");
      setTokenChecked(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError("");
    setMessage("");
    
    // Validate input
    if (!password) {
      setError("Please enter a new password");
      return;
    }
    
    if (password.length < 10 || password.length > 15) {
      setError("Password must be between 10 and 15 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage("Your password has been reset successfully. You can now log in with your new password.");
        // Clear form
        setPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(data.error || "Failed to reset password");
      }
    } catch (err) {
      console.error("Error during password reset:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const goBackToLogin = () => {
    navigate("/login");
  };

  if (!tokenChecked) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h2>Reset Password</h2>
          <p>Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2>Reset Password</h2>
        
        {error && <p className={styles.errorMessage}>{error}</p>}
        {message && <p className={styles.successMessage}>{message}</p>}
        
        {!message && tokenValid ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className={styles.passwordHelper}>Password must be between 10-15 characters</small>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={goBackToLogin}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 