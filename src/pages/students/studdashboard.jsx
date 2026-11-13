import React from "react";
import { AlertTriangle, ChevronRight, CheckCircle2, Clock } from "lucide-react";

export default function Dashboard({ onReportClick }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28">
      {/* Main Container */}
      <main className="px-5 space-y-6 max-w-md mx-auto pt-4">
        {/* User Greeting Section */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Monday, October 14
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-0.5">
              Good morning, Alex!
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              College of Engineering · Student
            </p>
          </div>

          {/* Avatar / Profile Graphic */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Emergency Report Banner Button */}
        <button
          onClick={onReportClick}
          className="w-full relative group overflow-hidden bg-gradient-to-r from-red-500 to-rose-500 p-5 rounded-3xl shadow-xl shadow-red-500/25 text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
                <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-red-100 uppercase bg-black/10 px-2 py-0.5 rounded-md">
                  Need Help?
                </span>
                <h2 className="text-[15px] font-bold text-white mt-1">
                  REPORT AN INCIDENT
                </h2>
                <p className="text-xs text-red-50">
                  Tap to send a safety report
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-center text-[9px] text-red-50 font-medium">
            🛡️ Reports are private and only visible to authorized personnel.
          </div>
        </button>

        {/* LIVE UPDATES: Recent Safety Alerts */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">
              Live Updates
            </span>
            <button className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </button>
          </div>

          <h3 className="text-sm font-bold text-slate-800">
            Recent safety alerts
          </h3>

          {/* Yellow Alert Card */}
          <div className="bg-white rounded-2xl p-4 border-l-4 border-amber-400 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-1.5" />
                    Active - Yellow alert
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                  College Safety Alert
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Engineering Building B - Use the east entrance until further
                  notice.
                </p>
                <div className="flex items-center text-[11px] text-slate-400 mt-3 space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>12 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Campus Updates / News Section */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Campus updates</h3>
            <button className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </button>
          </div>

          {/* News Card 1: Safety Reminder Image Card */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="h-36 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80"
                alt="Campus green"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
            </div>
            <div className="p-4 space-y-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                🛡️ Safety reminder
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                Know your nearest emergency assembly point
              </h4>
              <p className="text-xs text-slate-400">October 14 · 3 min read</p>
            </div>
          </div>

          {/* News Card 2: Resolved Incident Ticket */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Incident #C360-241008 resolved
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Library Annex access has returned to normal.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 ml-2">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Resolved
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
