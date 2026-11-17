import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Clock,
  Eye,
  LoaderCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";

async function requestAlerts(method, body, signal) {
  const response = await fetch("/api/alerts/manage", {
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
    throw new Error(result.error || "Unable to manage alerts.");
  }
  return result;
}

function formatAlertDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function AlertDetailsSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-5 pt-5"
      role="status"
      aria-label="Loading alert details"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="h-5 w-3/4 rounded bg-slate-200" />
        </div>
      </div>
      <div className="space-y-3 border-y border-slate-100 py-4">
        <div className="h-3 w-16 rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-14 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="h-10 w-full rounded-xl bg-slate-200" />
    </div>
  );
}

function AlertListSkeleton() {
  return (
    <div
      className="divide-y divide-slate-100"
      role="status"
      aria-label="Loading alerts"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col gap-3 px-4 py-4 sm:px-5"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
              <div className="flex gap-3 pt-1">
                <div className="h-3 w-1/4 rounded bg-slate-100" />
                <div className="h-3 w-1/3 rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <div className="h-8 w-20 rounded-lg bg-slate-100" />
            <div className="h-8 w-20 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeleteDialog({ alert, busy, onCancel, onConfirm }) {
  if (!alert) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-alert-title"
    >
      <section
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="delete-alert-title" className="font-bold text-slate-900">
              Delete this alert?
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              “{alert.title}” will be permanently removed.
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AlertManagement() {
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAlerts() {
      setIsLoading(true);
      setLoadError("");
      try {
        const result = await requestAlerts("GET", undefined, controller.signal);
        if (!Array.isArray(result.alerts)) {
          throw new Error("The server returned an invalid alert list.");
        }
        setAlerts(result.alerts);
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "Unable to load alerts.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadAlerts();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return alerts;
    return alerts.filter((alert) =>
      [alert.title, alert.message, alert.college].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [alerts, search]);

  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await requestAlerts("DELETE", { id: deleteTarget.id });
      setAlerts((current) =>
        current.filter((alert) => alert.id !== result.deletedId),
      );
      setSelectedAlert((current) =>
        current?.id === result.deletedId ? null : current,
      );
      setDeleteTarget(null);
    } catch (error) {
      setActionError(error.message || "Unable to delete alert.");
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (alert) => {
    setActionError("");
    setDeleteTarget(alert);
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-800 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
              Campus safety
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Alert Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review campus alerts and remove outdated or incorrect entries.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh alerts
          </button>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <section className="order-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:order-2 lg:col-span-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Alert details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedAlert ? "Selected alert" : "No alert selected"}
                </p>
              </div>
              {selectedAlert && (
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  aria-label="Close alert details"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isLoading && alerts.length === 0 ? (
              <AlertDetailsSkeleton />
            ) : selectedAlert ? (
              <div className="flex flex-col gap-5 pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                      Campus alert
                    </span>
                    <h3 className="mt-2 break-words text-base font-bold text-slate-900">
                      {selectedAlert.title}
                    </h3>
                  </div>
                </div>

                <div className="grid gap-4 border-y border-slate-100 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      College
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {selectedAlert.college}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Clock className="h-3 w-3" />
                      Alert time
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {formatAlertDate(
                        selectedAlert.alertTime || selectedAlert.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Message
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {selectedAlert.message || "No additional message."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => requestDelete(selectedAlert)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete alert
                </button>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
                <Bell className="h-7 w-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No alert selected
                </p>
                <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-500">
                  Select an alert from the list to view its full details here.
                </p>
              </div>
            )}
          </section>

          <section className="order-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-1 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  All alerts
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {isLoading
                    ? "Loading alerts..."
                    : `${filteredAlerts.length} of ${alerts.length} alerts`}
                </p>
              </div>
              <label className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search alerts"
                  aria-label="Search alerts"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>
            </div>

            {(loadError || actionError) && (
              <div
                role="alert"
                className="mx-4 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 sm:mx-5"
              >
                {loadError || actionError}
                {loadError && (
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="ml-2 font-semibold underline"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}

            {isLoading ? (
              <AlertListSkeleton />
            ) : loadError ? null : filteredAlerts.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Bell className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {alerts.length === 0 ? "No alerts yet" : "No matching alerts"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {alerts.length === 0
                    ? "New campus alerts will appear here."
                    : "Try another search term."}
                </p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-260px)] divide-y divide-slate-100 overflow-y-auto">
                {filteredAlerts.map((alert) => (
                  <article
                    key={alert.id}
                    className={`flex flex-col gap-3 px-4 py-4 transition-colors sm:px-5 ${
                      selectedAlert?.id === alert.id
                        ? "bg-blue-50/60"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {alert.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-500">
                          {alert.message || "No additional message."}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                          <span>{alert.college}</span>
                          <span>
                            {formatAlertDate(alert.alertTime || alert.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAlert(alert)}
                        aria-pressed={selectedAlert?.id === alert.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(alert)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <DeleteDialog
        alert={deleteTarget}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
