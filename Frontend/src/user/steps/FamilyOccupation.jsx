import { useForm } from "react-hook-form";
import React, { useEffect } from "react";
import "./FamilyOccupation.css";
import "./shared.css";

export default function FamilyOccupation({ prevStep, nextStep, formData, updateFormData }) {
  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm({
    defaultValues: formData
  });

  const rawNumberOfChildren = watch("Number of children") || 0;
  // Ensure numberOfChildren is always a safe integer between 0 and 100
  const numberOfChildren = Number.isInteger(parseInt(rawNumberOfChildren)) && 
    parseInt(rawNumberOfChildren) >= 0 && parseInt(rawNumberOfChildren) <= 100 
    ? parseInt(rawNumberOfChildren) 
    : 0;

  // Get the minimum date for child's birthdate based on parent's birthdate + 11 years
  const getMinValidChildDate = () => {
    if (!formData.date_of_birth) return "";
    
    const parentBirthdate = new Date(formData.date_of_birth);
    // A parent should be at least 11 years older than their child
    const minParentAgeForChild = 11;
    const minDate = new Date(
      parentBirthdate.getFullYear() + minParentAgeForChild,
      parentBirthdate.getMonth(),
      parentBirthdate.getDate()
    );
    return minDate.toISOString().split('T')[0];
  };

  // Clear children data when number of children changes
  useEffect(() => {
    // Clear existing children data when number changes
    const currentChildren = formData.children || [];
    
    if (currentChildren.length !== numberOfChildren) {
      updateFormData({ 
        ...formData,
        children: Array(numberOfChildren).fill({
          first_name: "",
          middle_name: "",
          last_name: "",
          suffix: "",  // Add this line
          birthdate: "",
          age: "",
          educational_attainment: ""
        })
      });
    }
  }, [numberOfChildren]);

  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    
    // Check if birthdate is in the future
    if (birthDateObj > today) {
      return "Invalid date";
    }
    
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Handle text input to filter out numbers and special characters
  const handleTextInput = (e) => {
    const { name, value } = e.target;
    
    // Allow only letters, spaces, periods, hyphens, and apostrophes
    const filteredValue = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s.\-']/g, '');
    
    if (filteredValue !== value) {
      // Update the input field with the filtered value
      e.target.value = filteredValue;
      
      // Update the form value
      const fieldNameParts = name.match(/children\[(\d+)\]\.(\w+)/);
      if (fieldNameParts && fieldNameParts.length === 3) {
        const index = fieldNameParts[1];
        const field = fieldNameParts[2];
        setValue(`children[${index}].${field}`, filteredValue);
      }
    }
  };

  const birthdates = numberOfChildren > 0 
    ? Array.from({ length: numberOfChildren }).map((_, index) =>
        watch(`children[${index}].birthdate`)
      )
    : [];

  useEffect(() => {
    birthdates.forEach((birthdate, index) => {
      if (birthdate) {
        const age = calculateAge(birthdate);
        setValue(`children[${index}].age`, age);
      }
    });
  }, [birthdates, setValue]);

  // Add this function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onSubmit = async (data) => {
    const isValid = await trigger();
    if (!isValid) return;
  
    const childrenData = numberOfChildren > 0
      ? Array.from({ length: numberOfChildren }).map((_, index) => {
          // Ensure middle_name is optional and can be empty
          return {
            first_name: data.children?.[index]?.first_name || "",
            middle_name: data.children?.[index]?.middle_name || "", // This can be empty
            last_name: data.children?.[index]?.last_name || "",
            suffix: data.children?.[index]?.suffix || "",
            birthdate: data.children?.[index]?.birthdate || "",
            age: data.children?.[index]?.age || "",
            educational_attainment: data.children?.[index]?.educational_attainment || ""
          };
        })
      : [];
  
    updateFormData({ 
      ...formData,
      "Number of children": numberOfChildren,
      children: childrenData 
    });
    nextStep();
  };
  
  // Validation function for required name fields
  const validateName = (value) => {
    if (!value) return "This field is required";
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(value)) {
      return "Name must contain only letters, spaces, and basic punctuation";
    }
    return true;
  };
  
  // Validation function for optional name fields
  const validateOptionalName = (value) => {
    if (value && !/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(value)) {
      return "Name must contain only letters, spaces, and basic punctuation";
    }
    return true;
  };
  
  return (
    <form className="family-form step-form" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="family-header step-header">
        Step 2: Family Occupation and Composition
        <span className="subtitle">(Hanapbuhay at Komposisyon ng Pamilya)</span>
      </h2>

      <div className="family-input-group">
        <label className="form-label step-label">Number of Children</label>
        <input
          className={`form-input step-input ${errors["Number of children"] ? 'error' : ''}`}
          type="number"
          placeholder="Enter number of children"
          min="0"
          max="100"
          {...register("Number of children", {
            required: "This field is required",
            min: { value: 0, message: "Number of children cannot be negative" },
            max: { value: 100, message: "Number of children cannot exceed 100" },
            valueAsNumber: true
          })}
          onBlur={() => trigger("Number of children")}
        />
        {errors["Number of children"] &&
          <span className="error-message step-error">{errors["Number of children"].message}</span>
        }
      </div>

      {Array.from({ length: numberOfChildren }).map((_, index) => (
        <div key={index} className="child-form">
          <h4>Child {index + 1}</h4>

          <div className="child-section">
            <h5>Full Name</h5>
            <div className="name-row step-row">
              <div>
                <input
                  className="form-input step-input"
                  type="text"
                  placeholder="First name"
                  maxLength={20}
                  onInput={handleTextInput}
                  {...register(`children[${index}].first_name`, { 
                    required: "First name is required",
                    validate: validateName,
                    maxLength: { value: 20, message: "First name cannot exceed 20 characters" }
                  })}
                />
                {errors.children?.[index]?.["first_name"] &&
                  <span className="error-message step-error">{errors.children[index]["first_name"].message}</span>
                }
              </div>
              <div>
                <input
                  className="form-input step-input"
                  type="text"
                  placeholder="Middle name (Optional)"
                  maxLength={20}
                  onInput={handleTextInput}
                  {...register(`children[${index}].middle_name`, { 
                    required: false, // Explicitly set as not required
                    validate: validateOptionalName,
                    maxLength: { value: 20, message: "Middle name cannot exceed 20 characters" }
                  })}
                />
                {errors.children?.[index]?.["middle_name"] &&
                  <span className="error-message step-error">{errors.children[index]["middle_name"].message}</span>
                }
              </div>
              <div>
                <input
                  className="form-input step-input"
                  type="text"
                  placeholder="Last name"
                  maxLength={20}
                  onInput={handleTextInput}
                  {...register(`children[${index}].last_name`, { 
                    required: "Last name is required",
                    validate: validateName,
                    maxLength: { value: 20, message: "Last name cannot exceed 20 characters" }
                  })}
                />
                {errors.children?.[index]?.["last_name"] &&
                  <span className="error-message step-error">{errors.children[index]["last_name"].message}</span>
                }
              </div>
            </div>
            <div>
              <select
                className="form-input step-input"
                {...register(`children[${index}].suffix`)}
              >
                <option value="">No Suffix</option>
                <option value="Jr">Jr.</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="V">V</option>
              </select>
            </div>
          </div>

          <div className="child-section">
            <div className="birth-info">
              <div>
                <label className="form-label step-label">Birthdate</label>
                <input
                  className="form-input step-input"
                  type="date"
                  max={getTodayDate()}
                  min={getMinValidChildDate()}
                  {...register(`children[${index}].birthdate`, {
                    required: "Birthdate is required",
                    validate: value => {
                      const birthDate = new Date(value);
                      const today = new Date();
                      if (birthDate > today) {
                        return "Birthdate cannot be in the future";
                      }
                      
                      // Check that the child is not older than the parent
                      if (formData.date_of_birth) {
                        const parentBirthDate = new Date(formData.date_of_birth);
                        
                        // Child cannot be born before parent
                        if (birthDate < parentBirthDate) {
                          return "Child cannot be born before parent";
                        }
                        
                        // Parent should be at least 11 years older than child
                        const parentBirthYear = parentBirthDate.getFullYear();
                        const childBirthYear = birthDate.getFullYear();
                        const yearDifference = childBirthYear - parentBirthYear;
                        
                        if (yearDifference < 11) {
                          return "Parent must be at least 11 years older than child";
                        }
                      }
                      
                      const age = calculateAge(value);
                      return age <= 22 || "Child must be 22 years old or younger";
                    }
                  })}
                  onChange={(e) => {
                    const birthdate = e.target.value;
                    if (birthdate) {
                      const age = calculateAge(birthdate);
                      setValue(`children[${index}].age`, age);
                    }
                  }}
                />
                {errors.children?.[index]?.birthdate &&
                  <span className="error-message step-error">{errors.children[index].birthdate.message}</span>
                }
              </div>

              <div>
                <label className="form-label step-label">Age (Auto-Calculated)</label>
                <input
                  className="form-input step-input"
                  type="number"
                  placeholder="Age"
                  {...register(`children[${index}].age`)}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="child-section">
            <h5>Educational Background</h5>
            <select
              className="form-input step-input"
              defaultValue=""
              {...register(`children[${index}].educational_attainment`, {
                required: "Educational Attainment is required"
              })}
            >
              <option value="" disabled>Select Educational Attainment</option>
              <option value="Not Applicable">Not Applicable</option>
              <option value="College Graduate">College Graduate</option>
              <option value="College Undergraduate">College Undergraduate</option>
              <option value="High School Graduate">High School Graduate</option>
              <option value="High School Undergraduate">High School Undergraduate</option>
              <option value="Elementary Graduate">Elementary Graduate</option>
              <option value="Elementary Undergraduate">Elementary Undergraduate</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="Daycare">Daycare</option>
            </select>
            {errors.children?.[index]?.["educational_attainment"] &&
              <span className="error-message step-error">
                {errors.children[index]["educational_attainment"].message}
              </span>
            }
          </div>
        </div>
      ))}

      <div className="form-buttons">
        <button type="button" className="back-btn step-button" onClick={prevStep}>
          Back
        </button>
        <button type="submit" className="next-btn step-button">
          Next
        </button>
      </div>
    </form>
  );
}
