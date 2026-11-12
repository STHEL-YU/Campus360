import React, { useState } from "react";
import {
  Users,
  Shield,
  BookOpen,
  GraduationCap,
  Calendar,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  Clock,
  Ban,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Mail,
  Unlock,
  MousePointerClick,
  Search,
} from "lucide-react";

export default function UserManagement() {
  const [usersList, setUsersList] = useState([
    {
      id: 1,
      name: "Alexandra Reyes",
      studentId: "2024-01842",
      accountType: "Student",
      college: "College of Engineering",
      program: "BS Information Technology",
      yearLevel: "Third year",
      status: "Active",
      email: "alexandra.reyes@campus360.edu",
    },
    {
      id: 2,
      name: "James Villanueva",
      studentId: "2024-02910",
      accountType: "Student",
      college: "College of Business",
      program: "BS Accountancy",
      yearLevel: "Second year",
      status: "Active",
      email: "james.villanueva@campus360.edu",
    },
    {
      id: 3,
      name: "Dr. Maria Santos",
      studentId: "ADM-99012",
      accountType: "Administrator",
      college: "Central Administration",
      program: "System Management",
      yearLevel: "Staff",
      status: "Active",
      email: "maria.santos@campus360.edu",
    },
    {
      id: 4,
      name: "Carlos Mendoza",
      studentId: "2023-00471",
      accountType: "Student",
      college: "College of Education",
      program: "BSEd Mathematics",
      yearLevel: "Fourth year",
      status: "Blocked",
      email: "carlos.mendoza@campus360.edu",
    },
    {
      id: 5,
      name: "Bianca Dela Cruz",
      studentId: "2025-03318",
      accountType: "Student",
      college: "College of Nursing",
      program: "BS Nursing",
      yearLevel: "First year",
      status: "Pending",
      email: "bianca.delacruz@campus360.edu",
      submitted: "Nov 12, 2026",
    },
    {
      id: 6,
      name: "Prof. Ramon Lopez",
      studentId: "FAC-20458",
      accountType: "Faculty",
      college: "College of Engineering",
      program: "Computer Engineering",
      yearLevel: "Staff",
      status: "Pending",
      email: "ramon.lopez@campus360.edu",
      submitted: "Nov 13, 2026",
    },
  ]);

  // View: 'directory' | 'pending'
  const [view, setView] = useState("directory");
  const [directoryFilter, setDirectoryFilter] = useState("all"); 
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedId, setSelectedId] = useState(1);
  const [pendingSelectedId, setPendingSelectedId] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);

  // ---------- Derived data ----------
  const approvedUsers = usersList.filter((u) => u.status !== "Pending");
  const pendingUsers = usersList.filter((u) => u.status === "Pending");
  const blockedUsers = usersList.filter((u) => u.status === "Blocked");

  const visibleUsers =
    directoryFilter === "blocked" ? blockedUsers : approvedUsers;

  // Search: name, ID, type, program / college, status
  const query = searchTerm.trim().toLowerCase();
  const filteredUsers = visibleUsers.filter(
    (u) =>
      !query ||
      [u.name, u.studentId, u.accountType, u.program, u.college, u.status].some(
        (value) => (value || "").toLowerCase().includes(query),
      ),
  );

  const selectedUser = approvedUsers.find((u) => u.id === selectedId) || null;
  const pendingSelected =
    pendingUsers.find((u) => u.id === pendingSelectedId) || null;

  const isSelectedBlocked = selectedUser?.status === "Blocked";

  // Navigation
  const showDirectory = (filter) => {
    setDirectoryFilter(filter);
    setView("directory");
  };

  const showPending = () => {
    setView("pending");
  };

  // Edit 
  const openEdit = () => {
    if (!selectedUser) return;
    setEditForm({ ...selectedUser });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditForm(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = () => {
    if (!editForm.name.trim() || !editForm.studentId.trim()) return;

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === editForm.id
          ? {
              ...editForm,
              name: editForm.name.trim(),
              studentId: editForm.studentId.trim(),
              email: editForm.email.trim(),
            }
          : u,
      ),
    );
    closeEdit();
  };

  // Block / Unblock  
  const handleBlock = () => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === selectedId ? { ...u, status: "Blocked" } : u)),
    );
    setIsBlockOpen(false);
  };

  const handleUnblock = () => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === selectedId ? { ...u, status: "Active" } : u)),
    );
  };

  // Delete 
  const handleDelete = () => {
    setUsersList((prev) => prev.filter((u) => u.id !== selectedId));
    setSelectedId(null);
    setIsDeleteOpen(false);
  };

  // Approve / Decline 
  const handleApprove = () => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === pendingSelectedId ? { ...u, status: "Active" } : u,
      ),
    );
    setPendingSelectedId(null);
  };

  const handleDecline = () => {
    setUsersList((prev) => prev.filter((u) => u.id !== pendingSelectedId));
    setPendingSelectedId(null);
    setIsDeclineOpen(false);
  };

  // Styles  
  const statusStyles = (status) => {
    if (status === "Active")
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
        dot: "bg-emerald-500",
      };
    if (status === "Blocked")
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-200/60",
        dot: "bg-rose-500",
      };
    if (status === "Pending")
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200/60",
        dot: "bg-amber-500",
      };
    return {
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    };
  };

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-wider text-slate-500";

  const initials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("");

  const statCards = [
    {
      key: "total",
      label: "Total users",
      value: approvedUsers.length,
      hint: "Approved campus members",
      icon: Users,
      iconWrap: "bg-blue-50 text-blue-600",
      active: view === "directory" && directoryFilter === "all",
      ring: "ring-blue-500",
      onClick: () => showDirectory("all"),
    },
    {
      key: "pending",
      label: "Pending approval",
      value: pendingUsers.length,
      hint: "Waiting for review",
      icon: Clock,
      iconWrap: "bg-amber-50 text-amber-600",
      active: view === "pending",
      ring: "ring-amber-500",
      onClick: showPending,
    },
    {
      key: "blocked",
      label: "Blocked users",
      value: blockedUsers.length,
      hint: "Access restricted",
      icon: Ban,
      iconWrap: "bg-rose-50 text-rose-600",
      active: view === "directory" && directoryFilter === "blocked",
      ring: "ring-rose-500",
      onClick: () => showDirectory("blocked"),
    },
  ];

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-100 select-none font-sans">
      {/* Page Content Body */}
      <div className="p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        {/* Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
              Campus360 Command Center
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              User management
            </h1>
            <p className="text-xs text-slate-500">
              Manage approved students, faculty, administrators, and responders
            </p>
          </div>
 
          {view === "directory" && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, ID, type, program, status..."
                className="w-72 bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.key}
                onClick={card.onClick}
                className={`text-left bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs hover:shadow-md transition-all ${
                  card.active ? `ring-2 ${card.ring}` : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {card.label}
                  </span>
                  <span className="text-3xl font-bold text-slate-900 leading-none">
                    {card.value}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {card.hint}
                  </span>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.iconWrap}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </button>
            );
          })}
        </div>

        {/* DIRECTORY VIEW  */}
        {view === "directory" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Users Directory Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {directoryFilter === "blocked"
                      ? "Blocked users"
                      : "Approved users directory"}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {query
                      ? `${filteredUsers.length} of ${visibleUsers.length} users match your search`
                      : directoryFilter === "blocked"
                        ? "Showing users with restricted access"
                        : "Showing approved campus members"}
                  </p>
                </div>

                {directoryFilter !== "all" && (
                  <button
                    onClick={() => setDirectoryFilter("all")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear filter
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                        Name
                      </th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                        ID
                      </th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                        Type
                      </th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                        Program / College
                      </th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const s = statusStyles(user.status);

                      return (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedId(user.id)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedId === user.id ? "bg-blue-50/50" : ""}`}
                        >
                          <td className="py-4 px-4 font-semibold text-slate-900">
                            {user.name}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {user.studentId}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {user.accountType}
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {user.program}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] border ${s.badge}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                              ></span>
                              {user.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-slate-400 font-medium"
                        >
                          {query
                            ? "No users match your search."
                            : "No users found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected User Info Card */}
            {selectedUser ? (
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/20">
                      {initials(selectedUser.name)}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {selectedUser.name}
                      </h2>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {selectedUser.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-blue-600" /> Student
                      ID
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedUser.studentId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-600" /> Account
                      type
                    </span>
                    <span className="font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {selectedUser.accountType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" /> College
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedUser.college}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />{" "}
                      Program
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedUser.program}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Year
                      level
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedUser.yearLevel}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={openEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {isSelectedBlocked ? (
                    <button
                      onClick={handleUnblock}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unblock</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsBlockOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Block</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 shadow-2xs items-center justify-center text-center min-h-[320px]">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <MousePointerClick className="w-6 h-6 text-slate-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  No user selected
                </h2>
                <p className="text-xs text-slate-500 max-w-[220px]">
                  Click a user from the list to see their full details here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PENDING REVIEW VIEW */}
        {view === "pending" && (
          <div className="flex flex-col gap-4">
            <div>
              <button
                onClick={() => showDirectory("all")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to users directory
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Pending Requests List */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Pending approval requests
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Review each request to approve or decline
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                        <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                          Name
                        </th>
                        <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                          ID
                        </th>
                        <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                          Type
                        </th>
                        <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                          Submitted
                        </th>
                        <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingUsers.map((user) => {
                        const s = statusStyles(user.status);
                        const isSelected = pendingSelectedId === user.id;

                        return (
                          <tr
                            key={user.id}
                            onClick={() => setPendingSelectedId(user.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-amber-50/60"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            <td className="py-4 px-4 font-semibold text-slate-900">
                              {user.name}
                            </td>
                            <td className="py-4 px-4 text-slate-600">
                              {user.studentId}
                            </td>
                            <td className="py-4 px-4 text-slate-600">
                              {user.accountType}
                            </td>
                            <td className="py-4 px-4 text-slate-500">
                              {user.submitted}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] border ${s.badge}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                                ></span>
                                {user.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {pendingUsers.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-10 text-center text-slate-400 font-medium"
                          >
                            No pending requests. You're all caught up.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Review Card */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs min-h-[320px]">
                {pendingSelected ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-amber-500/20">
                          {initials(pendingSelected.name)}
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">
                            {pendingSelected.name}
                          </h2>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {pendingSelected.email}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setPendingSelectedId(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-4 text-xs">
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-blue-600" /> ID
                        </span>
                        <span className="font-bold text-slate-900">
                          {pendingSelected.studentId}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-600" />{" "}
                          Account type
                        </span>
                        <span className="font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                          {pendingSelected.accountType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />{" "}
                          College
                        </span>
                        <span className="font-bold text-slate-900 text-right">
                          {pendingSelected.college}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />{" "}
                          Program
                        </span>
                        <span className="font-bold text-slate-900 text-right">
                          {pendingSelected.program}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />{" "}
                          Year level
                        </span>
                        <span className="font-bold text-slate-900">
                          {pendingSelected.yearLevel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />{" "}
                          Submitted
                        </span>
                        <span className="font-bold text-slate-900">
                          {pendingSelected.submitted}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={handleApprove}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => setIsDeclineOpen(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <MousePointerClick className="w-6 h-6 text-slate-400" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      No request selected
                    </h2>
                    <p className="text-xs text-slate-500 max-w-[220px]">
                      Click a pending request from the list to review its
                      details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update User Modal */}
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
                Update User Profile
              </h2>
              <button
                onClick={closeEdit}
                className="text-slate-400 hover:text-slate-600"
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

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleEditChange("email", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>ID</label>
                <input
                  type="text"
                  value={editForm.studentId}
                  onChange={(e) =>
                    handleEditChange("studentId", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Account type</label>
                <select
                  value={editForm.accountType}
                  onChange={(e) =>
                    handleEditChange("accountType", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Responder">Responder</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>College</label>
                <input
                  type="text"
                  value={editForm.college}
                  onChange={(e) => handleEditChange("college", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Program</label>
                <input
                  type="text"
                  value={editForm.program}
                  onChange={(e) => handleEditChange("program", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Year level</label>
                <input
                  type="text"
                  value={editForm.yearLevel}
                  onChange={(e) =>
                    handleEditChange("yearLevel", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleEditChange("status", e.target.value)}
                  className={inputClass}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={closeEdit}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!editForm.name.trim() || !editForm.studentId.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {isBlockOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setIsBlockOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Ban className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Block this user?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-800">
                    {selectedUser.name}
                  </span>{" "}
                  ({selectedUser.studentId}) will lose access to Campus360. You
                  can unblock them at any time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsBlockOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Yes, block</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setIsDeleteOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Delete this user?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You are about to remove{" "}
                  <span className="font-bold text-slate-800">
                    {selectedUser.name}
                  </span>{" "}
                  ({selectedUser.studentId}) from the directory. This action
                  cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {isDeclineOpen && pendingSelected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setIsDeclineOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Decline this request?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The request from{" "}
                  <span className="font-bold text-slate-800">
                    {pendingSelected.name}
                  </span>{" "}
                  ({pendingSelected.studentId}) will be removed and they will
                  not get access. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeclineOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Yes, decline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
