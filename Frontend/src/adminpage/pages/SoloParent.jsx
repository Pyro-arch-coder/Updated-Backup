import React, { useState, useEffect } from 'react';
import './SoloParent.css';
import axios from 'axios';
import { useContext } from 'react';
import { AdminContext } from '../../contexts/AdminContext';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const SoloParent = () => {
  const [soloParents, setSoloParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [parentsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { adminId, setAdminId } = useContext(AdminContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get adminId from localStorage if not in context
        const storedAdminId = localStorage.getItem('adminId') || localStorage.getItem('id');
        if (storedAdminId) {
          setAdminId(storedAdminId);
          await fetchVerifiedUsers(storedAdminId);
        } else {
          setError('Admin ID not found. Please log in again.');
        }
      } catch (err) {
        setError('Error fetching data. Please try again.');
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setAdminId, selectedStatus]);

  const fetchVerifiedUsers = async (currentAdminId) => {
    try {
      setIsLoading(true);
      let url = `${API_BASE_URL}/verifiedUsers/${currentAdminId}`;
      if (selectedStatus !== 'all') {
        url += `?status=${selectedStatus}`;
      }
      const response = await axios.get(url);
      setSoloParents(response.data || []);
    } catch (err) {
      setError('Error fetching verified users');
      console.error('Fetch verified users error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openRevokeModal = (parent) => {
    setSelectedParent(parent);
    setShowRevokeModal(true);
  };

  const closeModal = () => {
    setSelectedParent(null);
    setRemarks("");
    setShowRevokeModal(false);
  };

  const handleRevoke = async () => {
    if (!selectedParent || !remarks.trim()) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/saveRemarks`, {
        code_id: selectedParent.code_id,
        remarks: remarks,
        user_id: selectedParent.userId,
        admin_id: adminId
      });

      if (response.data) {
        // Wait for a short delay to ensure database update is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh the list with the current admin ID
        await fetchVerifiedUsers(adminId);
        closeModal();
        setSuccessMessage('Remarks saved successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        throw new Error('Failed to save remarks');
      }
    } catch (err) {
      console.error('Error saving remarks:', err);
      alert('Failed to save remarks. Please try again.');
    }
  };

  const filteredParents = soloParents.filter(parent => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (parent.userId && parent.userId.toString().includes(searchLower)) ||
      (parent.code_id && parent.code_id.toLowerCase().includes(searchLower)) ||
      (parent.first_name && parent.first_name.toLowerCase().includes(searchLower)) ||
      (parent.email && parent.email.toLowerCase().includes(searchLower)) ||
      (parent.age && parent.age.toString().includes(searchLower))
    );
  });

  const paginatedParents = filteredParents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (isLoading) {
    return (
      <div className="soloparent-container">
        <div className="loading">Loading verified solo parents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="soloparent-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!adminId) {
    return (
      <div className="soloparent-container">
        <div className="error">Admin session expired. Please login again.</div>
      </div>
    );
  }

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 2
          }}>
            <Box>
              <h2 style={{
                fontWeight: 600,
                color: '#16C47F',
                fontSize: '2rem',
                margin: 0
              }}>Solo Parent Management</h2>
            </Box>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <Box sx={{ minWidth: { xs: 120, sm: 200 } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    label="Status"
                    sx={{
                      height: { xs: '32px', md: '40px' },
                      fontSize: { xs: '0.85rem', md: '1rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#16C47F'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#16C47F'
                        }
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#16C47F'
                      }
                    }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Verified">Verified</MenuItem>
                    <MenuItem value="Pending Remarks">Pending Remarks</MenuItem>
                    <MenuItem value="Terminated">Terminated</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 300 } }}>
                <TextField
                  fullWidth
                  placeholder="Search solo parents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: { xs: '32px', md: '40px' },
                      fontSize: { xs: '0.8rem', sm: '1rem' },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16C47F'
                    },
                    fontSize: { xs: '0.8rem', sm: '1rem' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#16C47F', fontSize: { xs: '1rem', md: '1.5rem' } }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="solo parent table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>ID</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Code ID</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Name</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Email</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Category</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Status</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedParents.map((parent, index) => (
                <TableRow
                  key={index}
                  className={parent.status === "Terminated" ? "terminated-row" : ""}
                  sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                >
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{parent.code_id}</TableCell>
                  <TableCell>{`${parent.first_name} ${parent.middle_name ? parent.middle_name[0] + '.' : ''} ${parent.last_name}${parent.suffix && parent.suffix !== 'none' ? ` ${parent.suffix}` : ''}`}</TableCell>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>{parent.classification}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${parent.status.toLowerCase()}`}>{parent.status}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => openRevokeModal(parent)}
                      disabled={parent.status === "Unverified" || parent.status === "Pending Remarks" || parent.status === "Terminated"}
                      title={
                        parent.status === "Terminated" ? "User is already terminated" :
                        parent.status === "Pending Remarks" ? "User is under investigation" :
                        parent.status === "Unverified" ? "User is not verified" : ""
                      }
                      sx={{ minWidth: 90 }}
                    >
                      <i className="fas fa-ban"></i> Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedParents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No solo parents found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredParents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
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
        </TableContainer>
        {/* Revoke Verification Modal */}
        {showRevokeModal && selectedParent && (
          <div className="solo-parent-modal-overlay" onClick={closeModal}>
            <div className="solo-parent-modal solo-parent-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="solo-parent-modal-header">
                <h3>Add Remarks</h3>
              </div>
              <div className="solo-parent-modal-content compact">
                <div className="details-grid compact">
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">
                      {`${selectedParent.first_name} ${selectedParent.middle_name || ''} ${selectedParent.last_name}${selectedParent.suffix && selectedParent.suffix !== 'none' ? ` ${selectedParent.suffix}` : ''}`}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Code ID:</span>
                    <span className="value">{selectedParent.code_id}</span>
                  </div>
                </div>
                <div className="remarks-section compact">
                  <label>Add remarks:</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter remarks here"
                    rows="3"
                    className="compact-textarea"
                  />
                </div>
              </div>
              <div className="solo-parent-modal-footer">
                <button 
                  className="btn view-btn" 
                  onClick={handleRevoke}
                  disabled={!remarks.trim()}
                >
                  Save Remarks
                </button>
                <button className="btn decline-btn" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showSuccessModal && (
          <div className="soloparent-modal-overlay">
            <div className="soloparent-success-modal">
              <div className="soloparent-success-content">
                <CheckCircleIcon style={{ fontSize: '4rem', color: '#10b981', animation: 'pulse 1.5s infinite' }} />
                <p style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>{successMessage}</p>
              </div>
            </div>
          </div>
        )}
      </Paper>
    </Box>
  );
};

export default SoloParent;
