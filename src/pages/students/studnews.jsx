import React, { useState } from "react";
import { Clock, ChevronRight, Bookmark } from "lucide-react";

export default function Announcement() {
  const [activeFilter, setActiveFilter] = useState("All");

  const newsData = [
    {
      id: 1,
      category: "SAFETY CAMPAIGN · OCTOBER 14",
      title: "Safety begins with all of us",
      description:
        "Join Campus Safety Week and learn practical emergency readiness skills.",
      image:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80",
      type: "Announcements",
    },
    {
      id: 2,
      category: "UNIVERSITY NEWS · OCTOBER 12",
      title: "New evening escort service begins Monday",
      description:
        "Students and faculty can request a security escort between campus buildings.",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      type: "Advisories",
    },
    {
      id: 3,
      category: "SAFETY REMINDER · OCTOBER 10",
      title: "Five ways to stay aware on campus",
      description:
        "Simple habits can help make our shared university spaces safer.",
      image:
        "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&auto=format&fit=crop&q=80",
      type: "Announcements",
    },
  ];

  const filteredNews = newsData.filter((item) => {
    if (activeFilter === "Announcements") return item.type === "Announcements";
    if (activeFilter === "Advisories") return item.type === "Advisories";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* Main Container */}
      <main className="px-5 pt-4 max-w-md mx-auto space-y-6">
        {/* Header Section */}
        <div>
          <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
            Campus Updates
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            Campus news
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stay informed with the latest announcements
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {["All", "Announcements", "Advisories"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all shrink-0 ${
                activeFilter === tab
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* News Feed Cards */}
        <div className="space-y-4">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all hover:shadow-md"
            >
              <div className="h-40 w-full relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              </div>
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                  {item.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-3">
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 group">
                    <span>Read article</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredNews.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No news updates found in this category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
