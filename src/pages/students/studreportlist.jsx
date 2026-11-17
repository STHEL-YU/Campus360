import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ImageOff,
  MapPin,
  X,
} from "lucide-react";

const FILTERS = ["All", "Active", "Resolved"];

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

  // Modal only: close with Escape and lock the page scroll behind it
  useEffect(() => {
    if (!isModal) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModal, onClose]);

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

  if (isModal) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      <main className="mx-auto max-w-md space-y-6 px-5 pt-4">{content}</main>
    </div>
  );
}
