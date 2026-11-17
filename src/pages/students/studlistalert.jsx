import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

// Skeleton card shown while the alerts load
function AlertSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-rose-100 border-l-4 border-l-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-2/5 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-slate-200" />
            <div className="h-3 w-4/5 rounded bg-slate-200" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsList() {
  const [alerts, setAlerts] = useState([]);
  const [areAlertsLoading, setAreAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState("");
  const [alertsReloadKey, setAlertsReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAlerts() {
      setAreAlertsLoading(true);
      setAlertsError("");
      try {
        const response = await fetch("/api/alerts/student-latest", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Unable to load campus alerts.");
        }
        if (!Array.isArray(result.alerts)) {
          throw new Error("The server returned an invalid alert list.");
        }
        setAlerts(result.alerts);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setAlertsError(
            requestError.message || "Unable to load campus alerts.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setAreAlertsLoading(false);
      }
    }

    loadAlerts();
    return () => controller.abort();
  }, [alertsReloadKey]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      <main className="mx-auto max-w-md space-y-6 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
              Campus safety
            </span>
            <h1 className="mt-0.5 text-2xl font-extrabold text-slate-900">
              Campus alerts
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Alert messages from the last 7 days
            </p>
          </div>
          <Link
            to="/student/report"
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Report incident
          </Link>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent alerts
              </h2>
            </div>
            {!areAlertsLoading && !alertsError && (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
              </span>
            )}
          </div>

          {alertsError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
            >
              <p>{alertsError}</p>
              <button
                type="button"
                onClick={() => setAlertsReloadKey((key) => key + 1)}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {areAlertsLoading ? (
            <div
              role="status"
              aria-live="polite"
              aria-label="Loading campus alerts"
              className="space-y-3"
            >
              <AlertSkeleton />
              <AlertSkeleton />
              <AlertSkeleton />
            </div>
          ) : alertsError ? null : alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-600">
                No campus alerts in the last 7 days
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="rounded-2xl border border-rose-100 border-l-4 border-l-rose-500 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {alert.title}
                        </h3>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                          Campus alert
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                        {alert.message}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span>{alert.college}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(alert.alertTime || alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
