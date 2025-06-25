import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

// Import necessary Material-UI components and icons
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Import Material-UI icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const AdminManagement = () => {
  // Added hooks for responsiveness based on SoloParent.jsx
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [barangays, setBarangays] = useState([
    'All',
    'Adia', 'Bagong Pook', 'Bagumbayan', 'Bubucal', 'Cabooan',
    'Calangay', 'Cambuja', 'Coralan', 'Cueva', 'Inayapan',
    'Jose P. Laurel, Sr.', 'Jose P. Rizal', 'Juan Santiago',
    'Kayhacat', 'Macasipac', 'Masinao', 'Matalinting',
    'Pao-o', 'Parang ng Buho', 'Poblacion Dos',
    'Poblacion Quatro', 'Poblacion Tres', 'Poblacion Uno',
    'Talangka', 'Tungkod'
  ]);
  const [assignedBarangays, setAssignedBarangays] = useState(new Set());
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    barangay: ''
  });
  const [editUser, setEditUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (Array.isArray(users)) {
      const assigned = new Set(users.map(user => user.barangay));
      setAssignedBarangays(assigned);
    }
  }, [users]);

  const availableBarangays = barangays.filter(
    barangay => barangay === 'All' || !assignedBarangays.has(barangay)
  );

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/admins`);
      if (response.data && response.data.users && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
        console.log('Fetched users data:', response.data);
        console.log('Users state after fetch:', users); // Note: State updates are asynchronous, so this might not reflect immediately
      } else {
        setError('Received unexpected data format from server.');
        console.error('Unexpected data format from API:', response.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBarangayChange = (e) => {
    setSelectedBarangay(e.target.value);
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.barangay?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = selectedBarangay === 'All' || user.barangay === selectedBarangay;
    return matchesSearch && matchesBarangay;
  });

  console.log('Filtered users:', filteredUsers);

  // Debugging console logs for filtering
  if (Array.isArray(users)) {
    console.log('Debug: Filtering process for each user:');
    users.forEach(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.barangay?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBarangay = selectedBarangay === 'All' || user.barangay === selectedBarangay;
      console.log(`User: ${user.email || 'N/A'}, Search Term: '${searchTerm}', Selected Barangay: '${selectedBarangay}', Matches Search: ${matchesSearch}, Matches Barangay: ${matchesBarangay}, Include in Filtered: ${matchesSearch && matchesBarangay}`);
    });
  }

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort />;
    }
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === null) return 0;
    
    if (sortConfig.key === 'barangay') {
      if (sortConfig.direction === 'asc') {
        return a.barangay.localeCompare(b.barangay);
      }
      return b.barangay.localeCompare(a.barangay);
    }
    
    if (sortConfig.key === 'email') {
      if (sortConfig.direction === 'asc') {
        return a.email.localeCompare(b.email);
      }
      return b.email.localeCompare(a.email);
    }
    
    return 0;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  console.log('Paginated users (for table display):', paginatedUsers);

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleStatusChange = (userId, newStatus) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
    
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, status: newStatus }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    if (name === 'barangay') {
      const formattedBarangay = value.replace(/\s+/g, '');
      const capitalizedBarangay = formattedBarangay.charAt(0).toUpperCase() + formattedBarangay.slice(1).toLowerCase();
      setNewUser(prev => ({
        ...prev,
        barangay: value,
        email: `barangay${formattedBarangay.toLowerCase()}@gmail.com`,
        password: `${capitalizedBarangay}123@`
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/admins`, newUser);
      if (response.data && response.data.success) {
        setShowAddModal(false);
        setNewUser({
          email: '',
          password: '',
          barangay: ''
        });
        fetchUsers();
        setSuccessMessage('Admin added successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        setError(response.data.message || 'Failed to add admin.');
      }
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.response?.data?.message || 'Failed to add admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditUser({
      id: user.id,
      email: user.email,
      password: user.password,
      barangay: user.barangay
    });
    setError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setError(null);
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/admins/${editUser.id}`, editUser);
      if (response.data && response.data.success) {
        setShowEditModal(false);
        setEditUser(null);
        fetchUsers();
        setSuccessMessage('Admin updated successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        setError(response.data.message || 'Failed to update admin.');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update admin.');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'barangay') {
      const formattedBarangay = value.replace(/\s+/g, '');
      const capitalizedBarangay = formattedBarangay.charAt(0).toUpperCase() + formattedBarangay.slice(1).toLowerCase();
      setEditUser(prev => ({
        ...prev,
        barangay: value,
        email: `barangay${formattedBarangay.toLowerCase()}@gmail.com`,
        password: `${capitalizedBarangay}123@`
      }));
    } else {
      setEditUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
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
              Admin Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />}
              onClick={() => {
                setError(null);
                setShowAddModal(true);
              }}
              sx={{
                borderRadius: 2,
                px: { xs: 1, md: 3 },
                py: { xs: 0.5, md: 1.5 },
                minWidth: { xs: 36, sm: 0 },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.85rem', md: '1rem' },
                boxShadow: 2,
                backgroundColor: '#16C47F',
                width: 'auto',
                alignSelf: 'center',
                '&:hover': {
                  backgroundColor: '#14a36f',
                  boxShadow: 4
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Admin</Box>
            </Button>
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
                  placeholder="Search admins..."
                  value={searchTerm}
                  onChange={handleSearch}
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
              <Box sx={{ minWidth: { xs: 120, sm: 200 } }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    fontSize: { xs: '0.85rem', md: '1rem' }
                  }}>Filter by Barangay</InputLabel>
                  <Select
                    value={selectedBarangay}
                    onChange={handleBarangayChange}
                    label="Filter by Barangay"
                    sx={{
                      height: { xs: '32px', md: '48px' },
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
                    {barangays.map(barangay => (
                      <MenuItem 
                        key={barangay} 
                        value={barangay}
                        sx={{ 
                          fontSize: { xs: '0.85rem', md: '1rem' }
                        }}
                      >
                        {barangay === 'All' ? 'All Barangays' : barangay}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress sx={{ color: '#16C47F' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, overflowX: 'auto' }}>
              <Table sx={{ minWidth: 650 }} aria-label="admin management table">
                <TableHead>
                  <TableRow sx={{ py: { xs: 0.5, sm: 1 } }}>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>ID</TableCell>
                    <TableCell
                      onClick={() => handleSort('email')}
                      sx={{
                        cursor: 'pointer',
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        py: { xs: 0.5, sm: 1 },
                        '&:hover': {
                          backgroundColor: 'rgba(22, 196, 127, 0.1)'
                        }
                      }}
                    >
                      Email {getSortIcon('email')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('barangay')}
                      sx={{
                        cursor: 'pointer',
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        py: { xs: 0.5, sm: 1 },
                        '&:hover': {
                          backgroundColor: 'rgba(22, 196, 127, 0.1)'
                        }
                      }}
                    >
                      Barangay {getSortIcon('barangay')}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(22, 196, 127, 0.05)'
                        },
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        py: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{user.email}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{user.barangay}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                        <Button
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditClick(user)}
                          sx={{
                            backgroundColor: '#FFD600',
                            color: '#222',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: { xs: '0.8rem', sm: '1rem' },
                            '&:hover': { backgroundColor: '#FFC400' },
                            py: { xs: 0.5, sm: 1 },
                            px: { xs: 1, sm: 2 },
                            borderRadius: 2
                          }}
                          size="small"
                        >
                          <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit</Box>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {paginatedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                        No admins found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredUsers.length}
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
          </>
        )}

        <Dialog 
          open={showAddModal} 
          onClose={() => {
            setError(null);
            setShowAddModal(false);
            setNewUser({ email: '', password: '', barangay: '' });
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#16C47F',
            color: 'white',
            fontWeight: 600
          }}>
            Add New Admin
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleAddUser} sx={{ mt: 2 }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2
                  }}
                >
                  {error}
                </Alert>
              )}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16C47F'
                    }
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16C47F'
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControl 
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
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
                    '& .MuiSvgIcon-root': {
                      color: '#16C47F'
                    }
                  }}
                >
                  <InputLabel>Barangay</InputLabel>
                  <Select
                    name="barangay"
                    value={newUser.barangay}
                    onChange={handleNewUserChange}
                    required
                    label="Barangay"
                  >
                    <MenuItem value="" disabled>
                      Select Barangay
                    </MenuItem>
                    {availableBarangays.filter(b => b !== 'All').map(barangay => (
                      <MenuItem key={barangay} value={barangay}>
                        {barangay}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                  Note: Email and password will be automatically generated once you select a barangay.
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => {
                setError(null);
                setShowAddModal(false);
                setNewUser({ email: '', password: '', barangay: '' });
              }}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                color: '#16C47F',
                '&:hover': {
                  backgroundColor: 'rgba(22, 196, 127, 0.1)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleAddUser}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#16C47F',
                '&:hover': {
                  backgroundColor: '#14a36f'
                }
              }}
            >
              Add Admin
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showEditModal} 
          onClose={() => {
            setError(null);
            setShowEditModal(false);
            setEditUser(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#16C47F',
            color: 'white',
            fontWeight: 600
          }}>
            Edit Admin
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleEditSubmit} sx={{ mt: 2 }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2
                  }}
                >
                  {error}
                </Alert>
              )}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={editUser?.email}
                  onChange={handleEditChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16C47F'
                    }
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={editUser?.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16C47F'
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16C47F'
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControl
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
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
                    '& .MuiSvgIcon-root': {
                      color: '#16C47F'
                    }
                  }}
                >
                </FormControl>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => {
                setError(null);
                setShowEditModal(false);
                setEditUser(null);
              }}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                color: '#16C47F',
                '&:hover': {
                  backgroundColor: 'rgba(22, 196, 127, 0.1)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleEditSubmit}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#16C47F',
                '&:hover': {
                  backgroundColor: '#14a36f'
                }
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showModal} 
          onClose={() => setShowModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#16C47F',
            color: 'white',
            fontWeight: 600
          }}>
            Admin Details
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedUser?.email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Barangay
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedUser?.barangay}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setShowModal(false)}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                color: '#16C47F',
                '&:hover': {
                  backgroundColor: 'rgba(22, 196, 127, 0.1)'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
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
    </Box>
  );
};

export default AdminManagement;