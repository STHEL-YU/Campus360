import React, { useState, useEffect } from "react";
import { Home, AlertTriangle, Bell, FileText, User } from "lucide-react";

export default function BottomNav({ activeTab = "home", onTabChange }) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Keep internal state synced if activeTab prop changes from router routing
  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleTabClick = (tabName) => {
    setCurrentTab(tabName);
    if (onTabChange) onTabChange(tabName);
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe shadow-lg"
    >
      <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto relative">
        {/* Home Tab */}
        <button
          onClick={() => handleTabClick("home")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === "home"
              ? "text-blue-600 font-bold"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[11px]">Home</span>
        </button>

        {/* Alerts Tab */}
        <button
          onClick={() => handleTabClick("alerts")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === "alerts"
              ? "text-blue-600 font-bold"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Bell className="w-6 h-6 mb-1" />
          <span className="text-[11px]">Alerts</span>
        </button>

        {/* Centered Highlighted Report Button */}
        <div className="flex flex-col items-center justify-center flex-1 relative -top-4">
          <button
            onClick={() => handleTabClick("report")}
            aria-label="Report Incident"
            className="group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-red-600 to-rose-500 rounded-full text-white shadow-lg shadow-red-500/30 border-4 border-white transform active:scale-95 transition-all duration-200 hover:scale-105 hover:shadow-red-500/50"
          >
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </button>
          <span
            className={`text-[11px] mt-1 font-semibold ${
              currentTab === "report" ? "text-red-600" : "text-slate-600"
            }`}
          >
            Report
          </span>
        </div>

        {/* News Tab */}
        <button
          onClick={() => handleTabClick("news")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === "news"
              ? "text-blue-600 font-bold"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileText className="w-6 h-6 mb-1" />
          <span className="text-[11px]">News</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => handleTabClick("profile")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === "profile"
              ? "text-blue-600 font-bold"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className="w-6 h-6 mb-1" />
          <span className="text-[11px]">Profile</span>
        </button>
      </div>
    </nav>
  );
}
