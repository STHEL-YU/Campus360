import React, { useState } from "react";
import {
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Clock,
  Pencil,
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  BadgeCheck,
  KeyRound,
  AlertCircle,
} from "lucide-react";

const ROLE_CONFIG = {
  Dean: {
    scopeLabel: "College",
    subtitle: "Manage your dean account and college access",
    permissions: [
      "View users in your college",
      "Approve or decline college account requests",
      "Post college announcements",
      "Review reports filed in your college",
      "View campus monitoring (read-only)",
    ],
    defaults: {
      name: "Dr. Elena Garcia",
      email: "elena.garcia@campus360.edu",
      phone: "+63 917 555 0142",
      employeeId: "DEAN-10482",
      scope: "College of Engineering",
      joined: "Jun 3, 2019",
      lastLogin: "Today, 8:42 AM",
    },
  },
  Administrator: {
    scopeLabel: "Office",
    subtitle: "Manage your administrator account and system access",
    permissions: [
      "Manage all users, including blocking and deleting",
      "Approve or decline any account request",
      "Publish university-wide announcements",
      "Accept, resolve, decline and delete campus reports",
      "View campus monitoring and responder status",
    ],
    defaults: {
      name: "Dr. Maria Santos",
      email: "maria.santos@campus360.edu",
      phone: "+63 917 555 0199",
      employeeId: "ADM-99012",
      scope: "Central Administration",
      joined: "Jan 15, 2018",
      lastLogin: "Today, 7:58 AM",
    },
  },
};

export default function Profile({ role = "Dean" }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.Dean;

  const [profile, setProfile] = useState(config.defaults);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [notice, setNotice] = useState("");

  // Password form
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-wider text-slate-500";

  const initials = (name) =>
    name
      .replace(/^(Dr\.|Prof\.)\s*/i, "")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");

  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  };

  // Edit profile
  const openEdit = () => {
    setEditForm({ ...profile });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditForm(null);
    setPasswords({ current: "", next: "", confirm: "" });
    setPasswordError("");
    setShowPasswords(false);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    // Password fields are optional
    const wantsPasswordChange =
      passwords.current || passwords.next || passwords.confirm;

    if (wantsPasswordChange) {
      if (!passwords.current) {
        setPasswordError("Enter your current password.");
        return;
      }
      if (passwords.next.length < 8) {
        setPasswordError("New password must be at least 8 characters.");
        return;
      }
      if (passwords.next !== passwords.confirm) {
        setPasswordError("New password and confirmation do not match.");
        return;
      }
      // TODO: send the password change to your backend here
    }

    setProfile({
      ...editForm,
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      scope: editForm.scope.trim(),
    });
    closeEdit();
    showNotice(
      wantsPasswordChange
        ? "Profile and password updated."
        : "Profile updated.",
    );
  };

  //Change password 
  const handlePasswordChange = (field, value) => {
    setPasswordError("");
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const detailRows = [
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Phone", value: profile.phone || "Not provided" },
    { icon: Shield, label: "Employee ID", value: profile.employeeId },
    { icon: Building2, label: config.scopeLabel, value: profile.scope },
    { icon: Calendar, label: "Member since", value: profile.joined },
    { icon: Clock, label: "Last sign-in", value: profile.lastLogin },
  ];

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-100 select-none font-sans">
      <div className="p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        {/* Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
              Campus360 Command Center
            </span>
            <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
            <p className="text-xs text-slate-500">{config.subtitle}</p>
          </div>

          {notice && (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200/60 text-emerald-700 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {notice}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Profile summary card */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center gap-4 shadow-2xs">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-3xl shadow-md shadow-blue-500/20">
              {initials(profile.name)}
            </div>

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {profile.name}
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold">
                <BadgeCheck className="w-3.5 h-3.5" />
                {role}
              </span>
              <span className="text-xs text-slate-500">{profile.scope}</span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active
            </span>

            <button
              onClick={openEdit}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit profile</span>
            </button>
          </div>

          {/* Details and Access */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Account details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs">
              <div className="mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  Account details
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Your information as shown to other campus staff
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {detailRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 text-xs"
                    >
                      <span className="text-slate-400 font-medium flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                        {row.label}
                      </span>
                      <span className="font-bold text-slate-900 text-right break-all">
                        {row.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Access */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs">
              <div className="mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  What you can do
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Access granted to the {role.toLowerCase()} role
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {config.permissions.map((permission) => (
                  <li
                    key={permission}
                    className="flex items-center gap-2.5 text-xs text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Edit profile
              </h2>
              <button
                onClick={closeEdit}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Full name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleEditChange("name", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleEditChange("phone", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Employee ID</label>
                <input
                  type="text"
                  value={editForm.employeeId}
                  disabled
                  className={`${inputClass} text-slate-400 cursor-not-allowed`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>{config.scopeLabel}</label>
                <input
                  type="text"
                  value={editForm.scope}
                  onChange={(e) => handleEditChange("scope", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Change password (optional) */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    Change password
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Optional. Leave blank to keep your current password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
                >
                  {showPasswords ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  {showPasswords ? "Hide" : "Show"}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Current password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) =>
                    handlePasswordChange("current", e.target.value)
                  }
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>New password</label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwords.next}
                    onChange={(e) =>
                      handlePasswordChange("next", e.target.value)
                    }
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Confirm password</label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) =>
                      handlePasswordChange("confirm", e.target.value)
                    }
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
              </div>

              {passwordError && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={closeEdit}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!editForm.name.trim() || !editForm.email.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
