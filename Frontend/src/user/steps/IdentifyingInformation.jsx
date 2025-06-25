import React, { useState, useEffect, useRef } from "react";
import "./IdentifyingInformation.css";
import barangays from '../../data/santaMariaBarangays.json';
import philippineData from '../../data/philippines.json';

export default function IdentifyingInformation({ nextStep, updateFormData, formData }) {
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedBarangayOfBirth, setSelectedBarangayOfBirth] = useState("");
  const [municipalities, setMunicipalities] = useState([]);
  const [barangaysOfBirth, setBarangaysOfBirth] = useState([]);
  const prevPlaceOfBirthRef = useRef('');
  const updateFormDataRef = useRef(updateFormData);

  // Keep the reference to updateFormData function up to date
  useEffect(() => {
    updateFormDataRef.current = updateFormData;
  }, [updateFormData]);

  // Get provinces from the data structure only once
  const provinces = React.useMemo(() => {
    return Object.values(philippineData)
      .flatMap(region => 
        Object.keys(region.province_list)
      )
      .sort((a, b) => a.localeCompare(b));
  }, []);

  useEffect(() => {
    // When province changes, update the municipalities list
    if (selectedProvince) {
      // Find the region that contains this province
      const region = Object.values(philippineData).find(region => 
        Object.keys(region.province_list).includes(selectedProvince)
      );
      
      if (region) {
        // Get municipalities for this province
        const municipalitiesList = Object.keys(region.province_list[selectedProvince].municipality_list);
        setMunicipalities(municipalitiesList.sort((a, b) => a.localeCompare(b)));
      } else {
        setMunicipalities([]);
      }
    } else {
      setMunicipalities([]);
    }
    
    // Reset selected municipality when province changes
    setSelectedMunicipality("");
    setSelectedBarangayOfBirth("");
  }, [selectedProvince]);

  useEffect(() => {
    // Update barangays list when municipality changes
    if (selectedProvince && selectedMunicipality) {
      try {
        // Find the region that contains this province
        const region = Object.values(philippineData).find(region => 
          Object.keys(region.province_list).includes(selectedProvince)
        );
        
        if (region && 
            region.province_list[selectedProvince] && 
            region.province_list[selectedProvince].municipality_list && 
            region.province_list[selectedProvince].municipality_list[selectedMunicipality] &&
            region.province_list[selectedProvince].municipality_list[selectedMunicipality].barangay_list) {
          // Get barangays for this municipality
          const barangaysList = region.province_list[selectedProvince].municipality_list[selectedMunicipality].barangay_list;
          setBarangaysOfBirth(barangaysList.sort((a, b) => 
            typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : 0
          ));
        } else {
          setBarangaysOfBirth([]);
        }
      } catch (error) {
        console.error("Error loading barangays:", error);
        setBarangaysOfBirth([]);
      }
    } else {
      setBarangaysOfBirth([]);
    }

    // Reset selected barangay when municipality changes
    setSelectedBarangayOfBirth("");
  }, [selectedProvince, selectedMunicipality]);

  useEffect(() => {
    // Update place_of_birth when province, municipality, or barangay of birth changes
    let newPlaceOfBirth = "";
    
    if (selectedProvince && selectedMunicipality && selectedBarangayOfBirth) {
      newPlaceOfBirth = `${selectedBarangayOfBirth}, ${selectedMunicipality}, ${selectedProvince}`;
    } else if (selectedProvince && selectedMunicipality) {
      newPlaceOfBirth = `${selectedMunicipality}, ${selectedProvince}`;
    } else if (selectedProvince) {
      newPlaceOfBirth = selectedProvince;
    }

    // Only update if the place of birth value has actually changed
    if (newPlaceOfBirth !== prevPlaceOfBirthRef.current) {
      prevPlaceOfBirthRef.current = newPlaceOfBirth;
      // Use the ref to avoid the dependency on updateFormData
      updateFormDataRef.current({ place_of_birth: newPlaceOfBirth });
    }
  }, [selectedProvince, selectedMunicipality, selectedBarangayOfBirth]);

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Add text validation to prevent numeric input
  const handleTextInput = (e) => {
    const { name, value } = e.target;
    
    // Filter out numeric characters and special characters for name fields, occupation, and religion
    if (
      name === 'first_name' || 
      name === 'middle_name' || 
      name === 'last_name' || 
      name === 'suffix' || 
      name === 'occupation' || 
      name === 'religion'
    ) {
      // Allow only letters, spaces, periods, hyphens, and apostrophes
      const filteredValue = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s.\-']/g, '');
      
      if (filteredValue !== value) {
        // Update the input field with the filtered value
        e.target.value = filteredValue;
        
        // Update form data with filtered value
        updateFormData({ [name]: filteredValue });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date_of_birth') {
      const age = calculateAge(value);
      updateFormData({ [name]: value, age });
    } else if (name === 'employment_status') {
      // If employment status is changed to 'Not employed', clear occupation and company fields
      if (value === 'Not employed') {
        updateFormData({ [name]: value, occupation: '', company: '' });
      } else {
        updateFormData({ [name]: value });
      }
    } else if (name === 'contact_number') {
      let formattedValue = value.replace(/\D/g, '');
      if (!formattedValue.startsWith('09') && formattedValue.length > 0) {
        formattedValue = '09' + formattedValue.substring(formattedValue.length > 2 ? 2 : 0);
      }
      if (formattedValue.length <= 11) {
        updateFormData({ [name]: formattedValue });
      }
    } else if (name === 'income') {
      // Ensure income is saved as the selected text value
      updateFormData({ [name]: value || '' });
    } else if (name === 'province') {
      setSelectedProvince(value);
    } else if (name === 'municipality') {
      setSelectedMunicipality(value);
    } else if (name === 'barangay_of_birth') {
      setSelectedBarangayOfBirth(value);
    } else {
      updateFormData({ [name]: value });
    }
  };

  // Update the validation for contact number
  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name) {
      newErrors.first_name = "First Name is required.";
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(formData.first_name)) {
      newErrors.first_name = "First Name must contain only letters, spaces, and basic punctuation.";
    }

    // Middle name is optional, only validate format if provided
    if (formData.middle_name && !/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(formData.middle_name)) {
      newErrors.middle_name = "Middle Name must contain only letters, spaces, and basic punctuation.";
    }

    if (!formData.last_name) {
      newErrors.last_name = "Last Name is required.";
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(formData.last_name)) {
      newErrors.last_name = "Last Name must contain only letters, spaces, and basic punctuation.";
    }

    if (!formData.age || formData.age <= 0 || formData.age > 999) {
      newErrors.age = "Age must be a positive number between 1 and 999.";
    } else if (formData.age <= 11) {
      newErrors.age = "You must be older than 11 years old to register.";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required.";
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of Birth is required.";
    }

    if (!formData.place_of_birth) {
      newErrors.place_of_birth = "Place of Birth is required.";
    }

    if (!formData.barangay) {
      newErrors.barangay = "Barangay is required.";
    }

    if (!formData.education) {
      newErrors.education = "Educational Attainment is required.";
    }

    if (!formData.civil_status) {
      newErrors.civil_status = "Civil Status is required.";
    }

    // Only validate occupation if employment status is not 'Not employed'
    if (formData.employment_status !== 'Not employed') {
      if (!formData.occupation) {
        newErrors.occupation = "Occupation is required.";
      } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(formData.occupation)) {
        newErrors.occupation = "Occupation must contain only letters, spaces, and basic punctuation.";
      }
    }

    if (!formData.religion) {
      newErrors.religion = "Religion is required.";
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(formData.religion)) {
      newErrors.religion = "Religion must contain only letters, spaces, and basic punctuation.";
    }

    // Only validate company if employment status is not 'Not employed'
    if (formData.employment_status !== 'Not employed' && !formData.company) {
      newErrors.company = "Company/Agency is required.";
    }

    // Add this single income validation
    if (!formData.income) {
      newErrors.income = "Monthly Income is required.";
    }

    if (!formData.employment_status) {
      newErrors.employment_status = "Employment Status is required.";
    }

    if (!formData.contact_number || !formData.contact_number.startsWith('09') || formData.contact_number.length !== 11) {
      newErrors.contact_number = "Contact Number must start with 09 and be exactly 11 digits.";
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid Email Address is required.";
    }

    if (!formData.pantawid_beneficiary) {
      newErrors.pantawid_beneficiary = "Pantawid Beneficiary status is required.";
    }

    if (!formData.indigenous) {
      newErrors.indigenous = "Indigenous status is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Run validation
    const isValid = validateForm();
  
    if (isValid) {
      // Show success message briefly
      setSuccessMessage("Form validated successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        nextStep(); // Move to the next step
      }, 1000); 
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Auto-clear errors after a few seconds
      setTimeout(() => {
        setErrors({});
      }, 5000); 
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="identifying-form">
      <h2 className="identifying-header">Step 1: Identifying Information</h2>
      
      {successMessage && <div className="success-message">{successMessage}</div>} {/* Display success message */}

      {/* Names - Side by Side */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">First Name *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name || ''}
            onChange={handleChange}
            onInput={handleTextInput}
            className="identifying-input"
            placeholder="Enter your first name"
            maxLength={20}
          />
          {errors.first_name && <span className="error">{errors.first_name}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Middle Name <span className="optional-label">(Optional)</span></label>
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name || ''}
            onChange={handleChange}
            onInput={handleTextInput}
            className="identifying-input"
            placeholder="Enter your middle name"
            maxLength={20}
          />
          {errors.middle_name && <span className="error">{errors.middle_name}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Last Name *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name || ''}
            onChange={handleChange}
            onInput={handleTextInput}
            className="identifying-input"
            placeholder="Enter your last name"
            maxLength={20}
          />
          {errors.last_name && <span className="error">{errors.last_name}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Suffix <span className="optional-label">(Optional)</span></label>
          <select
            name="suffix"
            value={formData.suffix || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="">--Select--</option>
            <option value="Jr.">Jr.</option>
            <option value="Sr.">Sr.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
          {errors.suffix && <span className="error">{errors.suffix}</span>}
        </div>
      </div>

      {/* Date of Birth & Age */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Date of Birth *</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Select your birth date"
            max={(() => {
              const today = new Date();
              const minAge = 12; // Minimum age required is 12 (older than 11)
              const maxDate = new Date(
                today.getFullYear() - minAge,
                today.getMonth(),
                today.getDate()
              );
              return maxDate.toISOString().split('T')[0];
            })()}
          />
          {errors.date_of_birth && <span className="error">{errors.date_of_birth}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age || ''}
            readOnly
            className="identifying-input"
            placeholder="Auto-calculated from birth date"
          />
          {errors.age && <span className="error">{errors.age}</span>}
        </div>
      </div>

      {/* Gender & Place of Birth */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Gender *</label>
          <select
            name="gender"
            value={formData.gender || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="LGBTQ+">LGBTQ+</option>
          </select>
          {errors.gender && <span className="error">{errors.gender}</span>}
        </div>
      </div>

      {/* Place of Birth - Province and Municipality */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Province of Birth *</label>
          <select
            name="province"
            value={selectedProvince}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Select Province</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="identifying-label">Municipality/City of Birth *</label>
          <select
            name="municipality"
            value={selectedMunicipality}
            onChange={handleChange}
            className="identifying-input"
            disabled={!selectedProvince}
          >
            <option value="" disabled>Select Municipality/City</option>
            {municipalities.map((municipality) => (
              <option key={municipality} value={municipality}>
                {municipality}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Barangay of Birth */}
      <div className="form-group">
        <label className="identifying-label">Barangay of Birth *</label>
        <select
          name="barangay_of_birth"
          value={selectedBarangayOfBirth}
          onChange={handleChange}
          className="identifying-input"
          disabled={!selectedMunicipality}
        >
          <option value="" disabled>Select Barangay</option>
          {barangaysOfBirth.map((barangay) => (
            <option key={barangay} value={barangay}>
              {barangay}
            </option>
          ))}
        </select>
      </div>
      
      {/* Display the combined place of birth (hidden) */}
      <input 
        type="hidden" 
        name="place_of_birth" 
        value={formData.place_of_birth || ''} 
      />
      {errors.place_of_birth && <span className="error">{errors.place_of_birth}</span>}

      {/* Address */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Municipality</label>
          <input
            type="text"
            value="Santa Maria"
            disabled
            className="identifying-input"
          />
        </div>
        <div className="form-group">
          <label className="identifying-label">Barangay *</label>
          <select
            name="barangay"  
            value={formData.barangay || ''}  
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Select Barangay</option>
            {barangays.Barangays.map((barangay, index) => (
              <option key={index} value={barangay}>
                {barangay}
              </option>
            ))}
          </select>
          {errors.barangay && <span className="error">{errors.barangay}</span>}
        </div>
      </div>

      {/* Educational Attainment and Civil Status in one row */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Educational Attainment *</label>
          <select
            name="education"
            value={formData.education || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Educational Attainment</option>
            <option value="College Graduate">College Graduate</option>
            <option value="College Undergraduate">College Undergraduate</option>
            <option value="High School Graduate">High School Graduate</option>
            <option value="High School Undergraduate">High School Undergraduate</option>
            <option value="Elementary Graduate">Elementary Graduate</option>
            <option value="Elementary Undergraduate">Elementary Undergraduate</option>
          </select>
          {errors.education && <span className="error">{errors.education}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Civil Status *</label>
          <select
            name="civil_status"
            value={formData.civil_status || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          {errors.civil_status && <span className="error">{errors.civil_status}</span>}
        </div>
      </div>

      {/* Religion */}
      <div className="form-group">
        <label className="identifying-label">Religion *</label>
        <input
          type="text"
          name="religion"
          value={formData.religion || ''}
          onChange={handleChange}
          onInput={handleTextInput}
          className="identifying-input"
          placeholder="Enter your religion"
          maxLength={20}
        />
        {errors.religion && <span className="error">{errors.religion}</span>}
      </div>
      
      {/* Employment Status, Occupation, Company/Agency, and Monthly Income in one row */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Employment Status *</label>
          <select
            name="employment_status"
            value={formData.employment_status || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Employed">Employed</option>
            <option value="Self-employed">Self-employed</option>
            <option value="Not employed">Not employed</option>
          </select>
          {errors.employment_status && <span className="error">{errors.employment_status}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Occupation {formData.employment_status !== 'Not employed' && '*'}</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation || ''}
            onChange={handleChange}
            onInput={handleTextInput}
            className="identifying-input"
            placeholder={formData.employment_status === 'Not employed' ? "Not applicable" : "Enter your occupation"}
            maxLength={20}
            disabled={formData.employment_status === 'Not employed'}
          />
          {formData.employment_status === 'Not employed' && 
            <span className="info-text" style={{ color: '#666', fontSize: '0.8rem' }}>Field disabled when not employed</span>
          }
          {errors.occupation && <span className="error">{errors.occupation}</span>}
        </div>
      </div>
      
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Company/Agency {formData.employment_status !== 'Not employed' && '*'}</label>
          <input
            type="text"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder={formData.employment_status === 'Not employed' ? "Not applicable" : "Enter your company/agency"}
            maxLength={40}
            disabled={formData.employment_status === 'Not employed'}
          />
          {formData.employment_status === 'Not employed' && 
            <span className="info-text" style={{ color: '#666', fontSize: '0.8rem' }}>Field disabled when not employed</span>
          }
          {errors.company && <span className="error">{errors.company}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Monthly Income *</label>
          <select
            name="income"
            value={formData.income || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Select Income Range</option>
            <option value="Below ₱10,000">Below ₱10,000</option>
            <option value="₱11,000-₱20,000">₱11,000-₱20,000</option>
            <option value="₱21,000-₱43,000">₱21,000-₱43,000</option>
            <option value="₱44,000 and above">₱44,000 and above</option>
          </select>
          {errors.income && <span className="error">{errors.income}</span>}
        </div>
      </div>

      
      {/* Contact Number & Email */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Contact Number *</label>
          <input
            type="text"
            name="contact_number"
            value={formData.contact_number || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="09XXXXXXXXX"
          />
          {errors.contact_number && <span className="error">{errors.contact_number}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Email Address *(Please use an active email address)</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="example@email.com"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
      </div>

      {/* Pantawid Beneficiary & Indigenous */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Pantawid Beneficiary *</label>
          <select
            name="pantawid_beneficiary"
            value={formData.pantawid_beneficiary || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {errors.pantawid_beneficiary && <span className="error">{errors.pantawid_beneficiary}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Indigenous *</label>
          <select
            name="indigenous"
            value={formData.indigenous || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {errors.indigenous && <span className="error">{errors.indigenous}</span>}
        </div>
      </div>

      <button type="submit" className="identifying-next-btn">Next</button>
    </form>
  );
}
