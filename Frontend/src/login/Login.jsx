import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import FaceAuth from "./FaceAuth";
import { toast } from 'react-toastify';
import mswdoLogo from "../assets/MSWDO LOGO.png";

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

// Example for safe localStorage usage
const safeSetItem = (key, value) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};
const safeGetItem = (key) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [faceAuthError, setFaceAuthError] = useState("");

  useEffect(() => {
    const savedCredentials = safeGetItem('savedCredentials');
    if (savedCredentials) {
      let parsed = null;
      try {
        parsed = JSON.parse(savedCredentials);
      } catch (err) {
        safeSetItem('savedCredentials', null);
      }
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.email != null &&
        parsed.password != null
      ) {
        setFormData({ email: parsed.email, password: parsed.password });
        setRememberMe(true);
      } else {
        setFormData({ email: '', password: '' });
        setRememberMe(false);
      }
    } else {
      setFormData({ email: '', password: '' });
      setRememberMe(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const { user } = data;
        // Ensure user object has a valid role, fallback to 'user' if missing
        if (!user.role) {
          user.role = "user";
        }
        safeSetItem("loggedInUser", JSON.stringify(user));
        console.log("[Login] Set loggedInUser:", JSON.stringify(user)); // Debug log
        safeSetItem("UserId", user.id);
        
        // Store admin ID and barangay if the user is an admin
        if (user.role === "admin") {
          safeSetItem("id", user.id);
          safeSetItem("barangay", user.barangay);
        }

        // Store superadmin ID and email if the user is a superadmin
        if (user.role === "superadmin") {
          safeSetItem("superadminId", user.id);
          safeSetItem("superadminEmail", user.email);
        }

        // Save credentials if rememberMe is checked
        if (rememberMe) {
          safeSetItem('savedCredentials', JSON.stringify(formData));
        } else {
          safeSetItem('savedCredentials', null);
        }

        handleLoginSuccess(user.role);
      } else if (response.status === 403 && data.error === 'Account is pending approval') {
        // Handle pending account status
        setError(
          <div className={styles.pendingMessage}>
            <p><strong>Your application is currently being reviewed by our administrators.</strong></p>
          </div>
        );
        safeSetItem('savedCredentials', null);
      } else {
        setError(data.error || "Login failed. Please try again.");
        safeSetItem('savedCredentials', null);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server. Please try again later.");
      safeSetItem('savedCredentials', null);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceAuthSuccess = (user) => {
    try {
      if (!user || typeof user !== 'object') {
        setFaceAuthError('Invalid user data received from face authentication.');
        setShowFaceAuth(false);
        return;
      }
      // Store for ProtectedRoute
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      localStorage.setItem("UserId", user.id);
      // For backward compatibility with older code
      if (user.role) {
        localStorage.setItem("id", user.id);
        localStorage.setItem("barangay", user.barangay || "");
      }
      // Determine user role - in case the face auth endpoint doesn't return role
      const role = user.role || "user";
      navigateToDashboard(role);
    } catch (err) {
      console.error("Error during face auth login:", err);
      setFaceAuthError("Error completing face authentication login. Please try again.");
      setShowFaceAuth(false);
    }
  };

  const navigateToDashboard = (role) => {
    switch (role) {
      case "admin":
        navigate("/adminpage");
        break;
      case "superadmin":
        navigate("/superadminpage");
        break;
      default:
        navigate("/user");
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const openFaceAuth = () => {
    setShowFaceAuth(true);
  };

  const closeFaceAuth = () => {
    setShowFaceAuth(false);
    setFaceAuthError("");
  };

  const handleLoginSuccess = (role) => {
    // Check if user was trying to access profile before login
    const fromProfile = safeGetItem('fromProfile');
    
    if (fromProfile) {
      safeSetItem('fromProfile', null);
      navigate('/profile');
    } else {
      navigateToDashboard(role);
    }
  };

  if (showFaceAuth) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <button 
            className={styles.backButton}
            onClick={closeFaceAuth}
          >
            ← Back to Login
          </button>
          {faceAuthError && <p className={styles.errorMessage}>{faceAuthError}</p>}
          <FaceAuth 
            onLoginSuccess={handleFaceAuthSuccess} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.imageColumn}></div>
      <div className={styles.formColumn}>
        <div className={styles.loginBox}>
          <img src={mswdoLogo} alt="MSWDO Logo" className={styles.logo} />
          <h2>Login</h2>
          {error && <p className={styles.errorMessage}>{error}</p>}
          
          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordContainer}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  data-visible={showPassword}
                >
                </button>
              </div>
            </div>
            
            <div className={styles.rememberMe}>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
            </div>
            
            <div className={styles.forgotPassword}>
              <button 
                type="button"
                className={styles.forgotPasswordBtn}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>
            
            <button 
              type="submit" 
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <button
              type="button"
              className={styles.faceAuthBtn}
              onClick={openFaceAuth}
            >
              Login with Face Recognition
            </button>
          </form>
          
          <p className={styles.signupText}>
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
