import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Admin Pages
import AdminDashboard from "./pages/admins/dashboard.jsx";
import CampusMonitoring from "./pages/admins/reportsmap.jsx";
import Announcement from "./pages/admins/announcement.jsx";
import UserManagement from "./pages/admins/usersmanagement.jsx";
import AdminProfile from "./pages/admins/profile.jsx";
import AdminLogin from "./pages/admins/auth/login.jsx";

// Student Pages & Auth
import StudentDashboard from "./pages/students/studdashboard.jsx";
import StudentReport from "./pages/students/studreport.jsx";
import StudentAlerts from "./pages/students/studlistreport.jsx";
import StudentNews from "./pages/students/studnews.jsx";
import StudentProfile from "./pages/students/studprofile.jsx";
import StudentLogin from "./pages/students/auth/studlogin.jsx";
import StudentRegister from "./pages/students/auth/studsignup.jsx";
import SplashScreen from "./pages/students/studsplash.jsx";

// Components
import BottomNav from "./components/students/bottombar.jsx";
import TopBar from "./components/students/topbar.jsx";
import Sidebar from "./components/admins/sidebar.jsx";

// Authentication
import { isAuthed, signIn, signOut } from "./auth";

// ==========================================
// STUDENT LAYOUT
// ==========================================
function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only check student authentication
  if (!isAuthed("student")) {
    return <Navigate to="/student/login" replace />;
  }

  const getActiveTab = (pathname) => {
    if (pathname.startsWith("/student/report")) return "report";
    if (pathname.startsWith("/student/alerts")) return "alerts";
    if (pathname.startsWith("/student/news")) return "news";
    if (pathname.startsWith("/student/profile")) return "profile";
    return "home";
  };

  const handleTabChange = (tab) => {
    if (tab === "home") navigate("/student/dashboard");
    else if (tab === "report") navigate("/student/report");
    else if (tab === "alerts") navigate("/student/alerts");
    else if (tab === "news") navigate("/student/news");
    else if (tab === "profile") navigate("/student/profile");
  };

  const isHome = location.pathname === "/student/dashboard";

  return (
    <div className="flex justify-center bg-slate-950 min-h-screen font-sans">
      <div className="w-full max-w-md bg-slate-50 shadow-2xl relative flex flex-col h-screen overflow-hidden">
        <TopBar
          title="Campus360"
          showBack={!isHome}
          onBack={() => navigate(-1)}
          notificationCount={3}
        />

        <div className="flex-1 overflow-y-auto pb-28">
          <Outlet />
        </div>

        <BottomNav
          activeTab={getActiveTab(location.pathname)}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
}

// ==========================================
// ADMIN LAYOUT
// ==========================================
function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only check admin authentication
  if (!isAuthed("admin")) {
    return <Navigate to="/login" replace />;
  }

  const getActiveTab = (pathname) => {
    if (pathname.startsWith("/report")) return "report";
    if (pathname.startsWith("/news")) return "news";
    if (pathname.startsWith("/users")) return "users";
    if (pathname.startsWith("/profile")) return "profile";
    return "home";
  };

  const handleTabChange = (tab) => {
    if (tab === "home") navigate("/dashboard");
    else if (tab === "report") navigate("/report");
    else if (tab === "news") navigate("/news");
    else if (tab === "users") navigate("/users");
    else if (tab === "profile") navigate("/profile");
  };

  const handleLogout = () => {
    signOut("admin");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar
        activeTab={getActiveTab(location.pathname)}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
function StudentDashboardRoute() {
  const navigate = useNavigate();

  return <StudentDashboard onReportClick={() => navigate("/student/report")} />;
}

// ==========================================
// STUDENT PROFILE
// ==========================================
function StudentProfileRoute() {
  const navigate = useNavigate();

  return (
    <StudentProfile
      onLogout={async () => {
        try {
          const response = await fetch("/api/student/logout", {
            method: "POST",
            credentials: "same-origin",
          });
          if (!response.ok) {
            throw new Error("Unable to clear the student session.");
          }
        } catch (error) {
          console.error("Student logout request failed", error);
        } finally {
          signOut("student");
          navigate("/student/login", { replace: true });
        }
      }}
    />
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
function AdminDashboardRoute() {
  const navigate = useNavigate();

  return <AdminDashboard onReportClick={() => navigate("/report")} />;
}

// ==========================================
// ADMIN LOGIN
// ==========================================
function AdminLoginRoute() {
  const navigate = useNavigate();

  if (isAuthed("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminLogin
      onNavigate={navigate}
      onGoogle={async ({ mode, credential, profile }) => {
        const action = mode === "signup" ? "signup" : "login";
        const response = await fetch(`/api/admin/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential, profile }),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to authenticate admin.");
        }

        if (mode === "signin") {
          signIn("admin", result.admin);
        }
      }}
      onEmailPassword={async ({ mode, email, password, profile }) => {
        const action = mode === "signup" ? "signup" : "login";
        const response = await fetch(`/api/admin/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "password",
            email,
            password,
            profile,
          }),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to authenticate admin.");
        }

        if (mode === "signin") {
          signIn("admin", result.admin);
        }
      }}
    />
  );
}

// ==========================================
// STUDENT LOGIN
// ==========================================
function StudentLoginRoute() {
  const navigate = useNavigate();

  if (isAuthed("student")) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <StudentLogin
      onLogin={async (student) => {
        signIn("student", student);
        navigate("/student/dashboard", { replace: true });
      }}
      onRegisterClick={() => navigate("/student/signup")}
    />
  );
}

// ==========================================
// STUDENT REGISTRATION
// ==========================================
function StudentRegisterRoute() {
  const navigate = useNavigate();

  return (
    <StudentRegister
      onBack={() => navigate("/student/login")}
      onSuccess={() => navigate("/student/login")}
    />
  );
}

// ==========================================
// STUDENT SPLASH SCREEN
// ==========================================
function StudentSplashRoute() {
  const navigate = useNavigate();

  const goNext = () => {
    if (isAuthed("student")) {
      navigate("/student/dashboard", { replace: true });
    } else {
      navigate("/student/login", { replace: true });
    }
  };

  useEffect(() => {
    const timer = setTimeout(goNext, 2500);
    return () => clearTimeout(timer);
  }, []);

  return <SplashScreen onFinish={goNext} />;
}

// ==========================================
// MAIN APP
// ==========================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Splash */}
        <Route path="/" element={<StudentSplashRoute />} />

        {/* Authentication */}
        <Route path="/login" element={<AdminLoginRoute />} />
        <Route path="/student/login" element={<StudentLoginRoute />} />
        <Route path="/student/signup" element={<StudentRegisterRoute />} />

        {/* STUDENT ROUTES */}
        <Route element={<StudentLayout />}>
          <Route
            path="/student/dashboard"
            element={<StudentDashboardRoute />}
          />
          <Route path="/student/report" element={<StudentReport />} />
          <Route path="/student/alerts" element={<StudentAlerts />} />
          <Route path="/student/news" element={<StudentNews />} />
          <Route path="/student/profile" element={<StudentProfileRoute />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminDashboardRoute />} />
          <Route path="/report" element={<CampusMonitoring />} />
          <Route path="/news" element={<Announcement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/profile" element={<AdminProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/student/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
