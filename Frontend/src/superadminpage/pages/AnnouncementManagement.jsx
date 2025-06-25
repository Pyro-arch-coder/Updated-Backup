import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Grid } from '@mui/material';
import { FaBullhorn } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const AnnouncementManagement = () => {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementDescription, setAnnouncementDescription] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [announcementEndDate, setAnnouncementEndDate] = useState('');
  const [announcementImage, setAnnouncementImage] = useState(null);
  const [announcementImagePreview, setAnnouncementImagePreview] = useState(null);
  const [isAnnLoading, setIsAnnLoading] = useState(false);
  const [annError, setAnnError] = useState('');
  const [annSuccess, setAnnSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setAnnError('');
    setAnnSuccess('');

    if (!announcementTitle.trim()) {
      setAnnError('Title is required.');
      return;
    }
    if (!announcementDescription.trim()) {
      setAnnError('Description is required.');
      return;
    }
    if (!announcementEndDate) {
      setAnnError('End date is required.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(announcementEndDate);
    if (inputDate <= today) {
      setAnnError('End date must be in the future.');
      return;
    }
    if (!announcementImage) {
      setAnnError('Image is required.');
      return;
    }
    setIsAnnLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle,
          description: announcementDescription,
          link: announcementLink,
          endDate: announcementEndDate || undefined,
          imageBase64: announcementImagePreview || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnnSuccess('Announcement posted successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        setAnnouncementTitle('');
        setAnnouncementDescription('');
        setAnnouncementLink('');
        setAnnouncementEndDate('');
        setAnnouncementImage(null);
        setAnnouncementImagePreview(null);
        setAnnError('');
        setTimeout(() => {
          setAnnSuccess('');
        }, 3000);
      } else {
        setAnnError(data.error || 'Failed to post announcement');
      }
    } catch (err) {
      setAnnError('Failed to post announcement');
    }
    setIsAnnLoading(false);
  };

  const handleAnnouncementImageChange = (e) => {
    const file = e.target.files[0];
    setAnnouncementImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnnouncementImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAnnouncementImagePreview(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        {/* Title inside the box */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: '#16C47F', // Set title color to green
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            mb: 3 // Add margin bottom
          }}
        >
          Announcement Management
        </Typography>
        
        <form onSubmit={handleAddAnnouncement}>
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={announcementDescription}
                onChange={(e) => setAnnouncementDescription(e.target.value)}
                required
              />
            </Grid>

            {/* Link and End Date in the same row */}
            <Grid item xs={12} container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Link (optional)"
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date (optional)"
                  value={announcementEndDate}
                  onChange={(e) => setAnnouncementEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: minDate }}
                />
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{ width: '100%' }}>
              {/* Image Preview Box */}
              <Box
                sx={{
                  width: 250, // Fixed width
                  height: 250, // Set height back to 250
                  border: '2px dashed #16C47F', // Green dashed border
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden', // Hide overflow if image is larger
                  mb: 2, // Margin bottom
                  mx: 'auto' // Center the box
                }}
              >
                {announcementImagePreview ? (
                  <img 
                    src={announcementImagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain' // Maintain aspect ratio
                    }} 
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Image Preview (250x250)
                  </Typography>
                )}
              </Box>
              {/* Choose File Button */}
              <Button
                component="label" // Use Button as a label for the file input
                variant="outlined" // Use outlined variant for a border
                startIcon={<i className="fas fa-upload"></i>} // Use an upload icon
                sx={{
                  borderRadius: 2,
                  px: { xs: 2, md: 3 },
                  py: { xs: 1, md: 1.5 },
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  borderColor: '#16C47F', // Green border color
                  color: '#16C47F', // Green text color
                  '&:hover': {
                    backgroundColor: 'rgba(22, 196, 127, 0.1)', // Light green hover background
                    borderColor: '#14a36f', // Darker green on hover
                    color: '#14a36f', // Darker green text on hover
                  },
                  minWidth: 200,
                  display: 'block', // Make button a block element to center
                  mx: 'auto' // Center the button
                }}
              >
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAnnouncementImageChange}
                  style={{ display: 'none' }} // Hide the default file input
                />
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<FaBullhorn />}
                  disabled={isAnnLoading}
                  sx={{
                    borderRadius: 2,
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, md: 1.5 },
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    boxShadow: 2,
                    backgroundColor: '#16C47F',
                    '&:hover': {
                      backgroundColor: '#14a36f',
                      boxShadow: 4
                    },
                    minWidth: 200
                  }}
                >
                  {isAnnLoading ? "Posting..." : "Add Announcement"}
                </Button>
              </Box>
            </Grid>

            {annError && (
              <Grid item xs={12}>
                <Typography color="error" sx={{ mt: 2 }}>
                  {annError}
                </Typography>
              </Grid>
            )}

            {annSuccess && (
              <Grid item xs={12}>
                {/* Success message removed, now handled by modal */}
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
      {showSuccessModal && (
        <div className="soloparent-modal-overlay">
          <div className="soloparent-success-modal">
            <div className="soloparent-success-content">
              <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#10b981', animation: 'pulse 1.5s infinite' }}></i>
              <p style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>{annSuccess || 'Announcement posted successfully!'}</p>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default AnnouncementManagement; 