import React, { useState } from "react";
import { useForm } from "react-hook-form";
import "./Classification.css";
import "./shared.css";

export default function Classification({
  prevStep,
  nextStep,
  formData,
  updateFormData
}) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: formData
  });
  const [showOthersInput, setShowOthersInput] = useState(false);
  const selectedClassification = watch("classification");

  const onSubmit = async (data) => {
    const selected = classifications.find(c => c.code === data.classification);
    const saveValue = selected.code === '013' ? data.others_details : selected.saveValue;
    updateFormData({ classification: saveValue });
    nextStep();
  };

  const classifications = [
    { code: "001", label: "Birth due to rape / Kapanganakan dahil sa panggagahasa", saveValue: "001" },
    { code: "002", label: "Death of spouse / Pagkamatay ng asawa", saveValue: "002" },
    { code: "003", label: "Detention of spouse / Pagkakakulong ng asawa", saveValue: "003" },
    { code: "004", label: "Spouse's physical/mental incapacity / Pisikal o mental na kapansanan ng asawa", saveValue: "004" },
    { code: "005", label: "Legal/de facto separation / Legal o de facto na paghihiwalay", saveValue: "005" },
    { code: "006", label: "Annulled/nullified marriage / Pinawalang-bisa o nullified na kasal", saveValue: "006" },
    { code: "007", label: "Abandoned by spouse / Inabandona ng asawa", saveValue: "007" },
    { code: "008", label: "OFW's spouse/family member / Asawa o miyembro ng pamilya ng OFW", saveValue: "008" },
    { code: "009", label: "Unmarried mother/father / Nakakaisang ina o ama", saveValue: "009" },
    { code: "010", label: "Legal guardian/adoptive parent / Legal na tagapag-alaga o adoptibong magulang", saveValue: "010" },
    { code: "011", label: "Relative caring for child / Kamag-anak na nag-aalaga sa bata", saveValue: "011" },
    { code: "012", label: "Pregnant woman solo caregiver / Buntis na babae na solo caregiver", saveValue: "012" },
    { code: "013", label: "Others / Iba pa", saveValue: "Others" }
  ];

  React.useEffect(() => {
    setShowOthersInput(selectedClassification === "013");
  }, [selectedClassification]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="classification-form step-form">
      <h2 className="classification-header step-header">
        Step 3: Classification/Circumstances of Being a Solo Parent
        <span className="subtitle">(Dahilan bakit Naging Solo Parent)</span>
      </h2>

      <div className="classification-input-container">
        <label className="classification-label step-label">
          Please select your circumstances:
        </label>
        <select
          {...register("classification", { required: "This field is required" })}
          className={`classification-input step-input ${errors.classification ? 'error' : ''}`}
        >
          <option value="">Select your classification</option>
          {classifications.map((classification) => (
            <option key={classification.code} value={classification.code}>
              {classification.code} - {classification.label}
            </option>
          ))}
        </select>
        {errors.classification && (
          <p className="classification-error step-error">
            {errors.classification.message}
          </p>
        )}
      </div>

      {showOthersInput && (
        <div className="classification-input-container">
          <label className="classification-label step-label">
            Please specify your circumstances:
          </label>
          <textarea
            {...register("others_details", { 
              required: showOthersInput ? "This field is required" : false 
            })}
            className={`classification-input step-input ${errors.others_details ? 'error' : ''}`}
            placeholder="Please describe your circumstances"
            rows={4}
          />
          {errors.others_details && (
            <p className="classification-error step-error">
              {errors.others_details.message}
            </p>
          )}
        </div>
      )}

      <div className="classification-buttons">
        <button type="button" className="classification-back-btn step-button" onClick={prevStep}>
          Back
        </button>
        <button type="submit" className="classification-next-btn step-button">
          Next
        </button>
      </div>
    </form>
  );
}