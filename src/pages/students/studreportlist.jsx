import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ImageOff,
  LoaderCircle,
  MapPin,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";

const FILTERS = ["All", "Active", "Resolved"];

// Must match the keys in INCIDENT_CATEGORIES on the server
const CATEGORY_OPTIONS = [
  { value: "safety", label: "Safety Hazard" },
  { value: "maintenance", label: "Facility Maintenance" },
  { value: "security", label: "Security Concern" },
  { value: "medical", label: "Medical Emergency" },
  { value: "other", label: "Other Issue" },
];

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all";
const labelClass =
  "text-[11px] font-bold uppercase tracking-wider text-slate-500";

async function requestReport(method, body) {
  const response = await fetch("/api/student/report", {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Unable to update your report.");
  }
  return result;
}

// Edit only while the report is still New
function canEditReport(report) {
  return report.status.toLowerCase() === "new";
}

// Delete while New, or once it is Resolved or Declined
function canDeleteReport(report) {
  return ["new", "resolved", "declined"].includes(report.status.toLowerCase());
}

function getStatusStyle(status) {
  switch (status.toLowerCase()) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "in review":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "active":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

// Skeleton card shown while the report list loads
function ReportSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 border-l-4 border-l-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-3 w-28 rounded bg-slate-200" />
      </div>
      <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
      </div>
      <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
      <div className="mt-3 h-40 w-full rounded-xl bg-slate-200" />
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="h-5 w-20 rounded-full bg-slate-200" />
        <div className="h-3 w-24 rounded bg-slate-200" />
      </div>
    </div>
  );
}

// Evidence image with a skeleton until it loads (and a fallback if it fails)
function EvidenceImage({ src, alt }) {
  const [status, setStatus] = useState("loading"); // loading | loaded | error
  const imgRef = useRef(null);

  // Handles images that were already cached before onLoad could fire
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setStatus("loaded");
  }, [src]);

  if (status === "error") {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
        <ImageOff className="h-6 w-6" />
        <span className="text-[11px] font-medium">Image unavailable</span>
      </div>
    );
  }

  const isLoaded = status === "loaded";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${
        isLoaded ? "" : "h-56"
      }`}
    >
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-slate-200"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`w-full object-cover transition-opacity duration-300 ${
          isLoaded
            ? "max-h-56 opacity-100"
            : "absolute inset-0 h-full opacity-0"
        }`}
      />
    </div>
  );
}

// Pass onClose to show this as a modal. Without it, it renders as a full page.
export default function ReportsList({ onClose }) {
  const isModal = typeof onClose === "function";
  const [activeFilter, setActiveFilter] = useState("All");
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Edit / delete
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReports() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/student/report", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Unable to load your reports.");
        }
        if (!Array.isArray(result.reports)) {
          throw new Error("The server returned an invalid report list.");
        }
        setReports(result.reports);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load your reports.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadReports();
    return () => controller.abort();
  }, [reloadKey]);

  const closeEdit = () => {
    setEditForm(null);
    setActionError("");
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    setActionError("");
  };

  // Escape closes the top-most dialog first; lock page scroll while any is open
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || isSaving) return;
      if (deleteTarget) closeDelete();
      else if (editForm) closeEdit();
      else if (isModal) onClose();
    };
    const previousOverflow = document.body.style.overflow;
    if (isModal || editForm || deleteTarget) {
      document.body.style.overflow = "hidden";
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModal, onClose, editForm, deleteTarget, isSaving]);

  const openEdit = (report) => {
    const category = CATEGORY_OPTIONS.find(
      (option) => option.label === report.category,
    );
    setActionError("");
    setEditForm({
      id: report.id,
      reportNumber: report.reportNumber,
      category: category?.value || "other",
      building: report.building || "",
      location: report.location || "",
      description: report.description || "",
    });
  };

  const openDelete = (report) => {
    setActionError("");
    setDeleteTarget(report);
  };

  const handleEditChange = (field, value) => {
    setEditForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!editForm?.building.trim()) return;

    setActionError("");
    setIsSaving(true);
    try {
      const { report } = await requestReport("PATCH", {
        id: editForm.id,
        category: editForm.category,
        building: editForm.building.trim(),
        location: editForm.location.trim(),
        description: editForm.description.trim(),
      });
      setReports((previous) =>
        previous.map((item) => (item.id === report.id ? report : item)),
      );
      closeEdit();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to update your report.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setActionError("");
    setIsSaving(true);
    try {
      const { deletedId } = await requestReport("DELETE", {
        id: deleteTarget.id,
      });
      setReports((previous) =>
        previous.filter((item) => item.id !== deletedId),
      );
      closeDelete();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to delete your report.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (activeFilter === "Active") {
      return report.status.toLowerCase() !== "resolved";
    }
    if (activeFilter === "Resolved") {
      return report.status.toLowerCase() === "resolved";
    }
    return true;
  });

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
            Incident Management
          </span>
          <h1 className="mt-0.5 text-2xl font-extrabold text-slate-900">
            My reports
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Track and view status of submitted reports
          </p>
        </div>
        {isModal ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close my reports"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <Link
            to="/student/report"
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            New report
          </Link>
        )}
      </div>

      <div className="flex rounded-2xl bg-slate-200/70 p-1">
        {FILTERS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
              activeFilter === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading your reports"
          className="space-y-4"
        >
          <ReportSkeleton />
          <ReportSkeleton />
          <ReportSkeleton />
        </div>
      ) : !error && filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No reports found
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Submitted reports will appear here so you can track their status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isResolved = report.status.toLowerCase() === "resolved";
            const canEdit = canEditReport(report);
            const canDelete = canDeleteReport(report);
            return (
              <article
                key={report.id}
                className="relative overflow-hidden rounded-2xl border border-slate-100 border-l-4 border-l-blue-500 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-400">
                    {report.reportNumber}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(report.submittedAt)}
                  </span>
                </div>

                <h2 className="mt-1 text-base font-bold text-slate-900">
                  {report.category}
                </h2>
                <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>
                    <strong className="font-semibold">{report.building}</strong>
                    {report.location ? ` · ${report.location}` : ""}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                  {report.description || "No description provided."}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {report.college}
                  {report.pin
                    ? ` · Map pin ${report.pin.x}%, ${report.pin.y}%`
                    : ""}
                </p>

                {(report.imageUrl || report.audioUrl) && (
                  <div className="mt-3 space-y-2">
                    {report.imageUrl && (
                      <EvidenceImage
                        src={report.imageUrl}
                        alt={`Evidence for ${report.reportNumber}`}
                      />
                    )}
                    {report.audioUrl && (
                      <audio
                        controls
                        preload="none"
                        src={report.audioUrl}
                        className="w-full"
                      />
                    )}
                  </div>
                )}

                {(canEdit || canDelete) && (
                  <div className="mt-3 flex items-center gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEdit(report)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => openDelete(report)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 ${
                          canEdit ? "" : "flex-1"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getStatusStyle(
                      report.status,
                    )}`}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                    {report.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {report.anonymous ? "Identity hidden" : "Identity shared"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );

  // Edit and delete dialogs (rendered above the list)
  const dialogs = (
    <>
      {editForm && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
          onClick={() => !isSaving && closeEdit()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-report-title"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2
                  id="edit-report-title"
                  className="flex items-center gap-2 text-sm font-bold text-slate-900"
                >
                  <Pencil className="h-4 w-4 text-blue-600" />
                  Edit report
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {editForm.reportNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                disabled={isSaving}
                aria-label="Close edit report"
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <p role="alert" className="text-xs text-rose-700">
                {actionError}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-category" className={labelClass}>
                Category
              </label>
              <select
                id="edit-category"
                value={editForm.category}
                onChange={(event) =>
                  handleEditChange("category", event.target.value)
                }
                className={inputClass}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-building" className={labelClass}>
                Building
              </label>
              <input
                id="edit-building"
                type="text"
                value={editForm.building}
                onChange={(event) =>
                  handleEditChange("building", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-location" className={labelClass}>
                Location details
              </label>
              <input
                id="edit-location"
                type="text"
                value={editForm.location}
                onChange={(event) =>
                  handleEditChange("location", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-description" className={labelClass}>
                Description
              </label>
              <textarea
                id="edit-description"
                rows="5"
                value={editForm.description}
                onChange={(event) =>
                  handleEditChange("description", event.target.value)
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={!editForm.building.trim() || isSaving}
                aria-busy={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>{isSaving ? "Saving..." : "Save changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isSaving && closeDelete()}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-report-title"
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div className="flex flex-col gap-1">
                <h2
                  id="delete-report-title"
                  className="text-sm font-bold text-slate-900"
                >
                  Delete this report?
                </h2>
                <p className="text-xs leading-relaxed text-slate-500">
                  You are about to remove{" "}
                  <span className="font-bold text-slate-800">
                    {deleteTarget.reportNumber}
                  </span>{" "}
                  and its attached photo or audio. This action cannot be undone.
                </p>
              </div>
            </div>

            {actionError && (
              <p role="alert" className="text-center text-xs text-rose-700">
                {actionError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeDelete}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                aria-busy={isSaving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-600/20 transition-all hover:bg-rose-700 disabled:opacity-70"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{isSaving ? "Deleting..." : "Yes, delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isModal) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="My reports"
            className="flex max-h-[90vh] w-full max-w-md flex-col gap-6 overflow-y-auto rounded-t-3xl bg-slate-50 px-5 pb-8 pt-5 text-slate-800 shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            {content}
          </div>
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
        <main className="mx-auto max-w-md space-y-6 px-5 pt-4">{content}</main>
      </div>
      {dialogs}
    </>
  );
}
