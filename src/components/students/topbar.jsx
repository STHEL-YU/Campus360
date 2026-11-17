import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Megaphone,
  Shield,
} from "lucide-react";

export default function TopBar({
  title,
  notificationItems = [],
  notificationError = "",
  onNotificationSelect,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 pt-6 pb-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
      {/* Left: Optional Back Button + Icon + Title */}
      <div className="flex items-center space-x-3 min-w-0">

        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5" />
        </div>

        <h1 className="text-base font-bold text-slate-900 truncate">
          {title || "Campus Safety"}
        </h1>
      </div>

      {/* Right Notifications Button */}
      <div className="relative ml-3 shrink-0">
        <button
          onClick={() => setIsNotificationsOpen((open) => !open)}
          aria-label={
            notificationItems.length > 0
              ? `${notificationItems.length} new notifications`
              : "Notifications"
          }
          aria-expanded={isNotificationsOpen}
          aria-controls="student-notifications-panel"
          className="relative w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {notificationItems.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {notificationItems.length > 99 ? "99+" : notificationItems.length}
            </span>
          )}
        </button>

        {isNotificationsOpen && (
          <div
            id="student-notifications-panel"
            role="region"
            aria-label="Notifications"
            className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-900">
                Notifications
              </h2>
              <p className="text-[11px] text-slate-500">
                New alerts, resolved reports, and announcements today
              </p>
            </div>

            {notificationError && (
              <p
                role="alert"
                className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-center text-xs text-rose-600"
              >
                {notificationError}
              </p>
            )}
            {notificationItems.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                No new alerts, resolved reports, or announcements today.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notificationItems.map((item) => {
                  const Icon =
                    item.kind === "alert"
                      ? AlertTriangle
                      : item.kind === "report"
                        ? CheckCircle2
                        : Megaphone;
                  const iconStyle =
                    item.kind === "alert"
                      ? "bg-amber-50 text-amber-600"
                      : item.kind === "report"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-blue-50 text-blue-600";

                  return (
                    <button
                      key={item.key || `${item.kind || "announcement"}-${item.id}`}
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onNotificationSelect?.(item);
                      }}
                      className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50"
                    >
                      {item.kind === "announcement" && item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          aria-hidden="true"
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconStyle}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                      )}
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.type} · {item.published}
                        </span>
                        {item.message && (
                          <span className="line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                            {item.message}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
