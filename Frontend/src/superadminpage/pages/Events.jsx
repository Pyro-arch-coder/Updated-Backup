import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaTimes, FaQrcode } from 'react-icons/fa';
import QrScanner from 'qr-scanner';
import santaMariaBarangays from '../../data/santaMariaBarangays.json';

// Import necessary Material-UI components
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';

// Import Material-UI icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Define API base URL from environment variables with fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

// Define time options for dropdown
const timeOptions = [
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endTime: '',
    location: '',
    status: 'Upcoming',
    visibility: 'everyone',
    barangay: 'All'
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [attendeesList, setAttendeesList] = useState([]);
  const [completedEventAttendees, setCompletedEventAttendees] = useState([]);
  const [showCompletedEventModal, setShowCompletedEventModal] = useState(false);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [showTimeConflictModal, setShowTimeConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);
  const loggedInUserId = localStorage.getItem('UserId');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDateTodayError, setShowDateTodayError] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const CLOUD_NAME = 'dskj7oxr7';
  const UPLOAD_PRESET = 'soloparent';
  const [eventImage, setEventImage] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Calculate tomorrow's date in YYYY-MM-DD format
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const minEventDate = getTomorrow();

  useEffect(() => {
    fetchEvents();
  }, []);

  // Add debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        try {
          console.log('Searching for:', searchTerm);
          const response = await axios.get(`${API_BASE_URL}/api/users/search?q=${searchTerm}`);
          console.log('Search response:', response.data);
          
          // Filter only verified users
          const verifiedUsers = response.data.filter(user => 
            user.status === 'Verified' || user.status === 'verified' || user.status === 'VERIFIED'
          );
          
          console.log('Verified users:', verifiedUsers);
          
          if (verifiedUsers.length === 0) {
            setSearchMessage('User not found');
            setSearchResults([]);
          } else {
            setSearchMessage('');
            setSearchResults(verifiedUsers);
          }
        } catch (error) {
          console.error('Search error details:', error.response?.data || error.message);
          setSearchResults([]);
          setSearchMessage('User not found');
        }
      } else {
        setSearchResults([]);
        setSearchMessage('');
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events?userId=${loggedInUserId}`);
      if (response.data) {
        setEvents(response.data);
        console.log('Events fetched:', response.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setStatusMessage('Failed to fetch events');
    }
  };

  const fetchEventAttendees = async (eventId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events/${eventId}/attendees`);
      if (response.data) {
        setAttendeesList(response.data);
        setCompletedEventAttendees(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast.error('Failed to fetch attendees');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return '';
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatBufferTimeMessage = (event, bufferStart, bufferEnd) => {
    // Strip seconds from time display
    const eventStartTime = formatTime(event.startTime);
    const eventEndTime = formatTime(event.endTime);
    
    // Convert buffer times from minutes to HH:mm format
    const formatMinutesToTime = (minutes) => {
      if (typeof minutes !== 'number' || isNaN(minutes)) return '--:--';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const bufferStartTime = formatMinutesToTime(bufferStart);
    const bufferEndTime = formatMinutesToTime(bufferEnd);

    return `There must be a 1-hour gap between events. Event "${event.title}" runs from ${eventStartTime} to ${eventEndTime}, blocking the time slot from ${bufferStartTime} to ${bufferEndTime}.`;
  };

  const checkTimeConflict = async (newStartDate, newEndDate, newStartTime, newEndTime, excludeEventId = null) => {
    try {
      // Validate input times
      if (!newStartTime || !newEndTime) {
        return {
          hasConflict: true,
          conflictingEvent: null,
          message: 'Please select both start and end times'
        };
      }

      const response = await axios.get(`${API_BASE_URL}/api/events`);
      const existingEvents = response.data.filter(event => 
        event.id !== excludeEventId &&
        event.startDate.split('T')[0] === newStartDate.split('T')[0]
      );

      // Convert times to minutes for easier comparison, handling HH:mm:ss format
      const parseTimeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
      };

      const newStart = parseTimeToMinutes(newStartTime);
      const newEnd = parseTimeToMinutes(newEndTime);

      if (newStart === null || newEnd === null) {
        return {
          hasConflict: true,
          conflictingEvent: null,
          message: 'Invalid time format'
        };
      }

      // Check each existing event for overlap including 1-hour buffer
      for (const event of existingEvents) {
        const existingStart = parseTimeToMinutes(event.startTime);
        const existingEnd = parseTimeToMinutes(event.endTime);
        
        if (existingStart === null || existingEnd === null) {
          continue; // Skip invalid events
        }

        // Add 1-hour buffer before and after existing events
        const bufferStart = existingStart - 60; // 1 hour before event starts
        const bufferEnd = existingEnd + 60;    // 1 hour after event ends

        // Check if there's any overlap including buffer time
        if ((newStart >= bufferStart && newStart < bufferEnd) || 
            (newEnd > bufferStart && newEnd <= bufferEnd) ||
            (newStart <= bufferStart && newEnd >= bufferEnd)) {
          return {
            hasConflict: true,
            conflictingEvent: event,
            message: formatBufferTimeMessage(event, bufferStart, bufferEnd)
          };
        }
      }

      return {
        hasConflict: false,
        conflictingEvent: null,
        message: null
      };
    } catch (error) {
      console.error('Error checking time conflicts:', error);
      return {
        hasConflict: false,
        conflictingEvent: null,
        message: null
      };
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleInputChange = (e) => {
    const { name } = e.target;
    let value = e.target.value;

    if (name === 'startDate') {
      // Validate dates
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast.error('Cannot select a past date');
        return;
      }
    }

    if (name === 'startTime' || name === 'endTime') {
      // Convert from 12-hour to 24-hour format if needed
      if (value.includes('AM') || value.includes('PM')) {
        value = convertTo24Hour(value);
      }

      // Validate times
      if (formData.startDate) {
        const startMinutes = name === 'startTime' ? timeToMinutes(value) : timeToMinutes(formData.startTime);
        const endMinutes = name === 'endTime' ? timeToMinutes(value) : timeToMinutes(formData.endTime);

        if (startMinutes && endMinutes && endMinutes <= startMinutes) {
          toast.error('End time must be after start time');
          return;
        }
      }
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      return newData;
    });
  };

  const handleEventImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Please upload only image files (JPG, PNG, GIF, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should not exceed 5MB');
      return;
    }
    setEventImage(file);
    setEventImagePreview(URL.createObjectURL(file));
  };

  const uploadEventImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'soloparent/events');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!data.secure_url) throw new Error('Failed to upload image');
    return data.secure_url;
  };

  const validateEventForm = () => {
    const requiredFields = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'startDate', label: 'Date' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
      { key: 'location', label: 'Location' },
      { key: 'barangay', label: 'Barangay' },
      { key: 'visibility', label: 'Visibility' },
    ];
    for (const field of requiredFields) {
      if (!formData[field.key] || formData[field.key].toString().trim() === '') {
        toast.error(`${field.label} is required`);
        return false;
      }
    }
    if (!eventImage && !eventImagePreview) {
      toast.error('Event photo is required');
      return false;
    }
    // Time logic (already checked elsewhere, but double check)
    if (formData.startTime && formData.endTime) {
      const startMinutes = timeToMinutes(formData.startTime);
      const endMinutes = timeToMinutes(formData.endTime);
      if (endMinutes <= startMinutes) {
        toast.error('End time must be after start time');
        return false;
      }
    }
    return true;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!validateEventForm()) return;
    try {
      let imageUrl = '';
      if (eventImage) {
        setIsUploadingImage(true);
        imageUrl = await uploadEventImageToCloudinary(eventImage);
        setIsUploadingImage(false);
      }
      const eventData = { ...formData, image: imageUrl };
      const response = await axios.post(`${API_BASE_URL}/api/events`, eventData);
      
      if (response.data) {
        toast.success('Event added successfully');
        setShowAddModal(false);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          startTime: '',
          endTime: '',
          location: '',
          status: 'Upcoming',
          visibility: 'everyone',
          barangay: 'All'
        });
        setSuccessMessage('Event added successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        fetchEvents();
        setEventImage(null);
        setEventImagePreview('');
      }
    } catch (error) {
      setIsUploadingImage(false);
      console.error('Error adding event:', error);
      if (error.response?.data?.error === 'Time Conflict' && error.response?.data?.conflictingEvent) {
        setConflictInfo(error.response.data.conflictingEvent);
        setShowTimeConflictModal(true);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to add event');
      }
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    // Validation: disallow today
    const today = new Date();
    const selected = new Date(formData.startDate);
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    if (selected.getTime() === today.getTime()) {
      setShowDateTodayError(true);
      return;
    }
    try {
      // Validate end time is after start time
      const startMinutes = timeToMinutes(formData.startTime);
      const endMinutes = timeToMinutes(formData.endTime);
      
      if (endMinutes <= startMinutes) {
        toast.error('End time must be after start time');
        return;
      }

      let imageUrl = selectedEvent?.image || '';
      if (eventImage) {
        setIsUploadingImage(true);
        imageUrl = await uploadEventImageToCloudinary(eventImage);
        setIsUploadingImage(false);
      }
      const eventData = { ...formData, image: imageUrl };
      const response = await axios.put(`${API_BASE_URL}/api/events/${selectedEvent.id}`, eventData);
      
      if (response.data) {
        toast.success('Event updated successfully');
        setShowEditModal(false);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          startTime: '',
          endTime: '',
          location: '',
          status: 'Upcoming',
          visibility: 'everyone',
          barangay: 'All'
        });
        setSuccessMessage('Event updated successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        fetchEvents();
        setEventImage(null);
        setEventImagePreview('');
      }
    } catch (error) {
      setIsUploadingImage(false);
      console.error('Error updating event:', error);
      if (error.response?.data?.error === 'Time Conflict' && error.response?.data?.conflictingEvent) {
        setConflictInfo(error.response.data.conflictingEvent);
        setShowTimeConflictModal(true);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update event');
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/events/${id}`);
        setSuccessMessage('Event deleted successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleEditClick = (e, event) => {
    e.stopPropagation();
    if (event.status === 'Completed') {
      toast.error('Completed events cannot be edited');
      return;
    }
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate.split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      status: event.status,
      visibility: event.visibility,
      barangay: event.barangay
    });
    setShowEditModal(true);
  };

  const handleEventClick = (event) => {
    if (event.status === 'Completed') {
      setSelectedEventTitle(event.title);
      setCurrentEventId(event.id);
      fetchEventAttendees(event.id);
      setShowCompletedEventModal(true);
      return;
    }

    if (!['Active', 'Ongoing'].includes(event.status)) {
      setStatusMessage(`Attendee management is not available for ${event.status.toLowerCase()} events`);
      setShowStatusModal(true);
      return;
    }
    setCurrentEventId(event.id);
    setShowAttendeesModal(true);
    fetchEventAttendees(event.id);
  };

  const addAttendee = async (userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/events/${currentEventId}/attendees`, { userId });
      toast.success('Attendee added successfully');
      setAttendeesList(response.data.attendees);
      // Clear search results after adding
      setSearchResults([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding attendee:', error);
      toast.error(error.response?.data?.error || 'Failed to add attendee');
    }
  };

  const handleQRCodeScan = async () => {
    try {
      setScannerError('');
      setShowScanner(true);
      
      // Ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      const videoElem = document.getElementById('qr-scanner-video');
      
      if (!videoElem) {
        throw new Error('Scanner elements not found');
      }

      // Configure video element
      videoElem.playsInline = true;
      videoElem.muted = true;
      
      // Get camera stream with fallback
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      }).catch(async () => {
        // Fallback to any available camera
        return navigator.mediaDevices.getUserMedia({
          video: true
        });
      });

      if (!stream) {
        throw new Error('No camera available');
      }
      
      videoElem.srcObject = stream;
      await videoElem.play().catch(err => {
        throw new Error('Failed to start video feed: ' + err.message);
      });
      
      // Scanning logic
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      let scanAttempts = 0;
      let lastScanTime = 0;
      
      const scanInterval = setInterval(async () => {
        try {
          const now = Date.now();
          if (now - lastScanTime < 200) { // Limit scan rate to 5 times per second
            return;
          }
          lastScanTime = now;

          if (scanAttempts++ > 300) { // 60 second timeout
            clearInterval(scanInterval);
            stream.getTracks().forEach(track => track.stop());
            throw new Error('Scan timed out - please try again');
          }
          
          if (!videoElem.videoWidth) {
            return; // Skip if video not ready
          }

          canvas.width = videoElem.videoWidth;
          canvas.height = videoElem.videoHeight;
          context.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
          
          const result = await QrScanner.scanImage(canvas).catch(() => null);
          if (result) {
            clearInterval(scanInterval);
            // Get the QR code data directly
            const qrData = result.trim();
            
            // Get user details by searching with qr_code_data
            try {
              const response = await axios.get(`${API_BASE_URL}/api/users/search/qr?qr_code_data=${qrData}`);
              if (response.data.success) {
                // Set the search input to the user's name
                setSearchTerm(response.data.user.name);
                // Optionally trigger search automatically:
                // handleSearch({ preventDefault: () => {} });
                toast.success(`Found user: ${response.data.user.name}`);
              } else {
                toast.error(response.data.error || 'User not found');
              }
            } catch (error) {
              console.error('Error searching user:', error);
              toast.error('Failed to search user');
            }
            
            // Cleanup
            stream.getTracks().forEach(track => track.stop());
            setShowScanner(false);
          }
        } catch (err) {
          // Only stop on actual errors, not failed scans
          if (err.message !== 'QR code not found') {
            clearInterval(scanInterval);
            stream.getTracks().forEach(track => track.stop());
            setScannerError(err.message);
            setShowScanner(false);
          }
        }
      }, 200); // Scan every 200ms
      
      // Cleanup function
      return () => {
        clearInterval(scanInterval);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
    } catch (err) {
      console.error('QR Scanner error:', err);
      setScannerError(err.message || 'Failed to initialize camera');
      setShowScanner(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChipColor = (status) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'primary';
      case 'ongoing':
      case 'active':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Filtered events by selected date
  const filteredEvents = filterDate
    ? events.filter(event => event.startDate && event.startDate.split('T')[0] === filterDate)
    : events;
  const paginatedEvents = filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // QR Scanner Modal Component
  const QRScannerModal = () => (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-modal">
        <div className="scanner-header">
        <center> <h2>Scan QR Code</h2></center>
          {scannerError ? (
            <p className="scanner-error-message">{scannerError}</p>
          ) : (
            <center><p className="scanner-instructions">Position the QR code within the frame</p></center>
          )}
        </div>
        
        <div className="scanner-container">
          <div className="scanner-frame">
            <video 
              id="qr-scanner-video"
              className={`scanner-video ${scannerError ? 'scanner-error-state' : ''}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="scanner-corner top-left"></div>
            <div className="scanner-corner top-right"></div>
            <div className="scanner-corner bottom-left"></div>
            <div className="scanner-corner bottom-right"></div>
          </div>
        </div>

        <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
          <Button
            onClick={() => {
              const videoElem = document.getElementById('qr-scanner-video');
              if (videoElem && videoElem.srcObject) {
                videoElem.srcObject.getTracks().forEach(track => track.stop());
              }
              setShowScanner(false);
              setScannerError('');
            }}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, fontWeight: 700, px: 4, py: 1, fontSize: 16, boxShadow: 'none', mt: 2 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </div>
    </div>
  );

  // Time conflict modal component
  const TimeConflictModal = () => {
    if (!showTimeConflictModal || !conflictInfo) return null;

    return (
      <Dialog open={showTimeConflictModal} onClose={() => setShowTimeConflictModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', fontWeight: 700, textAlign: 'center', pb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            Time Conflict Detected
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'grey.50', p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#16C47F' }}>Existing Event</Typography>
          <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, bgcolor: 'white', p: 2, mb: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Title</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{conflictInfo.title}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Time</Typography>
                <Typography variant="body2">{formatTime(conflictInfo.startTime)} - {formatTime(conflictInfo.endTime)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body2">{formatDate(conflictInfo.startDate)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2">{conflictInfo.location}</Typography>
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ bgcolor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 1, p: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#ad6800', fontWeight: 600, mb: 1 }}>
              There must be a 1-hour gap between events.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Please select a time that is:</Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>
                At least 1 hour after the existing event ends ({formatTime(conflictInfo.endTime)} + 1 hour)
              </li>
              <li>
                OR at least 1 hour before the existing event starts ({formatTime(conflictInfo.startTime)} - 1 hour)
              </li>
            </ul>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setShowTimeConflictModal(false)} variant="contained" sx={{ backgroundColor: '#16C47F', fontWeight: 600, px: 4 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Date Today Error Modal
  const DateTodayErrorModal = () => (
    <Dialog open={showDateTodayError} onClose={() => setShowDateTodayError(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white', fontWeight: 700, textAlign: 'center', pb: 2 }}>
        Invalid Date
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'grey.50', p: 3 }}>
        <Typography variant="body1" sx={{ color: '#d32f2f', fontWeight: 600, mb: 1 }}>
          You cannot schedule an event for today. Please select a future date.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={() => setShowDateTodayError(false)} variant="contained" sx={{ backgroundColor: '#d32f2f', fontWeight: 600, px: 4 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // When opening edit modal, set preview if image exists
  useEffect(() => {
    if (showEditModal && selectedEvent?.image) {
      setEventImagePreview(selectedEvent.image);
      setEventImage(null);
    }
    if (!showEditModal) {
      setEventImagePreview('');
      setEventImage(null);
    }
  }, [showEditModal, selectedEvent]);

  // When opening add modal, reset image
  useEffect(() => {
    if (showAddModal) {
      setEventImagePreview('');
      setEventImage(null);
    }
  }, [showAddModal]);

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
          mb: 1
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#16C47F', fontSize: { xs: '1.1rem', sm: '1.75rem', md: '2rem' }, textAlign: 'left', mb: 0 }}>
            Events Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddModal(true)}
            sx={{
              backgroundColor: '#16C47F',
              '&:hover': { backgroundColor: '#14a36f' },
              borderRadius: 2,
              px: { xs: 1, sm: 2 },
              py: { xs: 0.5, sm: 1 },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.8rem', sm: '1rem' },
              minWidth: { xs: 36, sm: 'auto' },
              width: { xs: 'auto', sm: 'auto' },
              alignSelf: 'center',
              height: { xs: 32, sm: 40 },
              ml: 1
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Add New Event</Box>
          </Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            type="date"
            size="small"
            label="Filter by Date"
            value={filterDate}
            onChange={e => {
              setFilterDate(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{
              fontSize: { xs: '0.8rem', sm: '1rem' },
              minWidth: { xs: 120, sm: 180 },
              '& .MuiInputBase-root': { borderRadius: 2, height: { xs: 32, sm: 40 }, fontSize: { xs: '0.8rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.8rem', sm: '1rem' } }
            }}
          />
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="events table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>ID</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Title</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Status</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEvents.map((event, index) => (
                <TableRow
                  key={event.id}
                  hover
                  sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}
                >
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{event.title}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <Chip label={event.status} color={getStatusChipColor(event.status)} size="small" sx={{ fontWeight: 600, fontSize: '0.9em', textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={(e) => handleEditClick(e, event)}
                      disabled={event.status === 'Completed'}
                      sx={{
                        backgroundColor: '#FFD600',
                        color: '#222',
                        fontWeight: 600,
                        mr: 1,
                        textTransform: 'none',
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        '&:hover': { backgroundColor: '#FFC400' },
                        opacity: event.status === 'Completed' ? 0.5 : 1,
                        cursor: event.status === 'Completed' ? 'not-allowed' : 'pointer',
                        py: { xs: 0.5, sm: 1 },
                        px: { xs: 1, sm: 2 },
                        mb: { xs: 1, sm: 0 }
                      }}
                      size="small"
                    >
                      <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit</Box>
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        setSelectedEvent(event);
                        fetchEventAttendees(event.id);
                        setShowViewModal(true);
                      }}
                      sx={{
                        backgroundColor: '#3498db',
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        '&:hover': { backgroundColor: '#217dbb' },
                        py: { xs: 0.5, sm: 1 },
                        px: { xs: 1, sm: 2 },
                        mr: 1,
                        mb: { xs: 1, sm: 0 }
                      }}
                      size="small"
                    >
                      <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>View</Box>
                    </Button>
                    {['Active', 'Ongoing'].includes(event.status) && (
                      <Button
                        variant="contained"
                        startIcon={<FaQrcode />}
                        onClick={() => handleEventClick(event)}
                        sx={{
                          backgroundColor: '#16C47F',
                          color: '#fff',
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: { xs: '0.8rem', sm: '1rem' },
                          '&:hover': { backgroundColor: '#14a36f' },
                          py: { xs: 0.5, sm: 1 },
                          px: { xs: 1, sm: 2 },
                          mb: { xs: 1, sm: 0 }
                        }}
                        size="small"
                      >
                        <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Manage Attendees</Box>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            fontSize: { xs: '0.75rem', sm: '1rem' },
            '& .MuiTablePagination-select, & .MuiTablePagination-displayedRows, & .MuiTablePagination-actions, & .MuiTablePagination-toolbar, & .MuiTablePagination-input': {
              fontSize: { xs: '0.75rem', sm: '1rem' }
            },
            '& .MuiTablePagination-selectIcon': {
              color: '#16C47F'
            }
          }}
        />
      </Paper>
      {showSuccessModal && (
        <div className="soloparent-modal-overlay">
          <div className="soloparent-success-modal">
            <div className="soloparent-success-content">
              <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#10b981', animation: 'pulse 1.5s infinite' }}></i>
              <p style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      {/* Add Event Modal */}
      <Dialog 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', fontWeight: 600 }}>
          Add New Event
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddEvent} sx={{ mt: 2, display: 'grid', gap: '16px', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            <Box>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minEventDate }}
                sx={{ '& .MuiInputBase-root': { fontWeight: 500 }, '& .MuiInputLabel-root': { fontWeight: 600 } }}
              />
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Visibility</InputLabel>
                <Select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  label="Visibility"
                >
                  <MenuItem value="everyone">Show to Everyone</MenuItem>
                  <MenuItem value="beneficiaries">Beneficiaries</MenuItem>
                  <MenuItem value="not_beneficiaries">Not Beneficiaries</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Start Time</InputLabel>
                <Select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  label="Start Time"
                >
                  {timeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>End Time</InputLabel>
                <Select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  label="End Time"
                >
                  {timeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                multiline
                rows={3}
              />
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Barangay</InputLabel>
                <Select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  label="Barangay"
                >
                  <MenuItem value="All">All</MenuItem>
                  {santaMariaBarangays.Barangays.map(barangay => (
                    <MenuItem key={barangay} value={barangay}>{barangay}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Status"
                value="Upcoming"
                disabled
                InputProps={{ style: { fontWeight: 700, color: '#222' } }}
                InputLabelProps={{ style: { fontWeight: 600 } }}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Event Photo</Typography>
              <Box
                sx={{
                  width: 250,
                  height: 250,
                  border: '2px dashed #16C47F',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  mb: 2,
                  mx: 'auto',
                  position: 'relative',
                  background: '#f8fafc',
                }}
              >
                {eventImagePreview ? (
                  <img src={eventImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <Typography variant="body2" color="textSecondary">Image Preview (250x250)</Typography>
                )}
                {eventImagePreview && (
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    sx={{ position: 'absolute', top: 8, right: 8, minWidth: 0, width: 32, height: 32, borderRadius: '50%' }}
                    onClick={() => { setEventImage(null); setEventImagePreview(''); }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<i className="fas fa-upload"></i>}
                sx={{ borderRadius: 2, px: 2, py: 1, textTransform: 'none', fontWeight: 600, fontSize: '1rem', borderColor: '#16C47F', color: '#16C47F', '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)', borderColor: '#14a36f', color: '#14a36f' }, minWidth: 200, display: 'block', mx: 'auto', mb: 2 }}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? 'Uploading...' : 'Choose Image'}
                <input type="file" accept="image/*" onChange={handleEventImageChange} style={{ display: 'none' }} />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAddModal(false)} sx={{ color: '#16C47F' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddEvent}
            variant="contained" 
            sx={{ backgroundColor: '#16C47F', '&:hover': { backgroundColor: '#14a36f' } }}
            disabled={isUploadingImage}
          >
            Save Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', fontWeight: 600 }}>
          Edit Event
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleEditEvent} sx={{ mt: 2, display: 'grid', gap: '16px', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            <Box>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minEventDate }}
              />
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Visibility</InputLabel>
                <Select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  label="Visibility"
                >
                  <MenuItem value="everyone">Show to Everyone</MenuItem>
                  <MenuItem value="beneficiaries">Beneficiaries</MenuItem>
                  <MenuItem value="not_beneficiaries">Not Beneficiaries</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Start Time</InputLabel>
                <Select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  label="Start Time"
                >
                  {timeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>End Time</InputLabel>
                <Select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  label="End Time"
                >
                  {timeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                multiline
                rows={3}
              />
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Barangay</InputLabel>
                <Select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  label="Barangay"
                >
                  <MenuItem value="All">All</MenuItem>
                  {santaMariaBarangays.Barangays.map(barangay => (
                    <MenuItem key={barangay} value={barangay}>{barangay}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value="Upcoming">Upcoming</MenuItem>
                  <MenuItem value="Ongoing">Ongoing</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Event Photo</Typography>
              <Box
                sx={{
                  width: 250,
                  height: 250,
                  border: '2px dashed #16C47F',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  mb: 2,
                  mx: 'auto',
                  position: 'relative',
                  background: '#f8fafc',
                }}
              >
                {eventImagePreview ? (
                  <img src={eventImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <Typography variant="body2" color="textSecondary">Image Preview (250x250)</Typography>
                )}
                {eventImagePreview && (
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    sx={{ position: 'absolute', top: 8, right: 8, minWidth: 0, width: 32, height: 32, borderRadius: '50%' }}
                    onClick={() => { setEventImage(null); setEventImagePreview(''); }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<i className="fas fa-upload"></i>}
                sx={{ borderRadius: 2, px: 2, py: 1, textTransform: 'none', fontWeight: 600, fontSize: '1rem', borderColor: '#16C47F', color: '#16C47F', '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)', borderColor: '#14a36f', color: '#14a36f' }, minWidth: 200, display: 'block', mx: 'auto', mb: 2 }}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? 'Uploading...' : 'Choose Image'}
                <input type="file" accept="image/*" onChange={handleEventImageChange} style={{ display: 'none' }} />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowEditModal(false)} sx={{ color: '#16C47F' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditEvent}
            variant="contained"
            sx={{ backgroundColor: '#16C47F', '&:hover': { backgroundColor: '#14a36f' } }}
          >
            Update Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendees Modal */}
      {showAttendeesModal && (
        <Dialog open={showAttendeesModal} onClose={() => setShowAttendeesModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
            <Box display="flex" alignItems="center" gap={1}>
              Manage Attendees for Event #{currentEventId}
            </Box>
            <IconButton onClick={() => setShowAttendeesModal(false)} size="large" sx={{ color: '#fff' }}>
              <FaTimes />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc' }}>
            {/* Search/Add Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#16C47F', mb: 1 }}>Add Attendee</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name or email"
                  className="event-attendees-search-input"
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15, background: '#fff' }}
                />
                <Button
                  onClick={handleQRCodeScan}
                  variant="outlined"
                  startIcon={<FaQrcode />}
                  sx={{ borderRadius: 2, color: '#16C47F', borderColor: '#16C47F', fontWeight: 600, minWidth: 44, height: 44 }}
                >
                  Scan QR
                </Button>
              </Box>
              {searchMessage && (
                <Typography sx={{ color: searchResults.length === 0 ? 'red' : 'green', mt: 1 }}>{searchMessage}</Typography>
              )}
              {searchResults.length > 0 && (
                <Box className="event-attendees-search-results" sx={{ mt: 2 }}>
                  {searchResults.map(user => (
                    <Paper key={user.id} elevation={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2, mb: 1, bgcolor: '#fff' }}>
                      <span style={{ fontWeight: 500 }}>{user.name} ({user.email})</span>
                      <Button
                        onClick={() => addAttendee(user.id)}
                        variant="contained"
                        sx={{ backgroundColor: '#16C47F', color: '#fff', fontWeight: 600, borderRadius: 2, px: 2, py: 0.5, fontSize: 14, ml: 2, boxShadow: 'none' }}
                      >
                        Add
                      </Button>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            {/* Attendees Table Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#16C47F', mb: 2 }}>Current Attendees</Typography>
            <Paper elevation={0} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 0, maxHeight: 320, overflowY: 'auto' }}>
              <table className="event-attendees-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px 8px', fontWeight: 'bold', borderTopLeftRadius: 8 }}>Name</th>
                    <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Email</th>
                    <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Barangay</th>
                    <th style={{ padding: '10px 8px', fontWeight: 'bold', borderTopRightRadius: 8 }}>Attendance Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendeesList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>No attendees yet.</td>
                    </tr>
                  ) : (
                    attendeesList.map(attendee => (
                      <tr key={attendee.id} style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px' }}>{attendee.name}</td>
                        <td style={{ padding: '8px' }}>{attendee.email}</td>
                        <td style={{ padding: '8px' }}>{attendee.barangay}</td>
                        <td style={{ padding: '8px' }}>{new Date(attendee.attend_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'flex-end', bgcolor: '#f8fafc', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
            <Button onClick={() => setShowAttendeesModal(false)} sx={{ color: '#16C47F', fontWeight: 600, borderRadius: 2 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {showScanner && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2000, // very high to ensure on top
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(4px)'
        }}>
          <QRScannerModal />
        </Box>
      )}

      {/* Add Completed Event Attendees Modal */}
      {showCompletedEventModal && (
        <div className="event-attendees-backdrop" onClick={() => setShowCompletedEventModal(false)}>
          <div className="event-attendees-modal" onClick={e => e.stopPropagation()}>
            <div className="event-attendees-header">
              <h3>Attendees List - {selectedEventTitle}</h3>
              <button 
                className="event-attendees-close" 
                onClick={() => setShowCompletedEventModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="event-attendees-content">
              <div className="event-attendees-table-section">
                <div className="event-attendees-table-container">
                  <table className="event-attendees-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Barangay</th>
                        <th>Attendance Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedEventAttendees.map(attendee => (
                        <tr key={attendee.id}>
                          <td>{attendee.name}</td>
                          <td>{attendee.email}</td>
                          <td>{attendee.barangay}</td>
                          <td>{new Date(attendee.attend_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {completedEventAttendees.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center' }}>No attendees found for this event</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Restriction Modal */}
      {showStatusModal && (
        <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}>
          <div className="status-modal" onClick={e => e.stopPropagation()}>
            <h3>Event Status Restriction</h3>
            <p>{statusMessage}</p>
          </div>
        </div>
      )}

      <TimeConflictModal />
      <DateTodayErrorModal />

      {/* View Event Modal */}
      <Dialog 
        open={showViewModal && !!selectedEvent} 
        onClose={() => setShowViewModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', fontWeight: 600 }}>
          Event Details
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ mt: 2 }}>
              {/* Event Image Display */}
              {selectedEvent.image && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <img
                    src={selectedEvent.image}
                    alt="Event"
                    style={{
                      maxWidth: 320,
                      maxHeight: 220,
                      borderRadius: 12,
                      boxShadow: '0 2px 12px rgba(44,109,46,0.10)',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                    }}
                  />
                </Box>
              )}
              <Box sx={{
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Title</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEvent.title}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Description</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEvent.description}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Date</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatDate(selectedEvent.startDate)}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Visibility</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEvent.visibility}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Time</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Location</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEvent.location}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Barangay</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEvent.barangay}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Status</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEvent.status}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
          {selectedEvent && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#16C47F', mb: 2 }}>Attendees</Typography>
              <Paper elevation={0} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 0, maxHeight: 320, overflowY: 'auto' }}>
                <table className="event-attendees-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Name</th>
                      <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Email</th>
                      <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Barangay</th>
                      <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Attendance Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendeesList && attendeesList.length > 0 ? (
                      attendeesList.map(attendee => (
                        <tr key={attendee.id} style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px' }}>{attendee.name}</td>
                          <td style={{ padding: '8px' }}>{attendee.email}</td>
                          <td style={{ padding: '8px' }}>{attendee.barangay}</td>
                          <td style={{ padding: '8px' }}>{new Date(attendee.attend_at).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>No attendees yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowViewModal(false)}
            sx={{ color: '#16C47F' }}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this event?')) {
                handleDeleteEvent(selectedEvent.id);
                setShowViewModal(false);
              }
            }}
            color="error"
            variant="contained"
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Events;