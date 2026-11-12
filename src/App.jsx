import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/admins/sidebar';
import Dashboard from './pages/admins/dashboard.jsx';
import CampusMonitoring from './pages/admins/reportsmap.jsx';
import Announcement from './pages/admins/announcement.jsx';
import UserManagement from './pages/admins/usersmanagement.jsx';
import Profile from './pages/admins/profile.jsx';
const Placeholder = ({ title }) => (
  <main className="flex-1 flex items-center justify-center text-slate-500 text-lg font-medium">
    {title} (coming soon)
  </main>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Route Views */}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<CampusMonitoring />} />
          <Route path="/news" element={<Announcement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/profile" element={<Profile />} />
        
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}