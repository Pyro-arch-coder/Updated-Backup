import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Profile.css';
import './ResendApplicationModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt,
  faCalendarAlt,
  faVenusMars,
  faIdCard,
  faFileAlt,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faPrint,
  faFilePdf,
  faCamera,
  faTimes,
  faSignOutAlt,
  faEdit,
  faDownload,
  faStar,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import avatar from '../assets/avatar.jpg';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import LogoutModal from '../components/LogoutModal';
import { QRCodeSVG } from 'qrcode.react';
import dswdLogo from '../assets/dswd-logo.png';
import santaMariaBarangays from '../data/santaMariaBarangays.json';
import philippinesData from '../data/philippines.json';
import html2canvas from 'html2canvas';
import mswdoLogo from '../assets/MSWDO LOGO.png';

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

// Function to calculate age from birthdate
const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  
  const birthDate = new Date(birthdate);
  const today = new Date();
  
  // Check if birthdate is valid
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred yet this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};
const Profile = () => {
  const [showResendModal, setShowResendModal] = useState(false);
  const [declinedInfo, setDeclinedInfo] = useState(null);
  const [isDeclinedLoading, setIsDeclinedLoading] = useState(false);

  // Fetch declined info when resend modal opens
  useEffect(() => {
    if (showResendModal) {
      setIsDeclinedLoading(true);
      axios.get(`${API_BASE_URL}/declineInfo?userId=${loggedInUserId}`, { withCredentials: true })
        .then(res => {
          setDeclinedInfo(res.data);
        })
        .catch(err => {
          setDeclinedInfo(null);
        })
        .finally(() => setIsDeclinedLoading(false));
    }
  }, [showResendModal]);

  // ...rest of the Profile component code


  // ...rest of Profile


  const [activeTab, setActiveTab] = useState('personal');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [uploadProgress, setUploadProgress] = useState({});
  const [user, setUser] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [events, setEvents] = useState([]); // State for events
  const [attendanceModal, setAttendanceModal] = useState({
    show: false,
    message: '',
    attended: false
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventRatings, setEventRatings] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [fetchingRatings, setFetchingRatings] = useState(false);
  const [hasAttended, setHasAttended] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [childRequests, setChildRequests] = useState([]);
  const [loadingChildRequests, setLoadingChildRequests] = useState(false);

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
  const CLOUD_NAME = 'dskj7oxr7';
  const UPLOAD_PRESET = 'soloparent';
  const CLOUDINARY_FOLDER = 'soloparent/users';

  const documentTypes = {
    psa: 'PSA Birth Certificate',
    itr: 'Income Tax Return',
    med_cert: 'Medical Certificate',
    marriage: 'Marriage Certificate',
    cenomar: 'CENOMAR',
    death_cert: 'Death Certificate',
    barangay_cert: 'Barangay Certificate'
  };

  // Add function to get documents based on civil status
  const getDocumentsByCivilStatus = (civilStatus) => {
    const baseDocuments = ['psa', 'itr', 'med_cert'];
    
    switch (civilStatus?.toLowerCase()) {
      case 'single':
        return [...baseDocuments, 'cenomar'];
      case 'married':
        return [...baseDocuments, 'marriage'];
      case 'divorced':
        return [...baseDocuments, 'marriage'];
      case 'widowed':
        return [...baseDocuments, 'marriage', 'death_cert'];
      default:
        return baseDocuments;
    }
  };

  // Add these functions for profile picture handling
  const getProfilePicture = () => {
    if (user?.profilePic) {
      return user.profilePic;
    }
    const cachedProfilePic = localStorage.getItem(`profilePic_${loggedInUserId}`);
    return cachedProfilePic || avatar;
  };

  const getImageUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined' || url === avatar) {
      return avatar;
    }
    return url;
  };

  const addCacheBuster = (url) => {
    if (!url || url === avatar) return url;
    return `${url}?t=${new Date().getTime()}`;
  };

  // Update the handleFileSelect function
  const fileInputRef = useRef(null);
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only image files (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size should not exceed 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setShowUploadModal(true);
  };

  // Helper to reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update the handleUploadProfilePic function
  const handleUploadProfilePic = async () => {
    if (!selectedFile || !loggedInUserId) return;
    
    setIsUploading(true);
    const uploadingToastId = toast.loading('Uploading profile picture...');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `${CLOUDINARY_FOLDER}/${loggedInUserId}/profile`);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await response.json();
      
      if (cloudinaryData.secure_url) {
        const updateResponse = await fetch(`${API_BASE_URL}/updateUserProfile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: loggedInUserId,
            profilePic: cloudinaryData.secure_url,
          }),
        });

        if (updateResponse.ok) {
          setUser(prev => ({ ...prev, profilePic: cloudinaryData.secure_url }));
          localStorage.setItem(`profilePic_${loggedInUserId}`, cloudinaryData.secure_url);
          toast.dismiss(uploadingToastId);
          toast.success('Profile picture updated successfully');
          setShowUploadModal(false);
          setSelectedFile(null);
          setPreviewUrl(null);
          setRefreshKey(oldKey => oldKey + 1);
        } else {
          throw new Error('Failed to update profile picture');
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.dismiss(uploadingToastId);
      toast.error('Failed to upload profile picture. Please try again.');
      localStorage.removeItem(`profilePic_${loggedInUserId}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Update the useEffect for fetching user details
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
        console.log("Received user data:", data);

        if (response.ok) {
          if (data.profilePic) {
            localStorage.setItem(`profilePic_${loggedInUserId}`, data.profilePic);
          } else {
            const cachedProfilePic = localStorage.getItem(`profilePic_${loggedInUserId}`);
            if (cachedProfilePic) {
              data.profilePic = cachedProfilePic;
            }
          }
          console.log("Setting user data:", data);
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

  // Add responsive window resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect to refresh component when user data changes
  useEffect(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, [user?.profilePic]);

  // Add function to validate document URL
  const getValidDocumentUrl = (doc) => {
    if (!doc) return null;
    
    let url = doc.file_url || '';
    
    if (typeof url !== 'string') return null;
    if (url.trim() === '') return null;
    
    if (url && !url.startsWith('http')) {
      url = `http://${url}`;
    }
    
    return url;
  };

  // Update the uploadDocument function to set status to 'Pending' for Barangay Certificate
  const uploadDocument = async (file, documentType) => {
    if (!file) return;

    const uploadingToastId = toast.loading(`Uploading ${documentTypes[documentType]}...`);
    setIsUploading(true);
    
    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be an image (JPEG/PNG) or PDF');
      }

      // Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `${CLOUDINARY_FOLDER}/${loggedInUserId}/documents/${documentType}`);

      // Upload to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [documentType]: percentCompleted
            }));
          }
        }
      );
      
      const documentUrl = response.data.secure_url;
      
      if (documentType === 'barangay_cert') {
        // Only upload to barangay_cert_documents for barangay_cert
        await axios.post(`${API_BASE_URL}/api/documents/barangay_cert`, {
          code_id: user.code_id,
          file_name: documentUrl,
          display_name: file.name,
          status: 'Pending'
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/documents/follow_up`, {
          code_id: user.code_id,
          document_type: documentType,
          status: 'Pending',
          file_url: documentUrl,
          display_name: file.name
        });
        await axios.post(`${API_BASE_URL}/api/documents/${documentType}`, {
          code_id: user.code_id,
          file_name: documentUrl,
          display_name: file.name,
          status: 'Pending'
        });
      }
      
      // Update local state
      setDocuments(prev => [
        ...prev,
        {
          url: documentUrl,
          public_id: response.data.public_id,
          name: file.name,
          status: 'Pending',
          document_type: `${documentType}_documents`
        }
      ]);
      
      toast.dismiss(uploadingToastId);
      toast.success(`${documentTypes[documentType]} uploaded successfully and is pending verification`);
    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error);
      toast.dismiss(uploadingToastId);
      toast.error(error.message || `Failed to upload ${documentType}. Please try again.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => ({
        ...prev,
        [documentType]: 0
      }));
    }
  };

  const handleDocumentChange = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    await uploadDocument(file, documentType);
  };

  const confirmDelete = (documentType) => {
    setDocumentToDelete(documentType);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    const documentType = documentToDelete;
    if (!documentType || !documents.find(doc => doc.document_type === `${documentType}_documents`)) return;

    const deletingToastId = toast.loading(`Deleting ${documentTypes[documentType]}...`);
    
    try {
      await axios.post(`${API_BASE_URL}/api/documents/deleteDocument`, {
        userId: loggedInUserId,
        documentType
      });

      setDocuments(prev => prev.filter(doc => doc.document_type !== `${documentType}_documents`));

      toast.dismiss(deletingToastId);
      toast.success(`${documentTypes[documentType]} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${documentType}:`, error);
      toast.dismiss(deletingToastId);
      toast.error(`Failed to delete ${documentTypes[documentType]}. Please try again.`);
    } finally {
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  const handleDeleteCancelled = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const handleRemoveDocument = async (documentType) => {
    confirmDelete(documentType);
  };

  // Add fetchDocuments function
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user details:', data);
        if (data && Array.isArray(data.documents)) {
          setDocuments(data.documents);
        } else {
          setDocuments([]);
        }
      } else {
        console.error('Error fetching user details:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Add useEffect to fetch documents
  useEffect(() => {
    if (loggedInUserId) {
      fetchDocuments();
    }
  }, [loggedInUserId, refreshKey]);

  // Add this function to fetch events
  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events?userId=${loggedInUserId}`);
      if (response.data) {
        // Filter events based on user's barangay
        const userBarangay = user?.barangay;
        const filteredEvents = response.data.filter(event => 
          event.barangay === 'All' || event.barangay === userBarangay
        );
        
        // Sort events by date
        filteredEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        setEvents(filteredEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  // Add useEffect to fetch events when user data changes
  useEffect(() => {
    if (loggedInUserId && user) {
      fetchEvents();
    }
  }, [loggedInUserId, user]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  const checkAttendance = async (eventId) => {
    try {
      if (!user || !user.code_id) {
        toast.error('User information not available');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/events/checkAttendance`,
        { 
          eventId: eventId,
          userId: user.code_id  // Using code_id as the userId for attendance check
        }
      );
      
      if (response.data.attended !== undefined) {
        setAttendanceModal({
          show: true,
          message: response.data.attended 
            ? 'You have attended this event' 
            : 'You have not attended this event yet',
          attended: response.data.attended
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
      toast.error('Unable to check attendance status');
      setAttendanceModal({
        show: true,
        message: 'Unable to check attendance status',
        attended: false
      });
    }
  };

  const AttendanceModal = () => (
    <div className={`attendance-modal ${attendanceModal.show ? 'show' : ''}`}>
      <div className="modal-content">
        {attendanceModal.attended ? (
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" size="3x" />
        ) : (
          <FontAwesomeIcon icon={faTimesCircle} className="error-icon" size="3x" />
        )}
        <p className={attendanceModal.attended ? 'success' : 'warning'}>
          {attendanceModal.message}
        </p>
        <button 
          onClick={() => setAttendanceModal({...attendanceModal, show: false})}
          className="modal-close-btn"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Rename and update the function to check for restricted access
  const hasRestrictedAccess = () => {
    return user?.status === 'Pending Remarks' || user?.status === 'Terminated';
  };

  // Add function to check if all required documents are submitted and approved
  const checkDocumentCompletion = () => {
    if (!user || !user.civil_status) return false;
    
    const requiredDocuments = getDocumentsByCivilStatus(user.civil_status);
    if (documents.length === 0) return false;
    
    const submittedDocuments = documents.map(doc => doc.document_type.replace('_documents', ''));
    
    // Check if all required documents are submitted AND approved
    const allDocumentsApproved = requiredDocuments.every(docType => {
      const document = documents.find(doc => doc.document_type === `${docType}_documents`);
      return document && document.status === 'Approved';
    });
    
    return allDocumentsApproved;
  };

  // Add function to update user status based on document completion
  const updateUserStatus = async () => {
    if (!user || !user.code_id) {
      console.error('Cannot update status: User or code_id is missing');
      return;
    }
    
    const isComplete = checkDocumentCompletion();
    const currentStatus = user.status;
    
    // Only update if status needs to change
    if ((isComplete && currentStatus === 'Incomplete') || 
        (!isComplete && currentStatus === 'Verified')) {
    try {
      const response = await axios.post(`${API_BASE_URL}/updateUserStatusIncompleteDocuments`, {
        code_id: user.code_id,
        status: isComplete ? 'Verified' : 'Incomplete'
      });
      
      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          status: isComplete ? 'Verified' : 'Incomplete'
        }));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update status. Please try again later.');
    }
    }
  };

  // Add useEffect to check document completion when documents change
  useEffect(() => {
    if (user) {
      updateUserStatus();
    }
  }, [documents, user]);

  useEffect(() => {
    const handlePopState = (event) => {
      setShowLogoutModal(true);
      window.history.pushState(null, '', window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
      sessionStorage.clear();
    }
    window.location.replace('/mainpage');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Enhanced Upload Modal component
  const UploadModal = () => (
    <div className="upload-profile-modal-overlay show">
      <div className="upload-profile-modal">
        <div className="upload-profile-modal-header">
          <h2>Upload Profile Picture</h2>
          <button
            className="upload-profile-modal-close-btn"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setPreviewUrl(null);
              resetFileInput();
            }}
            disabled={isUploading}
          >
            &times;
          </button>
        </div>
        <div className="upload-profile-modal-body">
          {previewUrl ? (
            <div className="upload-profile-image-preview-wrapper">
              <img
                src={previewUrl}
                alt="Selected profile picture preview"
                className="upload-profile-image-preview"
                onError={() => {
                  setPreviewUrl(null);
                  toast.error('Failed to load image preview');
                }}
              />
            </div>
          ) : (
            <div className="upload-profile-no-preview">
              <FontAwesomeIcon icon={faCamera} size="3x" />
              <p>No image selected</p>
            </div>
          )}
          <div className="upload-profile-file-input-wrapper">
            <label className="upload-profile-file-input-label">
              <FontAwesomeIcon icon={faCamera} /> Choose Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                ref={fileInputRef}
              />
            </label>
            {selectedFile && (
              <p className="upload-profile-file-info">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
        <div className="upload-profile-modal-footer">
          <button
            className="upload-profile-btn cancel-btn"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setPreviewUrl(null);
              resetFileInput();
            }}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            className={`upload-profile-btn confirm-btn ${isUploading ? 'uploading' : ''}`}
            onClick={handleUploadProfilePic}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="upload-profile-spinner"></span>
                Uploading...
              </>
            ) : 'Confirm Upload'}
          </button>
        </div>
      </div>
    </div>
  );

  // Add this function to check if ID is expired
  const isIDExpired = () => {
    if (!user?.validUntil) return false;
    const expirationDate = new Date(user.validUntil);
    // Use the actual current date (2025-04-21) as provided by the system
    const today = new Date('2025-04-28');
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    return expirationDate < today; // Expired if expirationDate is before today
  };

  // Define the updateUserStatusToRenewal function before useEffect
  const updateUserStatusToRenewal = async () => {
    try {
      console.log('Attempting to update user status to Renewal...');
      const response = await fetch(`${API_BASE_URL}/updateUserStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code_id: user.code_id,  // Add code_id
          status: "Renewal",
          email: user.email,
          firstName: user.first_name,
          action: "renewal"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const data = await response.json();
      console.log('Status update response:', data);

      // Update local state
      setUser(prev => ({
        ...prev,
        status: "Renewal"
      }));

      console.log('User status updated to Renewal in local state.');
      toast.success('Your ID has expired. Please submit your renewal application.');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update status to renewal');
    }
  };

  const deletePreviousBarangayCert = async () => {
      try {
        await axios.delete(`${API_BASE_URL}/api/documents/barangay_cert/${user.code_id}`);
        // Update local documents state to remove the barangay certificate
        setDocuments(prev => prev.filter(doc => doc.document_type !== 'barangay_cert_documents'));
      } catch (error) {
        console.error('Error deleting previous barangay certificate:', error);
      }
    };
  // Enhanced logging to diagnose the issue
  useEffect(() => {
    console.log('Checking if ID is expired...');
    console.log('User validUntil:', user?.validUntil);
    console.log('Current date:', new Date());
    console.log('Is ID expired:', isIDExpired());
    if (user && isIDExpired() && user.status !== "Renewal") {
      console.log('ID is expired, updating status to Renewal...');
      // Delete barangay certificate first, then update status
      deletePreviousBarangayCert().then(() => {
        updateUserStatusToRenewal();
      });
    }
  }, [user, isIDExpired, updateUserStatusToRenewal]);

  // Determine if the user's status is 'Renewal'
  const isRenewalStatus = user && user.status === 'Renewal';

  const downloadCombinedId = async () => {
    try {
      const frontElement = document.querySelector('.id-card.front');
      const backElement = document.querySelector('.id-card.back');

      if (!frontElement || !backElement) {
        toast.error('Could not find ID card elements to download.');
        return;
      }

      const addWatermark = (clonedDoc, side) => {
        const clonedCard = clonedDoc.querySelector(`.id-card.${side}`);
        if (clonedCard) {
          const watermark = clonedDoc.createElement('div');
          watermark.innerText = 'MSWDO COPY';
          watermark.style.position = 'absolute';
          watermark.style.top = '50%';
          watermark.style.left = '50%';
          watermark.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
          watermark.style.fontSize = '60px';
          watermark.style.color = 'rgba(0, 0, 0, 0.15)';
          watermark.style.fontWeight = 'bold';
          watermark.style.pointerEvents = 'none';
          watermark.style.textAlign = 'center';
          watermark.style.width = '100%';
          watermark.style.zIndex = '1000';
          clonedCard.style.position = 'relative';
          clonedCard.appendChild(watermark);
        }
      };

      const canvasOptions = {
        useCORS: true,
        allowTaint: true,
        scale: 3,
      };

      toast.loading('Generating ID card...');

      const frontCanvas = await html2canvas(frontElement, {
        ...canvasOptions,
        onclone: (doc) => addWatermark(doc, 'front'),
      });

      const backCanvas = await html2canvas(backElement, {
        ...canvasOptions,
        onclone: (doc) => addWatermark(doc, 'back'),
      });

      const combinedCanvas = document.createElement('canvas');
      const padding = 20; // 20px padding between images
      combinedCanvas.width = frontCanvas.width + backCanvas.width + padding;
      combinedCanvas.height = Math.max(frontCanvas.height, backCanvas.height);

      const ctx = combinedCanvas.getContext('2d');
      ctx.fillStyle = 'white'; // Set background to white
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, frontCanvas.width + padding, 0);

      const image = combinedCanvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `solo-parent-id-combined-${user?.code_id || 'user'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success('ID Card downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading combined ID card:', error);
      toast.error('An error occurred while downloading the ID card.');
    }
  };

  const openEventModal = async (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    setUserRating(0);
    setFetchingRatings(true);
    setHasAttended(false);
    setHasRated(false);
    try {
      const attendanceRes = await axios.post(`${API_BASE_URL}/api/events/checkAttendance`, {
        eventId: event.id,
        userId: user.code_id
      });
      setHasAttended(attendanceRes.data.attended === true);
      const res = await axios.get(`${API_BASE_URL}/api/events/${event.id}/ratings`);
      setEventRatings(res.data);
      const myRating = res.data.find(r => r.user_id === user.code_id);
      if (myRating) {
        setUserRating(myRating.rating);
        setHasRated(true);
      } else {
        setHasRated(false);
      }
    } catch {
      setEventRatings([]);
      setHasAttended(false);
      setHasRated(false);
    } finally {
      setFetchingRatings(false);
    }
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setUserRating(0);
    setEventRatings([]);
  };

  const submitRating = async () => {
    if (!userRating) return toast.error('Please select a rating');
    setSubmittingRating(true);
    try {
      await axios.post(`${API_BASE_URL}/api/events/${selectedEvent.id}/rate`, {
        userId: user.code_id,
        rating: userRating
      });
      toast.success('Thank you for your feedback!');
      closeEventModal();
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const averageRating = eventRatings.length > 0 ? (eventRatings.reduce((a, b) => a + b.rating, 0) / eventRatings.length).toFixed(1) : null;

  // Add child functions
  const calculateChildAge = (birthdate) => {
    if (!birthdate) return '';
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    
    // Check if birthdate is in the future
    if (birthDateObj > today) {
      return 'Invalid date';
    }
    
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Function to fetch child requests
  const fetchChildRequests = async () => {
    if (!user?.code_id) return;
    
    setLoadingChildRequests(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/children/user/${user.code_id}`, { withCredentials: true });
      if (response.data.success) {
        setChildRequests(response.data.childRequests);
      }
    } catch (error) {
      console.error('Error fetching child requests:', error);
    } finally {
      setLoadingChildRequests(false);
    }
  };

  // Fetch child requests when user data is available
  useEffect(() => {
    if (user?.code_id) {
      fetchChildRequests();
    }
  }, [user?.code_id]);

  const EventModal = () => selectedEvent && (
    <div className="modal-overlay" style={{zIndex: 3000}}>
      <div className="modal-content" style={{maxWidth: 480, borderRadius: 16, boxShadow: '0 8px 32px rgba(44,109,46,0.18)', padding: 0, overflow: 'hidden'}}>
        <div className="modal-header" style={{background: '#e8f5e9', padding: '1.5rem 2rem', borderBottom: '1px solid #f0f0f0'}}>
          <h2 style={{margin: 0, fontWeight: 700, color: '#2E7D32', fontSize: '1.5rem'}}>{selectedEvent.title}</h2>
          <button className="close-btn-attendace" onClick={closeEventModal} style={{fontSize: 22, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer'}}>&times;</button>
        </div>
        <div className="modal-body" style={{padding: '2rem'}}>
          <div style={{marginBottom: 20}}>
            <div style={{fontWeight: 600, color: '#1976d2', fontSize: 15}}>{formatDate(selectedEvent.startDate)} {formatTime(selectedEvent.startTime)}</div>
            
            Location: <span style={{color: '#555', fontSize: 14, marginBottom: 5,fontWeight: 700}}>{selectedEvent.location}</span>
            
            <div style={{margin: '5px 0 18px', fontWeight: 500, fontSize: 14}}>
            Description: <span style={{color: '#333', fontSize: 15, marginBottom: 10, fontWeight: 700}}>{selectedEvent.description}</span>
            </div>
            
            <div style={{margin: '10px 0 18px', color: '#2E7D32', fontWeight: 500, fontSize: 20}}>
              Status: <span style={{fontWeight: 700}}>{selectedEvent.status}</span>
            </div>
            
            <div style={{marginBottom: 18}}>
              <div style={{fontWeight: 600, color: '#2E7D32', fontSize: 15, marginBottom: 4}}>Event Rating</div>
              {fetchingRatings ? (
                <div style={{color: '#888'}}>Loading ratings...</div>
              ) : (
                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                  <span style={{fontSize: 18, color: '#1976d2', fontWeight: 600}}>Average:</span>
                  <span style={{fontSize: 18, color: '#2E7D32', fontWeight: 700}}>{averageRating || 'N/A'}</span>
                  <FontAwesomeIcon icon={faStar} style={{color: '#FFD600', fontSize: 18}} />
                  <span style={{fontSize: 13, color: '#888'}}>({eventRatings.length} rating{eventRatings.length !== 1 ? 's' : ''})</span>
                </div>
              )}
            </div>
            <div style={{marginBottom: 18}}>
              {hasAttended ? (
                <>
                  <div style={{fontWeight: 600, color: '#2E7D32', fontSize: 15, marginBottom: 4}}>Your Rating</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8}}>
                    {[1,2,3,4,5].map(star => (
                      <FontAwesomeIcon
                        key={star}
                        icon={faStar}
                        style={{
                          color: userRating >= star ? '#FFD600' : '#e0e0e0',
                          fontSize: 28,
                          cursor: hasRated ? 'not-allowed' : 'pointer',
                          transition: 'color 0.2s'
                        }}
                        onClick={() => !hasRated && setUserRating(star)}
                      />
                    ))}
                  </div>
                  <button
                    onClick={submitRating}
                    disabled={submittingRating || !userRating || hasRated}
                    style={{background: hasRated ? '#bdbdbd' : 'linear-gradient(90deg, #2E7D32, #4CAF50)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: hasRated ? 'not-allowed' : 'pointer', width: '100%', marginTop: 6, boxShadow: '0 2px 8px rgba(44,109,46,0.08)'}}
                  >
                    {hasRated ? 'Already Rated' : (submittingRating ? 'Submitting...' : 'Submit Rating')}
                  </button>
                </>
              ) : (
                <div style={{color:'#888',fontWeight:500,fontSize:16,marginTop:12}}>You must attend this event to rate it.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <Toaster position="top-right" />
      {showUploadModal && <UploadModal />}
      <AttendanceModal />
      <LogoutModal isOpen={showLogoutModal} onConfirm={confirmLogout} onCancel={cancelLogout} />
      <div className="dashboard-main">
        <div className="profile-header">
          <div className="profile-cover">
            <div className="profile-info">
              <div className="profile-pic-container">
                <img 
                  src={addCacheBuster(getImageUrl(getProfilePicture()))} 
                  alt={user?.first_name || 'Profile'} 
                  className="profile-pic"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = avatar;
                    localStorage.removeItem(`profilePic_${loggedInUserId}`);
                  }}
                />
                {!hasRestrictedAccess() && user?.status !== 'Incomplete' && (
                  <label className="edit-profile-pic" aria-label="Edit profile picture">
                    <FontAwesomeIcon icon={faCamera} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                    />
                  </label>
                )}
              </div>
              <div className="profile-text">
                <h1>
                  {user ? (
                    user.first_name && user.last_name 
                      ? `${user.first_name} ${user.middle_name || ''} ${user.last_name}${user.suffix && user.suffix !== 'none' ? ` ${user.suffix}` : ''}`
                      : user.name || 'First Name Last Name'
                  ) : 'Loading...'}
                </h1>
                <p className="user-email">{user?.email || 'Loading...'}</p>
                <div className="profile-tags">
                  <span className={`tag ${user?.status?.toLowerCase()}-tag`}>
                    {!['Pending Remarks', 'Terminated', 'Incomplete', 'Declined'].includes(user?.status) && (
                      <FontAwesomeIcon icon={faCheckCircle} />
                    )}
                    {user?.status || 'Loading...'}
                    {user?.status === 'Verified' && (
                      <span className={`beneficiary-status ${user?.beneficiary_status === 'beneficiary' ? 'eligible' : 'not-eligible'}`}>
                        ({user?.beneficiary_status === 'beneficiary' ? 'Beneficiary' : 'Not Beneficiary'})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {user?.status === 'Declined' && (
          <>
            <div className="declined-message">
              <div className="declined-content">
                <FontAwesomeIcon icon={faTimesCircle} className="warning-icon" size="3x" />
                <h2>Application Declined</h2>
                <p>Your application has been declined. You may resend your application for reconsideration.</p>
                <button
                  className="btn resend-btn"
                  onClick={() => setShowResendModal(true)}
                  style={{ marginTop: '20px', background: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', padding: '12px 28px', borderRadius: '8px' }}
                >
                  Resend Application
                </button>
              </div>
            </div>
            {showResendModal && (
              <ResendApplicationModal onClose={() => setShowResendModal(false)} />
            )}
          </>
        )}

        {user?.status === 'Incomplete' ? (
          <div className="incomplete-message">
            <div className="incomplete-content">
              <FontAwesomeIcon icon={faTimesCircle} className="warning-icon" size="3x" />
              <h2>Incomplete Documents</h2>
              <p>Please submit all required documents to complete your application.</p>
              <p>You can submit your documents below.</p>
            </div>
          </div>
        ) : hasRestrictedAccess() ? (
          <div className="pending-remarks-message">
            <div className="pending-remarks-content">
              <FontAwesomeIcon icon={faTimesCircle} className="warning-icon" size="3x" />
              <h2>
                {user?.status === 'Terminated' ? 'Account Terminated' : 'Account Under Investigation'}
              </h2>
              <p>
                {user?.status === 'Terminated' 
                  ? 'Your account has been terminated. You no longer have access to solo parent services.'
                  : 'Your account is currently under investigation. Please wait for further notice from the administrator.'}
              </p>
              <p>If you have any questions, please contact your barangay office.</p>
            </div>
          </div>
        ) : null}

        <div className="dashboard-content">
          {user?.status === 'Incomplete' ? (
            <div className="documents-section-user">
              <div className="section-header">
                <h2>Documents</h2>
              </div>
              <div className="documents-table-container">
                <table className="documents-table">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDocumentsByCivilStatus(user.civil_status).map((documentType) => {
                      const document = documents.find(doc => doc.document_type === `${documentType}_documents`);
                      return (
                        <tr key={documentType}>
                          <td>{documentTypes[documentType]}</td>
                          <td className="status-cell">
                            {document ? (
                              <span className={`status-${document.status.toLowerCase()}`}>
                                <FontAwesomeIcon 
                                  icon={document.status === 'Approved' ? faCheckCircle : faClock} 
                                  className="status-icon" 
                                />
                                {document.status === 'Approved' ? 'Submitted' : document.status}
                              </span>
                            ) : (
                              <span className="status-pending">Not submitted yet</span>
                            )}
                          </td>
                          <td>
                            {document ? (
                              <button 
                                className="btn view-btn"
                                onClick={() => window.open(document.file_url, '_blank')}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                            ) : (
                              <label className="btn upload-btn">
                                <i className="fas fa-upload"></i> Upload
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleDocumentChange(e, documentType)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {!isRenewalStatus && user?.status !== 'Declined' && (
                <div className="profile-tabsuser">
                  {user?.status !== 'Terminated' && user?.status !== 'Pending Remarks' && (
                    <button 
                      className={`tab-buttonuser ${activeTab === 'personal' ? 'active' : ''}`}
                      onClick={() => setActiveTab('personal')}
                      disabled={hasRestrictedAccess()}
                    >
                      Personal Information
                    </button>
                  )}
                  {user?.status !== 'Terminated' && user?.status !== 'Pending Remarks' && (
                    <button 
                      className={`tab-buttonuser ${activeTab === 'documents' ? 'active' : ''}`}
                      onClick={() => setActiveTab('documents')}
                    >
                      Documents
                    </button>
                  )}
                  {user?.status === 'Verified' && (
                    <button 
                      className={`tab-buttonuser ${activeTab === 'cardId' ? 'active' : ''}`}
                      onClick={() => setActiveTab('cardId')}
                    >
                      Card ID
                    </button>
                  )}
                </div>
              )}

              <div className="content-grid">
                {isRenewalStatus ? (
                  <div className="documents-section-user">
                    <div className="section-header">
                      <h2>Renewal Application</h2>
                      <p>Please upload your Barangay Certificate to complete your renewal application.</p>
                    </div>
                    <div className="documents-table-container">
                      <table className="documents-table">
                        <thead>
                          <tr>
                            <th>Document Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Barangay Certificate</td>
                            <td className="status-cell">
                              {(() => {
                                const doc = documents.find(doc => doc.document_type === 'barangay_cert_documents');
                                if (doc) {
                                  if (doc.status === 'Approved') {
                                    return (
                                      <span className="status-approved">
                                        <i className="fas fa-check-circle"></i> Submitted
                                      </span>
                                    );
                                  } else if (doc.status === 'Rejected') {
                                    return (
                                      <span className="status-rejected">
                                        <i className="fas fa-times-circle"></i> Rejected
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className={`status-${doc.status.toLowerCase()}`}>
                                        <i className="fas fa-clock"></i> Pending
                                      </span>
                                    );
                                  }
                                } else {
                                  return <span className="status-pending">Not submitted yet</span>;
                                }
                              })()}
                            </td>
                            <td>
                              {(() => {
                                const doc = documents.find(doc => doc.document_type === 'barangay_cert_documents');
                                if (isRenewalStatus) {
                                  return (
                                    <>
                                      {doc && (
                                        <button
                                          className="btn view-btn"
                                          onClick={() => window.open(doc.file_url, '_blank')}
                                          style={{ marginRight: '8px' }}
                                        >
                                          <i className="fas fa-eye"></i> View
                                        </button>
                                      )}
                                      <label className="btn upload-btn">
                                        <i className="fas fa-upload"></i> {doc ? 'Re-upload' : 'Upload'}
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => handleDocumentChange(e, 'barangay_cert')}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    </>
                                  );
                                } else if (doc) {
                                  if (doc.status === 'Rejected') {
                                    return (
                                      <label className="btn upload-btn">
                                        <i className="fas fa-upload"></i> Re-upload
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => handleDocumentChange(e, 'barangay_cert')}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    );
                                  } else {
                                    return (
                                      <button 
                                        className="btn view-btn"
                                        onClick={() => window.open(doc.file_url, '_blank')}
                                      >
                                        <i className="fas fa-eye"></i> View
                                      </button>
                                    );
                                  }
                                } else {
                                  return (
                                    <label className="btn upload-btn">
                                      <i className="fas fa-upload"></i> Upload
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleDocumentChange(e, 'barangay_cert')}
                                        style={{ display: 'none' }}
                                      />
                                    </label>
                                  );
                                }
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'personal' && user?.status !== 'Terminated' && user?.status !== 'Pending Remarks' && user?.status !== 'Declined' && (
                      <>
                        <div className="details-section">
                          <div className="section-header">
                            <h3>Personal Information</h3>
                          </div>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-label">Full Name</span>
                              <p className="detail-value">{user?.first_name} {user?.middle_name || ''} {user?.last_name}{user?.suffix && user?.suffix !== 'none' ? ` ${user.suffix}` : ''}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Gender</span>
                              <p className="detail-value">{user?.gender}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Birthdate</span>
                              <p className="detail-value">
                                {user?.date_of_birth ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(user.date_of_birth)) : ''}
                              </p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Place of Birth</span>
                              <p className="detail-value">{user?.place_of_birth}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Barangay</span>
                              <p className="detail-value">{user?.barangay}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Religion</span>
                              <p className="detail-value">{user?.religion}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Civil Status</span>
                              <p className="detail-value">{user?.civil_status}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Monthly Income</span>
                              <p className="detail-value">₱{user?.income}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Contact Number</span>
                              <p className="detail-value">{user?.contact_number}</p>
                            </div>
                          </div>
                        </div>

                        <div className="children-section">
                          <div className="section-header">
                            <h2>Children</h2>
                            
                          </div>
                          
                          {/* Existing Children */}
                          <div className="children-list">
                            {user?.familyMembers?.length > 0 ? (
                              <div className="family-members">
                                <div className="family-list">
                                  {user.familyMembers.map((member, index) => (
                                    <div key={index} className="family-member">
                                      <div className="member-header">
                                        <strong>{member.family_member_name}</strong>
                                        <span className="member-id">ID: {member.id || index + 1}</span>
                                      </div>
                                      <div className="member-details">
                                        <span>Age: {member.age}</span>
                                        <span>Education: {member.educational_attainment}</span>
                                        {member.birthdate && (
                                          <span>Birthdate: {new Date(member.birthdate).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          
                          
                        </div>
                      </>
                    )}
                    {activeTab === 'documents' && user?.status !== 'Declined' ? (
                      <div className="documents-section-user">
                        <div className="section-header">
                          <h2>Documents</h2>
                        </div>
                        <div className="documents-table-container">
                          <table className="documents-table">
                            <thead>
                              <tr>
                                <th>Document Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getDocumentsByCivilStatus(user.civil_status).map((documentType) => {
                                const document = documents.find(doc => doc.document_type === `${documentType}_documents`);
                                return (
                                  <tr key={documentType}>
                                    <td>{documentTypes[documentType]}</td>
                                    <td className="status-cell">
                                      {document ? (
                                        <span className={`status-${document.status.toLowerCase()}`}>
                                          <FontAwesomeIcon 
                                            icon={document.status === 'Submitted' ? faCheckCircle : faClock} 
                                            className="status-icon" 
                                          />
                                          {document.status === 'Approved' ? 'Submitted' : document.status}
                                        </span>
                                      ) : (
                                        <span className="status-pending">Not submitted yet</span>
                                      )}
                                    </td>
                                    <td>
                                      {document ? (
                                        <button 
                                          className="btn view-btn"
                                          onClick={() => window.open(document.file_url, '_blank')}
                                        >
                                          <i className="fas fa-eye"></i> View
                                        </button>
                                      ) : (
                                        <label className="btn upload-btn">
                                          <i className="fas fa-upload"></i> Upload
                                          <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentChange(e, documentType)}
                                            style={{ display: 'none' }}
                                          />
                                        </label>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <div className="mobile-documents-list">
                            {getDocumentsByCivilStatus(user.civil_status).map((documentType) => {
                              const document = documents.find(doc => doc.document_type === `${documentType}_documents`);
                              return (
                                <div className="document-card" key={documentType}>
                                  <div className="document-card-header">
                                    <div className="document-card-type">{documentTypes[documentType]}</div>
                                    <div className="document-card-status">
                                      {document ? 'Submitted' : 'Not submitted'}
                                    </div>
                                  </div>
                                  <div className="document-card-actions">
                                    {document ? (
                                      <button 
                                        className="btn view-btn"
                                        onClick={() => window.open(document.file_url, '_blank')}
                                      >
                                        View
                                      </button>
                                    ) : (
                                      <label className="btn upload-btn">
                                        Upload
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => handleDocumentChange(e, documentType)}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : activeTab === 'cardId' && user?.status === 'Verified' && (
                      <div className="id-cards-container">
                        {/* Front of ID */}
                        <div className="id-card front">
                          <div className="id-card-header">
                            <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                            <div className="id-title">
                              <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                              <h4>Republic of the Philippines</h4>
                              <h4>DSWD Region III</h4>
                            </div>
                          </div>
                          <div className="id-card-body">
                            <div className="id-left-section">
                              <div className="id-photo-container">
                                <img 
                                  src={user?.profilePic || avatar} 
                                  alt="User" 
                                  className="id-photo"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = avatar;
                                  }}
                                />
                              </div>
                              <div className="id-category">
                                Category: {user?.classification}
                              </div>
                              <div className="id-validity">
                                Valid Until: {user?.validUntil }
                              </div>
                            </div>
                            <div className="id-card-container">
                              <div className="id-card-details">
                                <div className="id-detail">
                                  <span className="id-label">ID No:</span>
                                  <span className="id-value">{user?.code_id || 'N/A'}</span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Name:</span>
                                  <span className="id-value">
                                    {`${user?.first_name || ''} ${user?.middle_name || ''} ${user?.last_name || ''}${user?.suffix && user?.suffix !== 'none' ? ` ${user.suffix}` : ''}`}
                                  </span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Barangay:</span>
                                  <span className="id-value">{user?.barangay || 'N/A'}</span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Birthdate:</span>
                                  <span className="id-value">
                                    {user?.date_of_birth ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(user.date_of_birth)) : 'N/A'}
                                  </span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Civil Status:</span>
                                  <span className="id-value">{user?.civil_status || 'N/A'}</span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Contact:</span>
                                  <span className="id-value">{user?.contact_number || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="id-card-footer">
                                <div className="footer-watermark">
                                  <span>DSWD SOLO PARENT</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back of ID */}
                        <div className="id-card back">
                          <div className="id-card-header">
                            <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                            <div className="id-title">
                              <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                              <h4>Republic of the Philippines</h4>
                              <h4>DSWD Region III</h4>
                            </div>
                          </div>
                          <div className="terms-section">
                            <h3>Terms and Conditions</h3>
                            <ol>
                              <li>This ID is non-transferable</li>
                              <li>Report loss/damage to DSWD office</li>
                              <li>Present this ID when availing benefits</li>
                              <li>Tampering invalidates this ID</li>
                            </ol>
                          </div>
                          <div className="signature-section">
                            <div className="signature-block">
                              <div className="signature-line"></div>
                              <span>Card Holder's Signature</span>
                            </div>
                            <div className="signature-block">
                              <div className="signature-line"></div>
                              <span>Authorized DSWD Official</span>
                            </div>
                          </div>
                          <div className="id-card-footer">
                            <div className="footer-watermark">
                              <span>DSWD SOLO PARENT</span>
                            </div>
                          </div>
                        </div>
                        <div className="id-card-actions">
                          <button
                            className="btn download-btn"
                            onClick={downloadCombinedId}
                            style={{ background: '#1976d2', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                          >
                            <FontAwesomeIcon icon={faDownload} style={{ marginRight: '8px' }} />
                            Download ID (Front & Back)
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Add Events Section */}
                {user?.status !== 'Declined' && user?.status !== 'Pending Remarks' && user?.status !== 'Terminated' && user?.status !== 'Renewal' && (
                  <div className="user-profile-announcements">
                    <div className="profile-announcements-header">
                      <h2>Events</h2>
                    </div>
                    <div className="profile-announcements-list">
                    {(() => {
                        const isBeneficiary = user?.beneficiary_status === 'beneficiary';
                        const filteredEvents = events.filter(event => {
                          if (!event.visibility || event.visibility === 'everyone') return true;
                          if (event.visibility === 'beneficiaries') return isBeneficiary;
                          if (event.visibility === 'not_beneficiaries') return !isBeneficiary;
                          return false;
                        });
                        return filteredEvents.length > 0 ? (
                          filteredEvents.map((event, index) => (
                            <div key={index} className="profile-announcement-card" onClick={() => openEventModal(event)}>
                              {/* Event Image Banner */}
                              {event.image && (
                                <div style={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                  <img
                                    src={event.image}
                                    alt="Event"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                                  />
                                </div>
                              )}
                              <div className="profile-announcement-content">
                                <h4>{event.title}</h4>
                                <p>{event.description}</p>
                                <div className="profile-announcement-meta">
                                  <span>{formatDate(event.startDate)} {formatTime(event.startTime)}</span>
                                  <span>{event.location}</span>
                                  <span className="profile-announcement-badge">{event.status}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-events-message">No events available</p>
                        );
                      })()}
                    </div>
                    {showEventModal && <EventModal />}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button onClick={handleDeleteCancelled} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this document?</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={handleDeleteConfirmed} 
                className="delete-button"
              >
                Delete
              </button>
              <button 
                onClick={handleDeleteCancelled} 
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal for showing declined info and resend confirmation
function ResendApplicationModal({ onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [municipalities, setMunicipalities] = useState([]);
  const [showOthersInput, setShowOthersInput] = useState(false);
  
  // Classification options
  const classifications = [
    { code: "001", label: "Birth due to rape / Kapanganakan dahil sa panggagahasa", saveValue: "001" },
    { code: "002", label: "Death of spouse / Pagkamatay ng asawa", saveValue: "002" },
    { code: "003", label: "Detention of spouse / Pagkakakulong ng asawa", saveValue: "003" },
    { code: "004", label: "Spouse's physical/mental incapacity / Pisikal o mental na kapansanan ng asawa", saveValue: "004" },
    { code: "005", label: "Legal/de facto separation / Legal o de facto na paghihiwalay", saveValue: "005" },
    { code: "006", label: "Annulled/nullified marriage / Pinawalang-bisa o nullified na kasal", saveValue: "006" },
    { code: "007", label: "Abandoned by spouse / Inabandona ng asawa", saveValue: "007" },
    { code: "008", label: "OFW's spouse/family member / Asawa o miyembro ng pamilya ng OFW", saveValue: "008" },
    { code: "009", label: "Unmarried mother/father / Nakakaisang ina o ama", saveValue: "009" },
    { code: "010", label: "Legal guardian/adoptive parent / Legal na tagapag-alaga o adoptibong magulang", saveValue: "010" },
    { code: "011", label: "Relative caring for child / Kamag-anak na nag-aalaga sa bata", saveValue: "011" },
    { code: "012", label: "Pregnant woman solo caregiver / Buntis na babae na solo caregiver", saveValue: "012" },
    { code: "013", label: "Others / Iba pa", saveValue: "Others" }
  ];
  
  // Extract all provinces from the Philippines data
  const allProvinces = useMemo(() => {
    return Object.values(philippinesData)
      .flatMap(region => 
        Object.keys(region.province_list)
      )
      .sort((a, b) => a.localeCompare(b));
  }, []);

  // Update municipalities when province changes
  useEffect(() => {
    if (selectedProvince) {
      // Find the region that contains this province
      const region = Object.values(philippinesData).find(region => 
        Object.keys(region.province_list).includes(selectedProvince)
      );
      
      if (region) {
        // Get municipalities for this province
        const municipalitiesList = Object.keys(region.province_list[selectedProvince].municipality_list);
        setMunicipalities(municipalitiesList.sort((a, b) => a.localeCompare(b)));
      } else {
        setMunicipalities([]);
      }
    } else {
      setMunicipalities([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    setLoading(true);
    const userId = localStorage.getItem('UserId');
    axios.get(`${API_BASE_URL}/declineInfo?userId=${userId}`, { withCredentials: true })
      .then(res => {
        setInfo(res.data);
        setEditValues({
          ...res.data,
          faceRecognitionPhoto: res.data.faceRecognitionPhoto || '', // always keep in state
          familyMembers: res.data.familyMembers ? res.data.familyMembers.map(fm => ({...fm})) : [],
        });
      })
      .catch(err => setError('Failed to load info'))
      .finally(() => setLoading(false));
  }, []);

  // Handler for starting edit mode
  const startEditAll = () => {
    setIsEditing(true);
  };
  // Handler for canceling edit mode
  const cancelEditAll = () => {
    setIsEditing(false);
    setEditValues({
      ...info,
      familyMembers: info.familyMembers ? info.familyMembers.map(fm => ({...fm})) : [],
    });
  };
  // Handler for saving all edits and submitting to backend
  const saveEditAll = async () => {
    if (loading) return;
    
    // Validate required fields - ALL fields must be filled
    const errors = [];
    
    // Personal Information Validation - All fields required
    if (!editValues.first_name?.trim()) errors.push("First name is required");
    if (!editValues.middle_name?.trim()) errors.push("Middle name is required");
    if (!editValues.last_name?.trim()) errors.push("Last name is required");
    if (!editValues.age?.toString().trim()) errors.push("Age is required");
    if (!editValues.gender?.trim()) errors.push("Gender is required");
    
    // Strict date validation for date of birth
    if (!editValues.date_of_birth || editValues.date_of_birth === "") {
      errors.push("Date of birth is required");
    }
    
    if (!editValues.place_of_birth?.trim()) errors.push("Place of birth is required");
    if (!editValues.barangay?.trim()) errors.push("Barangay is required");
    if (!editValues.education?.trim()) errors.push("Education is required");
    if (!editValues.civil_status?.trim()) errors.push("Civil status is required");
    if (!editValues.occupation?.trim()) errors.push("Occupation is required");
    if (!editValues.religion?.trim()) errors.push("Religion is required");
    if (!editValues.company?.trim()) errors.push("Company is required");
    if (!editValues.income?.trim()) errors.push("Income is required");
    if (!editValues.employment_status?.trim()) errors.push("Employment status is required");
    if (!editValues.contact_number?.trim()) errors.push("Contact number is required");
    if (editValues.contact_number && !/^\d{11}$/.test(editValues.contact_number.replace(/\s/g, ''))) {
      errors.push("Contact number must be 11 digits");
    }
    if (editValues.pantawid_beneficiary === undefined || editValues.pantawid_beneficiary === null || editValues.pantawid_beneficiary === "") {
      errors.push("Pantawid beneficiary status is required");
    }
    if (editValues.indigenous === undefined || editValues.indigenous === null || editValues.indigenous === "") {
      errors.push("Indigenous status is required");
    }
    if (!editValues.email?.trim()) errors.push("Email is required");
    if (editValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValues.email)) {
      errors.push("Email format is invalid");
    }
    
    // Emergency Contact Validation - All fields required
    if (!editValues.emergency_name?.trim()) errors.push("Emergency contact name is required");
    if (!editValues.emergency_relationship?.trim()) errors.push("Emergency contact relationship is required");
    if (!editValues.emergency_address?.trim()) errors.push("Emergency contact address is required");
    if (!editValues.emergency_contact?.trim()) errors.push("Emergency contact number is required");
    if (editValues.emergency_contact && !/^\d{11}$/.test(editValues.emergency_contact.replace(/\s/g, ''))) {
      errors.push("Emergency contact number must be 11 digits");
    }

    // Classification Validation
    if (!editValues.classification?.trim()) errors.push("Classification is required");
    if ((editValues.classification === "013" || editValues.classification === "Others") && 
        !editValues.classification_others?.trim()) {
      errors.push("Please specify 'Others' classification");
    }
    
    // Needs/Problems Validation
    if (!editValues.needs_problems?.trim()) errors.push("Needs/Problems field is required");
    
    // Family Members Validation - All fields required for each member
    if (editValues.familyMembers && editValues.familyMembers.length > 0) {
      editValues.familyMembers.forEach((fm, index) => {
        if (!fm.family_member_name?.trim()) errors.push(`Family member #${index + 1}: Name is required`);
        
        // Strict date validation for birthdate
        if (!fm.birthdate || fm.birthdate === "") {
          errors.push(`Family member #${index + 1}: Birthdate is required`);
        }
        
        if (!fm.age?.toString().trim()) errors.push(`Family member #${index + 1}: Age is required`);
        if (!fm.educational_attainment?.trim()) errors.push(`Family member #${index + 1}: Educational attainment is required`);
      });
    }
    
    // Log validation for debugging
    console.log("Validation errors:", errors);
    console.log("Date of birth value:", editValues.date_of_birth);
    console.log("Family member birthdates:", editValues.familyMembers?.map(fm => fm.birthdate));
    
    // If there are validation errors, display them and stop submission
    if (errors.length > 0) {
      setLoading(false);
      toast.error(
        <div>
          <strong>Please fill in all required fields:</strong>
          <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
            {errors.map((error, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
            ))}
          </ul>
        </div>,
        { duration: 8000 }
      );
      return;
    }
    
    setLoading(true);
    try {
      // Prepare the steps data based on editValues
      const step1 = {
        first_name: editValues.first_name,
        middle_name: editValues.middle_name,
        last_name: editValues.last_name,
        age: editValues.age,
        gender: editValues.gender,
        date_of_birth: editValues.date_of_birth ? editValues.date_of_birth.split('T')[0] : editValues.date_of_birth,
        place_of_birth: editValues.place_of_birth,
        barangay: editValues.barangay,
        education: editValues.education,
        civil_status: editValues.civil_status,
        occupation: editValues.occupation,
        religion: editValues.religion,
        company: editValues.company,
        income: editValues.income,
        employment_status: editValues.employment_status,
        contact_number: editValues.contact_number,
        pantawid_beneficiary: editValues.pantawid_beneficiary,
        indigenous: editValues.indigenous,
        email: editValues.email
      };
      const step2 = {
        children: (editValues.familyMembers || []).map(fm => {
          // Try to split name if possible, fallback to full string
          let [first_name, ...rest] = (fm.family_member_name || '').split(' ');
          let last_name = rest.pop() || '';
          let middle_name = rest.join(' ');
          return {
            first_name: first_name || '',
            middle_name: middle_name || '',
            last_name: last_name || '',
            age: fm.age,
            educational_attainment: fm.educational_attainment,
            birthdate: fm.birthdate ? fm.birthdate.split('T')[0] : fm.birthdate,
          };
        })
      };
      const step3 = { classification: editValues.classification };
      const step4 = { needs_problems: editValues.needs_problems };
      const step5 = {
        emergency_name: editValues.emergency_name,
        emergency_relationship: editValues.emergency_relationship,
        emergency_address: editValues.emergency_address,
        emergency_contact: editValues.emergency_contact
      };
      const step6 = {
        faceRecognitionPhoto: editValues.faceRecognitionPhoto || null
      };
      const payload = { step1, step2, step3, step4, step5, step6 };
      const toastId = toast.loading('Saving and resubmitting application...');
      const response = await axios.post(`${API_BASE_URL}/api/documents/submitAllSteps`, payload, { withCredentials: true });
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success('Application resubmitted successfully!');
        setIsEditing(false);
        setInfo({ ...editValues, familyMembers: editValues.familyMembers ? editValues.familyMembers.map(fm => ({...fm})) : [] });
        if (typeof onClose === 'function') onClose();
      } else {
        toast.error(response.data.message || 'Failed to resubmit application.');
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.error || err.message || 'Error resubmitting application.');
    } finally {
      setLoading(false);
    }
  };
  // Handler for updating family member fields
  const updateFamilyMember = (idx, key, value) => {
    setEditValues(prev => {
      const updated = prev.familyMembers ? 
        prev.familyMembers.map((fm, i) => i === idx ? { ...fm, [key]: value } : fm) :
        [];
      return { ...prev, familyMembers: updated };
    });
  };

  useEffect(() => {
    if (isEditing) {
      setShowOthersInput(editValues.classification === "013" || editValues.classification === "Others");
    }
  }, [isEditing, editValues.classification]);

  useEffect(() => {
    if (selectedProvince) {
      // Find the region that contains this province
      const region = Object.values(philippinesData).find(region => 
        Object.keys(region.province_list).includes(selectedProvince)
      );
      
      if (region) {
        // Get municipalities for this province
        const municipalitiesList = Object.keys(region.province_list[selectedProvince].municipality_list);
        setMunicipalities(municipalitiesList.sort((a, b) => a.localeCompare(b)));
      } else {
        setMunicipalities([]);
      }
    } else {
      setMunicipalities([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (isEditing) {
      let newPlaceOfBirth = "";
      
      if (selectedProvince && selectedMunicipality) {
        newPlaceOfBirth = `${selectedMunicipality}, ${selectedProvince}`;
      } else if (selectedProvince) {
        newPlaceOfBirth = selectedProvince;
      }
      
      if (newPlaceOfBirth) {
        setEditValues(prev => ({...prev, place_of_birth: newPlaceOfBirth}));
      }
    }
  }, [selectedProvince, selectedMunicipality, isEditing]);

  useEffect(() => {
    if (isEditing && editValues.place_of_birth) {
      const parts = editValues.place_of_birth.split(', ');
      if (parts.length >= 2) {
        const province = parts[parts.length - 1];
        const municipality = parts[parts.length - 2];
        
        setSelectedProvince(province);
        // Municipality will be set by the effect that watches selectedProvince
        setTimeout(() => {
          setSelectedMunicipality(municipality);
        }, 100);
      } else if (parts.length === 1) {
        setSelectedProvince(parts[0]);
        setSelectedMunicipality("");
      }
    }
  }, [isEditing, editValues.place_of_birth]);

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    
    // Check if birthdate is in the future
    if (birthDateObj > today) {
      return "Invalid date";
    }
    
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Get today's date in YYYY-MM-DD format for date input max attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <div className="resend-modal">
        <div className="resend-modal-content">
          <div className="resend-modal-header">
            <h2>Resend Application</h2>
            <button className="resend-modal-close" onClick={onClose} title="Close">
              <FontAwesomeIcon icon="times" />
            </button>
          </div>
          <div className="resend-modal-body">
            {loading && (
              <div style={{display: 'flex', justifyContent: 'center', padding: '20px'}}>
                <FontAwesomeIcon icon="spinner" spin size="2x" color="#2E7D32" />
              </div>
            )}
            {error && (
              <div style={{
                background: '#ffebee', 
                color: '#c62828', 
                padding: '12px 16px', 
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FontAwesomeIcon icon="exclamation-circle" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <>
                <div style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '20px',
                  background: '#f5f5f5',
                  padding: '12px 16px',
                  borderRadius: '10px'
                }}>
                  <div>
                    <h3 style={{margin: '0 0 4px 0', fontSize: '1.1rem'}}>Application Details</h3>
                    <p style={{margin: 0, color: '#666', fontSize: '0.9rem'}}>
                      Review and update your information before resubmitting
                    </p>
                  </div>
                  {!isEditing ? (
                    <button className="resend-btn" onClick={startEditAll} disabled={loading || isEditing}>
                      <FontAwesomeIcon icon="edit" style={{marginRight: '8px'}} />
                      Edit
                    </button>
                  ) : (
                    <button className="resend-btn cancel" onClick={cancelEditAll}>
                      <FontAwesomeIcon icon="times" style={{marginRight: '8px'}} />
                      Cancel
                    </button>
                  )}
                </div>
                <div className="info-row">
                  <label>Email:</label>
                  <span>{isEditing ? (
                    <input 
                      value={editValues.email} 
                      onChange={e => setEditValues(v => ({...v, email: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    />
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <FontAwesomeIcon icon="envelope" style={{color: '#2E7D32'}} />
                      {info.email}
                    </div>
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Status:</label>
                  <span>
                    <div style={{
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      background: info.status === 'Declined' ? '#ffebee' : '#e8f5e9',
                      color: info.status === 'Declined' ? '#c62828' : '#2E7D32',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      <FontAwesomeIcon 
                        icon={info.status === 'Declined' ? 'times-circle' : 'check-circle'} 
                        style={{marginRight: '6px'}} 
                      />
                      {info.status}
                    </div>
                  </span>
                </div>
                <div className="info-row">
                  <label>Classification:</label>
                  <span>{isEditing ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '280px'}}>
                      <select 
                        value={editValues.classification} 
                        onChange={e => setEditValues(v => ({...v, classification: e.target.value}))}
                        style={{width: '100%'}}
                      >
                        <option value="">Select Classification</option>
                        {classifications.map((classification, index) => (
                          <option key={index} value={classification.saveValue}>{classification.label}</option>
                        ))}
                      </select>
                      
                      {showOthersInput && (
                        <input
                          placeholder="Please specify other classification"
                          value={editValues.classification_others || ''}
                          onChange={e => {
                            setEditValues(v => ({
                              ...v, 
                              others_details: e.target.value,
                              classification: e.target.value ? e.target.value : "013"
                            }));
                          }}
                          style={{width: '100%'}}
                        />
                      )}
                    </div>
                  ) : (
                    info.classification || 'N/A'
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Gender:</label>
                  <span>{info.gender}</span>
                </div>
                <div className="info-row">
                  <label>Date of Birth:</label>
                  <span>{isEditing ? (
                    <input 
                      type="date" 
                      value={editValues.date_of_birth} 
                      onChange={e => setEditValues(v => ({...v, date_of_birth: e.target.value}))}
                      style={{width: '100%', maxWidth: '280px'}}
                      max={getTodayDate()}
                    />
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <FontAwesomeIcon icon="calendar-alt" style={{color: '#2E7D32'}} />
                      {info.date_of_birth ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(info.date_of_birth)) : ''}
                    </div>
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Place of Birth:</label>
                  <span>
                    {isEditing ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        width: '100%',
                        maxWidth: '280px'
                      }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <label style={{
                            fontSize: '0.85rem',
                            color: '#555',
                            fontWeight: '500',
                            marginBottom: '2px'
                          }}>
                            Province:
                          </label>
                          <select 
                            value={selectedProvince} 
                            onChange={e => setSelectedProvince(e.target.value)} 
                            style={{width: '100%'}}
                          >
                            <option value="">Select Province</option>
                            {allProvinces.map((province, index) => (
                              <option key={index} value={province}>{province}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <label style={{
                            fontSize: '0.85rem',
                            color: '#555',
                            fontWeight: '500',
                            marginBottom: '2px'
                          }}>
                            Municipality/City:
                          </label>
                          <select 
                            value={selectedMunicipality} 
                            onChange={e => setSelectedMunicipality(e.target.value)} 
                            style={{width: '100%'}}
                            disabled={!selectedProvince}
                          >
                            <option value="">Select Municipality/City</option>
                            {municipalities.map((municipality, index) => (
                              <option key={index} value={municipality}>{municipality}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      info.place_of_birth
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <label>Current Barangay:</label>
                  <span>{isEditing ? (
                    <select 
                      value={editValues.barangay} 
                      onChange={e => setEditValues(v => ({...v, barangay: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    >
                      <option value="">Select Barangay</option>
                      {santaMariaBarangays.Barangays.map((barangay, index) => (
                        <option key={index} value={barangay}>{barangay}</option>
                      ))}
                    </select>
                  ) : (
                    info.barangay
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Education:</label>
                  <span>{isEditing ? (
                    <input 
                      value={editValues.education} 
                      onChange={e => setEditValues(v => ({...v, education: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    />
                  ) : (
                    info.education
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Civil Status:</label>
                  <span>{isEditing ? (
                    <input 
                      value={editValues.civil_status} 
                      onChange={e => setEditValues(v => ({...v, civil_status: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    />
                  ) : (
                    info.civil_status
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Occupation:</label>
                  <span>{isEditing ? (
                    <input
                      value={editValues.occupation} 
                      onChange={e => setEditValues(v => ({...v, occupation: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}}
                      >
                      
                    </input>                    
                    
                  ) : (
                    info.occupation
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Religion:</label>
                  <span>{isEditing ? (
                    <input 
                      value={editValues.religion} 
                      onChange={e => setEditValues(v => ({...v, religion: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    />
                  ) : (
                    info.religion
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Company:</label>
                  <span>{isEditing ? (
                    <input 
                      value={editValues.company} 
                      onChange={e => setEditValues(v => ({...v, company: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    />
                  ) : (
                    info.company
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Income:</label>
                  <span>{isEditing ? (
                    <select 
                      value={editValues.income} 
                      onChange={e => setEditValues(v => ({...v, income: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    >
                      <option value="">Select Income Range</option>
                      <option value="Below ₱10,000">Below ₱10,000</option>
                      <option value="₱11,000-₱20,000">₱11,000-₱20,000</option>
                      <option value="₱21,000-₱43,000">₱21,000-₱43,000</option>
                      <option value="₱44,000 and above">₱44,000 and above</option>
                    </select>
                  ) : (
                    info.income
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Employment Status:</label>
                  <span>{isEditing ? (
                    <select
                      value={editValues.employment_status} 
                      onChange={e => setEditValues(v => ({...v, employment_status: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    >
                      <option value="" disabled>Please choose</option>
                      <option value="Employed">Employed</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Not employed">Not employed</option>
                      </select>
                  ) : (
                    info.employment_status
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Contact Number:</label>
                  <span>{isEditing ? (
                    <input 
                      value={editValues.contact_number} 
                      onChange={e => setEditValues(v => ({...v, contact_number: e.target.value}))} 
                      style={{width: '100%', maxWidth: '280px'}} 
                    />
                  ) : (
                    info.contact_number
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Pantawid Beneficiary:</label>
                  <span>{isEditing ? (
                    <select 
                      value={editValues.pantawid_beneficiary} 
                      onChange={e => setEditValues(v => ({...v, pantawid_beneficiary: e.target.value}))}
                      style={{width: '100%', maxWidth: '280px'}}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    info.pantawid_beneficiary ? 'Yes' : 'No'
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Indigenous:</label>
                  <span>{isEditing ? (
                    <select 
                      value={editValues.indigenous} 
                      onChange={e => setEditValues(v => ({...v, indigenous: e.target.value}))}
                      style={{width: '100%', maxWidth: '280px'}}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    info.indigenous ? 'Yes' : 'No'
                  )}</span>
                </div>
                <div className="info-row emergency-contact-row">
                  <label>Emergency Contact:</label>
                  <span className="emergency-contact-container">
                    {isEditing ? (
                      <div className="emergency-contact-edit">
                        <div className="emergency-field-row">
                          <div className="emergency-field-label">Name</div>
                          <input 
                            value={editValues.emergency_name} 
                            onChange={e => setEditValues(v => ({...v, emergency_name: e.target.value}))} 
                            className="emergency-field-input"
                            placeholder="Enter name" 
                          />
                        </div>
                        <div className="emergency-field-row address-field">
                          <div className="emergency-field-label">Address</div>
                          <div className="address-inputs">
                            <div className="address-input-group">
                              <label className="address-sublabel">Province/City</label>
                              <select
                                value={editValues.emergency_address ? editValues.emergency_address.split(',')[0] || '' : ''} 
                                onChange={e => {
                                  const currentAddress = editValues.emergency_address ? editValues.emergency_address.split(',') : ['', ''];
                                  currentAddress[0] = e.target.value;
                                  setEditValues(v => ({...v, emergency_address: currentAddress.join(',')}));
                                }} 
                                className="emergency-field-input"
                              >
                                <option value="">Select Province/City</option>
                                {allProvinces.map((province, index) => (
                                  <option key={`emergency-province-${index}`} value={province}>{province}</option>
                                ))}
                              </select>
                            </div>
                            <div className="address-input-group">
                              <label className="address-sublabel">Municipality/Barangay</label>
                              <select
                                value={editValues.emergency_address ? editValues.emergency_address.split(',')[1] || '' : ''} 
                                onChange={e => {
                                  const currentAddress = editValues.emergency_address ? editValues.emergency_address.split(',') : ['', ''];
                                  currentAddress[1] = e.target.value;
                                  setEditValues(v => ({...v, emergency_address: currentAddress.join(',')}));
                                }} 
                                className="emergency-field-input"
                                disabled={!(editValues.emergency_address && editValues.emergency_address.split(',')[0])}
                              >
                                <option value="">Select Municipality/Barangay</option>
                                {selectedProvince && municipalities.map((municipality, index) => (
                                  <option key={`emergency-municipality-${index}`} value={municipality}>{municipality}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="emergency-field-row">
                          <div className="emergency-field-label">Relationship</div>
                          <input 
                            value={editValues.emergency_relationship} 
                            onChange={e => setEditValues(v => ({...v, emergency_relationship: e.target.value}))} 
                            className="emergency-field-input"
                            placeholder="Enter relationship" 
                          />
                        </div>
                        <div className="emergency-field-row">
                          <div className="emergency-field-label">Contact</div>
                          <input 
                            value={editValues.emergency_contact} 
                            onChange={e => setEditValues(v => ({...v, emergency_contact: e.target.value}))} 
                            className="emergency-field-input"
                            placeholder="Enter contact number" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="emergency-contact-display">
                        <div className="emergency-field-row">
                          <div className="emergency-field-label">Name</div>
                          <div className="emergency-field-value">{info.emergency_name || 'Not provided'}</div>
                        </div>
                        <div className="emergency-field-row address-field">
                          <div className="emergency-field-label">Address</div>
                          <div className="emergency-field-value">{info.emergency_address || 'Not provided'}</div>
                        </div>
                        <div className="emergency-field-row">
                          <div className="emergency-field-label">Relationship</div>
                          <div className="emergency-field-value">{info.emergency_relationship || 'Not provided'}</div>
                        </div>
                        <div className="emergency-field-row">
                          <div className="emergency-field-label">Contact</div>
                          <div className="emergency-field-value">{info.emergency_contact || 'Not provided'}</div>
                        </div>
                      </div>
                    )}
                  </span>
                </div>
                <input type="hidden" name="faceRecognitionPhoto" value={editValues.faceRecognitionPhoto || ''} />
                
                <div className="info-row family-members-row">
                  <label>Family Members:</label>
                  <span className="family-members-container">
                    {isEditing ? (
                      <div className="family-members-edit">
                        {(editValues.familyMembers || []).length === 0 ? (
                          <div className="no-family-members">
                            <button 
                              type="button" 
                              className="add-family-member-btn"
                              onClick={() => setEditValues(prev => ({
                                ...prev, 
                                familyMembers: [...(prev.familyMembers || []), { 
                                  id: '', 
                                  code_id: '', 
                                  family_member_name: '', 
                                  age: '', 
                                  created_at: '', 
                                  educational_attainment: '',
                                  birthdate: ''
                                }]
                              }))}
                            >
                              <FontAwesomeIcon icon="plus" style={{marginRight: '8px'}} />
                              Add Family Member
                            </button>
                          </div>
                        ) : (
                          <div className="family-members-list">
                            {editValues.familyMembers.map((fm, i) => (
                              <div key={i} className="family-member-item">
                                <div className="family-member-header">
                                  <div className="family-member-title">Family Member #{i+1}</div>
                                  <button 
                                    type="button" 
                                    className="remove-family-member-btn"
                                    onClick={() => setEditValues(prev => ({
                                      ...prev, 
                                      familyMembers: prev.familyMembers.filter((_, idx) => idx !== i)
                                    }))}
                                  >
                                    <FontAwesomeIcon icon="times" />
                                  </button>
                                </div>
                                <div className="family-member-fields">
                                  <div className="family-field-row">
                                    <div className="family-field-label">Name</div>
                                    <input 
                                      value={fm.family_member_name || ''} 
                                      onChange={e => updateFamilyMember(i, 'family_member_name', e.target.value)} 
                                      className="family-field-input"
                                      placeholder="Enter full name" 
                                    />
                                  </div>
                                  <div className="family-field-row">
                                    <div className="family-field-label">Birthdate</div>
                                    <input 
                                      type="date" 
                                      value={fm.birthdate || ''} 
                                      onChange={e => {
                                        updateFamilyMember(i, 'birthdate', e.target.value);
                                        // Auto-update age when birthdate changes
                                        const age = calculateAge(e.target.value);
                                        updateFamilyMember(i, 'age', age);
                                      }} 
                                      className="family-field-input"
                                      placeholder="Enter birthdate" 
                                      max={getTodayDate()}
                                    />
                                  </div>
                                  <div className="family-field-row">
                                    <div className="family-field-label">Age (Auto-Calculated)</div>
                                    <div className="age-display-container">
                                      <input 
                                        value={calculateAge(fm.birthdate) !== null ? `${calculateAge(fm.birthdate)}` : ''}
                                        disabled={true} 
                                        className="family-field-input age-input"
                                        placeholder="Age will be calculated automatically" 
                                      />
                                      {fm.birthdate && calculateAge(fm.birthdate) !== null && (
                                        <div className="age-calculation-badge">
                                          {calculateAge(fm.birthdate)} years old
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="family-field-row">
                                    <div className="family-field-label">Educational Attainment</div>
                                    <input 
                                      value={fm.educational_attainment || ''} 
                                      onChange={e => updateFamilyMember(i, 'educational_attainment', e.target.value)} 
                                      className="family-field-input"
                                      placeholder="Enter educational attainment" 
                                    />
                                  </div>
                                  {/* Hidden fields for id and code_id if they exist */}
                                  <input type="hidden" value={fm.id || ''} />
                                  <input type="hidden" value={fm.code_id || ''} />
                                  <input type="hidden" value={fm.created_at || ''} />
                                </div>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              className="add-family-member-btn"
                              onClick={() => setEditValues(prev => ({
                                ...prev, 
                                familyMembers: [...(prev.familyMembers || []), { 
                                  id: '', 
                                  code_id: '', 
                                  family_member_name: '', 
                                  age: '', 
                                  created_at: '', 
                                  educational_attainment: '',
                                  birthdate: ''
                                }]
                              }))}
                            >
                              <FontAwesomeIcon icon="plus" style={{marginRight: '8px'}} />
                              Add Another Family Member
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="family-members-display">
                        {(info.familyMembers || []).length === 0 ? (
                          <div className="no-family-members">No family members added</div>
                        ) : (
                          <div className="family-members-list">
                            {info.familyMembers.map((fm, i) => (
                              <div key={i} className="family-member-item">
                                <div className="family-member-title">Family Member #{i+1}</div>
                                <div className="family-member-details">
                                  <div className="family-detail-row">
                                    <span className="family-detail-label">Name:</span>
                                    <span className="family-detail-value">{fm.family_member_name || 'Not provided'}</span>
                                  </div>
                                  <div className="family-detail-row">
                                    <span className="family-detail-label">Birthdate:</span>
                                    <span className="family-detail-value">
                                      {fm.birthdate ? new Date(fm.birthdate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Not provided'}
                                    </span>
                                  </div>
                                  <div className="family-detail-row">
                                    <span className="family-detail-label">Age:</span>
                                    <span className="family-detail-value age-display">
                                      {calculateAge(fm.birthdate) !== null ? (
                                        <>
                                          <span className="age-badge">{calculateAge(fm.birthdate)} years old</span>
                                        </>
                                      ) : 'Not provided'}
                                    </span>
                                  </div>
                                  <div className="family-detail-row">
                                    <span className="family-detail-label">Educational Attainment:</span>
                                    <span className="family-detail-value">{fm.educational_attainment || 'Not provided'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </span>
                </div>
                
                <div className="info-row">
                  <label>Documents:</label>
                  <span>
                    {(info.documents || []).length === 0 ? (
                      <div style={{
                        padding: '10px', 
                        background: '#f5f5f5', 
                        borderRadius: '8px', 
                        color: '#666',
                        textAlign: 'center'
                      }}>
                        <FontAwesomeIcon icon="file-alt" style={{marginRight: '8px'}} />
                        No documents uploaded
                      </div>
                    ) : info.documents.map((doc, i) => (
                      <div key={i} className="document-row">
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <FontAwesomeIcon icon="file-pdf" style={{color: '#2E7D32'}} />
                          <span>{doc.display_name}</span>
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#1976d2',
                              textDecoration: 'none',
                              fontWeight: '500'
                            }}
                          >
                            <FontAwesomeIcon icon="external-link-alt" />
                            View
                          </a>
                          <span style={{
                            background: doc.status === 'Approved' ? '#e8f5e9' : '#fff3e0',
                            color: doc.status === 'Approved' ? '#2E7D32' : '#ef6c00',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="resend-modal-footer">
            <button
              className="resend-btn save"
              onClick={saveEditAll}
              disabled={loading || (isEditing && loading)}
            >
              {isEditing ? (
                loading ? (
                  <>
                    <FontAwesomeIcon icon="spinner" spin style={{marginRight: '8px'}} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon="paper-plane" style={{marginRight: '8px'}} />
                    Submit
                  </>
                )
              ) : (
                <>
                  <FontAwesomeIcon icon="check" style={{marginRight: '8px'}} />
                  Confirm
                </>
              )}
            </button>
            <button
              className="resend-btn cancel"
              onClick={onClose}
            >
              <FontAwesomeIcon icon="times" style={{marginRight: '8px'}} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;

