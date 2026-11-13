import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Lock,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Pencil,
  X,
  Camera,
  Loader2,
} from "lucide-react";

export default function Profile({ onLogout }) {
  const [profile, setProfile] = useState({
    name: "Alexandra Reyes",
    studentId: "2024-01842",
    college: "College of Engineering",
    program: "BS Information Technology",
    yearLevel: "Third year",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const [avatarFile, setAvatarFile] = useState(null); // raw file, for your upload API
  const [avatarError, setAvatarError] = useState("");

  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwError, setPwError] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const openEdit = () => {
    setDraft(profile);
    setAvatarFile(null);
    setAvatarError("");
    setPwForm({ current: "", next: "", confirm: "" });
    setPwError("");
    setIsEditing(true);
  };

  const closeEdit = () => setIsEditing(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setAvatarError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be 2 MB or smaller.");
      return;
    }

    setAvatarError("");
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Password is optional: only validate if the student typed something
    const wantsPasswordChange = pwForm.next || pwForm.confirm;
    if (wantsPasswordChange) {
      if (pwForm.next.length < 8) {
        setPwError("New password must be at least 8 characters.");
        return;
      }
      if (pwForm.next !== pwForm.confirm) {
        setPwError("New password and confirmation do not match.");
        return;
      }
    }
    setPwError("");

    // TODO: Connect to your API or backend update logic
    // - send `draft` (profile fields) and `avatarFile` (if not null)
    // - send pwForm.next only if wantsPasswordChange
    setProfile(draft);
    setIsEditing(false);
  };

  const closeLogoutConfirm = () => {
    if (isLoggingOut) return; // can't dismiss while logging out
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Short delay so the loader is visible even if onLogout is instant
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (onLogout) await onLogout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* Main Container */}
      <main className="px-5 pt-4 max-w-md mx-auto space-y-6">
        {/* Header Profile Card (Deep Navy Theme with Centered Avatar) */}
        <div className="bg-[#0f172a] rounded-3xl p-6 text-center text-white shadow-lg relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Centered Profile Picture */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-md">
                <img
                  src={profile.avatar}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Edit Button */}
              <button
                type="button"
                onClick={openEdit}
                aria-label="Edit profile"
                className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#0f172a] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Name & ID */}
          <h2 className="text-lg font-bold text-white">{profile.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{profile.studentId}</p>

          {/* Verified Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            Verified account
          </div>
        </div>

        {/* University Information Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            University information
          </h3>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Account type</span>
              <span className="font-bold text-slate-900">Student</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-slate-400 font-medium">College</span>
              <span className="font-bold text-slate-900">
                {profile.college}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Program</span>
              <span className="font-bold text-slate-900">
                {profile.program}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Year level</span>
              <span className="font-bold text-slate-900">
                {profile.yearLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Log Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold py-3.5 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center mt-3">
            Campus360 Mobile · Version 1.0.0
          </p>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-5"
          onClick={closeLogoutConfirm}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm log out"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-6 text-center"
          >
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Log out?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to log out of your account?
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={closeLogoutConfirm}
                disabled={isLoggingOut}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-2xl shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <span>Log out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={closeEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit profile
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update your personal information
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close"
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Profile Photo */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md">
                    <img
                      src={draft.avatar}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="avatar-input"
                    aria-label="Change profile photo"
                    className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  JPG or PNG, up to 2 MB
                </p>
                {avatarError && (
                  <p className="text-[11px] font-semibold text-red-600">
                    {avatarError}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Student ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={draft.studentId}
                  onChange={(e) =>
                    setDraft({ ...draft, studentId: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* College */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  College
                </label>
                <div className="relative">
                  <select
                    value={draft.college}
                    onChange={(e) =>
                      setDraft({ ...draft, college: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm font-medium"
                  >
                    <option value="College of Engineering">
                      College of Engineering
                    </option>
                    <option value="College of Arts & Sciences">
                      College of Arts & Sciences
                    </option>
                    <option value="College of Nursing">
                      College of Nursing
                    </option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Program */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Program
                </label>
                <input
                  type="text"
                  required
                  value={draft.program}
                  onChange={(e) =>
                    setDraft({ ...draft, program: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Year Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Year level
                </label>
                <div className="relative">
                  <select
                    value={draft.yearLevel}
                    onChange={(e) =>
                      setDraft({ ...draft, yearLevel: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm font-medium"
                  >
                    <option value="First year">First year</option>
                    <option value="Second year">Second year</option>
                    <option value="Third year">Third year</option>
                    <option value="Fourth year">Fourth year</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  New password{" "}
                  <span className="text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={pwForm.next}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, next: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Confirm new password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwForm.confirm}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirm: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Password Error */}
              {pwError && (
                <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {pwError}
                </p>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2 mb-20">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3.5 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3.5 rounded-2xl shadow-md transition-colors"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
