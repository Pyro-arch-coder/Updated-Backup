import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './AdminLayout';
import Dashboard from './pages/Dashboard';
import SoloParent from './pages/SoloParent';
import Box from '@mui/material/Box';

export default function AdminPage() {
  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/soloparents" element={<SoloParent />} />
          <Route path="*" element={<Navigate to="/adminpage" replace />} />
        </Routes>
      </Layout>
    </Box>
  );
}
