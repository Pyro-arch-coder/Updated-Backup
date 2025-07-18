import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SoloParentManagement.css';
import html2canvas from 'html2canvas';
import dswdLogo from '../../assets/dswd-logo.png';
import mswdoLogo from '../../assets/MSWDO LOGO.png';
import avatarImage from '../../assets/avatar.jpg';
import bagongPilipinasLogo from '../../assets/Bagong-pilipinas.png';
import { QRCodeSVG } from 'qrcode.react';
import * as ReactDOM from 'react-dom/client';
// Add Material-UI imports
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

// Use API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL||'http://localhost:8081';

const SoloParentManagement = () => {
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [stepPage, setStepPage] = useState(1);
  const [isTableScrollable, setIsTableScrollable] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const tableContainerRef = useRef(null);
  const [showIDModal, setShowIDModal] = useState(false);
  const [selectedIDUser, setSelectedIDUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkPrintBackToBack, setBulkPrintBackToBack] = useState(true);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeUser, setRevokeUser] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [showRemoveBeneficiaryModal, setShowRemoveBeneficiaryModal] = useState(false);
  const [beneficiaryToRemove, setBeneficiaryToRemove] = useState(null);
  const [showSetBeneficiaryModal, setShowSetBeneficiaryModal] = useState(false);
  const [beneficiaryToSet, setBeneficiaryToSet] = useState(null);
  const [adminId, setAdminId] = useState(null);

  const barangays = [
    'All',
    'Adia',
    'Bagong Pook',
    'Bagumbayan',
    'Bubucal',
    'Cabooan',
    'Calangay',
    'Cambuja',
    'Coralan',
    'Cueva',
    'Inayapan',
    'Jose P. Laurel, Sr.',
    'Jose P. Rizal',
    'Juan Santiago',
    'Kayhacat',
    'Macasipac',
    'Masinao',
    'Matalinting',
    'Pao-o',
    'Parang ng Buho',
    'Poblacion Dos',
    'Poblacion Quatro',
    'Poblacion Tres',
    'Poblacion Uno',
    'Talangka',
    'Tungkod'
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending_remarks', label: 'Pending Remarks' },
    { value: 'terminated', label: 'Terminated Users' },
    { value: 'renewal', label: 'Renewal' },
    { value: 'beneficiaries', label: 'Verified Beneficiaries' },
    { value: 'not_beneficiaries', label: 'Verified Not Beneficiaries' }
  ];

  useEffect(() => {
    const storedAdminId = localStorage.getItem('adminId');
    const storedSuperadminId = localStorage.getItem('superadminId');
    setAdminId(storedAdminId || storedSuperadminId);
    fetchVerifiedUsers();
    checkTableScroll();
    window.addEventListener('resize', checkTableScroll);
    return () => window.removeEventListener('resize', checkTableScroll);
  }, []);

  const checkTableScroll = () => {
    if (tableContainerRef.current) {
      const { scrollWidth, clientWidth } = tableContainerRef.current;
      setIsTableScrollable(scrollWidth > clientWidth);
    }
  };

  const fetchVerifiedUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/verifiedUsersSA`);
      setVerifiedUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching verified users:', error);
      setVerifiedUsers([]);
      alert('Error fetching verified users. Please refresh the page.');
    }
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setStepPage(1);
    if (window.innerWidth > 768) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    document.body.style.overflow = 'auto';
  };

  const handleUnterminate = async (userId) => {
    try {
      const response = await axios.post(`${API_URL}/unTerminateUser`, { userId });
      if (response.data.success) {
        setSuccessMessage('Account Re-verified');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to re-verify user');
      }
    } catch (err) {
      console.error('Error re-verifying user:', err);
      alert('Failed to re-verify user');
    }
  };

  const handleAccept = async (codeId) => {
    try {
      // Find the user with the given code_id
      if (!selectedUser) {
        throw new Error('User not found');
      }
      
      // Log the selectedUser object to debug
      console.log('Selected user for re-verification:', selectedUser);
      
      // Check different possible property names for user ID
      const userId = selectedUser.id || selectedUser.user_id || selectedUser.userId;
      
      if (!userId) {
        throw new Error('User ID is missing');
      }
      
      console.log('Re-verifying user with ID:', userId);
      
      // Call the unTerminateUser endpoint to re-verify the user
      const response = await axios.post(`${API_URL}/unTerminateUser`, { 
        userId: userId 
      });
      
      if (response.data.success) {
        setSuccessMessage('Account Re-verified');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to re-verify user');
      }
    } catch (err) {
      console.error('Error re-verifying user:', err);
      alert('Failed to re-verify user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDecline = async (codeId) => {
    try {
      // Find the user with the given code_id
      if (!selectedUser) {
        throw new Error('User not found');
      }
      
      // Log the selectedUser object to debug
      console.log('Selected user for termination:', selectedUser);
      
      // Check different possible property names for user ID
      const userId = selectedUser.id || selectedUser.user_id || selectedUser.userId;
      
      if (!userId) {
        throw new Error('User ID is missing');
      }
      
      console.log('Terminating user with ID:', userId);
      
      // Call the terminateUser endpoint to terminate the user
      const response = await axios.post(`${API_URL}/terminateUser`, { 
        userId: userId 
      });
      
      if (response.data.success) {
        setSuccessMessage('Account Terminated');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to terminate user');
      }
    } catch (err) {
      console.error('Error terminating user:', err);
      alert('Failed to terminate user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAction = async (action, user) => {
    try {
      const response = await axios.post(`${API_URL}/superadminUpdateStatus`, {
        userId: user.userId,
        status: action === "Accept" ? "Verified" : "Renewal",
        remarks: action === "Accept" ? "Your renewal has been approved by a superadmin" : "Your renewal has been declined"
      });

      if (response.data.success) {
        setSuccessMessage(action === "Accept" ? 'Renewal Accepted' : 'Renewal Declined');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status');
    }
  };

  const downloadID = async (side) => {
    try {
      // Get the element to capture based on side
      const targetElement = document.querySelector(side === 'back' ? '.id-card.back' : '.id-card.front');
      if (!targetElement) {
        console.error('Target element not found');
        return;
      }

      // Get the actual dimensions
      const rect = targetElement.getBoundingClientRect();

      // Capture the current state
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: 3,
        width: rect.width,
        height: rect.height,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(side === 'back' ? '.id-card.back' : '.id-card.front');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'relative';
            clonedElement.style.display = 'flex';
            clonedElement.style.opacity = '1';
            
            // Make sure all content is visible
            const header = clonedElement.querySelector('.id-card-header');
            const body = clonedElement.querySelector('.id-card-body');
            const terms = clonedElement.querySelector('.terms-section');
            const signature = clonedElement.querySelector('.signature-section');
            
            if (header) header.style.display = 'flex';
            if (body) body.style.display = 'flex';
            if (terms) terms.style.display = 'block';
            if (signature) signature.style.display = 'flex';
          }
        }
      });

      // Download the image
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `solo_parent_id_${side === 'back' ? 'back' : 'front'}.png`;
      link.click();

    } catch (error) {
      console.error('Error generating ID:', error);
      alert('Failed to download ID. Please try again.');
    }
  };

  const printID = async () => {
    try {
      // Check if a user is selected for ID printing
      if (!selectedIDUser) {
        console.error('No user selected for ID printing');
        alert('Please select a user before printing an ID.');
        return;
      }
      
      // Get front and back elements
      const frontElement = document.querySelector('.id-card.front');
      const backElement = document.querySelector('.id-card.back');
      
      if (!frontElement || !backElement) {
        console.error('ID card elements not found');
        alert('ID card elements not found. Please try again.');
        return;
      }

      // Get dimensions
      const frontRect = frontElement.getBoundingClientRect();
      const backRect = backElement.getBoundingClientRect();

      // Capture options
      const options = {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: 3,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedFront = clonedDoc.querySelector('.id-card.front');
          const clonedBack = clonedDoc.querySelector('.id-card.back');
          
          [clonedFront, clonedBack].forEach(element => {
            if (element) {
              element.style.transform = 'none';
              element.style.position = 'relative';
              element.style.display = 'flex';
              element.style.opacity = '1';
              
              // Make sure all content is visible
              const header = element.querySelector('.id-card-header');
              const body = element.querySelector('.id-card-body');
              const terms = element.querySelector('.terms-section');
              const signature = element.querySelector('.signature-section');
              
              if (header) header.style.display = 'flex';
              if (body) body.style.display = 'flex';
              if (terms) terms.style.display = 'block';
              if (signature) signature.style.display = 'flex';
            }
          });
        }
      };

      // Capture both sides
      const frontCanvas = await html2canvas(frontElement, { ...options, width: frontRect.width, height: frontRect.height });
      const backCanvas = await html2canvas(backElement, { ...options, width: backRect.width, height: backRect.height });

      // --- Cloudinary upload and DB insert ---
      if (selectedIDUser) {
        setSuccessMessage('Uploading ID to Cloudinary...');
        setShowSuccessModal(true);
        try {
          console.log('Selected user for ID upload:', selectedIDUser);
          
          // Validate user object has required properties
          const userId = selectedIDUser.userId || selectedIDUser.user_id || selectedIDUser.id;
          const codeId = selectedIDUser.code_id || selectedIDUser.codeId;
          
          if (!userId) {
            console.error('User ID not found in selectedIDUser:', selectedIDUser);
            setSuccessMessage('Error: User ID not found');
            setTimeout(() => setShowSuccessModal(false), 3000);
            return;
          }
          
          if (!codeId) {
            console.error('Code ID not found in selectedIDUser:', selectedIDUser);
            setSuccessMessage('Error: Code ID not found');
            setTimeout(() => setShowSuccessModal(false), 3000);
            return;
          }
          
          const uploadResult = await uploadIDToCloudinary(frontCanvas, backCanvas, selectedIDUser);
          console.log('Upload result:', uploadResult);
          
          if (uploadResult.success) {
            setSuccessMessage(`ID uploaded to Cloudinary and saved! User ID: ${userId}`);
          } else {
            console.error('Upload failed:', uploadResult);
            setSuccessMessage(`Failed to upload ID: ${uploadResult.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('Error in ID upload process:', err);
          setSuccessMessage(`Error uploading to Cloudinary: ${err.message || 'Unknown error'}`);
        }
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        console.error('No user selected for ID upload');
      }
      // --- End Cloudinary upload ---

      // Check if pop-ups are blocked by the browser
      const popupBlockerTest = window.open('', '_blank');
      if (!popupBlockerTest) {
        console.error('Pop-up blocker detected');
        alert('Pop-up blocker is preventing the ID from printing. Please allow pop-ups for this site and try again.');
        return;
      }
      popupBlockerTest.close();
      
      // Open print window with a check to ensure it opened successfully
      const printWindow = window.open('', '_blank');
      
      // Check if the window was successfully opened and document is accessible
      if (printWindow && printWindow.document) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Solo Parent ID</title>
              <style>
                @page {
                  size: 3.375in 2.125in;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                img {
                  width: 3.375in;
                  height: 2.125in;
                  object-fit: contain;
                  page-break-after: always;
                  display: block;
                }
              </style>
            </head>
            <body>
              <img src="${(() => {
                try {
                  return frontCanvas.toDataURL('image/png', 1.0);
                } catch (err) {
                  console.error('Error converting front canvas to data URL:', err);
                  return '';
                }
              })()}" />
              <img src="${(() => {
                try {
                  return backCanvas.toDataURL('image/png', 1.0);
                } catch (err) {
                  console.error('Error converting back canvas to data URL:', err);
                  return '';
                }
              })()}" />
            </body>
          </html>
        `);
        printWindow.document.close();

        // Wait for images to load before printing
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      } else {
        console.error('Failed to open print window. Pop-up might be blocked by the browser.');
        alert('Failed to open print window. Please check if pop-ups are allowed for this site.');
      }

    } catch (error) {
      console.error('Error printing ID:', error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof TypeError && error.message.includes("Cannot read properties of null")) {
        alert('Failed to print ID: The print window could not be accessed. Please check if pop-ups are allowed for this site.');
      } else {
        alert(`Failed to print ID: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  const handleUserSelection = (user) => {
    setSelectedUsers(prev => {
      // Check if user is already selected
      const isSelected = prev.some(selectedUser => selectedUser.userId === user.userId);
      
      if (isSelected) {
        // Remove user from selection
        return prev.filter(selectedUser => selectedUser.userId !== user.userId);
      } else {
        // Add user to selection
        return [...prev, user];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers);
    } else {
      setSelectedUsers([]);
    }
  };

  const downloadBulkIDs = async () => {
    try {
      if (selectedUsers.length === 0) {
        alert('Please select at least one solo parent');
        return;
      }
      
      setSuccessMessage('Generating IDs...');
      setShowSuccessModal(true);
      
      // Dynamically import JSZip
      const JSZip = await import('jszip').then(module => module.default);
      const zip = new JSZip();
      
      const { saveAs } = await import('file-saver').then(module => module.default);
      
      // Process each selected user
      for (const [index, user] of selectedUsers.entries()) {
        // Update progress message
        setSuccessMessage(`Generating ID ${index + 1} of ${selectedUsers.length}`);
        
        // Create temporary container for ID card
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute'; 
        tempContainer.style.left = '-9999px';
        
        // Create a QR code element
        const qrContainer = document.createElement('div');
        qrContainer.id = `qr-container-${index}`;
        qrContainer.style.width = '120px';
        qrContainer.style.height = '120px';
        qrContainer.style.backgroundColor = 'white';
        qrContainer.style.padding = '0';
        document.body.appendChild(qrContainer);
        
        // Render QR code using ReactDOM createRoot API
        const root = ReactDOM.createRoot(qrContainer);
        root.render(
          <QRCodeSVG 
            value={`user:${user.userId}`}
            size={120}
            level="H"
            includeMargin={false}
            fgColor="#2E7D32"
            bgColor="#ffffff"
          />
        );
        
        // Wait a moment for the QR code to render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture QR code as image
        const qrCanvas = await html2canvas(qrContainer, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 3
        });
        const qrDataUrl = qrCanvas.toDataURL('image/png', 1.0);
        
        // Clean up
        root.unmount();
        document.body.removeChild(qrContainer);
        
        tempContainer.innerHTML = `
          <div class="id-card front">
            <div class="id-card-header">
              <div class="id-logos">
                <img src="${dswdLogo}" alt="DSWD Logo" class="id-logo" style="width: 60px; height: 60px;" />
                <div class="id-title">
                  <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                  <h4>Republic of the Philippines</h4>
                  <h4>DSWD Region III</h4>
                </div>
                <img src="${mswdoLogo}" alt="MSWDO Logo" class="id-logo" style="width: 60px; height: 60px;" />
              </div>
            </div>
            <div class="id-card-body">
              <div class="id-left-section">
                <div class="id-photo-container">
                  <img 
                    src="${user.profile_picture || avatarImage}" 
                    alt="User" 
                    class="id-photo"
                    onerror="this.onerror=null; this.src='${avatarImage}';"
                  />
                </div>
                <div class="id-category">
                  Category: ${user.classification || 'N/A'}
                </div>
                <div class="id-validity-container">
                  <span class="id-validity">
                    Valid Until: ${user.validUntil ? new Date(user.validUntil).toLocaleDateString(undefined, {dateStyle: 'medium'}) : 'N/A'}
                  </span>
                  <img src="${bagongPilipinasLogo}" alt="Bagong Pilipinas Logo" class="bagong-pilipinas-logo" />
                </div>
              </div>
              <div class="id-card-container">
                <div class="id-card-details">
                  <div class="id-detail">
                    <span class="id-label">ID No:</span>
                    <span class="id-value">${user.code_id || 'N/A'}</span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Name:</span>
                    <span class="id-value">
                      ${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}${user.suffix && user.suffix !== 'none' ? ` ${user.suffix}` : ''}
                    </span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Barangay:</span>
                    <span class="id-value">${user.barangay || 'N/A'}</span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Birthdate:</span>
                    <span class="id-value">
                      ${user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Civil Status:</span>
                    <span class="id-value">${user.civil_status || 'N/A'}</span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Contact:</span>
                    <span class="id-value">${user.contact_number || 'N/A'}</span>
                  </div>
                </div>
                <div class="id-card-qr-container">
                  <img src="${qrDataUrl}" alt="QR Code" class="qr-code" style="width: 120px; height: 120px;" />
                </div>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(tempContainer);
        
        // Get the actual dimensions
        const rect = tempContainer.querySelector('.id-card.front').getBoundingClientRect();

        // Capture the front ID using the same options as downloadID function
        const frontCanvas = await html2canvas(tempContainer.querySelector('.id-card.front'), {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 3,
          width: rect.width,
          height: rect.height,
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.id-card.front');
            if (clonedElement) {
              clonedElement.style.transform = 'none';
              clonedElement.style.position = 'relative';
              clonedElement.style.display = 'flex';
              clonedElement.style.opacity = '1';
              
              // Make sure all content is visible
              const header = clonedElement.querySelector('.id-card-header');
              const body = clonedElement.querySelector('.id-card-body');
              
              if (header) header.style.display = 'flex';
              if (body) body.style.display = 'flex';
            }
          }
        });

        // Create back of ID
        const backContainer = document.createElement('div');
        backContainer.className = 'temp-id-container';
        backContainer.style.position = 'absolute';
        backContainer.style.left = '-9999px';
        document.body.appendChild(backContainer);
        
        backContainer.innerHTML = `
          <div class="id-card back">
            <div class="id-card-header">
              <img src="${dswdLogo}" alt="DSWD Logo" class="id-logo" />
              <div class="id-title">
                <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                <h4>Republic of the Philippines</h4>
                <h4>DSWD Region III</h4>
              </div>
            </div>
            <div class="terms-section">
              <h3>Terms and Conditions</h3>
              <ol>
                <li>This ID is non-transferable</li>
                <li>Report loss/damage to DSWD office</li>
                <li>Present this ID when availing benefits</li>
                <li>Tampering invalidates this ID</li>
              </ol>
            </div>
            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <span>Card Holder's Signature</span>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <span>Authorized DSWD Official</span>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(backContainer);
        
        // Get the back dimensions
        const backRect = backContainer.querySelector('.id-card.back').getBoundingClientRect();
        
        // Capture the back ID using the same options as downloadID function
        const backCanvas = await html2canvas(backContainer.querySelector('.id-card.back'), {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 3,
          width: backRect.width,
          height: backRect.height,
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.id-card.back');
            if (clonedElement) {
              clonedElement.style.transform = 'none';
              clonedElement.style.position = 'relative';
              clonedElement.style.display = 'flex';
              clonedElement.style.opacity = '1';
              clonedElement.style.flexDirection = 'column';
              
              // Make sure all content is visible
              const header = clonedElement.querySelector('.id-card-header');
              const terms = clonedElement.querySelector('.terms-section');
              const signature = clonedElement.querySelector('.signature-section');
              
              if (header) {
                header.style.display = 'flex';
                header.style.justifyContent = 'center';
                header.style.alignItems = 'center';
                header.style.margin = '0px';
              }
              if (terms) {
                terms.style.display = 'block';
                terms.style.margin = '0px';
              }
              if (signature) {
                signature.style.display = 'flex';
                signature.style.justifyContent = 'space-around';
                signature.style.margin = '0px';
              }
            }
          }
        });
        
        // Add to zip
        const frontBlob = await new Promise(resolve => frontCanvas.toBlob(resolve, 'image/png', 1.0));
        const backBlob = await new Promise(resolve => backCanvas.toBlob(resolve, 'image/png', 1.0));
        
        const userName = `${user.first_name || 'Unknown'}_${user.last_name || 'User'}`.replace(/[^a-zA-Z0-9_]/g, '_');
        zip.file(`${userName}_front.png`, frontBlob);
        zip.file(`${userName}_back.png`, backBlob);
        
        // Clean up
        document.body.removeChild(tempContainer);
        document.body.removeChild(backContainer);
      }
      
      // Generate and download zip
      const content = await zip.generateAsync({type: 'blob'});
      saveAs(content, 'solo_parent_ids.zip');
      
      setSuccessMessage('Download complete!');
      setTimeout(() => setShowSuccessModal(false), 2000);
      
    } catch (error) {
      console.error('Error generating bulk IDs:', error);
      setSuccessMessage('Failed to generate IDs');
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  const printBulkIDs = async () => {
    try {
      if (selectedUsers.length === 0) {
        alert('Please select at least one solo parent');
        return;
      }
      
      setSuccessMessage('Preparing IDs for printing...');
      setShowSuccessModal(true);
      
      // Check if pop-ups are blocked by the browser
      const popupBlockerTest = window.open('', '_blank');
      if (!popupBlockerTest) {
        console.error('Pop-up blocker detected');
        alert('Pop-up blocker is preventing the ID from printing. Please allow pop-ups for this site and try again.');
        setShowSuccessModal(false);
        return;
      }
      popupBlockerTest.close();
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow || !printWindow.document) {
        console.error('Failed to open print window');
        alert('Failed to open print window. Please check if pop-ups are allowed for this site.');
        setShowSuccessModal(false);
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Solo Parent IDs</title>
            <style>
              @page {
                size: 3.375in 2.125in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .id-card-wrapper {
                width: 3.375in;
                height: 2.125in;
                margin: 0;
                padding: 0;
                page-break-after: always;
                position: relative;
                overflow: hidden;
              }
              img {
                width: 100%;
                height: auto;
                display: block;
              }
            </style>
          </head>
          <body>
      `);
      
      // Process each selected user
      for (const [index, user] of selectedUsers.entries()) {
        // Update progress message
        setSuccessMessage(`Preparing ID ${index + 1} of ${selectedUsers.length} for printing`);
        
        // Create a QR code element
        const qrContainer = document.createElement('div');
        qrContainer.id = `qr-print-container-${index}`;
        qrContainer.style.width = '120px';
        qrContainer.style.height = '120px';
        qrContainer.style.backgroundColor = 'white';
        qrContainer.style.padding = '0';
        document.body.appendChild(qrContainer);
        
        // Render QR code using ReactDOM createRoot API
        const root = ReactDOM.createRoot(qrContainer);
        root.render(
          <QRCodeSVG 
            value={`user:${user.userId}`}
            size={120}
            level="H"
            includeMargin={false}
            fgColor="#2E7D32"
            bgColor="#ffffff"
          />
        );
        
        // Wait a moment for the QR code to render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture QR code as image
        const qrCanvas = await html2canvas(qrContainer, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 3
        });
        const qrDataUrl = qrCanvas.toDataURL('image/png', 1.0);
        
        // Clean up QR code container
        root.unmount();
        document.body.removeChild(qrContainer);
        
        // Create temporary elements to render the front ID
        const tempContainer = document.createElement('div');
        tempContainer.className = 'temp-id-container';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
        
        tempContainer.innerHTML = `
          <div class="id-card front">
            <div class="id-card-header">
              <div class="id-logos">
                <img src="${dswdLogo}" alt="DSWD Logo" class="id-logo" style="width: 60px; height: 60px;" />
                <div class="id-title">
                  <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                  <h4>Republic of the Philippines</h4>
                  <h4>DSWD Region III</h4>
                </div>
                <img src="${mswdoLogo}" alt="MSWDO Logo" class="id-logo" style="width: 60px; height: 60px;" />
              </div>
            </div>
            <div class="id-card-body">
              <div class="id-left-section">
                <div class="id-photo-container">
                  <img 
                    src="${user.profile_picture || avatarImage}" 
                    alt="User" 
                    class="id-photo"
                    onerror="this.onerror=null; this.src='${avatarImage}';"
                  />
                </div>
                <div class="id-category">
                  Category: ${user.classification || 'N/A'}
                </div>
                <div class="id-validity-container">
                  <span class="id-validity">
                    Valid Until: ${user.validUntil ? new Date(user.validUntil).toLocaleDateString(undefined, {dateStyle: 'medium'}) : 'N/A'}
                  </span>
                  <img src="${bagongPilipinasLogo}" alt="Bagong Pilipinas Logo" class="bagong-pilipinas-logo" />
                </div>
              </div>
              <div class="id-card-container">
                <div class="id-card-details">
                  <div class="id-detail">
                    <span class="id-label">ID No:</span>
                    <span class="id-value">${user.code_id || 'N/A'}</span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Name:</span>
                    <span class="id-value">
                      ${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}${user.suffix && user.suffix !== 'none' ? ` ${user.suffix}` : ''}
                    </span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Barangay:</span>
                    <span class="id-value">${user.barangay || 'N/A'}</span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Birthdate:</span>
                    <span class="id-value">
                      ${user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Civil Status:</span>
                    <span class="id-value">${user.civil_status || 'N/A'}</span>
                  </div>
                  <div class="id-detail">
                    <span class="id-label">Contact:</span>
                    <span class="id-value">${user.contact_number || 'N/A'}</span>
                  </div>
                </div>
                <div class="id-card-qr-container">
                  <img src="${qrDataUrl}" alt="QR Code" class="qr-code" style="width: 120px; height: 120px;" />
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Capture the front ID
        const frontCanvas = await html2canvas(tempContainer.querySelector('.id-card.front'), {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 3,
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.id-card.front');
            if (clonedElement) {
              clonedElement.style.transform = 'none';
              clonedElement.style.position = 'relative';
              clonedElement.style.display = 'flex';
              clonedElement.style.opacity = '1';
              
              // Make sure all content is visible
              const header = clonedElement.querySelector('.id-card-header');
              const body = clonedElement.querySelector('.id-card-body');
              
              if (header) header.style.display = 'flex';
              if (body) body.style.display = 'flex';
            }
          }
        });

        // Create back of ID
        const backContainer = document.createElement('div');
        backContainer.className = 'temp-id-container';
        backContainer.style.position = 'absolute';
        backContainer.style.left = '-9999px';
        document.body.appendChild(backContainer);
        
        backContainer.innerHTML = `
          <div class="id-card back">
            <div class="id-card-header">
              <img src="${dswdLogo}" alt="DSWD Logo" class="id-logo" />
              <div class="id-title">
                <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                <h4>Republic of the Philippines</h4>
                <h4>DSWD Region III</h4>
              </div>
            </div>
            <div class="terms-section">
              <h3>Terms and Conditions</h3>
              <ol>
                <li>This ID is non-transferable</li>
                <li>Report loss/damage to DSWD office</li>
                <li>Present this ID when availing benefits</li>
                <li>Tampering invalidates this ID</li>
              </ol>
            </div>
            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <span>Card Holder's Signature</span>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <span>Authorized DSWD Official</span>
              </div>
            </div>
          </div>
        `;
        
        // Capture the back ID
        const backCanvas = await html2canvas(backContainer.querySelector('.id-card.back'), {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 3,
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.id-card.back');
            if (clonedElement) {
              clonedElement.style.transform = 'none';
              clonedElement.style.position = 'relative';
              clonedElement.style.display = 'flex';
              clonedElement.style.opacity = '1';
              clonedElement.style.flexDirection = 'column';
              
              // Make sure all content is visible
              const header = clonedElement.querySelector('.id-card-header');
              const terms = clonedElement.querySelector('.terms-section');
              const signature = clonedElement.querySelector('.signature-section');
              
              if (header) {
                header.style.display = 'flex';
                header.style.justifyContent = 'center';
                header.style.alignItems = 'center';
                header.style.margin = '0px';
              }
              if (terms) {
                terms.style.display = 'block';
                terms.style.margin = '0px';
              }
              if (signature) {
                signature.style.display = 'flex';
                signature.style.justifyContent = 'space-around';
                signature.style.margin = '0px';
              }
            }
          }
        });
        
        // Upload to Cloudinary
        try {
          setSuccessMessage(`Uploading ID ${index + 1} of ${selectedUsers.length} to Cloudinary...`);
          
          // Validate user object has required properties
          const userId = user.userId || user.user_id || user.id;
          const codeId = user.code_id || user.codeId;
          
          if (!userId || !codeId) {
            console.error('Missing user ID or code ID for user:', user);
            // Continue with printing even if upload fails
          } else {
            // Upload to Cloudinary in the background
            await uploadIDToCloudinary(frontCanvas, backCanvas, user)
              .then(result => {
                console.log(`ID card upload successful for user ${userId}:`, result);
              })
              .catch(err => {
                console.error(`ID card upload failed for user ${userId}:`, err);
                // Continue with printing even if upload fails
              });
          }
        } catch (uploadError) {
          console.error('Error uploading ID to Cloudinary:', uploadError);
          // Continue with printing even if upload fails
        }
        
        // Add to print window - front of ID
        try {
          const frontDataUrl = frontCanvas.toDataURL('image/png', 1.0);
          printWindow.document.write(`
            <div class="id-card-wrapper">
              <img src="${frontDataUrl}" alt="ID Card Front" />
            </div>
          `);
        } catch (err) {
          console.error('Error converting front canvas to data URL:', err);
          // Continue with other IDs even if this one fails
        }
        
        // Add to print window - back of ID (on a new page)
        try {
          const backDataUrl = backCanvas.toDataURL('image/png', 1.0);
          printWindow.document.write(`
            <div class="id-card-wrapper">
              <img src="${backDataUrl}" alt="ID Card Back" />
            </div>
          `);
        } catch (err) {
          console.error('Error converting back canvas to data URL:', err);
          // Continue with other IDs even if this one fails
        }
        
        // Clean up
        document.body.removeChild(tempContainer);
        document.body.removeChild(backContainer);
      }
      
      // Close document and print
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setSuccessMessage('Print dialog opened');
        setTimeout(() => setShowSuccessModal(false), 2000);
      }, 1000);
      
    } catch (error) {
      console.error('Error printing bulk IDs:', error);
      setSuccessMessage('Failed to print IDs: ' + (error.message || 'Unknown error'));
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
  };

  const filteredUsers = verifiedUsers.filter(user => {
    if (!user) return false;
    
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (user.id && user.id.toString().includes(searchLower)) ||
      (user.code_id && user.code_id.toLowerCase().includes(searchLower)) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.age && user.age.toString().includes(searchLower))
    );

    // Barangay filter
    const matchesBarangay = selectedBarangay === 'All' || user.barangay === selectedBarangay;

    // Status filter
    let matchesStatus = true;
    if (selectedStatus !== 'all') {
      switch (selectedStatus) {
        case 'pending_remarks':
          matchesStatus = user.status === 'Pending Remarks';
          break;
        case 'terminated':
          matchesStatus = user.status === 'Terminated';
          break;
        case 'renewal':
          // Only show if user is Renewal AND their barangay_cert_documents status is Pending
          matchesStatus = user.status === 'Renewal' && user.documents && user.documents.some(doc => doc.document_type === 'barangay_cert_documents' && doc.status === 'Pending');
          break;
          case 'beneficiaries':
            // Only show verified users who are marked as beneficiaries
            matchesStatus = user.status === 'Verified' && user.beneficiary_status === 'beneficiary';
            break;
          case 'not_beneficiaries':
              matchesStatus = user.status === 'Verified' && user.beneficiary_status === 'non-beneficiary';
              break;  
        default:
          matchesStatus = true;
      }
    }

    return matchesSearch && matchesBarangay && matchesStatus;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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

  const openIDModal = (user) => {
    setSelectedIDUser(user);
    setShowIDModal(true);
  };

  const closeIDModal = () => {
    setShowIDModal(false);
    setSelectedIDUser(null);
    document.body.style.overflow = 'auto';
  };

  const openRevokeModal = (user) => {
    setRevokeUser(user);
    setRemarks("");
    setShowRevokeModal(true);
  };

  const closeRevokeModal = () => {
    setRevokeUser(null);
    setRemarks("");
    setShowRevokeModal(false);
  };

  const handleRevoke = async () => {
    if (!revokeUser || !remarks.trim()) return;
    
    try {
      setSuccessMessage('Processing...');
      setShowSuccessModal(true);
      
      // Get the user ID
      const userId = revokeUser.id || revokeUser.user_id || revokeUser.userId;
      
      // Get the logged in user info
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      const loggedInUserId = localStorage.getItem('UserId') || localStorage.getItem('id');
      
      // Create the payload
      const payload = {
        code_id: revokeUser.code_id,
        remarks: remarks,
        user_id: userId
      };
      
      // Check if the logged in user is a superadmin or admin
      if (loggedInUser.role === 'superadmin') {
        payload.superadmin_id = loggedInUserId;
      } else {
        payload.admin_id = loggedInUserId;
      }
      
      console.log('Sending payload:', payload);
      
      // Use the saveRemarks endpoint
      const response = await axios.post(`${API_URL}/saveRemarks`, payload);
      
      if (response.data) {
        // Refresh the verified users list
        await fetchVerifiedUsers();
        closeRevokeModal();
        
        setSuccessMessage('User status changed to Pending Remarks');
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      console.error('Error revoking status:', err);
      setSuccessMessage('Failed to update status: ' + (err.message || 'Unknown error'));
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  const handleRemoveBeneficiaryClick = (user) => {
    setBeneficiaryToRemove(user);
    setShowRemoveBeneficiaryModal(true);
  };

  const handleRemoveBeneficiary = async () => {
    if (!beneficiaryToRemove) return;
    
    try {
      setShowRemoveBeneficiaryModal(false);
      setSuccessMessage('Processing...');
      setShowSuccessModal(true);
      
      const userId = beneficiaryToRemove.id || beneficiaryToRemove.user_id || beneficiaryToRemove.userId;
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      const loggedInUserId = localStorage.getItem('UserId') || localStorage.getItem('id');
      
      const payload = {
        user_id: userId,
        admin_id: loggedInUser.role === 'admin' ? loggedInUserId : null,
        superadmin_id: loggedInUser.role === 'superadmin' ? loggedInUserId : null
      };
      
      console.log('Sending payload to removeBeneficiary:', payload);
      
      const response = await axios.post(`${API_URL}/removeBeneficiary`, payload);
      
      if (response.data.success) {
        await fetchVerifiedUsers();
        setSuccessMessage(response.data.message || 'User removed as beneficiary');
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        throw new Error(response.data.error || 'Failed to remove beneficiary');
      }
    } catch (err) {
      console.error('Error removing beneficiary:', err);
      setSuccessMessage(err.response?.data?.error || err.message || 'Failed to remove beneficiary');
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setBeneficiaryToRemove(null);
    }
  };

  const handleSetBeneficiary = async () => {
    if (!beneficiaryToSet) return;
    
    try {
      setShowSetBeneficiaryModal(false);
      setSuccessMessage('Processing...');
      setShowSuccessModal(true);
      
      const userId = beneficiaryToSet.id || beneficiaryToSet.user_id || beneficiaryToSet.userId;
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      const loggedInUserId = localStorage.getItem('UserId') || localStorage.getItem('id');
      
      const payload = {
        user_id: userId,
        beneficiary_status: 'beneficiary',
        admin_id: loggedInUser.role === 'admin' ? loggedInUserId : null,
        superadmin_id: loggedInUser.role === 'superadmin' ? loggedInUserId : null
      };
      
      console.log('Sending payload to updateBeneficiaryStatus:', payload);
      
      const response = await axios.post(`${API_URL}/updateBeneficiaryStatus`, payload);
      
      if (response.data.success) {
        await fetchVerifiedUsers();
        setSuccessMessage(response.data.message || 'User set as beneficiary');
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        throw new Error(response.data.error || 'Failed to set beneficiary');
      }
    } catch (err) {
      console.error('Error setting beneficiary:', err);
      setSuccessMessage(err.response?.data?.error || err.message || 'Failed to set beneficiary');
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setBeneficiaryToSet(null);
    }
  };

  const handleSetBeneficiaryClick = (user) => {
    setBeneficiaryToSet(user);
    setShowSetBeneficiaryModal(true);
  };

  const uploadIDToCloudinary = async (frontCanvas, backCanvas, user) => {
    try {
      console.log('Uploading ID to Cloudinary for user:', user);
      
      // Get base64 images with error handling
      let frontBase64, backBase64;
      
      try {
        frontBase64 = frontCanvas.toDataURL('image/png', 1.0);
      } catch (err) {
        console.error('Error converting front canvas to data URL:', err);
        throw new Error('Failed to process front image for upload');
      }
      
      try {
        backBase64 = backCanvas.toDataURL('image/png', 1.0);
      } catch (err) {
        console.error('Error converting back canvas to data URL:', err);
        throw new Error('Failed to process back image for upload');
      }
      
      // Extract user ID - check all possible property names
      const userId = user.userId || user.user_id || user.id;
      if (!userId) {
        console.error('User ID not found in user object:', user);
        throw new Error('User ID not found');
      }
      
      // Extract code ID
      const codeId = user.code_id || user.codeId;
      if (!codeId) {
        console.error('Code ID not found in user object:', user);
        throw new Error('Code ID not found');
      }
      
      console.log(`Sending ID card upload request for user ID: ${userId}, code ID: ${codeId}`);
      
      // Make API request
      const response = await axios.post(`${API_URL}/api/idcard/upload-id-card`, {
        userId: userId,
        codeId: codeId,
        frontImage: frontBase64,
        backImage: backBase64,
      });
      
      console.log('ID card upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in uploadIDToCloudinary:', error);
      throw error;
    }
  };

  return (
    <div className="solo-parent-container">
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
              Solo Parent Management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 300 } }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search solo parents..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'grey.500', mr: 1 }} fontSize="small" />
                }}
                sx={{
                  '& .MuiInputBase-root': { borderRadius: 2, height: { xs: 32, sm: 40 }, fontSize: { xs: '0.8rem', sm: '1rem' } },
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.8rem', sm: '1rem' } }
                }}
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 180 } }}>
              <InputLabel>Barangay</InputLabel>
              <Select
                value={selectedBarangay}
                onChange={e => setSelectedBarangay(e.target.value)}
                label="Barangay"
              >
                {barangays.map(barangay => (
                  <MenuItem key={barangay} value={barangay}>
                    {barangay === 'All' ? 'All Barangays' : barangay}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 180 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {selectedUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Button 
                variant="contained"
                size="small"
                sx={{ backgroundColor: '#16C47F', color: '#fff', fontWeight: 600, textTransform: 'none', fontSize: { xs: '0.75rem', sm: '0.9rem' }, px: 1.5, py: 0.5 }}
                onClick={downloadBulkIDs}
              >
                Download Selected IDs ({selectedUsers.length})
              </Button>
              <Button 
                variant="contained"
                size="small"
                sx={{ backgroundColor: '#16C47F', color: '#fff', fontWeight: 600, textTransform: 'none', fontSize: { xs: '0.75rem', sm: '0.9rem' }, px: 1.5, py: 0.5 }}
                onClick={printBulkIDs}
              >
                Print Selected IDs ({selectedUsers.length})
              </Button>
              <Box sx={{ ml: 1 }}>
                <label style={{ fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input 
                    type="checkbox" 
                    checked={bulkPrintBackToBack} 
                    onChange={e => setBulkPrintBackToBack(e.target.checked)}
                    style={{ marginRight: 4 }}
                  />
                  Print back-to-back
                </label>
              </Box>
            </Box>
          )}
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, mt: 3 }}>
            <Table sx={{ minWidth: 650 }} aria-label="solo parent table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} 
                      onChange={handleSelectAll} 
                      className="select-all-checkbox"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>ID</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Code ID</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Name</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Barangay</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Status</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentUsers.map((user, index) => (
                  <TableRow key={index} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.some(selectedUser => selectedUser.userId === user.userId)} 
                        onChange={() => handleUserSelection(user)} 
                        className="user-checkbox"
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{indexOfFirstUser + index + 1}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{user.code_id}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{`${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}${user.suffix && user.suffix !== 'none' ? ` ${user.suffix}` : ''}`}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{user.barangay || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{user.status}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                      <button className="btn view-btn" onClick={() => openModal(user)}>
                        <i className="fas fa-eye"></i> View
                      </button>
                      {user.status === 'Verified' && (
                        <>
                          <button 
                            className="btn decline-btn" 
                            onClick={() => openRevokeModal(user)}
                            title="Revoke verification status"
                          >
                            <i className="fas fa-ban"></i> Revoke
                          </button>
                          {selectedStatus === 'beneficiaries' && (
                            <button 
                              className="btn remove-beneficiary-btn"
                              onClick={() => handleRemoveBeneficiaryClick(user)}
                              title="Remove beneficiary status"
                            >
                              <i className="fas fa-user-minus"></i> Remove Beneficiary
                            </button>
                          )}
                          {selectedStatus === 'not_beneficiaries' && (
                            <button 
                              className="btn set-beneficiary-btn"
                              onClick={() => handleSetBeneficiaryClick(user)}
                              title="Set as beneficiary"
                            >
                              <i className="fas fa-user-plus"></i> Set as Beneficiary
                            </button>
                          )}
                          <button className="btn download-btn" onClick={() => openIDModal(user)} title="Download ID">
                            <i className="fas fa-download"></i>
                          </button>
                        </>
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
            count={filteredUsers.length}
            rowsPerPage={usersPerPage}
            page={currentPage - 1}
            onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
            onRowsPerPageChange={e => {
              // Not supporting changing usersPerPage for now
            }}
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
      </Box>

      {/* VIEW DETAILS MODAL */}
      {selectedUser && (
        <div 
          className="solo-parent-modal-overlay" 
          onClick={closeModal}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="solo-parent-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="solo-parent-modal-header">
              <h3>Solo Parent Details</h3>
            </div>
            <div className="solo-parent-modal-content">
              {selectedUser.status === 'Pending Remarks' ? (
                <div className="detail-section">
                  <h4>Remarks Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Code ID</span>
                      <span className="value">{selectedUser.code_id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">
                        {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}${selectedUser.suffix && selectedUser.suffix !== 'none' ? ` ${selectedUser.suffix}` : ''}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Barangay</span>
                      <span className="value">{selectedUser.barangay}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Remarks</span>
                      <span className="value remarks-text">{selectedUser.latest_remarks || 'No remarks'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Date</span>
                      <span className="value">{formatDate(selectedUser.remarks_at)}</span>
                    </div>
                  </div>
                  <div className="modal-buttons">
                    <button 
                      onClick={() => handleAccept(selectedUser.code_id)} 
                      className="accept-btn"
                    >
                      Re-verify Account
                    </button>
                    <button 
                      onClick={() => handleDecline(selectedUser.code_id)} 
                      className="decline-btn"
                    >
                      Terminate Account
                    </button>
                  </div>
                </div>
              ) : selectedUser.status === 'Terminated' ? (
                <div className="detail-section">
                  <h4>Terminated User Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Code ID</span>
                      <span className="value">{selectedUser.code_id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">
                        {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}${selectedUser.suffix && selectedUser.suffix !== 'none' ? ` ${selectedUser.suffix}` : ''}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Barangay</span>
                      <span className="value">{selectedUser.barangay}</span>
                    </div>
                  </div>
                  <div className="modal-buttons">
                    <button 
                      onClick={() => handleUnterminate(selectedUser.userId)} 
                      className="accept-btn"
                    >
                      Re-verify Account
                    </button>
                  </div>
                </div>
              ) : selectedUser.status === 'Renewal' ? (
                <div className="detail-section">
                  <h4>Renewal Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Code ID</span>
                      <span className="value">{selectedUser.code_id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">
                        {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}${selectedUser.suffix && selectedUser.suffix !== 'none' ? ` ${selectedUser.suffix}` : ''}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Barangay</span>
                      <span className="value">{selectedUser.barangay}</span>
                    </div>
                  </div>
                  <div className="documents-section">
                    <h4>Barangay Certificate</h4>
                    {(() => {
  // Check if user has uploaded a barangay certificate
  const barangayCerts = selectedUser.documents ? 
    selectedUser.documents.filter(doc => doc.document_type === 'barangay_cert_documents') : [];
  
  if (barangayCerts.length === 0) {
    return (
      <div className="no-documents">
        <i className="fas fa-exclamation-circle document-icon"></i>
        <p>No barangay certificate has been submitted for renewal.</p>
        <p className="document-note">A barangay certificate is required to process the renewal.</p>
      </div>
    );
  }
  
  // Only show barangay certificates
  return (
    <div className="documents-list">
      {barangayCerts.map((doc, index) => (
        <div key={index} className="document-item">
          <div className="document-header">
            <h5>Barangay Certificate</h5>
          </div>
          <div className="document-preview">
            <img 
              src={doc.file_url} 
              alt={doc.display_name || 'Barangay Certificate'}
              className="document-thumbnail"
              onClick={() => window.open(doc.file_url, '_blank')}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/400x300/e2e8f0/64748b?text=Certificate+Not+Found";
              }}
            />
          </div>
          <div className="document-actions">
            <button 
              className="btn view-btn full-width"
              onClick={() => window.open(doc.file_url, '_blank')}
            >
              <i className="fas fa-eye"></i> View Full Size
            </button>
          </div>
        </div>
      ))}
    </div>
  );
})()}
                  </div>
                  <div className="modal-buttons">
                    <button
                       onClick={() => handleAction("Accept", selectedUser)}
                       className="accept-btn"
                       disabled={!(selectedUser.documents && selectedUser.documents.filter(doc => doc.document_type === 'barangay_cert_documents').length > 0)}
                     >
                       Accept Renewal
                     </button>
                    <button 
                      onClick={() => handleAction("Decline", selectedUser)} 
                      className="decline-btn"
                    >
                      Decline Renewal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="step-indicators">
                    {[1, 2, 3, 4, 5, 6].map(step => (
                      <div
                        key={step}
                        className={`step-dot ${stepPage === step ? 'active' : ''}`}
                        onClick={() => setStepPage(step)}
                      />
                    ))}
                  </div>
                  
                  {stepPage === 1 && (
                    <div className="detail-section">
                      <h4>Personal Information</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">Name</span>
                          <span className="value">
                            {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}${selectedUser.suffix && selectedUser.suffix !== 'none' ? ` ${selectedUser.suffix}` : ''}`}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Age</span>
                          <span className="value">{selectedUser.age || ''}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Gender</span>
                          <span className="value">{selectedUser.gender || ''}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Date of Birth</span>
                          <span className="value">{formatDate(selectedUser.date_of_birth)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Place of Birth</span>
                          <span className="value">{selectedUser.place_of_birth}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Barangay</span>
                          <span className="value">{selectedUser.barangay}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Email</span>
                          <span className="value">{selectedUser.email}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Contact Number</span>
                          <span className="value">{selectedUser.contact_number}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Education</span>
                          <span className="value">{selectedUser.education}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Occupation</span>
                          <span className="value">{selectedUser.occupation}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Company</span>
                          <span className="value">{selectedUser.company}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Income</span>
                          <span className="value">{selectedUser.income}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Employment Status</span>
                          <span className="value">{selectedUser.employment_status}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Civil Status</span>
                          <span className="value">{selectedUser.civil_status}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Religion</span>
                          <span className="value">{selectedUser.religion}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Pantawid Beneficiary</span>
                          <span className="value">{selectedUser.pantawid_beneficiary}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Indigenous</span>
                          <span className="value">{selectedUser.indigenous}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Code ID</span>
                          <span className="value">{selectedUser.code_id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {stepPage === 2 && (
                    <div className="detail-section">
                      <h4>Family Information</h4>
                      {selectedUser.familyMembers && selectedUser.familyMembers.length > 0 ? (
                        <div className="children-list">
                          {selectedUser.familyMembers.map((member, index) => (
                            <div key={index} className="child-details">
                              <h5>Family Member {index + 1}</h5>
                              <div className="details-grid">
                                <div className="detail-item">
                                  <span className="label">Name</span>
                                  <span className="value">{member.family_member_name}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">Birthdate</span>
                                  <span className="value">{formatDate(member.birthdate)}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">Age</span>
                                  <span className="value">{member.age}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">Educational Attainment</span>
                                  <span className="value">{member.educational_attainment}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No family members information available.</p>
                      )}
                    </div>
                  )}
                  {stepPage === 3 && (
                    <div className="detail-section">
                      <h4>Classification</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">Type</span>
                          <span className="value">{selectedUser.classification}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {stepPage === 4 && (
                    <div className="detail-section">
                      <h4>Needs/Problems</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">Details</span>
                          <span className="value">{selectedUser.needs_problems}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {stepPage === 5 && (
                    <div className="detail-section">
                      <h4>Emergency Contact</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">Name</span>
                          <span className="value">{selectedUser.emergency_name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Relationship</span>
                          <span className="value">{selectedUser.emergency_relationship}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Address</span>
                          <span className="value">{selectedUser.emergency_address}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Contact Number</span>
                          <span className="value">{selectedUser.emergency_contact}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {stepPage === 6 && (
                    <div className="detail-section">
                      <h4>Documents</h4>
                      {selectedUser.documents && selectedUser.documents.length > 0 ? (
                        <div className="documents-list">
                          {selectedUser.documents.map((doc, index) => {
                            const displayType = doc.document_type ? 
                              doc.document_type.replace('_documents', '').toUpperCase() : 'Document';
                            
                            return (
                              <div key={index} className="document-item">
                                <div className="document-header">
                                  <h5>{displayType}</h5>
                                </div>
                                <div className="document-preview">
                                  <img 
                                    src={doc.file_url} 
                                    alt={doc.display_name || displayType}
                                    className="document-thumbnail"
                                    onClick={() => window.open(doc.file_url, '_blank')}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Image+Not+Found";
                                    }}
                                  />
                                </div>
                                <div className="document-actions">
                                  <button 
                                    className="btn view-btn full-width"
                                    onClick={() => window.open(doc.file_url, '_blank')}
                                  >
                                    <i className="fas fa-eye"></i> View Full Size
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p>No documents available.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              {selectedUser.status !== 'Pending Remarks' && selectedUser.status !== 'Terminated' && selectedUser.status !== 'Renewal' && (
                <>
                  <div className="modal-footer-left">
                    {stepPage > 1 && (
                      <button 
                        className="btn view-btn mobile-nav-btn"
                        onClick={() => setStepPage(stepPage - 1)}
                      >
                        <i className="fas fa-arrow-left"></i> Previous
                      </button>
                    )}
                  </div>
                  <div className="modal-footer-right">
                    {stepPage < 6 ? (
                      <button 
                        className="accept-mobile-nav-btn"
                        onClick={() => setStepPage(stepPage + 1)}
                      >
                        Next <i className="fas fa-arrow-right"></i>
                      </button>
                    ) : null}
                  </div>
                </>
              )}
              <button className="btn view-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="soloparent-modal-overlay">
          <div className="soloparent-success-modal">
            <div className="soloparent-success-content">
              <i className="fas fa-check-circle"></i>
              <p>{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Verification Modal */}
      {showRevokeModal && revokeUser && (
        <div className="solo-parent-modal-overlay" onClick={closeRevokeModal}>
          <div className="solo-parent-modal solo-parent-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="solo-parent-modal-header">
              <h3>Add Remarks for Revocation</h3>
              <button 
                className="close-btn"
                onClick={closeRevokeModal}
              >
                &times;
              </button>
            </div>
            <div className="solo-parent-modal-content compact">
              <div className="details-grid compact">
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">
                    {`${revokeUser.first_name || ''} ${revokeUser.middle_name || ''} ${revokeUser.last_name || ''}${revokeUser.suffix && revokeUser.suffix !== 'none' ? ` ${revokeUser.suffix}` : ''}`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Code ID:</span>
                  <span className="value">{revokeUser.code_id}</span>
                </div>
              </div>
              <div className="remarks-section compact">
                <label>Add remarks for revocation:</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter reason for revocation"
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
              <button className="btn decline-btn" onClick={closeRevokeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Beneficiary Confirmation Modal */}
      {showRemoveBeneficiaryModal && (
        <div className="modal-overlay" onClick={() => setShowRemoveBeneficiaryModal(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to remove {beneficiaryToRemove?.first_name || 'this user'} as a beneficiary?</p>
            <div className="modal-buttons">
              <button 
                className="btn cancel-btn" 
                onClick={() => setShowRemoveBeneficiaryModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn confirm-btn" 
                onClick={handleRemoveBeneficiary}
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Beneficiary Confirmation Modal */}
      {showSetBeneficiaryModal && (
        <div className="modal-overlay" onClick={() => setShowSetBeneficiaryModal(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Beneficiary Status</h3>
            <p>Are you sure you want to set {beneficiaryToSet?.first_name || 'this user'} as a beneficiary?</p>
            <div className="modal-buttons">
              <button 
                className="btn cancel-btn" 
                onClick={() => setShowSetBeneficiaryModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn confirm-btn" 
                onClick={handleSetBeneficiary}
                style={{backgroundColor: '#28a745'}}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {showIDModal && (
        <div className="soloparent-id-modal-overlay" onClick={closeIDModal}>
          <div className="soloparent-id-modal" onClick={(e) => e.stopPropagation()}>
            <div className="soloparent-id-modal-header">
              <h3>Solo Parent ID Card</h3>
              <button 
                className="soloparent-close-btn"
                onClick={closeIDModal}
              >
                &times;
              </button>
            </div>
            <div className="soloparent-id-modal-content">
              <div className="soloparent-id-cards-container">
                {/* Front of ID */}
                <div className="id-card front">
                  <div className="id-card-header">
                    <div className="id-logos">
                      <img src={dswdLogo} alt="DSWD Logo" className="id-logo" style={{ width: '60px', height: '60px' }} />
                      <div className="id-title">
                        <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                        <h4>Republic of the Philippines</h4>
                        <h4>DSWD Region III</h4>
                      </div>
                      <img src={mswdoLogo} alt="MSWDO Logo" className="id-logo" style={{ width: '60px', height: '60px' }} />
                    </div>
                  </div>
                  <div className="id-card-body">
                    <div className="id-left-section">
                      <div className="id-photo-container">
                        <img 
                          src={selectedIDUser.profilePic || selectedIDUser.profile_picture || avatarImage} 
                          alt="User" 
                          className="id-photo"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = avatarImage;
                          }}
                        />
                      </div>
                      <div className="id-category">
                        Category: {selectedIDUser.classification}
                      </div>
                      <div className="id-validity-container">
                        <span className="id-validity">
                          Valid Until: {selectedIDUser.validUntil ? new Date(selectedIDUser.validUntil).toLocaleDateString(undefined, {dateStyle: 'medium'}) : 'N/A'}
                        </span>
                        <img src={bagongPilipinasLogo} alt="Bagong Pilipinas Logo" className="bagong-pilipinas-logo" />
                      </div>
                    </div>
                    <div className="id-card-container">
                      <div className="id-card-details">
                        <div className="id-detail">
                          <span className="id-label">ID No:</span>
                          <span className="id-value">{selectedIDUser.code_id || 'N/A'}</span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Name:</span>
                          <span className="id-value">
                            {`${selectedIDUser.first_name || ''} ${selectedIDUser.middle_name || ''} ${selectedIDUser.last_name || ''}${selectedIDUser.suffix && selectedIDUser.suffix !== 'none' ? ` ${selectedIDUser.suffix}` : ''}`}
                          </span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Barangay:</span>
                          <span className="id-value">{selectedIDUser.barangay || 'N/A'}</span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Birthdate:</span>
                          <span className="id-value">
                            {selectedIDUser.date_of_birth ? new Date(selectedIDUser.date_of_birth).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Civil Status:</span>
                          <span className="id-value">{selectedIDUser.civil_status || 'N/A'}</span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Contact:</span>
                          <span className="id-value">{selectedIDUser.contact_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="id-card-qr-container">
                        <QRCodeSVG 
                          value={`user:${selectedIDUser?.userId}`}
                          size={120}
                          level="H"
                          includeMargin={false}
                          fgColor="#2E7D32"
                          bgColor="#ffffff"
                        />
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
                </div>
              </div>
            </div>
            <div className="soloparent-id-modal-actions">
              <button 
                className="soloparent-download-btn"
                onClick={() => downloadID('front')}
              >
                Download Front
              </button>
              <button 
                className="soloparent-download-btn"
                onClick={() => downloadID('back')}
              >
                Download Back
              </button>
              <button 
                className="soloparent-print-btn"
                onClick={printID}
              >
                Print ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoloParentManagement;