import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Megaphone,
  Shield,
} from "lucide-react";

const getItemKey = (item) =>
  item.key || `${item.kind || "announcement"}-${item.id}`;

export default function TopBar({
  title,
  notificationItems = [],
  notificationError = "",
  onNotificationSelect,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [seenKeys, setSeenKeys] = useState(() => new Set());

  // New = not yet seen; new items are listed first
  const newItems = notificationItems.filter(
    (item) => !seenKeys.has(getItemKey(item)),
  );
  const earlierItems = notificationItems.filter((item) =>
    seenKeys.has(getItemKey(item)),
  );
  const orderedItems = [...newItems, ...earlierItems];
  const newCount = newItems.length;

  const markAllSeen = () => {
    setSeenKeys((previous) => {
      const next = new Set(previous);
      notificationItems.forEach((item) => next.add(getItemKey(item)));
      return next;
    });
  };

  const toggleNotifications = () => {
    // Items are marked as seen when the panel is closed
    if (isNotificationsOpen) markAllSeen();
    setIsNotificationsOpen((open) => !open);
  };

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
          onClick={toggleNotifications}
          aria-label={
            newCount > 0 ? `${newCount} new notifications` : "Notifications"
          }
          aria-expanded={isNotificationsOpen}
          aria-controls="student-notifications-panel"
          className="relative w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {newCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {newCount > 99 ? "99+" : newCount}
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
            {orderedItems.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                No new alerts, resolved reports, or announcements today.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {orderedItems.map((item) => {
                  const isNew = !seenKeys.has(getItemKey(item));
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
                      key={getItemKey(item)}
                      type="button"
                      onClick={() => {
                        markAllSeen();
                        setIsNotificationsOpen(false);
                        onNotificationSelect?.(item);
                      }}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 ${
                        isNew ? "bg-blue-50/60" : ""
                      }`}
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
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {item.title}
                          </span>
                          {isNew && (
                            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                              New
                            </span>
                          )}
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
