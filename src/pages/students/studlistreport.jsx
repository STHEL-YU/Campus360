import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  FileText,
} from "lucide-react";

export default function ReportsList({ onViewReport }) {
  const [activeFilter, setActiveFilter] = useState("All");

  // Sample data representing student-submitted incident reports
  const reportsData = [
    {
      id: "REP-2024-089",
      category: "Facility Maintenance",
      college: "College of Engineering",
      building: "Engineering Building B",
      location: "2nd floor, Room 214",
      timestamp: "Today, 10:15 AM",
      description:
        "Leaking ceiling pipe near the main hallway causing a slippery floor hazard.",
      status: "In Review",
      statusColor: "bg-blue-50 text-blue-700 border-blue-200",
      indicatorColor: "bg-blue-500",
      borderLeft: "border-l-4 border-blue-500",
    },
    {
      id: "REP-2024-084",
      category: "Safety Hazard",
      college: "College of Arts & Sciences",
      building: "Science Annex",
      location: "Ground floor laboratory",
      timestamp: "Yesterday, 3:40 PM",
      description:
        "Flickering emergency exit light and blocked fire extinguisher cabinet.",
      status: "Active",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200",
      indicatorColor: "bg-amber-500",
      borderLeft: "border-l-4 border-amber-400",
    },
    {
      id: "REP-2024-072",
      category: "Security Concern",
      college: "College of Nursing",
      building: "Main Administration",
      location: "West wing entrance",
      timestamp: "October 12, 1:20 PM",
      description:
        "Exterior automated sliding door sensor failing to detect movement.",
      status: "Resolved",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      indicatorColor: "bg-emerald-500",
      borderLeft: "border-l-4 border-emerald-500",
    },
  ];

  const filteredReports = reportsData.filter((report) => {
    if (activeFilter === "Active") return report.status !== "Resolved";
    if (activeFilter === "Resolved") return report.status === "Resolved";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* Main Container */}
      <main className="px-5 pt-4 max-w-md mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
              Incident Management
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              My reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track and view status of submitted reports
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl">
          {["All", "Active", "Resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeFilter === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Reports Feed */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-2xl p-4 ${report.borderLeft} border border-slate-100 shadow-sm relative overflow-hidden`}
            >
              {/* Top Row: Ticket ID & Timestamp */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  {report.id}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{report.timestamp}</span>
                </span>
              </div>

              {/* Category */}
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {report.category}
              </h3>

              {/* Location Tag */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">
                  {report.building} · {report.location}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {report.description}
              </p>

              {/* Bottom Footer: Status Badge & View Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${report.statusColor}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${report.indicatorColor} mr-1.5`}
                  />
                  {report.status}
                </span>

                <button
                  onClick={() => onViewReport && onViewReport(report.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-0.5 group"
                >
                  <span>Details</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No incident reports found in this category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
