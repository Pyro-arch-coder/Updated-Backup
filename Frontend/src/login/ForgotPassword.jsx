import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear any previous messages when email changes
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Reset states
    setError("");
    setMessage("");
    setLoading(true);

    try {
      console.log("Sending password reset request for email:", email);
      
      // First, verify the email exists
      const checkResponse = await fetch(`${API_BASE_URL}/api/check-user-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Check user status response status:", checkResponse.status);
      
      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
          throw new Error("Email not found. Please check your email or register a new account.");
        }
        throw new Error(`Server error: ${checkResponse.status}`);
      }

      const checkData = await checkResponse.json();
      console.log("Check user status response data:", checkData);
      
      if (!checkData.success) {
        throw new Error(checkData.error || "Email not found. Please check your email.");
      }

      // Check user status
      if (checkData.user && checkData.user.status !== 'Verified') {
        setError(`Your account status is "${checkData.user.status}". Only verified accounts can reset passwords. Please contact an administrator for assistance.`);
        setLoading(false);
        return;
      }

      // If email exists and is verified, send password reset request
      console.log("Sending reset password request to server");
      const resetResponse = await fetch(`${API_BASE_URL}/api/reset-password-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Reset password response status:", resetResponse.status);
      
      // Handle 403 Forbidden specifically
      if (resetResponse.status === 403) {
        const errorData = await resetResponse.json();
        setError(errorData.error || "Your account is not verified yet. Only verified accounts can use the password reset feature. Please contact an administrator for assistance.");
        setLoading(false);
        return;
      }
      
      if (!resetResponse.ok) {
        const errorText = await resetResponse.text();
        console.error("Reset password error response:", errorText);
        throw new Error(`Failed to send reset link: ${resetResponse.status}`);
      }

      const resetData = await resetResponse.json();
      
      if (resetData.success) {
        setMessage("Password reset link has been sent to your email. Please check your inbox.");
        setResetSent(true);
      } else {
        throw new Error(resetData.error || "Failed to send password reset link.");
      }
    } catch (err) {
      console.error("Error during password reset request:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2>Forgot Password</h2>
        
        {error && <p className={styles.errorMessage}>{error}</p>}
        {message && <p className={styles.successMessage}>{message}</p>}
        
        {!resetSent ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
            
            <p className={styles.instructionText}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={goBackToLogin}
                disabled={loading}
              >
                Back to Login
              </button>
              
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.resetSuccess}>
            <p>
              A password reset link has been sent to your email. Please check your
              inbox and follow the instructions to reset your password.
            </p>
            
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

export default ForgotPassword; 