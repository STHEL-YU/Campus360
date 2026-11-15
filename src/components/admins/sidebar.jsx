import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Newspaper,
  Users,
  LogOut,
  ShieldCheck,
  User,
  Loader2,
} from "lucide-react";
import { getAdminProfile, signOut } from "../../auth";

export default function Sidebar() {
  const navigate = useNavigate();
  const admin = getAdminProfile() || {};
  const adminName =
    [admin.first_name, admin.middle_name, admin.last_name]
      .filter(Boolean)
      .join(" ") || "Administrator";
  const adminInitials =
    [admin.first_name, admin.last_name]
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .toUpperCase() || "AD";
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  /* Navigation Menu Items */
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Campus Monitoring", icon: Map, path: "/report" },
    { name: "News & Announcements", icon: Newspaper, path: "/news" },
    { name: "User Management", icon: Users, path: "/users" },
    { name: "My Profile", icon: User, path: "/profile" },
  ];

  // Close the modal with the Escape key (not while logging out)
  useEffect(() => {
    if (!showLogout) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loggingOut) setShowLogout(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogout, loggingOut]);

  const closeModal = () => {
    if (!loggingOut) setShowLogout(false);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");
    let loggedOut = false;
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-Campus360-Admin": "1" },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to log out.");
      }

      signOut("admin");
      navigate("/login", { replace: true });
      loggedOut = true;
    } catch (error) {
      setLogoutError(error.message || "Unable to log out.");
    } finally {
      setLoggingOut(false);
      if (loggedOut) setShowLogout(false);
    }
  };

  return (
    <>
      <aside className="w-72 bg-[#0c192c] text-slate-300 flex flex-col justify-between h-screen p-5 select-none font-sans border-r border-slate-800">
        {/* Top Section */}
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center">
                Campus<span className="text-blue-500">360</span>
              </div>
              <div className="text-[10px] tracking-wider font-semibold text-slate-400 uppercase">
                University Safety
              </div>
            </div>
          </div>

          {/* Security Center Widget Card */}
          <div className="bg-[#12233b] border border-slate-700/50 rounded-2xl p-3.5 shadow-inner">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Security Center
            </div>
            <div className="text-sm font-semibold text-white mb-2">
              Central Administration
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-400 font-medium">
                Systems operational
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 overflow-y-auto pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "hover:bg-slate-800/60 text-slate-300 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}
                        />
                        <span className="tracking-tight">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            isActive
                              ? "bg-blue-700 text-white"
                              : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-4">
          {/* User Profile Card */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-md shadow-blue-500/20">
              {adminInitials}
            </div>
            <div className="flex flex-col overflow-hidden flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {adminName}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {admin.college || "Administrator"}
              </span>
            </div>
            <button
              onClick={() => {
                setLogoutError("");
                setShowLogout(true);
              }}
              title="Log out"
              aria-label="Log out"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogout && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 flex flex-col gap-5 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h2
                  id="logout-title"
                  className="text-base font-bold text-slate-900"
                >
                  Log out of Campus360?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You will need to sign in again to open the dashboard.
                </p>
                {logoutError && (
                  <p className="mt-2 text-xs text-rose-600" role="alert">
                    {logoutError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={loggingOut}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-70"
              >
                {loggingOut && <Loader2 className="w-4 h-4 animate-spin" />}
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
