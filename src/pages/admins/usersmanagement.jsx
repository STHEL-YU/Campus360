import { useEffect, useState } from "react";
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
  LoaderCircle,
} from "lucide-react";

async function requestStudents(method, body, signal) {
  const response = await fetch("/api/admin/students", {
    method,
    credentials: "same-origin",
    headers: {
      "X-Campus360-Admin": "1",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Unable to manage student accounts.");
  }
  return result;
}

export default function UserManagement() {
  const [usersList, setUsersList] = useState([]);
  const [adminCollege, setAdminCollege] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [requestError, setRequestError] = useState("");

  // View: 'directory' | 'pending'
  const [view, setView] = useState("directory");
  const [directoryFilter, setDirectoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [pendingSelectedId, setPendingSelectedId] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [failedIdImage, setFailedIdImage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let hasLoaded = false;
    let refreshInFlight = false;

    async function loadStudents() {
      if (refreshInFlight) return;
      refreshInFlight = true;
      try {
        const result = await requestStudents(
          "GET",
          undefined,
          controller.signal,
        );
        if (
          !Array.isArray(result.users) ||
          typeof result.college !== "string"
        ) {
          throw new Error("The server returned an invalid student list.");
        }

        const isFirstLoad = !hasLoaded;
        hasLoaded = true;
        setAdminCollege(result.college);
        setUsersList(result.users);
        setSelectedId((currentId) => {
          if (currentId && result.users.some((user) => user.id === currentId)) {
            return currentId;
          }
          return currentId || isFirstLoad ? result.users[0]?.id ?? null : null;
        });
        setPendingSelectedId((currentId) => {
          const pending = result.users.filter(
            (user) => user.status === "Pending",
          );
          if (currentId && pending.some((user) => user.id === currentId)) {
            return currentId;
          }
          return currentId || isFirstLoad ? pending[0]?.id ?? null : null;
        });
        setRequestError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setRequestError(error.message || "Unable to load student accounts.");
        }
      } finally {
        refreshInFlight = false;
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadStudents();
    const refreshTimer = window.setInterval(loadStudents, 15000);
    return () => {
      window.clearInterval(refreshTimer);
      controller.abort();
    };
  }, []);

  // ---------- Derived data ----------
  const pendingUsers = usersList.filter((u) => u.status === "Pending");
  const blockedUsers = usersList.filter((u) => u.status === "Blocked");
  const isInitialLoading = isLoading && usersList.length === 0;

  const visibleUsers =
    directoryFilter === "blocked" ? blockedUsers : usersList;

  // Search: name, ID, type, program / college, status
  const query = searchTerm.trim().toLowerCase();
  const filteredUsers = visibleUsers.filter(
    (u) =>
      !query ||
      [u.name, u.studentId, u.accountType, u.program, u.college, u.status].some(
        (value) => (value || "").toLowerCase().includes(query),
      ),
  );

  const selectedUser = usersList.find((u) => u.id === selectedId) || null;
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

  const handleUpdate = async () => {
    if (!editForm?.name.trim() || !editForm?.studentId.trim()) return;

    setRequestError("");
    setIsSaving(true);
    try {
      const { user } = await requestStudents("PATCH", {
        id: editForm.id,
        fullName: editForm.name,
        schoolId: editForm.studentId,
        email: editForm.email,
        role: editForm.accountType,
        college: editForm.college,
        program: editForm.program,
        yearLevel: editForm.yearLevel,
        status: editForm.status,
      });
      setUsersList((previous) =>
        previous.map((item) => (item.id === user.id ? user : item)),
      );
      setSelectedId(user.id);
      closeEdit();
    } catch (error) {
      setRequestError(error.message || "Unable to update the student.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    setRequestError("");
    setIsSaving(true);
    try {
      const { user } = await requestStudents("PATCH", { id, status });
      setUsersList((previous) =>
        previous.map((item) => (item.id === user.id ? user : item)),
      );
      return true;
    } catch (error) {
      setRequestError(error.message || "Unable to update the student status.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removeStudent = async (id) => {
    setRequestError("");
    setIsSaving(true);
    try {
      await requestStudents("DELETE", { id });
      setUsersList((previous) => previous.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      setRequestError(error.message || "Unable to delete the student.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlock = async () => {
    if (await updateStatus(selectedId, "Blocked")) setIsBlockOpen(false);
  };

  const handleUnblock = async () => {
    await updateStatus(selectedId, "Active");
  };

  const handleDelete = async () => {
    if (await removeStudent(selectedId)) {
      setSelectedId(null);
      setIsDeleteOpen(false);
    }
  };

  const handleApprove = async () => {
    if (await updateStatus(pendingSelectedId, "Active")) {
      setPendingSelectedId(
        pendingUsers.find((user) => user.id !== pendingSelectedId)?.id ?? null,
      );
    }
  };

  const handleDecline = async () => {
    if (await removeStudent(pendingSelectedId)) {
      setPendingSelectedId(
        pendingUsers.find((user) => user.id !== pendingSelectedId)?.id ?? null,
      );
      setIsDeclineOpen(false);
    }
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
      value: usersList.length,
      hint: "Student and faculty accounts",
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
              Manage student and faculty accounts in{" "}
              {adminCollege || "your assigned college"}
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

        {requestError && (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
            role="alert"
          >
            {requestError}
          </div>
        )}

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
                    {isInitialLoading ? (
                      <span className="block h-8 w-14 animate-pulse rounded-md bg-slate-200" />
                    ) : (
                      card.value
                    )}
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
                      : "Student and faculty accounts in your college"}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {query
                      ? `${filteredUsers.length} of ${visibleUsers.length} users match your search`
                      : directoryFilter === "blocked"
                        ? "Showing users with restricted access"
                        : `Showing accounts for ${adminCollege || "your college"}`}
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
                    {isInitialLoading
                      ? Array.from({ length: 5 }, (_, index) => (
                          <tr key={`loading-user-${index}`}>
                            {Array.from({ length: 5 }, (_, cellIndex) => (
                              <td key={cellIndex} className="py-4 px-4">
                                <span className="block h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : filteredUsers.map((user) => {
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

                    {!isLoading && filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-slate-400 font-medium"
                        >
                          {query ? "No users match your search." : "No users found."}
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

                {selectedUser.status !== "Pending" && (
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
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition-colors"
                      >
                        {isSaving ? (
                          <LoaderCircle
                            className="w-3.5 h-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        <span>{isSaving ? "Unblocking..." : "Unblock"}</span>
                      </button>
                    ) : isInitialLoading ? (
                      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 shadow-2xs animate-pulse">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 rounded bg-slate-200" />
                            <div className="h-3 w-3/4 rounded bg-slate-100" />
                          </div>
                        </div>
                        {Array.from({ length: 5 }, (_, index) => (
                          <div
                            key={`user-detail-loading-${index}`}
                            className="h-8 rounded bg-slate-100"
                          />
                        ))}
                      </div>
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
                )}
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
                      {isInitialLoading
                        ? Array.from({ length: 5 }, (_, index) => (
                            <tr key={`loading-pending-${index}`}>
                              {Array.from({ length: 5 }, (_, cellIndex) => (
                                <td key={cellIndex} className="py-4 px-4">
                                  <span className="block h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                                </td>
                              ))}
                            </tr>
                          ))
                        : pendingUsers.map((user) => {
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

                      {!isLoading && pendingUsers.length === 0 && (
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
                {isInitialLoading ? (
                  <div className="flex flex-col gap-5 animate-pulse">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                        <div className="h-3 w-3/4 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-40 rounded-xl bg-slate-100" />
                    {Array.from({ length: 5 }, (_, index) => (
                      <div
                        key={`pending-detail-loading-${index}`}
                        className="h-8 rounded bg-slate-100"
                      />
                    ))}
                  </div>
                ) : pendingSelected ? (
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

                    {pendingSelected.accountType === "Student" && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold text-slate-700">
                          Uploaded student ID
                        </h3>
                        {failedIdImage === pendingSelected.id ? (
                          <p
                            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
                            role="alert"
                          >
                            The student ID image could not be loaded.
                          </p>
                        ) : (
                          <img
                            key={pendingSelected.id}
                            src={`/api/admin/student-image?studentId=${encodeURIComponent(pendingSelected.id)}`}
                            alt={`${pendingSelected.name}'s school ID`}
                            loading="lazy"
                            onError={() => setFailedIdImage(pendingSelected.id)}
                            className="max-h-64 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                          />
                        )}
                      </div>
                    )}

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
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        {isSaving ? (
                          <LoaderCircle
                            className="w-3.5 h-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isSaving ? "Approving..." : "Approve"}</span>
                      </button>
                      <button
                        onClick={() => setIsDeclineOpen(true)}
                        disabled={isSaving}
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
                disabled={isSaving || !editForm.name.trim() || !editForm.studentId.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
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
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Blocking..." : "Yes, block"}</span>
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
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Deleting..." : "Yes, delete"}</span>
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
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Declining..." : "Yes, decline"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
