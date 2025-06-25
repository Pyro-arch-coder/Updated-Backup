import React, { createContext, useState, useEffect } from 'react';

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [adminId, setAdminId] = useState(null);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    // Get admin ID from localStorage when component mounts
    const storedAdminId = localStorage.getItem('id');
    if (storedAdminId) {
      setAdminId(storedAdminId);
    }
  }, []);

  const value = {
    adminId,
    setAdminId,
    adminData,
    setAdminData
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}; 