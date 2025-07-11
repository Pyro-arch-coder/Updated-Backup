import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './SuperAdminLayout';
import SDashboard from './pages/SDashboard';
import AdminManagement from './pages/AdminManagement';
import Applications from './pages/Applications';
import AnnouncementManagement from './pages/AnnouncementManagement';
import Events from './pages/Events';
import ForumManagement from './pages/ForumManagement';
import SoloParentManagement from './pages/SoloParentManagement';
import SNewChildRequest from './pages/SNewChildRequest';
import Box from '@mui/material/Box';

export default function SuperAdminPage() {
  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<SDashboard />} />
          <Route path="/admins" element={<AdminManagement />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/announcements" element={<AnnouncementManagement />} />
          <Route path="/events" element={<Events />} />
          <Route path="/forums" element={<ForumManagement />} />
          <Route path="/soloparents" element={<SoloParentManagement />} />
          <Route path="/newchildrequests" element={<SNewChildRequest />} />
          <Route path="*" element={<Navigate to="/superadminpage" replace />} />
        </Routes>
      </Layout>
    </Box>
  );
}
