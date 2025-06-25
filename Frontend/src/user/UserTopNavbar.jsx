import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faChevronDown,
  faSignOutAlt,
  faTimes,
  faCheck,
  faExclamationCircle,
  faCalendarAlt,
  faFileAlt,
  faFileUpload,
  faInfoCircle,
  faCog,
  faEye,
  faEyeSlash,
  faComments,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import './UserTopNavbar.css';
import defaultAvatar from '../assets/avatar.jpg';
import logo from '../assets/logo.jpg';
import LogoutModal from '../components/LogoutModal';

const UserTopNavbar = ({ onNavigate }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editableUser, setEditableUser] = useState(null);

  const notificationRef = useRef(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear all localStorage and sessionStorage
      localStorage.removeItem("UserId");
      localStorage.removeItem("UserEmail");
      localStorage.removeItem("UserName");
      localStorage.removeItem("UserRole");
      localStorage.removeItem("token");
      
      // Clear any other app-specific storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('profilePic_') || key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
      
      sessionStorage.clear();
      
      // Redirect to main page
      window.location.href = '/mainpage';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      // Force redirect even if there's an error
      window.location.href = '/mainpage';
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(false);
  };

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUserId) {
        console.error("No logged-in user found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.profilePic) {
            localStorage.setItem(`profilePic_${loggedInUserId}`, data.profilePic);
          } else {
            const cachedProfilePic = localStorage.getItem(`profilePic_${loggedInUserId}`);
            if (cachedProfilePic) {
              data.profilePic = cachedProfilePic;
            }
          }
          setUser(data);
        } else {
          console.error("Error fetching user data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [loggedInUserId, API_BASE_URL]);

  // Update the notification state and functions
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = localStorage.getItem("UserId");
        if (!userId) return;

        // Fetch user details to get beneficiary status
        const userResponse = await fetch(`${API_BASE_URL}/getUserDetails`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const userData = await userResponse.json();
        const isBeneficiary = userData.beneficiary_status === 'beneficiary';

        // Fetch regular notifications
        const notificationsResponse = await fetch(`${API_BASE_URL}/notifications/${userId}`);
        const notificationsData = await notificationsResponse.json();

        // Fetch events
        // Inside the fetchNotifications function, modify the events filtering
        const eventsResponse = await fetch(`${API_BASE_URL}/api/events?userId=${userId}`);
        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch events');
        }
        const eventsData = await eventsResponse.json();
        
        // Filter events based on visibility, beneficiary status, and user status
        const filteredEvents = Array.isArray(eventsData) ? eventsData.filter(event => {
        // Hide events for users with Incomplete status
        if (userData.status === 'Incomplete') return false;
        
        if (!event.visibility || event.visibility === 'everyone') return true;
        if (event.visibility === 'beneficiaries') return isBeneficiary;
        if (event.visibility === 'not_beneficiaries') return !isBeneficiary;
        return false;
        }) : [];
        
        // Convert filtered events to notification format
        const eventNotifications = filteredEvents.map(event => ({
        id: `event_${event.id}`,
        type: 'event',
        message: `New Event: ${event.title}`,
        details: {
          date: `${formatDate(event.startDate)}`,
          time: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`,
          location: event.location,
          status: event.status
        },
        created_at: event.created_at || new Date().toISOString(),
        read: event.is_read === 1
        }));

        // Fetch follow-up notifications
        let followupData = [];
        try {
          const followupResponse = await fetch(`${API_BASE_URL}/followup-notifications/${userId}`);
          if (followupResponse.ok) {
            followupData = await followupResponse.json();
          } else {
            followupData = [];
          }
        } catch (err) {
          followupData = [];
        }

        // Convert events to notification format (only if eventsData is an array)
      

        // Normalize follow-up notifications
        const followupNotifications = Array.isArray(followupData) ? followupData.map(notif => ({
          id: notif.id,
          type: 'followup',
          message: notif.message,
          created_at: notif.created_at,
          read: notif.is_read === 1
        })) : [];

        // Add this new section to fetch forum notifications
        let forumNotifications = [];
        try {
          const forumResponse = await fetch(`${API_BASE_URL}/api/forum/notifications/${userId}`);
          if (forumResponse.ok) {
            forumNotifications = await forumResponse.json();
            // Convert to notification format
            forumNotifications = forumNotifications.map(notif => ({
              id: `forum_${notif.id}`,
              type: 'forum',
              message: notif.message,
              created_at: notif.accepted_at,
              read: notif.is_read === 1
            }));
          }
        } catch (err) {
          console.error("Error fetching forum notifications:", err);
          forumNotifications = [];
        }

        // Combine all notifications (add forumNotifications to existing array)
        const allNotifications = [
          ...notificationsData,
          ...eventNotifications,
          ...followupNotifications,
          ...forumNotifications  // Add this line
        ];

        // Sort by creation date (newest first)
        allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setNotifications(allNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      }
    };

    fetchNotifications();
    
    // Set up polling for new events every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update the markAsRead function to handle forum notifications
  const markAsRead = async (notificationId, type) => {
    try {
      const userId = localStorage.getItem("UserId");
      if (!userId) return;

      // Update the notification state to mark it as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      // Add this new condition for forum notifications
      if (type === 'forum') {
        const forumNotifId = notificationId.replace('forum_', '');
        await fetch(`${API_BASE_URL}/api/forum/notifications/mark-as-read/${forumNotifId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return;
      }

      if (type === 'event') {
        const eventId = notificationId.replace('event_', '');
        await fetch(`${API_BASE_URL}/api/events/mark-as-read/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId,
            eventId
          }),
        });
        return;
      }

      if (type === 'followup') {
        await fetch(`${API_BASE_URL}/followup-notifications/mark-as-read/${userId}/${notificationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return;
      }

      // For regular notifications, mark as read in the backend
      await fetch(`${API_BASE_URL}/notifications/mark-as-read/${userId}/${type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Update the getNotificationIcon function to include forum icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "event":
        return <FontAwesomeIcon icon={faCalendarAlt} className="notification-icon event" />;
      case "application":
        return <FontAwesomeIcon icon={faFileAlt} className="notification-icon application" />;
      case "document":
        return <FontAwesomeIcon icon={faFileUpload} className="notification-icon document" />;
      case "status":
        return <FontAwesomeIcon icon={faInfoCircle} className="notification-icon status" />;
      case "forum":
        return <FontAwesomeIcon icon={faComments} className="notification-icon forum" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="notification-icon" />;
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem("UserId");

      // Mark all regular notifications as read
      await fetch(`${API_BASE_URL}/notifications/mark-all-as-read/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      // Mark all follow-up notifications as read
      await fetch(`${API_BASE_URL}/followup-notifications/mark-all-as-read/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getUnreadCount = () => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((notif) => !notif.read).length;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Update the notification icon function


  useEffect(() => {
    const handlePopState = () => {
      // Only clear storage and redirect if we're actually logging out
      if (isLoggingOut) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("UserId");
        window.history.pushState(null, "", "/login");
        window.location.replace("/login");
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggingOut]);

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
    setShowDropdown(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 10 || newPassword.length > 15) {
      setPasswordError('Password must be between 10 and 15 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password');
      return;
    }

    try {
      const userId = localStorage.getItem("UserId");
      const email = localStorage.getItem("loggedInUser");
      if (!userId && !email) {
        setPasswordError('User not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully');
        setTimeout(() => {
          setShowChangePasswordModal(false);
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('An error occurred. Please try again. ' + (error.message || ''));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/updateUserInformation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: loggedInUserId,
          first_name: editableUser.first_name,
          middle_name: editableUser.middle_name,
          last_name: editableUser.last_name,
          suffix: editableUser.suffix,
          gender: editableUser.gender,
          date_of_birth: editableUser.date_of_birth,
          place_of_birth: editableUser.place_of_birth,
          religion: editableUser.religion,
          civil_status: editableUser.civil_status,
          income: editableUser.income,
          contact_number: editableUser.contact_number
        }),
      });

      if (response.ok) {
        if (window.toast) {
          window.toast.success('Profile updated successfully');
        } else {
          console.log('Profile updated successfully');
        }
        setUser({ ...editableUser });
        setShowEditProfileModal(false);
      } else {
        const errorData = await response.json();
        if (window.toast) {
          window.toast.error(errorData.error || 'Failed to update profile.');
        } else {
          console.error('Failed to update profile:', errorData.error);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (window.toast) {
        window.toast.error('An error occurred while updating the profile.');
      }
    }
  };

  return (
    <nav className="user-top-navbar">
      <div className="usernav-container">
        <div className="usernav-logo">
          <img src={logo} alt="Logo" className="nav-logo" />
        </div>

        <div className="usernav-links">
          <button 
            className={`usernav-link ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('profile');
              if (onNavigate) onNavigate('profile');
            }}
          >
            <FontAwesomeIcon icon={faUser} className="usernav-icon" />
            <span>Profile</span>
          </button>
          {/* Only show forum link for verified users */}
          {user && user.status === 'Verified' && (
            <button 
              className={`usernav-link ${activeSection === 'forum' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('forum');
                if (onNavigate) onNavigate('forum');
              }}
            >
              <FontAwesomeIcon icon={faComments} className="usernav-icon" />
              <span>Forum</span>
            </button>
          )}
        </div>

        <div className="usernav-actions">
          <div className="notification-container" ref={notificationRef}>
            <button 
              className="nav-btn notification-bell-green"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="notification-bell-bg">
                <FontAwesomeIcon icon={faBell} />
              </span>
              {getUnreadCount() > 0 && (
                <span className="notification-badge">{getUnreadCount()}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Notifications</h4>
                  {getUnreadCount() > 0 && (
                    <button className="mark-all-as-read-btn" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={`${notification.id}-${notification.created_at}`}
                        className={`notification-item ${notification.read ? "read" : "unread"}`}
                        onClick={() => markAsRead(notification.id, notification.type)}
                      >
                        <div className="notification-icon-wrapper-new">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          {notification.details && (
                            <div className="notification-details">
                              <p className="notification-date">{notification.details.date}</p>
                              <p className="notification-time">{notification.details.time}</p>
                              <p className="notification-location">{notification.details.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-notifications">No notifications available</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="nav-profile" onClick={() => setShowDropdown(!showDropdown)}>
            {!isLoading && (
              <>
                <img 
                  src={user?.profilePic || defaultAvatar} 
                  alt="Profile" 
                  className="profile-image"
                  onError={(e) => e.target.src = defaultAvatar}
                />
                <span className="profile-name">
                  {user ? (
                    user.status === 'Pending Remarks' 
                      ? user.name || 'Guest'
                      : `${user.first_name || 'First Name'} ${user.middle_name || ''} ${user.last_name || 'Last Name'}${user.suffix && user.suffix !== 'none' ? ` ${user.suffix}` : ''}`
                  ) : 'Guest'}
                </span>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`}
                />
              </>
            )}

            {showDropdown && (
              <div className="profile-dropdown">
                <button
                  className={`dropdown-item ${(user?.status === 'Pending Remarks' || user?.status === 'Terminated') ? 'disabled' : ''}`}
                  onClick={() => {
                    setEditableUser({ ...user });
                    setShowEditProfileModal(true);
                    setShowDropdown(false);
                  }}
                  disabled={user?.status === 'Pending Remarks' || user?.status === 'Terminated'}
                >
                  <FontAwesomeIcon icon={faUser} />
                  Edit Profile
                </button>
                <button 
                  className={`dropdown-item ${(user?.status === 'Pending Remarks' || user?.status === 'Terminated') ? 'disabled' : ''}`}
                  onClick={handleChangePassword}
                  disabled={user?.status === 'Pending Remarks' || user?.status === 'Terminated'}
                >
                  <FontAwesomeIcon icon={faCog} />
                  Change Password
                </button>
                <button 
                  className="dropdown-item logout-option"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutModal 
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      {showChangePasswordModal && (
        <div className="modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
          <div className="modal-content change-password-modal" onClick={e => e.stopPropagation()}>
            <h3>Change Password</h3>
            
            {passwordSuccess && (
              <div className="success-message">
                {passwordSuccess}
              </div>
            )}
            
            {passwordError && (
              <div className="error-message">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={submitChangePassword}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <small className="password-helper">Password must be between 10-15 characters</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowChangePasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditProfileModal && editableUser && (
        <div className="modal-overlay">
          <div className="modal-content edit-profile-modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" value={editableUser.first_name || ''} onChange={(e) => setEditableUser({...editableUser, first_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input type="text" value={editableUser.middle_name || ''} onChange={(e) => setEditableUser({...editableUser, middle_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" value={editableUser.last_name || ''} onChange={(e) => setEditableUser({...editableUser, last_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Suffix</label>
                  <input type="text" value={editableUser.suffix || ''} onChange={(e) => setEditableUser({...editableUser, suffix: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={editableUser.gender || ''} onChange={(e) => setEditableUser({...editableUser, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Birthdate</label>
                  <input type="date" value={editableUser.date_of_birth ? editableUser.date_of_birth.split('T')[0] : ''} onChange={(e) => setEditableUser({...editableUser, date_of_birth: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Place of Birth</label>
                  <input type="text" value={editableUser.place_of_birth || ''} onChange={(e) => setEditableUser({...editableUser, place_of_birth: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Barangay</label>
                  <input type="text" value={editableUser.barangay || ''} disabled />
                </div>
                <div className="form-group">
                  <label>Religion</label>
                  <input type="text" value={editableUser.religion || ''} onChange={(e) => setEditableUser({...editableUser, religion: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Civil Status</label>
                   <select value={editableUser.civil_status || ''} onChange={(e) => setEditableUser({...editableUser, civil_status: e.target.value})}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monthly Income</label>
                  <input type="text" value={editableUser.income || ''} onChange={(e) => setEditableUser({...editableUser, income: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" value={editableUser.contact_number || ''} onChange={(e) => setEditableUser({...editableUser, contact_number: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditProfileModal(false)}>
                  Cancel
                </button>
                <button type="button" className="submit-btn" onClick={handleUpdateProfile}>
                  Save Changes
                </button>
              </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserTopNavbar;