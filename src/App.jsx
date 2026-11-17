import React, { useEffect, useState } from "react";
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
import StudentAlerts from "./pages/students/studlistalert.jsx";
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
function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatNotificationTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationItems, setNotificationItems] = useState([]);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    if (!isAuthed("student")) return undefined;

    const controller = new AbortController();
    let requestInFlight = false;

    async function loadNotifications() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        async function loadFeed(url, field, errorMessage) {
          const response = await fetch(url, {
            credentials: "same-origin",
            signal: controller.signal,
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || errorMessage);
          }
          if (!Array.isArray(result[field])) {
            throw new Error(errorMessage);
          }
          return result[field];
        }

        const today = new Date().toISOString().slice(0, 10);
        const [announcementFeed, alertFeed, reportFeed] =
          await Promise.allSettled([
            loadFeed(
              "/api/news/feed",
              "announcements",
              "Unable to load announcements.",
            ),
            loadFeed(
              "/api/alerts/student-latest",
              "alerts",
              "Unable to load campus alerts.",
            ),
            loadFeed(
              "/api/student/report",
              "reports",
              "Unable to load your reports.",
            ),
          ]);
        if (controller.signal.aborted) return;

        const feeds = [
          { kind: "announcement", result: announcementFeed },
          { kind: "alert", result: alertFeed },
          { kind: "report", result: reportFeed },
        ];
        const failedFeeds = feeds.filter(
          ({ result }) => result.status === "rejected",
        );
        const failedKinds = new Set(failedFeeds.map(({ kind }) => kind));
        const errors = failedFeeds.map(
          ({ result }) =>
            result.reason.message || "Unable to load notifications.",
        );
        const announcements =
          announcementFeed.status === "fulfilled"
            ? announcementFeed.value
            : [];
        const alerts = alertFeed.status === "fulfilled" ? alertFeed.value : [];
        const reports =
          reportFeed.status === "fulfilled" ? reportFeed.value : [];
        const newAnnouncements = announcements.filter(
          (announcement) => announcement.publishedAt === today,
        );
        const items = [
          ...newAnnouncements.map((announcement) => ({
            key: `announcement-${announcement.id}`,
            kind: "announcement",
            id: announcement.id,
            title: announcement.title,
            type: announcement.type,
            published: announcement.published,
            imageUrl: announcement.imageUrl,
            sortAt: announcement.publishedAt,
          })),
          ...alerts
            .filter((alert) => isToday(alert.createdAt))
            .map((alert) => ({
              key: `alert-${alert.id}`,
              kind: "alert",
              id: alert.id,
              title: alert.title,
              type: "New campus alert",
              message: alert.message,
              published: formatNotificationTime(
                alert.alertTime || alert.createdAt,
              ),
              sortAt: alert.createdAt,
            })),
          ...reports
            .filter(
              (report) =>
                report.status?.toLowerCase() === "resolved" &&
                isToday(report.updatedAt),
            )
            .map((report) => ({
              key: `report-${report.id}`,
              kind: "report",
              id: report.id,
              title: `${report.reportNumber} resolved`,
              type: report.category || "Incident report",
              message: "Your incident report has been resolved.",
              published: formatNotificationTime(report.updatedAt),
              sortAt: report.updatedAt,
            })),
        ];

        setNotificationItems((previousItems) => {
          const retainedItems = previousItems.filter((item) =>
            failedKinds.has(item.kind),
          );
          return [...items, ...retainedItems].sort(
            (first, second) =>
              new Date(second.sortAt).getTime() -
              new Date(first.sortAt).getTime(),
          );
        });
        setNotificationError(errors.join(" "));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Student notification count failed:", error);
          setNotificationError(error.message || "Unable to load notifications.");
        }
      } finally {
        requestInFlight = false;
      }
    }

    loadNotifications();
    const refreshTimer = window.setInterval(loadNotifications, 15000);
    window.addEventListener("focus", loadNotifications);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadNotifications);
      controller.abort();
    };
  }, []);

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
          notificationItems={notificationItems}
          notificationError={notificationError}
          onNotificationSelect={(item) => {
            if (item.kind === "alert") {
              navigate("/student/alerts", { state: { alertId: item.id } });
            } else if (item.kind === "report") {
              navigate("/student/report", {
                state: { openReports: true, reportId: item.id },
              });
            } else {
              navigate("/student/news", {
                state: { announcementId: item.id },
              });
            }
          }}
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
