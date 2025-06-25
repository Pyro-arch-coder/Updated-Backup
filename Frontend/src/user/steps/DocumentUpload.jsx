import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./shared.css";
import "./DocumentUpload.css";

const DocumentUpload = ({ formData, updateFormData, prevStep, handleSubmit }) => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const documentTypes = {
    psa: "PSA Birth Certificate",
    itr: "Income Tax Return",
    med_cert: "Medical Certificate",
    marriage: "Marriage Certificate",
    cenomar: "CENOMAR",
    death_cert: "Death Certificate"
  };

  // Document icons mapping
  const documentIcons = {
    psa: "📜",
    itr: "💰",
    med_cert: "🏥",
    marriage: "💍",
    cenomar: "📝",
    death_cert: "📄"
  };

  const handleFileSelect = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [documentType]: file
    }));

    // Reset progress for this document type
    setUploadProgress(prev => ({
      ...prev,
      [documentType]: 0
    }));
  };

  const handleRemoveFile = (documentType, e) => {
    // Stop event propagation to prevent triggering parent elements
    if (e) {
      e.stopPropagation();
    }
    
    if (isUploading) return;
    
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[documentType];
      return newFiles;
    });

    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[documentType];
      return newProgress;
    });
    
    // Reset the file input element
    const fileInput = document.getElementById(`file-${documentType}`);
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Show feedback to user
    toast.success(`${documentTypes[documentType]} file removed`);
  };

  const uploadToCloudinary = async (file, documentType, code_id) => {
    try {
      console.log('Uploading to Cloudinary:', { file, documentType, code_id });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'soloparent');
      formData.append('folder', `soloparent/users/${code_id}/documents/${documentType}`);

      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dskj7oxr7/upload',
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [documentType]: percentCompleted
            }));
          }
        }
      );

      if (!response.data.secure_url) {
        throw new Error('Failed to get URL from Cloudinary');
      }

      return response.data.secure_url;
    } catch (error) {
      console.error(`Error uploading ${documentType} to Cloudinary:`, error);
      throw error;
    }
  };

  const insertDocumentToDatabase = async (documentType, fileName, url, code_id) => {
    try {
      console.log(`Inserting ${documentType} document:`, {
        code_id,
        file_name: url,
        display_name: fileName,
        uploaded_at: new Date().toISOString(),
        status: 'pending'
      });

      // This is a placeholder for the actual API call to your backend
      // Replace with your actual API endpoint
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/documents/${documentType}`,
        {
          code_id: code_id,
          file_name: url,
          uploaded_at: new Date().toISOString(),
          status: 'pending',
          display_name: fileName,
          // rejection_reason will be null by default
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to insert document');
      }

      return response.data;
    } catch (error) {
      console.error(`Error inserting ${documentType} document to database:`, error);
      throw error;
    }
  };

  const handleRegistrationSubmit = async () => {
    // Prevent duplicate submissions
    if (isUploading) {
      console.log("Upload already in progress, preventing duplicate submission");
      return;
    }

    setIsUploading(true);

    try {
      // First, ensure we have a valid code_id by submitting the form data
      let code_id;
      
      // Check if we already have a valid code_id
      if (formData.code_id && formData.code_id !== 'default_user_id') {
        // Use existing code_id from form data
        code_id = formData.code_id;
        console.log("Using existing code_id:", code_id);
      } else {
        try {
          // Call handleSubmit to submit the form data first
          const submitResult = await handleSubmit();
          
          // Check if submission was successful
          if (!submitResult || !submitResult.success) {
            console.log("Form submission was not successful:", submitResult);
            // If submission is already in progress, wait and try again
            if (submitResult && submitResult.error === 'Submission already in progress') {
              toast.info("Submission is being processed, please wait...");
              setIsUploading(false);
              return;
            }
            throw new Error("Failed to submit form");
          }

          // Extract the code_id from the result
          code_id = submitResult.code_id;
          
          // Update the form data with the code_id if it's not already set
          if (!formData.code_id || formData.code_id !== code_id) {
            updateFormData({
              ...formData,
              code_id: code_id
            });
          }
          
          console.log("Form submitted successfully, using code_id:", code_id);
        } catch (error) {
          console.error("Error during form submission:", error);
          toast.error("Failed to submit form. Please try again.");
          setIsUploading(false);
          return;
        }
      }

      const uploadResults = {};

      // Process each file sequentially if any files are selected
      if (Object.keys(selectedFiles).length > 0) {
        for (const [documentType, file] of Object.entries(selectedFiles)) {
          try {
            // Upload to Cloudinary
            const cloudinaryUrl = await uploadToCloudinary(file, documentType, code_id);
            
            // Insert document info to database
            await insertDocumentToDatabase(documentType, file.name, cloudinaryUrl, code_id);
            
            uploadResults[documentType] = {
              success: true,
              fileName: file.name,
              url: cloudinaryUrl
            };
            
            toast.success(`${documentTypes[documentType]} uploaded successfully`);
          } catch (error) {
            uploadResults[documentType] = {
              success: false,
              error: error.message
            };
            toast.error(`Failed to upload ${documentTypes[documentType]}: ${error.message}`);
          }
        }
      }

      // Update form data with the upload results if any files were uploaded
      if (Object.keys(uploadResults).length > 0) {
        updateFormData({
          ...formData,
          documents: uploadResults,
          code_id: code_id
        });
      }
      
      toast.success("Registration submitted successfully! Redirecting to success page...");
      
      // Redirect to the submission success page after a short delay to show the success message
      setTimeout(() => {
        navigate('/submission-success');
      }, 2000);

    } catch (error) {
      console.error("Error in registration submission:", error);
      toast.error(`Registration submission failed: ${error.message}`);
    } finally {
      // Add a small delay before setting isUploading to false to prevent rapid resubmissions
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  };

  // Helper function to determine which documents are required based on civil status
  const getRequiredDocuments = () => {
    let requiredDocuments = ['psa', 'itr', 'med_cert']; // Base required documents for all statuses
    
    // Add specific documents based on civil status
    if (formData.civil_status === "Single") {
      requiredDocuments.push('cenomar');
    } else if (formData.civil_status === "Married") {
      requiredDocuments.push('marriage');
    } else if (formData.civil_status === "Widowed") {
      requiredDocuments.push('marriage', 'death_cert');
    } else if (formData.civil_status === "Divorced") {
      requiredDocuments.push('marriage');
    }
    
    return requiredDocuments;
  };

  // Check if all required documents are uploaded
  const isAllRequiredDocumentsUploaded = () => {
    // Return true to allow submission without requiring all documents
    return true;
  };

  // Get list of missing required documents
  const getMissingRequiredDocuments = () => {
    const requiredDocuments = getRequiredDocuments();
    return requiredDocuments.filter(type => !selectedFiles[type]);
  };

  // Function to get a shortened file ID
  const getShortFileId = (fileName) => {
    if (!fileName) return '';
    
    // Extract just the first 8 characters if it's a long filename
    if (fileName.length > 10) {
      return fileName.substring(0, 8) + '...';
    }
    return fileName;
  };

  // Function to get file extension
  const getFileExtension = (fileName) => {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  };

  useEffect(() => {
    // Debug log when component mounts or props change
    console.log('DocumentUpload component props:', {
      hasFormData: !!formData,
      civilStatus: formData.civil_status,
      hasUpdateFormData: typeof updateFormData === 'function',
      hasPrevStep: typeof prevStep === 'function',
      hasHandleSubmit: typeof handleSubmit === 'function',
      selectedFilesCount: Object.keys(selectedFiles).length,
      isUploading
    });
    
    // Log which document types will be displayed based on civil status
    if (formData.civil_status) {
      const displayedDocTypes = Object.keys(documentTypes).filter(type => {
        if (formData.civil_status === "Single" && (type === "marriage" || type === "death_cert")) {
          return false;
        }
        if (formData.civil_status === "Married" && (type === "cenomar" || type === "death_cert")) {
          return false;
        }
        if (formData.civil_status === "Widowed" && type === "cenomar") {
          return false;
        }
        if (formData.civil_status === "Divorced" && (type === "death_cert" || type === "cenomar")) {
          return false;
        }
        return true;
      });
      
      console.log(`Documents displayed for ${formData.civil_status} status:`, 
        displayedDocTypes.map(type => documentTypes[type])
      );
    }
  }, [formData, updateFormData, prevStep, handleSubmit, selectedFiles, isUploading, documentTypes]);

  return (
    <div className="document-upload-container">
      <h2 className="document-upload-header">Document Upload</h2>
      <p className="document-upload-description">
        Please upload the required documents to complete your registration
        <br />
        <span className="file-upload-hint">Accepted formats: JPG, PNG, or PDF (max 5MB each)</span>
      </p>

      {/* Display document requirements based on civil status */}
      <div className="document-requirements-note">
        <h3>Required Documents for {formData.civil_status || 'Your Application'}</h3>
        <p>
          {formData.civil_status === "Single" && 
            "Your required documents include: PSA Birth Certificate, Income Tax Return, Medical Certificate, and CENOMAR."
          }
          {formData.civil_status === "Married" && 
            "Your required documents include: PSA Birth Certificate, Income Tax Return, Medical Certificate, and Marriage Certificate."
          }
          {formData.civil_status === "Widowed" && 
            "Your required documents include: PSA Birth Certificate, Income Tax Return, Medical Certificate, Marriage Certificate, and Death Certificate. CENOMAR is not required."
          }
          {formData.civil_status === "Divorced" && 
            "Your required documents include: PSA Birth Certificate, Income Tax Return, Medical Certificate, and Marriage Certificate. CENOMAR and Death Certificate are not required."
          }
          {!formData.civil_status && 
            "Document requirements vary based on your civil status. Please complete Step 1 first."
          }
        </p>
      </div>

      <div className="document-list">
        {Object.entries(documentTypes).map(([type, label]) => {
          // Skip certain document types based on civil status
          if (formData.civil_status === "Single" && (type === "marriage" || type === "death_cert")) {
            return null;
          }
          if (formData.civil_status === "Married" && (type === "cenomar" || type === "death_cert")) {
            return null;
          }
          if (formData.civil_status === "Widowed" && type === "cenomar") {
            return null;
          }
          if (formData.civil_status === "Divorced" && (type === "death_cert" || type === "cenomar")) {
            return null;
          }
          
          return (
            <div key={type} className="document-item">
              <div className="document-item-header">
                <div className="document-icon">{documentIcons[type]}</div>
                <h3 className="document-label">{label}</h3>
              </div>
              
              <label className="file-upload-area" htmlFor={`file-${type}`}>
                <div className="file-upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="#40916c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 15V16C3 17.6569 3 18.4853 3.24224 19.0815C3.45338 19.6013 3.79878 20.0413 4.22836 20.3661C4.72283 20.7388 5.40061 20.9 6.75614 20.9H17.2439C18.5994 20.9 19.2772 20.9 19.7716 20.3661C20.2012 20.0413 20.5466 19.6013 20.7578 19.0815C21 18.4853 21 17.6569 21 16V15" stroke="#40916c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="file-upload-text">
                  {selectedFiles[type] ? "Change file" : "Choose a file"}
                </p>
                <span className="file-upload-hint">Click to browse</span>
                <input
                  id={`file-${type}`}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileSelect(e, type)}
                  disabled={isUploading}
                />
              </label>
              
              {uploadProgress[type] > 0 && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${uploadProgress[type]}%` }}
                    />
                  </div>
                  <div className="progress-text">{uploadProgress[type]}%</div>
                </div>
              )}
              
              {selectedFiles[type] && (
                <div className="file-status-container">
                  <div className="file-success-indicator">
                    <span className="selected-file-icon">✓</span>
                    <span className="file-selected-text">File selected</span>
                  </div>
                  <div className="selected-file">
                    <span className="selected-file-icon">
                      {getFileExtension(selectedFiles[type].name)}
                    </span>
                    <span className="selected-file-name">
                      {getShortFileId(selectedFiles[type].name)}
                    </span>
                    <button 
                      className="selected-file-remove" 
                      onClick={(e) => handleRemoveFile(type, e)}
                      title="Remove file"
                      disabled={isUploading}
                      aria-label="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="button-group">
        <button 
          type="button" 
          onClick={prevStep}
          disabled={isUploading}
          className="prev-button"
        >
          Previous
        </button>
        <button 
          type="button" 
          onClick={handleRegistrationSubmit}
          disabled={isUploading}
          className={`submit-button ${isUploading ? 'uploading' : ''}`}
        >
          {isUploading ? "Uploading..." : "Submit Registration"}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
