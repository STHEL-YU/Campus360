import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import Sidebar from "./components/admins/sidebar";
import Dashboard from "./pages/admins/dashboard.jsx";
import CampusMonitoring from "./pages/admins/reportsmap.jsx";
import Announcement from "./pages/admins/announcement.jsx";
import UserManagement from "./pages/admins/usersmanagement.jsx";
import Profile from "./pages/admins/profile.jsx";
import Login from "./pages/admins/auth/login.jsx";
import { isAuthed, signIn } from "./auth";

const Placeholder = ({ title }) => (
  <main className="flex-1 flex items-center justify-center text-slate-500 text-lg font-medium">
    {title} (coming soon)
  </main>
);

// Login page (no sidebar). Already signed in? Go straight to the dashboard.
function LoginRoute() {
  const navigate = useNavigate();
  if (isAuthed()) return <Navigate to="/dashboard" replace />;

  return (
    <Login
      onNavigate={navigate}
      onLogin={async ({ email, password }) => {
        // TODO: call your API here. Throw new Error('message') to show an error.
        signIn();
      }}
      onGoogle={async ({ mode, profile }) => {
        // TODO: start Google sign-in here.
        // "signup": save `profile` and wait for admin approval (do NOT sign in yet).
        // "signin": sign in once Google succeeds.
        if (mode === "signin") signIn();
      }}
    />
  );
}

// Everything with the sidebar. Not signed in? Send to /login.
function AdminLayout() {
  if (!isAuthed()) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Route Views */}
      <Outlet />
    </div>
  );
}

// Dashboard links (/report, /users, /news) use React Router instead of a page reload
function DashboardRoute() {
  const navigate = useNavigate();
  return <Dashboard onNavigate={navigate} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Admin pages (with sidebar) */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/report" element={<CampusMonitoring />} />
          <Route path="/news" element={<Announcement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
