import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import "./InCaseOfEmergency.css";
import "./shared.css";
import philippineData from '../../data/philippines.json';

export default function InCaseOfEmergency({ prevStep, nextStep, updateFormData, formData }) {
  const [errorMessages, setErrorMessages] = useState({});
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const prevAddressRef = useRef('');
  const updateFormDataRef = useRef(updateFormData);

  const { register, handleSubmit, setValue, watch, formState: { errors, touchedFields }, trigger } = useForm({
    defaultValues: {
      emergency_name: formData.emergency_name || "",
      emergency_relationship: formData.emergency_relationship || "",
      emergency_address: formData.emergency_address || "",
      emergency_contact: formData.emergency_contact || ""
    },
    mode: "onBlur" // Only validate on blur or submit
  });

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
    setSelectedBarangay("");
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
          setBarangays(barangaysList.sort((a, b) => 
            typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : 0
          ));
        } else {
          setBarangays([]);
        }
      } catch (error) {
        console.error("Error loading barangays:", error);
        setBarangays([]);
      }
    } else {
      setBarangays([]);
    }

    // Reset selected barangay when municipality changes
    setSelectedBarangay("");
  }, [selectedProvince, selectedMunicipality]);

  useEffect(() => {
    // Update emergency_address when province, municipality, or barangay changes
    let newAddress = "";
    
    if (selectedProvince && selectedMunicipality && selectedBarangay) {
      newAddress = `${selectedBarangay}, ${selectedMunicipality}, ${selectedProvince}`;
    } else if (selectedProvince && selectedMunicipality) {
      newAddress = `${selectedMunicipality}, ${selectedProvince}`;
    } else if (selectedProvince) {
      newAddress = selectedProvince;
    }

    // Only update if the address value has actually changed
    if (newAddress !== prevAddressRef.current && newAddress) {
      prevAddressRef.current = newAddress;
      setValue("emergency_address", newAddress);
      // Use the ref to avoid the dependency on updateFormData
      updateFormDataRef.current({ emergency_address: newAddress });
    }
  }, [selectedProvince, selectedMunicipality, selectedBarangay, setValue]);

  const validateEmergencyContact = (value) => {
    // Phone number must start with 09 and be exactly 11 digits
    if (!value) {
      return "Contact number is required";
    }
    if (!value.startsWith('09')) {
      return "Contact number must start with 09";
    }
    if (value.length !== 11) {
      return "Contact number must be exactly 11 digits";
    }
    if (!/^\d+$/.test(value)) {
      return "Contact number must contain only digits";
    }
    return true;
  };

  const validateName = (value) => {
    if (!value) {
      return "Name is required";
    }
    if (value.length < 2) {
      return "Name must be at least 2 characters";
    }
    if (value.length > 50) {
      return "Name must be less than 50 characters";
    }
    // Check if name contains only letters, spaces, dots, hyphens and apostrophes
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(value)) {
      return "Name must contain only letters, spaces, and punctuation";
    }
    return true;
  };

  const validateRelationship = (value) => {
    if (!value) {
      return "Relationship is required";
    }
    if (value.length < 2) {
      return "Relationship must be at least 2 characters";
    }
    if (value.length > 50) {
      return "Relationship must be less than 50 characters";
    }
    // Check if relationship contains only letters, spaces, dots, hyphens and apostrophes
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(value)) {
      return "Relationship must contain only letters, spaces, and punctuation";
    }
    return true;
  };

  const handleTextInput = (e) => {
    // Only allow letters, spaces, and punctuation
    const { name, value } = e.target;
    
    // Allow only letters, spaces, periods, hyphens, and apostrophes
    const filteredValue = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s.\-']/g, '');
    
    if (filteredValue !== value) {
      // If the value was changed (contained invalid characters), update with filtered value
      e.target.value = filteredValue;
      
      // Update form value
      setValue(name, filteredValue, { shouldValidate: true });
    }
  };

  const handleContactChange = (e) => {
    let value = e.target.value;
    
    // Only allow digits
    value = value.replace(/\D/g, '');
    
    // Ensure it starts with 09
    if (!value.startsWith('09') && value.length > 0) {
      value = '09' + value.substring(value.length > 2 ? 2 : 0);
    }
    
    // Limit to 11 digits
    if (value.length <= 11) {
      // Update the form value without validating
      setValue("emergency_contact", value, { shouldValidate: false });
      
      // Clear any previous custom error messages for this field
      setErrorMessages(prev => {
        const newErrors = { ...prev };
        delete newErrors.emergency_contact;
        return newErrors;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'province') {
      setSelectedProvince(value);
    } else if (name === 'municipality') {
      setSelectedMunicipality(value);
    } else if (name === 'barangay') {
      setSelectedBarangay(value);
    }
  };

  const onSubmitForm = (data) => {
    // Perform all validations before submitting
    const nameValidation = validateName(data.emergency_name);
    const relationshipValidation = validateRelationship(data.emergency_relationship);
    const contactValidation = validateEmergencyContact(data.emergency_contact);
    
    const newErrors = {};
    
    if (nameValidation !== true) {
      newErrors.emergency_name = nameValidation;
    }
    
    if (relationshipValidation !== true) {
      newErrors.emergency_relationship = relationshipValidation;
    }
    
    if (contactValidation !== true) {
      newErrors.emergency_contact = contactValidation;
    }

    if (!data.emergency_address) {
      newErrors.emergency_address = "Address is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrorMessages(newErrors);
      return;
    }
    
    updateFormData({
      emergency_name: data.emergency_name,
      emergency_relationship: data.emergency_relationship,
      emergency_address: data.emergency_address,
      emergency_contact: data.emergency_contact
    });
    nextStep();
  };

  return (
    <div className="ice-container">
      <form onSubmit={handleSubmit(onSubmitForm)} className="ice-form step-form">
        <h2 className="ice-header step-header">In Case of Emergency</h2>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Name</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergency_name || errorMessages.emergency_name ? 'error' : ''}`}
            placeholder="Full Name"
            onInput={handleTextInput}
            {...register("emergency_name", { 
              required: "This field is required",
              validate: validateName
            })}
          />
          {(errors.emergency_name || errorMessages.emergency_name) && 
            <p className="ice-error-message step-error">{errors.emergency_name?.message || errorMessages.emergency_name}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Relationship</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergency_relationship ? 'error' : ''}`}
            placeholder="Relationship"
            onInput={handleTextInput}
            {...register("emergency_relationship", { 
              required: "This field is required",
              validate: validateRelationship
            })}
          />
          {errors.emergency_relationship && <p className="ice-error-message step-error">{errors.emergency_relationship.message}</p>}
        </div>

        {/* Address using province, municipality, barangay selection */}
        <div className="ice-form-group">
          <label className="ice-form-label step-label">Address</label>
          
          <div className="ice-address-fields">
            {/* Province */}
            <div className="ice-form-subgroup">
              <label className="ice-form-sublabel">Province</label>
              <select
                name="province"
                className="ice-form-input step-input"
                value={selectedProvince}
                onChange={handleChange}
              >
                <option value="" disabled>Select Province</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Municipality */}
            <div className="ice-form-subgroup">
              <label className="ice-form-sublabel">Municipality/City</label>
              <select
                name="municipality"
                className="ice-form-input step-input"
                value={selectedMunicipality}
                onChange={handleChange}
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
            
            {/* Barangay */}
            <div className="ice-form-subgroup">
              <label className="ice-form-sublabel">Barangay</label>
              <select
                name="barangay"
                className="ice-form-input step-input"
                value={selectedBarangay}
                onChange={handleChange}
                disabled={!selectedMunicipality}
              >
                <option value="" disabled>Select Barangay</option>
                {barangays.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Hidden input to store the combined address */}
          <input 
            type="hidden" 
            {...register("emergency_address", { required: "Address is required" })}
          />
          {(errors.emergency_address || errorMessages.emergency_address) && 
            <p className="ice-error-message step-error">{errors.emergency_address?.message || errorMessages.emergency_address}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Contact Number</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergency_contact || errorMessages.emergency_contact ? 'error' : ''}`}
            placeholder="09XXXXXXXXX"
            maxLength={11}
            value={watch("emergency_contact") || ""}
            {...register("emergency_contact", { 
              required: "Contact number is required",
              validate: validateEmergencyContact,
              onChange: handleContactChange,
              onBlur: () => trigger("emergency_contact") // Validate on blur
            })}
          />
          {touchedFields.emergency_contact && (errors.emergency_contact || errorMessages.emergency_contact) && 
            <span className="error-message step-error">
              {errors.emergency_contact?.message || errorMessages.emergency_contact}
            </span>}
        </div>

        <div className="ice-form-buttons">
          <button type="button" onClick={prevStep} className="ice-back-btn step-button">Back</button>
          <button type="submit" className="ice-next-btn step-button">Next</button>
        </div>
      </form>
    </div>
  );
}
