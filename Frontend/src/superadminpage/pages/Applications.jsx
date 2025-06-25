import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Grid,
  Typography,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { ArrowUpward, ArrowDownward, UnfoldMore } from '@mui/icons-material';

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const Applications = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(''); // State for tabs
  const [modalType, setModalType] = useState(''); // State for modals
  const [documentActionStatus, setDocumentActionStatus] = useState({}); // { [docIndex]: 'Accepted' | 'Declined' | undefined }

  const [applications, setApplications] = useState([]);
  const [missingDocuments, setMissingDocuments] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [remarks, setRemarks] = useState("");
const [acceptAllLoading, setAcceptAllLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stepPage, setStepPage] = useState(1); // Pagination for steps
  const [isTableScrollable, setIsTableScrollable] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const tableContainerRef = useRef(null);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [barangays] = useState([
    'All',
    'Adia', 'Bagong Pook', 'Bagumbayan', 'Bubucal', 'Cabooan',
    'Calangay', 'Cambuja', 'Coralan', 'Cueva', 'Inayapan',
    'Jose P. Laurel, Sr.', 'Jose P. Rizal', 'Juan Santiago',
    'Kayhacat', 'Macasipac', 'Masinao', 'Matalinting',
    'Pao-o', 'Parang ng Buho', 'Poblacion Dos',
    'Poblacion Quatro', 'Poblacion Tres', 'Poblacion Uno',
    'Talangka', 'Tungkod'
  ]);

  // New state for classification dropdown
  const [classificationOptions] = useState([
    { code: "001", label: "Birth due to rape" },
    { code: "002", label: "Death of spouse" },
    { code: "003", label: "Detention of spouse" },
    { code: "004", label: "Spouse's incapacity" },
    { code: "005", label: "Legal separation" },
    { code: "006", label: "Annulled marriage" },
    { code: "007", label: "Abandoned by spouse" },
    { code: "008", label: "OFW's family member" },
    { code: "009", label: "Unmarried parent" },
    { code: "010", label: "Legal guardian" },
    { code: "011", label: "Relative caring for child" },
    { code: "012", label: "Pregnant woman solo caregiver" },
  ]);
  const [selectedClassification, setSelectedClassification] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (activeTab === "followup") {
      fetchMissingDocuments();
    } else {
      fetchApplications();
    }
    checkTableScroll();
    window.addEventListener('resize', checkTableScroll);
    return () => window.removeEventListener('resize', checkTableScroll);
  }, [activeTab]);

  const checkTableScroll = () => {
    if (tableContainerRef.current) {
      const { scrollWidth, clientWidth } = tableContainerRef.current;
      setIsTableScrollable(scrollWidth > clientWidth);
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pendingUsers`);
      
      // Log the response to check data structure
      console.log('Fetched Applications:', response.data);
      
      // Check if documents are included in the response
      if (response.data.length > 0) {
        console.log('Sample documents data:', response.data[0].documents || 'No documents');
      }
      
      // Ensure each application has the correct userId field
      const formattedData = response.data.map(app => {
        // Make sure we keep the userId from the database response
        return {
          ...app,
          userId: app.userId, // Keep the original userId from the database
        };
      });
      
      setApplications(formattedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Error fetching applications. Please refresh the page.');
    }
  };

  const fetchMissingDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/documents/follow_up_documents`);
      // Group documents by code_id
      const groupedDocuments = response.data.reduce((acc, doc) => {
        if (!acc[doc.code_id]) {
          acc[doc.code_id] = {
            id: doc.id,
            code_id: doc.code_id,
            documents: []
          };
        }
        acc[doc.code_id].documents.push({
          document_type: doc.document_type, // comes from backend SQL alias
          file_name: doc.file_name,         // ensure this is included for update
          status: doc.status,
          follow_up_date: doc.follow_up_date,
          file_url: doc.file_url,
          display_name: doc.display_name
        });
        return acc;
      }, {});
      
      // Convert to array
      const documentsList = Object.values(groupedDocuments);
      setMissingDocuments(documentsList);
    } catch (error) {
      console.error('Error fetching missing documents:', error);
      alert('Error fetching missing documents. Please refresh the page.');
    }
  };

  const openModal = (application, type) => {
    setSelectedApplication(application);
    setStepPage(1);
    setRemarks("");
    
    if (activeTab === "followup") {
      // For follow-up documents, use specific modal types
      if (type === "confirmAccept") {
        setModalType("followupConfirmAccept");
      } else if (type === "decline") {
        setModalType("followupDecline");
      } else if (type === "viewDocuments") {
        setModalType("followupViewDocuments");
      }
    } else {
      setModalType(type);
    }

    if (application.classification && !/^(00[1-9]|0[1-9][0-9]|1[01][0-2])$/.test(application.classification)) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
    if (window.innerWidth > 768) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setSelectedFollowup(null);
    setDocumentActionStatus({});
    setRemarks("");
    setModalType(""); // Just close the modal
    document.body.style.overflow = 'auto';
  };

  const handleAction = async (action) => {
    if (!selectedApplication) return;
    
    try {
      if (action === "Decline" && !remarks.trim()) {
        alert("Please provide remarks for declining.");
        return;
      }
  
      console.log('User email:', selectedApplication.email);
  
      const response = await axios.post(`${API_BASE_URL}/updateUserStatus`, {
        code_id: selectedApplication.code_id,
        status: action === "Accept" ? "Created" : "Declined",
        remarks: remarks.trim() || "No remarks provided",
        email: selectedApplication.email,
        firstName: selectedApplication.first_name,
        action: action,
        updateDocumentStatus: action === "Accept" ? true : false,
        documentType: selectedApplication.document_type,
        documentStatus: action === "Accept" ? "Approved" : "Declined"
      });
  
      if (response.status === 200) {
        const message = action === "Accept" 
          ? "Application accepted and email notification sent! Documents status updated to Approved." 
          : "Application declined and email notification sent!";
        
        if (action === "Accept") {
          const tempApplication = { ...selectedApplication }; // Store application data
          alert(message);
          await fetchApplications();
          setRemarks("");
          closeModal();
          setSelectedApplication(tempApplication); // Restore application data
          setShowBeneficiaryModal(true);
        } else {
          alert(message);
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
  const handleBeneficiaryStatus = async (status) => {
    try {
      if (!selectedApplication || !selectedApplication.code_id) {
        alert('Error: Application data is missing');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/update-beneficiary-status`, {
        code_id: selectedApplication.code_id,
        status: status
      });
  
      if (response.data.success) {
        setShowBeneficiaryModal(false);
        alert('Application accepted and beneficiary status updated successfully!');
        await fetchApplications(); // Refresh the applications list
      } else {
        throw new Error(response.data.error || 'Failed to update beneficiary status');
      }
    } catch (error) {
      console.error('Error updating beneficiary status:', error);
      alert(`Error updating beneficiary status: ${error.response?.data?.error || error.message}`);
    }
  };
  // Accept All Follow-up Documents
  const handleAcceptAllFollowups = async () => {
    if (!selectedApplication || !selectedApplication.documents) return;
    const docsToAccept = selectedApplication.documents.filter(doc => doc.status !== 'Approved');
    if (docsToAccept.length === 0) {
      alert('All documents are already approved.');
      return;
    }
    setAcceptAllLoading(true);
    let successCount = 0;
    let failCount = 0;
    for (const doc of docsToAccept) {
      try {
        const response = await axios.post(`${API_BASE_URL}/updateDocumentStatus`, {
          document_type: doc.document_type,
          file_name: doc.file_name,
          status: 'Approved',
          rejection_reason: ''
        });
        if (response.status === 200) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error approving document:', doc, error);
        failCount++;
      }
    }
    await fetchMissingDocuments();
    setAcceptAllLoading(false);
    closeModal();
    alert(`Accepted ${successCount} document(s). ${failCount > 0 ? failCount + ' failed.' : ''}`);
  };

  // New function for handling follow-up document actions
  const handleFollowupAction = async (action) => {
    if (!selectedFollowup) return;

    // Debug: log selectedFollowup
    console.log('selectedFollowup in handleFollowupAction:', selectedFollowup);

    // Ensure required fields are present
    const { document_type, file_name } = selectedFollowup;
    if (!document_type || !file_name) {
      alert('Error: Missing document_type or file_name');
      return;
    }

    try {
      // For decline action, check if remarks are provided
      if (action === "Decline" && !remarks.trim()) {
        alert("Please provide remarks for declining.");
        return;
      }

      const status = action === "Accept" ? "Approved" : "Declined";
      const rejection_reason = remarks.trim() || "No remarks provided";

      console.log('Sending request with:', {
        document_type,
        file_name,
        status,
        rejection_reason
      });

      const response = await axios.post(`${API_BASE_URL}/updateDocumentStatus`, {
        document_type,
        file_name,
        status,
        rejection_reason
      });

      if (response.status === 200) {
        alert(action === "Accept" ? "Document accepted successfully!" : "Document declined successfully!");
        await fetchMissingDocuments();
        closeModal();
        setRemarks("");
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleClassificationUpdate = async () => {
    if (selectedClassification) {
      console.log('Sending code_id:', selectedApplication.code_id); // Log the code_id
      try {
        const response = await axios.post(`${API_BASE_URL}/pendingUsers/updateClassification`, {
          code_id: selectedApplication.code_id,
          classification: selectedClassification,
        });
        if (response.status === 200) {
          alert('Classification updated successfully!');
          // Update the selected application classification directly
          setSelectedApplication(prev => ({ ...prev, classification: selectedClassification }));
        }
      } catch (error) {
        console.error('Error updating classification:', error);
        alert('Error updating classification. Please try again.');
      }
    } else {
      alert('Please select a classification.');
    }
  };

  const filteredApplications = activeTab === "followup" 
    ? missingDocuments.filter(doc => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (doc.id && doc.id.toString().includes(searchLower)) ||
          (doc.code_id && doc.code_id.toLowerCase().includes(searchLower))
        );
      })
    : applications.filter(app => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (app.id && app.id.toString().includes(searchLower)) ||
          (app.code_id && app.code_id.toLowerCase().includes(searchLower)) ||
          (app.first_name && app.first_name.toLowerCase().includes(searchLower)) ||
          (app.email && app.email.toLowerCase().includes(searchLower)) ||
          (app.barangay && app.barangay.toLowerCase().includes(searchLower)) ||
          (app.age && app.age.toString().includes(searchLower));

        const matchesBarangay = selectedBarangay === 'All' || app.barangay === selectedBarangay;
        
        return matchesSearch && matchesBarangay;
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

  // Add touch event handlers for mobile swipe
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = touchStart.y - touch.clientY;

    // If horizontal swipe is greater than vertical and more than 50px
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
            <Box sx={{ minWidth: { xs: 120, sm: 200 } }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Filter by Barangay</InputLabel>
                <Select
                  value={selectedBarangay}
                  onChange={handleBarangayChange}
                  label="Filter by Barangay"
                  sx={{
                    height: { xs: '32px', md: '48px' },
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {},
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#16C47F',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#16C47F',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#16C47F'
                    }
                  }}
                >
                  {barangays.map((barangay) => (
                    <MenuItem key={barangay} value={barangay} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                      {barangay === 'All' ? 'All Barangays' : barangay}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="application tabs"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#16C47F',
              },
              '& .Mui-selected': {
                color: '#16C47F !important',
                fontWeight: 'bold',
              }
            }}
          >
            <Tab label="Applications" value="" />
            <Tab label="Follow-up Documents" value="followup" />
          </Tabs>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table stickyHeader aria-label="applications table">
            <TableHead>
              <TableRow sx={{ py: { xs: 0.5, sm: 1 } }}>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>ID</TableCell>
                {activeTab === "" ? (
                  <>
                    <TableCell onClick={() => handleSort('code_id')} sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 }, '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>
                      Code ID {getSortIcon('code_id')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('first_name')} sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 }, '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>
                      Name {getSortIcon('first_name')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('barangay')} sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 }, '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>
                      Barangay {getSortIcon('barangay')}
                    </TableCell>
                </>
              ) : (
                  <TableCell onClick={() => handleSort('code_id')} sx={{ cursor: 'pointer', fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 }, '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>
                    Code ID {getSortIcon('code_id')}
                  </TableCell>
                )}
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedApplications
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={index} sx={{ '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.05)' }, fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{page * rowsPerPage + index + 1}</TableCell>
                    {activeTab === "" ? (
                      <>
                        <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{item.code_id}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{`${item.first_name || ''} ${item.middle_name || ''} ${item.last_name || ''}${item.suffix && item.suffix !== 'none' ? ` ${item.suffix}` : ''}`}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{item.barangay || 'N/A'}</TableCell>
                  </>
                ) : (
                      <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{item.code_id}</TableCell>
                    )}
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                      {activeTab === "" ? (
                        <>
                          <Button variant="contained" size="small" onClick={() => openModal(item, "view")} sx={{ mr: 1 }}>
                            <i className="fas fa-eye" style={{marginRight: '8px'}}></i> View
                          </Button>
                    </>
                  ) : (
                    <>
                          <Button variant="contained" size="small" onClick={() => openModal(item, "viewDocuments") }>
                            <i className="fas fa-eye" style={{marginRight: '8px'}}></i> View Documents
                          </Button>
                    </>
                  )}
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

      {/* PAGINATED VIEW DETAILS MODAL */}
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
                    {showDropdown && (
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Select Classification</InputLabel>
                          <Select
                        onChange={(e) => setSelectedClassification(e.target.value)}
                            label="Select Classification"
                      >
                        {classificationOptions.map(option => (
                              <MenuItem key={option.code} value={option.code}>
                            {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button variant="contained" onClick={handleClassificationUpdate} sx={{ mt: 1 }}>
                          Update Classification
                        </Button>
                      </Box>
                    )}
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
                                <>
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
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="success"
                                      size="small"
                                      onClick={() => {
                                  setSelectedFollowup(doc);
                                  setModalType("followupConfirmAccept");
                                }}
                              >
                                      Accept
                                    </Button>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="error"
                                      size="small"
                                      onClick={() => {
                                  setSelectedFollowup(doc);
                                  setModalType("followupDecline");
                                }}
                              >
                                      Decline
                                    </Button>
                                  </Box>
                                </>
                              ) : (
                                <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: '4px', textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <Typography variant="body2">Document not yet submitted</Typography>
                                  {doc.follow_up_date && (
                                    <Typography variant="caption" color="textSecondary">
                                      Follow-up date: {new Date(doc.follow_up_date).toLocaleDateString()}
                                    </Typography>
                                  )}
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
                {stepPage < 6 ? (
              <Button variant="contained" onClick={() => setStepPage(stepPage + 1)}>
                Next
              </Button>
            ) : (
              <Box>
                <Button variant="contained" color="success" onClick={() => handleAction("Accept")} sx={{ mr: 1 }}>
                  Accept
                </Button>
                <Button variant="contained" color="error" onClick={() => openModal(selectedApplication, 'decline')}>
                  Decline
                </Button>
              </Box>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog open={modalType === "confirmAccept" && !!selectedApplication} onClose={closeModal}>
        <DialogTitle>Confirm Acceptance</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to accept this application?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={() => handleAction("Accept")} color="success" variant="contained">
            Yes, Accept
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={modalType === "decline" && !!selectedApplication} onClose={closeModal} fullWidth maxWidth="sm">
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
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={() => handleAction("Decline")} color="error" variant="contained">
            Confirm Decline
          </Button>
        </DialogActions>
      </Dialog>

      {/* Follow-up Documents View Modal */}
      <Dialog open={modalType === "followupViewDocuments" && !!selectedApplication} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogTitle>
          Follow-up Documents
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedApplication && selectedApplication.documents && (
            <Box sx={{ p: 2, mt: 1, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
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
                            <>
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
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => {
                                    setSelectedFollowup(doc);
                                    setModalType("followupConfirmAccept");
                                  }}
                                >
                              Accept
                            </Button>
                            <Button
                              fullWidth
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => {
                                    setSelectedFollowup(doc);
                                    setModalType("followupDecline");
                                  }}
                                >
                              Decline
                            </Button>
                          </Box>
                            </>
                          ) : (
                        <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: '4px', textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="body2">Document not yet submitted</Typography>
                              {doc.follow_up_date && (
                            <Typography variant="caption" color="textSecondary">
                                  Follow-up date: {new Date(doc.follow_up_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleAcceptAllFollowups}
            disabled={acceptAllLoading}
            sx={{ mr: 1 }}
          >
            {acceptAllLoading ? <CircularProgress size={24} /> : 'Accept All'}
          </Button>
          <Button onClick={closeModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Follow-up Documents Confirm Accept Modal */}
      <Dialog open={modalType === "followupConfirmAccept" && !!selectedFollowup} onClose={closeModal}>
        <DialogTitle>Confirm Document Acceptance</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to accept this document?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={() => handleFollowupAction("Accept")} color="success" variant="contained">Yes, Accept</Button>
        </DialogActions>
      </Dialog>
      

      {/* Follow-up Documents Decline Modal */}
      <Dialog open={modalType === "followupDecline" && !!selectedFollowup} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>Decline Document</DialogTitle>
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
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={() => handleFollowupAction("Decline")} color="error" variant="contained">
            Confirm Decline
          </Button>
        </DialogActions>
      </Dialog>

       <Dialog open={showBeneficiaryModal && !!selectedApplication} onClose={() => setShowBeneficiaryModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Subsidy Status
        </DialogTitle>
        <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Is this solo parent qualified to receive subsidy?
          </Typography>
          <Box sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {selectedApplication?.first_name} {selectedApplication?.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Solo Parent
            </Typography>
          </Box>
          <Box sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {selectedApplication?.income}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly Income
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 2, gap: 2 }}>
          <Button 
              onClick={() => handleBeneficiaryStatus('Beneficiary')}
            color="success" 
            variant="contained"
            sx={{ flex: 1 }}
          >
            Yes, Qualified
          </Button>
          <Button 
              onClick={() => handleBeneficiaryStatus('Non-Beneficiary')}
            color="error" 
            variant="contained"
            sx={{ flex: 1 }}
          >
            No, Not Qualified
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Applications;
