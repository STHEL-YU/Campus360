import { useEffect, useState } from "react";
import {
  AlertTriangle,
  FileText,
  Bell,
  Clock,
  CheckCircle2,
  Check,
  LoaderCircle,
  X,
  XCircle,
  Search,
  Trash2,
  MapPin,
  Image as ImageIcon,
  Tag,
  Hash,
} from "lucide-react";

// Set to false to use your real map at /campus-map.png
const USE_DUMMY_MAP = true;

const DUMMY_MAP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#dcfce7"/>
  <rect x="0" y="270" width="800" height="60" fill="#e2e8f0"/>
  <rect x="370" y="0" width="60" height="600" fill="#e2e8f0"/>
  <rect x="60" y="60" width="240" height="150" rx="10" fill="#93c5fd"/>
  <text x="180" y="143" font-size="24" text-anchor="middle" fill="#1e3a8a" font-family="Arial">Engineering</text>
  <rect x="500" y="60" width="240" height="150" rx="10" fill="#fca5a5"/>
  <text x="620" y="143" font-size="24" text-anchor="middle" fill="#7f1d1d" font-family="Arial">Library</text>
  <rect x="60" y="390" width="240" height="150" rx="10" fill="#fde68a"/>
  <text x="180" y="473" font-size="24" text-anchor="middle" fill="#78350f" font-family="Arial">Admin</text>
  <rect x="500" y="390" width="240" height="150" rx="10" fill="#c4b5fd"/>
  <text x="620" y="473" font-size="24" text-anchor="middle" fill="#4c1d95" font-family="Arial">Gymnasium</text>
  <circle cx="400" cy="300" r="22" fill="#86efac" stroke="#16a34a" stroke-width="4"/>
  <text x="400" y="585" font-size="18" text-anchor="middle" fill="#475569" font-family="Arial">DUMMY TEST MAP</text>
</svg>`;

const MAP_SRC = USE_DUMMY_MAP
  ? `data:image/svg+xml;utf8,${encodeURIComponent(DUMMY_MAP_SVG)}`
  : "/campus-map.png";

const isToday = (ms) =>
  new Date(ms).toDateString() === new Date().toDateString();

const timeAgo = (ms) => {
  if (!Number.isFinite(ms)) return "Date unavailable";
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

function normalizeReportStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (normalized === "resolved") return "Resolved";
  if (["pending", "active", "in review"].includes(normalized)) {
    return "Pending";
  }
  if (["declined", "rejected"].includes(normalized)) return "Declined";
  return "New";
}

// Small spinner used inside buttons while a request is running
function Spinner({ className = "w-3 h-3" }) {
  return (
    <LoaderCircle className={`${className} animate-spin`} aria-hidden="true" />
  );
}

export default function CampusMonitoring() {
  // pin = { x: 0-100, y: 0-100 } as % of the map image (null = no pin)
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [mapError, setMapError] = useState(false);

  // Request in progress: { id, action } where action is
  // "accept" | "resolve" | "decline" | "delete"
  const [busy, setBusy] = useState(null);
  const isBusyFor = (id) => busy?.id === id;
  const isBusyAction = (id, action) =>
    busy?.id === id && busy.action === action;

  useEffect(() => {
    const controller = new AbortController();

    async function loadReports() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/student/admin-reports", {
          credentials: "same-origin",
          headers: { "X-Campus360-Admin": "1" },
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Unable to load incident reports.");
        }
        if (!Array.isArray(result.reports)) {
          throw new Error("The server returned an invalid report list.");
        }

        setReports(
          result.reports.map((report) => ({
            id: report.id,
            reportNumber: report.reportNumber,
            title: report.building || report.college || "Campus report",
            subtitle: report.category || "Incident report",
            desc: report.description || "",
            location: report.location || "",
            college: report.college || "",
            status: normalizeReportStatus(report.status),
            reportedAt: new Date(report.submittedAt).getTime(),
            pin: report.pin,
            hasImage: report.hasImage,
            hasAudio: report.hasAudio,
            image: report.imageUrl,
            audio: report.audioUrl,
            anonymous: report.anonymous,
          })),
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "Unable to load incident reports.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadReports();
    return () => controller.abort();
  }, [reloadKey]);

  // Derived data
  const countBy = (status) => reports.filter((r) => r.status === status).length;

  const query = searchTerm.trim().toLowerCase();
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

  // Actions
  const setStatus = async (id, status, action) => {
    setActionError("");
    setBusy({ id, action });
    try {
      const response = await fetch("/api/student/admin-report-status", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Campus360-Admin": "1",
        },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to update report status.");
      }

      setReports((previous) =>
        previous.map((report) =>
          report.id === id
            ? { ...report, status: result.report.status }
            : report,
        ),
      );
      return true;
    } catch (error) {
      setActionError(error.message || "Unable to update report status.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  // Permanently deletes the report (and its files) in the database
  const deleteReport = async (id) => {
    setActionError("");
    setBusy({ id, action: "delete" });
    try {
      const response = await fetch("/api/student/admin-report-delete", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Campus360-Admin": "1",
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to delete the report.");
      }

      setReports((previous) =>
        previous.filter((report) => report.id !== result.deletedId),
      );
      return true;
    } catch (error) {
      setActionError(error.message || "Unable to delete the report.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleAccept = (id) => void setStatus(id, "Pending", "accept");
  const handleResolve = (id) => void setStatus(id, "Resolved", "resolve");

  const handleConfirm = async () => {
    if (!confirm || busy) return;

    if (confirm.type === "decline") {
      const updated = await setStatus(confirm.id, "Declined", "decline");
      if (!updated) return;
    } else if (confirm.type === "delete") {
      const deleted = await deleteReport(confirm.id);
      if (!deleted) return;
      if (selectedId === confirm.id) setSelectedId(null);
    }
    setConfirm(null);
  };

  //  Styles
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

  //  Map pins (positioned by % of the image)
  const renderPin = (report) => {
    if (!report.pin) return null;

    const isActive = report.status === "New" || report.status === "Pending";

    return (
      // Outer wrapper handles positioning; inner button handles the bounce
      <div
        key={report.id}
        className={`absolute ${selectedId === report.id ? "z-30" : "z-20"}`}
        style={{
          left: `${report.pin.x}%`,
          top: `${report.pin.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {selectedId === report.id && (
          <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
            {report.reportNumber || report.subtitle}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(report.id);
          }}
          aria-label={`View report: ${report.title}`}
          title={`${report.title} – ${report.status}`}
          className={`w-8 h-8 ${statusStyles[report.status].dot} text-white rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform ${
            isActive ? "animate-bounce" : "hover:scale-110"
          } ${selectedId === report.id ? "ring-4 ring-white" : ""}`}
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-100 select-none font-sans">
      {actionError && (
        <p
          role="alert"
          className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-700 shadow-lg"
        >
          {actionError}
        </p>
      )}
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
          {/* Map Panel */}
          <div className="col-span-2 bg-[#eaf0eb] rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xs relative overflow-hidden">
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

            {/* Image map: the container wraps the image exactly (no fixed
                height / cropping) so the pin percentages match the image */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 ${
                mapError ? "h-96" : ""
              }`}
              style={
                mapError
                  ? {
                      backgroundImage:
                        "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }
                  : undefined
              }
            >
              {!mapError && (
                <img
                  src={MAP_SRC}
                  alt="Campus map"
                  draggable={false}
                  onError={() => setMapError(true)}
                  className="block w-full h-auto select-none pointer-events-none"
                />
              )}

              {reports.map((report) => renderPin(report))}
              {isLoading && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 shadow">
                  Loading submitted reports...
                </div>
              )}
              {loadError && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow">
                  Report pins could not be loaded
                </div>
              )}
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

          {/* All Reports & Responder Status */}
          <div className="flex flex-col gap-6">
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
                {isLoading ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    Loading submitted reports...
                  </div>
                ) : loadError ? (
                  <div
                    role="alert"
                    className="py-6 text-center text-xs text-rose-700"
                  >
                    <p>{loadError}</p>
                    <button
                      type="button"
                      onClick={() => setReloadKey((key) => key + 1)}
                      className="mt-2 font-semibold underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  visibleReports.map((report) => {
                    const s = statusStyles[report.status];
                    const rowBusy = isBusyFor(report.id);

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
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {report.pin
                            ? `Map pin: ${report.pin.x}%, ${report.pin.y}%`
                            : "No map pin saved"}
                        </div>
                        {report.location && (
                          <div className="text-[11px] text-slate-500">
                            {report.location}
                          </div>
                        )}
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
                                  setConfirm({
                                    type: "decline",
                                    id: report.id,
                                  });
                                }}
                                disabled={rowBusy}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <XCircle className="w-3 h-3" />
                                Decline
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(report.id);
                                }}
                                disabled={rowBusy}
                                aria-busy={isBusyAction(report.id, "accept")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-sm shadow-emerald-600/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isBusyAction(report.id, "accept") ? (
                                  <Spinner />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                {isBusyAction(report.id, "accept")
                                  ? "Accepting..."
                                  : "Accept"}
                              </button>
                            </div>
                          )}

                          {report.status === "Pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(report.id);
                              }}
                              disabled={rowBusy}
                              aria-busy={isBusyAction(report.id, "resolve")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusyAction(report.id, "resolve") ? (
                                <Spinner />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {isBusyAction(report.id, "resolve")
                                ? "Resolving..."
                                : "Mark resolved"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {!isLoading && !loadError && visibleReports.length === 0 && (
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
            {selectedReport.image && !imageLoadFailed[selectedReport.id] ? (
              <img
                src={selectedReport.image}
                alt={`Photo for report: ${selectedReport.subtitle}`}
                className="w-full h-52 object-cover rounded-xl border border-slate-200"
                onError={() =>
                  setImageLoadFailed((previous) => ({
                    ...previous,
                    [selectedReport.id]: true,
                  }))
                }
              />
            ) : (
              <div className="w-full h-52 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs font-medium">
                  {imageLoadFailed[selectedReport.id]
                    ? "Unable to load attached photo"
                    : selectedReport.hasImage
                      ? "Photo evidence is attached"
                      : "No image attached"}
                </span>
              </div>
            )}
            {selectedReport.audio && (
              <audio
                controls
                preload="none"
                src={selectedReport.audio}
                className="w-full"
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <MapPin className="w-3 h-3" /> Location
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {selectedReport.title}
                  {selectedReport.location
                    ? ` · ${selectedReport.location}`
                    : ""}
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
                  {selectedReport.reportNumber ||
                    `RPT-${String(selectedReport.id).slice(-4).padStart(4, "0")}`}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <MapPin className="w-3 h-3" /> Map pin
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {selectedReport.pin
                  ? `x: ${selectedReport.pin.x}%, y: ${selectedReport.pin.y}%`
                  : "No map pin was saved for this report"}
              </span>
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
                  disabled={isBusyFor(selectedReport.id)}
                  aria-busy={isBusyAction(selectedReport.id, "accept")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusyAction(selectedReport.id, "accept") ? (
                    <Spinner className="w-3.5 h-3.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isBusyAction(selectedReport.id, "accept")
                      ? "Accepting..."
                      : "Accept report"}
                  </span>
                </button>
              )}

              {selectedReport.status === "Pending" && (
                <button
                  onClick={() => handleResolve(selectedReport.id)}
                  disabled={isBusyFor(selectedReport.id)}
                  aria-busy={isBusyAction(selectedReport.id, "resolve")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusyAction(selectedReport.id, "resolve") ? (
                    <Spinner className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isBusyAction(selectedReport.id, "resolve")
                      ? "Resolving..."
                      : "Mark as resolved"}
                  </span>
                </button>
              )}

              {(selectedReport.status === "New" ||
                selectedReport.status === "Pending") && (
                <button
                  onClick={() =>
                    setConfirm({ type: "decline", id: selectedReport.id })
                  }
                  disabled={isBusyFor(selectedReport.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
              )}

              <button
                onClick={() =>
                  setConfirm({ type: "delete", id: selectedReport.id })
                }
                disabled={isBusyFor(selectedReport.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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
          onClick={() => !busy && setConfirm(null)}
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
                      </span>{" "}
                      and its attached photo or audio. This action cannot be
                      undone.
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
                disabled={Boolean(busy)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={Boolean(busy)}
                aria-busy={Boolean(busy)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? (
                  <Spinner className="w-3.5 h-3.5" />
                ) : confirm.type === "delete" ? (
                  <Trash2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>
                  {confirm.type === "delete"
                    ? busy
                      ? "Deleting..."
                      : "Yes, delete"
                    : busy
                      ? "Declining..."
                      : "Yes, decline"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
