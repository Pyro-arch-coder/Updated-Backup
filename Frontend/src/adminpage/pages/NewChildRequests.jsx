import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  TextField,
  Button,
  Chip,
  Modal,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast, Toaster } from 'react-hot-toast';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

export default function NewChildRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionResult, setActionResult] = useState({ open: false, type: '', message: '' });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Get admin's barangay from localStorage (adjust if you use context or API)
      const barangay = localStorage.getItem('barangay');
      if (!barangay) {
        toast.error('Barangay not found for admin.');
        setRequests([]);
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/newchildrequest/by-barangay`, {
        params: { barangay }
      });
      let requests = [];
      if (Array.isArray(res.data.requests)) {
        requests = res.data.requests.filter(r => r.status === 'Pending');
      }
      setRequests(requests);
    } catch (err) {
      toast.error('Failed to fetch requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const url = `${API_BASE_URL}/newchildrequest/${action}`;
      const res = await axios.post(url, { id });
      if (res.data && res.data.success) {
        // Show modal feedback
        setActionResult({
          open: true,
          type: action,
          message: action === 'approve' ? 'Request Approved' : 'Request Declined'
        });
        fetchRequests();
        handleCloseModal();
        // Auto-close modal after 1.5s
        setTimeout(() => {
          setActionResult({ open: false, type: '', message: '' });
        }, 1500);
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleView = (req) => {
    setSelectedRequest(req);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
  };

  const filtered = Array.isArray(requests) ? requests.filter(r => {
    const requester = (r.user_id + '').toLowerCase();
    const childName = `${r.first_name} ${r.middle_name || ''} ${r.last_name}`.toLowerCase();
    return (
      requester.includes(search.toLowerCase()) ||
      childName.includes(search.toLowerCase())
    );
  }) : [];

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
      <Toaster position="top-right" />
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: 1,
            mb: 2 
          }}>
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
              New Child Requests
            </Typography>
            {/* Optionally, add a button for future features */}
          </Box>
          <Box sx={{ mb: 3 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'row', sm: 'row' },
              gap: 1,
              alignItems: 'center',
            }}>
              <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 300 } }}>
                <TextField
                  fullWidth
                  placeholder="Search by requester or child name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16C47F'
                    },
                    fontSize: { xs: '0.8rem', sm: '1rem' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ 
                        color: '#16C47F',
                        fontSize: { xs: '1rem', md: '1.5rem' }
                      }} />
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }} aria-label="new child requests table">
            <TableHead>
              <TableRow sx={{ py: { xs: '0.5rem', sm: 1 } }}>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>#</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Code ID</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>No requests found.</TableCell>
                </TableRow>
              )}
              {paginated.map((req, idx) => (
                <TableRow
                  key={req.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(22, 196, 127, 0.05)'
                    },
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    py: { xs: 0.5, sm: 1 }
                  }}
                >
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{req.code_id}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.85rem' }, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#115293' }, minWidth: 60, px: 1.5, py: 0.5 }}
                      onClick={() => handleView(req)}
                    >
                      VIEW
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
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
      {/* Modal for viewing child request details */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', fontWeight: 600 }}>
          Child Request Details
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <Box sx={{ display: 'grid', gap: '16px', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Child Name</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{`${selectedRequest.first_name} ${selectedRequest.middle_name || ''} ${selectedRequest.last_name}`}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Birthdate</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedRequest.birthdate ? selectedRequest.birthdate.split('T')[0] : ''}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Age</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedRequest.age}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Educational Attainment</Typography>
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedRequest.educational_attainment}</Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Requested At</Typography>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedRequest.requested_at ? new Date(selectedRequest.requested_at).toLocaleString() : ''}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2, justifyContent: 'flex-end' }}>
                {selectedRequest.status === 'Pending' ? (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', fontSize: { xs: '0.8rem', sm: '1rem' }, backgroundColor: '#16C47F', '&:hover': { backgroundColor: '#14a36f' } }}
                      disabled={actionLoading[selectedRequest.id]}
                      onClick={() => handleAction(selectedRequest.id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', fontSize: { xs: '0.8rem', sm: '1rem' } }}
                      disabled={actionLoading[selectedRequest.id]}
                      onClick={() => handleAction(selectedRequest.id, 'decline')}
                    >
                      Decline
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">{selectedRequest.status}</Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Feedback Modal for Approve/Decline */}
      <Modal open={actionResult.open} onClose={() => setActionResult({ open: false, type: '', message: '' })} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 300 }}>
          {actionResult.type === 'approve' ? (
            <CheckCircleIcon sx={{ color: '#16C47F', fontSize: 64, mb: 2 }} />
          ) : actionResult.type === 'decline' ? (
            <CancelIcon sx={{ color: '#e53935', fontSize: 64, mb: 2 }} />
          ) : null}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{actionResult.message}</Typography>
        </Box>
      </Modal>
    </Box>
  );
} 