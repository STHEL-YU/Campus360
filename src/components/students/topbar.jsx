import React from "react";
import { Bell, ChevronLeft, Shield } from "lucide-react";

export default function TopBar({
  title,
  notificationCount = 3,
  onNotificationClick,
}) {
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
      <button
        onClick={onNotificationClick}
        aria-label="Notifications"
        className="relative w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors shrink-0 ml-3"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {notificationCount}
          </span>
        )}
      </button>
    </header>
  );
}
