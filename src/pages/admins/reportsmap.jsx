import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Bell,
  Clock,
  CheckCircle2,
  Check,
  X,
  XCircle,
  Search,
  Trash2,
  MapPin,
  Image as ImageIcon,
  Tag,
  Hash,
} from "lucide-react";

// Sample report photos (generated placeholders).
// Replace the `image` value on each report with a real photo URL from your backend.
const placeholderImage = (label, from, to) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
      `</linearGradient></defs>` +
      `<rect width='640' height='360' fill='url(#g)'/>` +
      `<text x='320' y='185' font-family='sans-serif' font-size='22' fill='white' text-anchor='middle'>${label}</text>` +
      `</svg>`,
  )}`;

const minutesAgo = (m) => Date.now() - m * 60 * 1000;

const isToday = (ms) =>
  new Date(ms).toDateString() === new Date().toDateString();

const timeAgo = (ms) => {
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  if (hrs < 48) return "Yesterday";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const STATUS_ORDER = { New: 0, Pending: 1, Resolved: 2, Declined: 3 };

export default function CampusMonitoring() {
  const [reports, setReports] = useState([
    {
      id: 1,
      title: "University-wide",
      subtitle: "All campus locations",
      desc: "Shelter-in-place advisory",
      status: "Pending",
      reportedAt: minutesAgo(10),
      image: placeholderImage(
        "Shelter-in-place advisory",
        "#475569",
        "#1e293b",
      ),
    },
    {
      id: 2,
      title: "Engineering Building B",
      subtitle: "Restricted access",
      desc: "",
      status: "Pending",
      reportedAt: minutesAgo(25),
      image: placeholderImage("Restricted access area", "#b45309", "#78350f"),
    },
    {
      id: 3,
      title: "University Library",
      subtitle: "Suspicious person report",
      desc: "",
      status: "New",
      reportedAt: minutesAgo(0),
      image: placeholderImage("Library entrance", "#2563eb", "#1e3a8a"),
    },
    {
      id: 4,
      title: "Science Hall",
      subtitle: "Broken emergency light",
      desc: "2nd floor stairwell",
      status: "New",
      reportedAt: minutesAgo(5),
      image: placeholderImage("Science Hall stairwell", "#0d9488", "#134e4a"),
    },
    {
      id: 5,
      title: "Business School",
      subtitle: "Unattended bag",
      desc: "Main lobby",
      status: "New",
      reportedAt: minutesAgo(12),
      image: placeholderImage("Main lobby", "#7c3aed", "#4c1d95"),
    },
    {
      id: 6,
      title: "Parking Lot C",
      subtitle: "Vehicle break-in",
      desc: "Security notified",
      status: "Resolved",
      reportedAt: minutesAgo(120),
      image: placeholderImage("Parking Lot C", "#16a34a", "#14532d"),
    },
    {
      id: 7,
      title: "Gymnasium",
      subtitle: "Wet floor hazard",
      desc: "",
      status: "Resolved",
      reportedAt: minutesAgo(1500),
      image: placeholderImage("Gymnasium floor", "#0891b2", "#164e63"),
    },
  ]);

  const [statusFilter, setStatusFilter] = useState(null); // null = today's new reports | All | Pending | New | Resolved
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null); // report shown in details modal
  const [confirm, setConfirm] = useState(null); // { type: 'decline' | 'delete', id }

  // ---------- Derived data ----------
  const countBy = (status) => reports.filter((r) => r.status === status).length;

  const query = searchTerm.trim().toLowerCase();

  // Default view shows new reports. Searching with no card selected looks
  // through every status so pending / resolved reports can still be found.
  const activeStatus = statusFilter ?? (query ? "All" : "New");

  const visibleReports = reports
    .filter((r) => {
      const matchesStatus = activeStatus === "All" || r.status === activeStatus;
      const matchesSearch =
        !query ||
        [r.title, r.subtitle, r.desc, r.status, timeAgo(r.reportedAt)].some(
          (value) => (value || "").toLowerCase().includes(query),
        );
      return matchesStatus && matchesSearch;
    })
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        b.reportedAt - a.reportedAt,
    );

  const newTodayCount = reports.filter(
    (r) => r.status === "New" && isToday(r.reportedAt),
  ).length;

  const selectedReport = reports.find((r) => r.id === selectedId) || null;
  const confirmReport = reports.find((r) => r.id === confirm?.id) || null;

  // ---------- Actions ----------
  const setStatus = (id, status) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleAccept = (id) => setStatus(id, "Pending");
  const handleResolve = (id) => setStatus(id, "Resolved");

  const handleConfirm = () => {
    if (!confirm) return;

    if (confirm.type === "decline") {
      setStatus(confirm.id, "Declined");
    } else if (confirm.type === "delete") {
      setReports((prev) => prev.filter((r) => r.id !== confirm.id));
      if (selectedId === confirm.id) setSelectedId(null);
    }
    setConfirm(null);
  };

  // ---------- Styles ----------
  const statusStyles = {
    New: {
      badge: "bg-blue-50 text-blue-700 border-blue-200/60",
      dot: "bg-blue-500",
    },
    Pending: {
      badge: "bg-amber-50 text-amber-700 border-amber-200/60",
      dot: "bg-amber-500",
    },
    Resolved: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      dot: "bg-emerald-500",
    },
    Declined: {
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const statCards = [
    {
      key: "All",
      label: "Total reports",
      value: reports.length,
      hint: "All submitted reports",
      icon: FileText,
      iconWrap: "bg-slate-100 text-slate-600",
      ring: "ring-slate-500",
    },
    {
      key: "Pending",
      label: "Pending",
      value: countBy("Pending"),
      hint: "Accepted, in progress",
      icon: Clock,
      iconWrap: "bg-amber-50 text-amber-600",
      ring: "ring-amber-500",
    },
    {
      key: "New",
      label: "New reports",
      value: countBy("New"),
      hint: "Waiting to be accepted",
      icon: Bell,
      iconWrap: "bg-blue-50 text-blue-600",
      ring: "ring-blue-500",
    },
    {
      key: "Resolved",
      label: "Resolved reports",
      value: countBy("Resolved"),
      hint: "Closed by responders",
      icon: CheckCircle2,
      iconWrap: "bg-emerald-50 text-emerald-600",
      ring: "ring-emerald-500",
    },
  ];

  // ---------- Map pins ----------
  const renderPin = (reportId, Icon, positionClass, bounce = false) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return null;

    const isActive = report.status === "New" || report.status === "Pending";

    return (
      <button
        key={reportId}
        onClick={() => setSelectedId(reportId)}
        aria-label={`View report: ${report.title}`}
        title={`${report.title} – ${report.status}`}
        className={`absolute ${positionClass} w-8 h-8 ${statusStyles[report.status].dot} text-white rounded-full flex items-center justify-center shadow-md transition-transform ${
          bounce && isActive ? "animate-bounce" : "hover:scale-110"
        } ${selectedId === reportId ? "ring-4 ring-white" : ""}`}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  const buildings = [
    {
      code: "ENG",
      name: "Engineering",
      reportId: 2,
      Icon: AlertCircle,
      pos: "-bottom-4 right-6",
    },
    {
      code: "LIB",
      name: "University Library",
      reportId: 3,
      Icon: FileText,
      pos: "-bottom-4 left-6",
    },
    {
      code: "SCI",
      name: "Science Hall",
      reportId: 4,
      Icon: FileText,
      pos: "-bottom-4 right-6",
    },
    {
      code: "BUS",
      name: "Business School",
      reportId: 5,
      Icon: FileText,
      pos: "-bottom-4 left-6",
    },
  ];

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-100 select-none font-sans">
      {/* Page Content Body */}
      <div className="p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        {/* Title Header */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
            Campus360 Command Center
          </span>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              Campus monitoring
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Live operational overview without sensitive reporter information
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const isActive =
              card.key === "New"
                ? statusFilter === "New" || (statusFilter === null && !query)
                : statusFilter === card.key;

            return (
              <button
                key={card.key}
                onClick={() => setStatusFilter(card.key)}
                className={`text-left bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs hover:shadow-md transition-all ${
                  isActive ? `ring-2 ${card.ring}` : ""
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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-3 gap-6 items-start">
          {/* Map Simulation Panel (Spans 2 columns) */}
          <div className="col-span-2 bg-[#eaf0eb] rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs relative overflow-hidden min-h-[640px]">
            {/* Map Header details */}
            <div className="flex items-center justify-between z-10 bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200/60 shadow-2xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Northfield University Campus
                </h2>
                <p className="text-[11px] text-slate-500">
                  Click a pin to view the report details
                </p>
              </div>
              <div className="flex items-center gap-2">
                {["New", "Pending", "Resolved"].map((status) => (
                  <span
                    key={status}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusStyles[status].badge}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusStyles[status].dot}`}
                    ></span>{" "}
                    {countBy(status)} {status.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Map Grid Buildings Layout */}
            <div className="grid grid-cols-2 gap-12 my-auto relative p-6">
              {buildings.map((b) => (
                <div
                  key={b.code}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg relative flex flex-col items-center justify-center h-28"
                >
                  <span className="text-lg font-bold text-slate-900 tracking-wider">
                    {b.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {b.name}
                  </span>
                  {renderPin(b.reportId, b.Icon, b.pos)}
                </div>
              ))}

              {/* University-wide pin on the road */}
              {renderPin(1, ShieldAlert, "top-[48%] left-[46%] z-20", true)}
            </div>

            {/* Map Legend Footer */}
            <div className="z-10 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-2xs flex items-center gap-6 text-xs font-semibold text-slate-600">
              {["New", "Pending", "Resolved"].map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${statusStyles[status].dot}`}
                  ></span>
                  <span>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: All Reports & Responder Status */}
          <div className="flex flex-col gap-6">
            {/* All Reports Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    All reports
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {statusFilter === null && !query
                      ? `${newTodayCount} new ${newTodayCount === 1 ? "report" : "reports"} today`
                      : `${visibleReports.length} of ${reports.length} reports`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search reports */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search reports..."
                      className="w-40 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-7 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {statusFilter !== null && (
                    <button
                      onClick={() => setStatusFilter(null)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Back to new
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
                {visibleReports.map((report) => {
                  const s = statusStyles[report.status];

                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedId(report.id)}
                      className={`border rounded-xl p-3.5 flex flex-col gap-1.5 cursor-pointer transition-colors ${
                        selectedId === report.id
                          ? "bg-blue-50/60 border-blue-200"
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[10px] border ${s.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                          ></span>
                          {report.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {report.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {report.subtitle}
                      </div>
                      {report.desc && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {report.desc}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {timeAgo(report.reportedAt)}
                        </span>

                        {report.status === "New" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirm({ type: "decline", id: report.id });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              Decline
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(report.id);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-sm shadow-emerald-600/20 transition-all"
                            >
                              <Check className="w-3 h-3" />
                              Accept
                            </button>
                          </div>
                        )}

                        {report.status === "Pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(report.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Mark resolved
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {visibleReports.length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-400 font-medium">
                    {query
                      ? "No reports match your search."
                      : statusFilter === null
                        ? "No new reports today. You're all caught up."
                        : "No reports in this category."}
                  </div>
                )}
              </div>
            </div>

            {/* Responder Status Panel */}
            {/* <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4">
                Responder status
              </h2>

              <div className="flex flex-col divide-y divide-slate-100 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-500">Campus guards on duty</span>
                  <span className="font-bold text-slate-900">28 / 32</span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-500">Active response teams</span>
                  <span className="font-bold text-slate-900">4 teams</span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-500">Average response time</span>
                  <span className="font-bold text-slate-900">4m 18s</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full font-semibold text-[10px] border ${statusStyles[selectedReport.status].badge}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusStyles[selectedReport.status].dot}`}
                  ></span>
                  {selectedReport.status}
                </span>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedReport.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedReport.subtitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Report image */}
            {selectedReport.image ? (
              <img
                src={selectedReport.image}
                alt={`Photo for report: ${selectedReport.subtitle}`}
                className="w-full h-52 object-cover rounded-xl border border-slate-200"
              />
            ) : (
              <div className="w-full h-52 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs font-medium">No image attached</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <MapPin className="w-3 h-3" /> Location
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {selectedReport.title}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Tag className="w-3 h-3" /> Report type
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {selectedReport.subtitle}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Clock className="w-3 h-3" /> Reported
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {timeAgo(selectedReport.reportedAt)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Hash className="w-3 h-3" /> Report ID
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  RPT-{String(selectedReport.id).slice(-4).padStart(4, "0")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Details
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedReport.desc || "No additional details provided."}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-2 border-t border-slate-100">
              {selectedReport.status === "New" && (
                <button
                  onClick={() => handleAccept(selectedReport.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept report</span>
                </button>
              )}

              {selectedReport.status === "Pending" && (
                <button
                  onClick={() => handleResolve(selectedReport.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as resolved</span>
                </button>
              )}

              {(selectedReport.status === "New" ||
                selectedReport.status === "Pending") && (
                <button
                  onClick={() =>
                    setConfirm({ type: "decline", id: selectedReport.id })
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
              )}

              <button
                onClick={() =>
                  setConfirm({ type: "delete", id: selectedReport.id })
                }
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline / Delete Confirmation Modal */}
      {confirm && confirmReport && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                {confirm.type === "delete" ? (
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-slate-900">
                  {confirm.type === "delete"
                    ? "Delete this report?"
                    : "Decline this report?"}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {confirm.type === "delete" ? (
                    <>
                      You are about to permanently remove the report for{" "}
                      <span className="font-bold text-slate-800">
                        {confirmReport.title}
                      </span>
                      . This action cannot be undone.
                    </>
                  ) : (
                    <>
                      The report for{" "}
                      <span className="font-bold text-slate-800">
                        {confirmReport.title}
                      </span>{" "}
                      will be marked as declined and no response will be
                      dispatched.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
              >
                {confirm.type === "delete" ? (
                  <Trash2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>
                  {confirm.type === "delete" ? "Yes, delete" : "Yes, decline"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
