import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import IdentifyingInformation from "./steps/IdentifyingInformation";
import FamilyOccupation from "./steps/FamilyOccupation";
import Classification from "./steps/Classification";
import NeedsProblems from "./steps/NeedsProblems";
import InCaseOfEmergency from "./steps/InCaseOfEmergency";
import DocumentUpload from "./steps/DocumentUpload";
import FaceDetection from "./FaceDetection";
import "./MultiStepForm.css";

export default function MultiStepForm() {
  // Add age calculation function
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    first_name: "",
    middle_name: "",
    last_name: "",
    age: "",
    gender: "",
    date_of_birth: "",
    place_of_birth: "",
    barangay: "",
    education: "",
    civil_status: "",
    occupation: "",
    religion: "",
    company: "",
    income: "",
    employment_status: "",
    contact_number: "",
    email: "",
    pantawid_beneficiary: "",
    indigenous: "",
    suffix: "",
    
    // Step 2: Children
    children: [],

    // Step 3: Classification
    classification: "",

    // Step 4: Needs/Problems
    needs_problems: "",

    // Step 5: Emergency Contact
    emergency_name: "",
    emergency_contact: "",
    emergency_address: "",
    emergency_relationship: "",

    // Step 6: Face Recognition Photo
    faceRecognitionPhoto: "",

    // Step 7: Documents
    documents: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);
  const totalSteps = 7;

  const updateFormData = (newData) => {
    // Add age calculation when date of birth is updated
    if (newData.date_of_birth) {
      const calculatedAge = calculateAge(newData.date_of_birth);
      newData.age = calculatedAge.toString();
    }
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    // Each step component handles its own validation
    // If we reach here, validation has passed
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => setStep(step - 1);

  const handlePhotoCapture = async (photoData) => {
    // If photoData is null, it means the user chose to skip
    if (photoData === null) {
      console.log('Photo capture skipped');
      // Set faceRecognitionPhoto to null or a default placeholder
      updateFormData({ faceRecognitionPhoto: null });
      // Move to the next step
      nextStep();
      return;
    }
    
    try {
      // Convert base64 to blob
      const response = await fetch(photoData);
      const blob = await response.blob();
      const file = new File([blob], "face_recognition.jpg", { type: "image/jpeg" });

      // Create form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'soloparent');
      formData.append('folder', 'soloparent/users/face_recognition');

      // Upload to Cloudinary
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/dskj7oxr7/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();
      updateFormData({ faceRecognitionPhoto: cloudinaryData.secure_url });
      nextStep();
    } catch (error) {
      console.error('Error uploading face photo:', error);
      toast.error('Failed to upload face photo. Please try again.');
    }
  };

  const handleFinalSubmit = async () => {
    // Prevent duplicate submissions
    if (submissionInProgress.current) {
      console.log('Submission already in progress, skipping duplicate request');
      return {
        success: false,
        error: 'Submission already in progress'
      };
    }

    try {
      submissionInProgress.current = true;
      setIsSubmitting(true);
      console.log('Starting final form submission');
      
      // If we already have a code_id, return it without resubmitting
      if (formData.code_id) {
        console.log('Using existing code_id:', formData.code_id);
        return {
          success: true,
          code_id: formData.code_id
        };
      }
      
      // Submit all steps data to create user entry
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/documents/submitAllSteps`, {
        step1: {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          age: formData.age,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          place_of_birth: formData.place_of_birth,
          barangay: formData.barangay,
          education: formData.education,
          civil_status: formData.civil_status,
          occupation: formData.occupation,
          religion: formData.religion,
          company: formData.company,
          income: formData.income,
          employment_status: formData.employment_status,
          contact_number: formData.contact_number,
          email: formData.email,
          pantawid_beneficiary: formData.pantawid_beneficiary,
          indigenous: formData.indigenous,
          suffix: formData.suffix
        },
        step2: {
          children: formData.children || []
        },
        step3: {
          classification: formData.classification
        },
        step4: {
          needs_problems: formData.needs_problems
        },
        step5: {
          emergency_name: formData.emergency_name,
          emergency_relationship: formData.emergency_relationship,
          emergency_address: formData.emergency_address,
          emergency_contact: formData.emergency_contact
        },
        step6: {
          faceRecognitionPhoto: formData.faceRecognitionPhoto || null
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create user");
      }

      const code_id = response.data.code_id;
      console.log('All steps submitted successfully with code_id:', code_id);

      // Update form data with the new code_id
      const updatedFormData = {
        ...formData,
        code_id: code_id
      };
      updateFormData(updatedFormData);

      return {
        success: true,
        code_id: code_id
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle various error responses from the backend
      if (error.response) {
        const errorData = error.response.data;
        console.log('Error response data:', errorData);
        
        // Check if the error is due to duplicate entry but an existing code_id was returned
        if (errorData.existing_code_id) {
          const code_id = errorData.existing_code_id;
          console.log('Using existing code_id from error response:', code_id);
          
          // Update form data with the existing code_id
          const updatedFormData = {
            ...formData,
            code_id: code_id
          };
          updateFormData(updatedFormData);
          
          // Show a toast that we're using an existing submission
          toast.info(errorData.details || 'Using existing submission');
          
          return {
            success: true,
            code_id: code_id,
            message: 'Using existing submission'
          };
        }
        
        // Handle different error codes
        if (errorData.errorCode === 'ER_DUP_ENTRY') {
          toast.error(errorData.details || 'A duplicate entry was detected. Please use a different email address.');
        } else if (errorData.errorCode === 'ER_LOCK_WAIT_TIMEOUT') {
          toast.error(errorData.details || 'The system is busy. Please try again in a moment.');
        } else {
          // Generic error message for other cases
          toast.error(errorData.error || errorData.details || "Registration failed. Please try again.");
        }
      } else {
        // Network error or other issues
        toast.error("Registration failed. Please check your connection and try again.");
      }
      
      // Rethrow for DocumentUpload component to handle
      throw error;
    } finally {
      // Reset submission status after a delay to prevent rapid resubmissions
      setTimeout(() => {
        submissionInProgress.current = false;
        setIsSubmitting(false);
      }, 2000);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <IdentifyingInformation
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <FamilyOccupation
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <Classification
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <NeedsProblems
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <InCaseOfEmergency
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 6:
        return (
          <div className="face-recognition-step">
            <h2>Take a Face Recognition Photo</h2>
            <p>Please take a clear photo of your face for identity verification.</p>
            <FaceDetection onPhotoCapture={handlePhotoCapture} />
            <div className="form-navigation-buttons">
              <div className="left-buttons">
                <button className="previous-btn" onClick={prevStep}>
                  Previous
                </button>
              </div>
              <div className="right-buttons">
                <button className="skip-btn" onClick={() => handlePhotoCapture(null)}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <DocumentUpload
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            handleSubmit={handleFinalSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="multistep-form-container">
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
      </div>
      {renderStep()}
    </div>
  );
}
