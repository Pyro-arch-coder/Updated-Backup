import React from "react";
import "./LogoutModal.css";

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="logout-modal-overlay">
      <div className="logout-modal">
        <h2>Confirm Logout</h2>
        <p>Are you sure you want to log out?</p>
        <div className="logout-modal-actions">
          <button className="logout-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="logout-modal-confirm" onClick={onConfirm}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
