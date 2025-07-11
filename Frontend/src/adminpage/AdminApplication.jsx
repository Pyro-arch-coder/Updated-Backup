import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { ArrowUpward, ArrowDownward, UnfoldMore } from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function AdminApplication() {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [modalType, setModalType] = useState('');
  const [stepPage, setStepPage] = useState(1);
  const [touchStart, setTouchStart] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [confirmModalType, setConfirmModalType] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pendingUsersAdmin`);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Error fetching applications. Please refresh the page.');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <UnfoldMore sx={{ fontSize: '1rem', opacity: 0.5, verticalAlign: 'middle' }} />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUpward sx={{ fontSize: '1rem', verticalAlign: 'middle' }} /> 
      : <ArrowDownward sx={{ fontSize: '1rem', verticalAlign: 'middle' }} />;
  };

  const handleBarangayChange = (e) => {
    setSelectedBarangay(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openModal = (application) => {
    setSelectedApplication(application);
    setStepPage(1);
    setModalType('view');
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setModalType("");
  };

  const adminBarangay = localStorage.getItem('barangay') || '';

  const filteredApplications = applications.filter(app => {
    // Debug: log approval and status for each application
    console.log('APP:', app.code_id, 'approval:', app.approval, 'status:', app.status);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (app.id && app.id.toString().includes(searchLower)) ||
      (app.code_id && app.code_id.toLowerCase().includes(searchLower)) ||
      (app.first_name && app.first_name.toLowerCase().includes(searchLower)) ||
      (app.email && app.email.toLowerCase().includes(searchLower)) ||
      (app.barangay && app.barangay.toLowerCase().includes(searchLower)) ||
      (app.age && app.age.toString().includes(searchLower));
    const matchesBarangay = app.barangay && app.barangay.toLowerCase() === adminBarangay.toLowerCase();

    // Hide if approval is 'Approved' or status is 'Declined'
    const notApprovedOrDeclined = app.approval !== 'Approved' && app.status !== 'Declined';

    return matchesSearch && matchesBarangay && notApprovedOrDeclined;
  });

  const sortedApplications = useMemo(() => {
    let sortableItems = [...filteredApplications];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredApplications, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = touchStart.y - touch.clientY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && stepPage < 6) {
        setStepPage(prev => prev + 1);
      } else if (deltaX < 0 && stepPage > 1) {
        setStepPage(prev => prev - 1);
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const handleAction = async (action) => {
    if (!selectedApplication) return;
    try {
      if (action === "Decline" && !remarks.trim()) {
        alert("Please provide remarks for declining.");
        return;
      }
      if (action === "Accept") {
        // Call the new endpoint for admin approval
        const response = await axios.post(`${API_BASE_URL}/updateUserStatusAdmin`, {
          code_id: selectedApplication.code_id,
          approval: 'Approved'
        });
        if (response.status === 200) {
          alert("Application marked as approved (admin approval only)!");
          await fetchApplications();
          setRemarks("");
          closeModal();
        }
      } else if (action === "Decline") {
        // Decline still uses the old endpoint for status + email
        const payload = {
          code_id: selectedApplication.code_id,
          status: "Declined",
          remarks: remarks.trim() || "No remarks provided",
          action: action,
          updateDocumentStatus: false,
          documentType: selectedApplication.document_type,
          documentStatus: "Declined",
          email: selectedApplication.email,
          firstName: selectedApplication.first_name,
          approval: "Declined"
        };
        const response = await axios.post(`${API_BASE_URL}/updateUserStatus`, payload);
        if (response.status === 200) {
          alert("Application declined and email notification sent!");
          await fetchApplications();
          setRemarks("");
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      alert(`Error updating application status: ${errorMessage}. Please try again.`);
    }
  };

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              color: '#16C47F',
              fontSize: { xs: '1.1rem', sm: '1.75rem', md: '2rem' },
              textAlign: 'left',
              width: 'auto'
            }}
          >
            Applications
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mt: 2 }}>
            <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 300 } }}>
              <TextField
                fullWidth
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    height: { xs: '32px', md: '48px' },
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#16C47F'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#16C47F'
                    }
                  },
                  fontSize: { xs: '0.8rem', sm: '1rem' }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ 
                        color: '#16C47F',
                        fontSize: { xs: '1rem', md: '1.5rem' }
                      }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table stickyHeader aria-label="applications table">
            <TableHead>
              <TableRow sx={{ py: { xs: 0.5, sm: 1 } }}>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>ID</TableCell>
                <TableCell onClick={() => handleSort('code_id')} sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 }, '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>
                  Code ID {getSortIcon('code_id')}
                </TableCell>
                <TableCell onClick={() => handleSort('first_name')} sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 }, '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>
                  Name {getSortIcon('first_name')}
                </TableCell>
                <TableCell onClick={() => handleSort('barangay')} sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 }, '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>
                  Barangay {getSortIcon('barangay')}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedApplications
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={index} sx={{ '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.05)' }, fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{item.code_id}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{`${item.first_name || ''} ${item.middle_name || ''} ${item.last_name || ''}${item.suffix && item.suffix !== 'none' ? ` ${item.suffix}` : ''}`}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{item.barangay || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                      <Button variant="contained" size="small" onClick={() => openModal(item)} sx={{ mr: 1 }}>
                        <i className="fas fa-eye" style={{marginRight: '8px'}}></i> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={sortedApplications.length}
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
      {/* Step-by-step View Details Modal */}
      <Dialog 
        open={modalType === "view" && !!selectedApplication} 
        onClose={closeModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Application Details (Step {stepPage}/6)
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {[1, 2, 3, 4, 5, 6].map(step => (
              <Box
                key={step}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: stepPage === step ? 'primary.main' : 'grey.400',
                  mx: 0.5,
                  cursor: 'pointer'
                }}
                onClick={() => setStepPage(step)}
              />
            ))}
          </Box>
          {selectedApplication && (
            <>
              {stepPage === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>Personal Information</Typography>
                  <Box sx={{ p: 2, mt: 1, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                    <Box sx={{
                      display: 'grid',
                      gap: '16px',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                      }
                    }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Name</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{`${selectedApplication.first_name || ''} ${selectedApplication.middle_name || ''} ${selectedApplication.last_name || ''}${selectedApplication.suffix && selectedApplication.suffix !== 'none' ? ` ${selectedApplication.suffix}` : ''}`}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Age</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.age || ''}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Gender</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.gender || ''}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Date of Birth</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatDate(selectedApplication.date_of_birth)}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Place of Birth</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.place_of_birth}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Barangay</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.barangay}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Email</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.email}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Contact Number</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.contact_number}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Education</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.education}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Occupation</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.occupation}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Company</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.company}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Income</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.income}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Employment Status</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.employment_status}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Civil Status</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.civil_status}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Pantawid Beneficiary</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.pantawid_beneficiary}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Indigenous</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.indigenous}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Religion</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.religion}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              {stepPage === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>Family Information</Typography>
                  <Box sx={{ p: 2, mt: 1, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                    {selectedApplication.familyMembers && selectedApplication.familyMembers.length > 0 ? (
                      selectedApplication.familyMembers.map((member, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2, '&:last-child': { mb: 0 } }}>
                          <Typography variant="subtitle1" gutterBottom>Family Member {index + 1}</Typography>
                          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary">Name</Typography>
                              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{member.family_member_name}</Typography>
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary">Birthdate</Typography>
                              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatDate(member.birthdate)}</Typography>
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary">Age</Typography>
                              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{member.age}</Typography>
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary">Educational Attainment</Typography>
                              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{member.educational_attainment}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ textAlign: 'center' }}>No family members information available.</Typography>
                    )}
                  </Box>
                </Box>
              )}
              {stepPage === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>Classification</Typography>
                  <Box sx={{ p: 2, mt: 1, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Type</Typography>
                      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.classification}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              {stepPage === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>Needs/Problems</Typography>
                  <Box sx={{ p: 2, mt: 1, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Details</Typography>
                      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.needs_problems}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              {stepPage === 5 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>Emergency Contact</Typography>
                  <Box sx={{ p: 2, mt: 1, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Name</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.emergency_name}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Relationship</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.emergency_relationship}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Address</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.emergency_address}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Contact Number</Typography>
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 56, overflowWrap: 'break-word' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedApplication.emergency_contact}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              {stepPage === 6 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>Documents</Typography>
                  <Box sx={{ p: 2, mt: 1, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                    {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                      <Box sx={{ maxHeight: 500, overflowY: 'auto', p: 1 }}>
                        {selectedApplication.documents.map((doc, index) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Paper elevation={2} sx={{ p: 2, textAlign: 'center', mb: 2, width: '100%', maxWidth: '450px' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {doc.document_type ? doc.document_type.replace('_documents', '').toUpperCase() : 'Document'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: doc.status === 'Approved' ? 'success.main' : doc.status === 'Declined' ? 'error.main' : 'text.secondary' }}>
                                  {doc.status}
                                </Typography>
                              </Box>
                              {doc.file_url ? (
                                <Box
                                  component="img"
                                  sx={{
                                    height: 200,
                                    width: '100%',
                                    objectFit: 'contain',
                                    cursor: 'pointer',
                                    mb: 1
                                  }}
                                  alt={doc.display_name}
                                  src={doc.file_url} 
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Image+Not+Found";
                                  }}
                                />
                              ) : (
                                <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: '4px', textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <Typography variant="body2">Document not yet submitted</Typography>
                                </Box>
                              )}
                            </Paper>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ textAlign: 'center' }}>No documents available.</Typography>
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            {stepPage > 1 && (
              <Button onClick={() => setStepPage(stepPage - 1)}>
                Previous
              </Button>
            )}
          </Box>
          <Box>
            {stepPage < 6 && (
              <Button variant="contained" onClick={() => setStepPage(stepPage + 1)}>
                Next
              </Button>
            )}
            {stepPage === 6 && (
              <>
                <Button variant="contained" color="success" onClick={() => setConfirmModalType('accept')} sx={{ mr: 1 }}>
                  Accept
                </Button>
                <Button variant="contained" color="error" onClick={() => setConfirmModalType('decline')}>
                  Decline
                </Button>
              </>
            )}
          </Box>
        </DialogActions>
      </Dialog>
      {/* Accept Confirmation Modal */}
      <Dialog open={confirmModalType === 'accept'} onClose={() => setConfirmModalType("")}> 
        <DialogTitle>Confirm Acceptance</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to accept this application?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModalType("")}>Cancel</Button>
          <Button onClick={() => handleAction("Accept") } color="success" variant="contained">
            Yes, Accept
          </Button>
        </DialogActions>
      </Dialog>
      {/* Decline Modal */}
      <Dialog open={confirmModalType === 'decline'} onClose={() => setConfirmModalType("")} fullWidth maxWidth="sm">
        <DialogTitle>Decline Application</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Please provide remarks for declining"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModalType("")}>Cancel</Button>
          <Button onClick={() => handleAction("Decline") } color="error" variant="contained">
            Confirm Decline
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminApplication; 