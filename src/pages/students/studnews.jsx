import { useEffect, useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";

const NEWS_RECENCY_DAYS = 7;

async function requestNews(signal) {
  const response = await fetch("/api/news/feed", {
    credentials: "same-origin",
    signal,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to load campus news.");
  }
  if (!Array.isArray(result.announcements)) {
    throw new Error("The server returned an invalid news feed.");
  }
  return result.announcements;
}

function getCategoryLabel(type) {
  if (type === "Campaign") return "SAFETY CAMPAIGN";
  if (type === "Safety Advisory") return "SAFETY ADVISORY";
  return "CAMPUS ANNOUNCEMENT";
}

function formatEventDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Announcement() {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let requestInFlight = false;

    async function loadNews() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const news = await requestNews(controller.signal);
        setAnnouncements(news);
        setRequestError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setRequestError(error.message || "Unable to load campus news.");
        }
      } finally {
        requestInFlight = false;
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadNews();
    const refreshTimer = window.setInterval(loadNews, 15000);
    window.addEventListener("focus", loadNews);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadNews);
      controller.abort();
    };
  }, []);

  const newsData = announcements.map((item) => {
    const publishedDate = item.published || "";
    const categoryDate = item.eventAt
      ? new Date(item.eventAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })
      : publishedDate;

    return {
      ...item,
      category: `${getCategoryLabel(item.type)} · ${categoryDate}`.toUpperCase(),
      description: item.content,
      type:
        item.type === "Safety Advisory"
          ? "Advisories"
          : item.type === "Campaign"
            ? "Campaigns"
            : "Announcements",
    };
  });

  const recentCutoff = new Date();
  recentCutoff.setUTCHours(0, 0, 0, 0);
  recentCutoff.setUTCDate(
    recentCutoff.getUTCDate() - (NEWS_RECENCY_DAYS - 1),
  );
  const cutoffDate = recentCutoff.toISOString().slice(0, 10);
  const todayDate = new Date().toISOString().slice(0, 10);
  const recentNews = newsData.filter(
    (item) =>
      typeof item.publishedAt === "string" &&
      item.publishedAt >= cutoffDate &&
      item.publishedAt <= todayDate,
  );
  const filteredNews = recentNews.filter((item) => {
    return activeFilter === "All" || item.type === activeFilter;
  });
  const notificationId = location.state?.announcementId;

  useEffect(() => {
    if (!notificationId) return;
    document
      .getElementById(`announcement-${notificationId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [notificationId, filteredNews.length]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      <main className="px-5 pt-4 max-w-md mx-auto space-y-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
            Campus Updates
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            Campus news
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing updates from the last {NEWS_RECENCY_DAYS} days
          </p>
        </div>

        {requestError && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
          >
            {requestError}
          </p>
        )}

        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {["All", "Announcements", "Advisories", "Campaigns"].map((tab) => (
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

        <div className="space-y-4">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              id={`announcement-${item.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all hover:shadow-md"
            >
              {item.imageUrl ? (
                <div className="h-40 w-full relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="h-40 w-full bg-gradient-to-br from-blue-100 to-slate-200 flex items-center justify-center">
                  <span className="text-sm font-bold tracking-widest text-slate-500">
                    CAMPUS360
                  </span>
                </div>
              )}
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                  {item.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {item.description || "No message content."}
                </p>
                {item.eventAt && (
                  <p className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {formatEventDateTime(item.eventAt)}
                  </p>
                )}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-3">
                  <span className="text-xs font-bold text-blue-600 flex items-center space-x-1">
                    <span>Read article</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </article>
          ))}

          {isLoading && announcements.length === 0 && (
            <div
              className="space-y-4"
              role="status"
              aria-label="Loading campus news"
            >
              {Array.from({ length: 2 }, (_, index) => (
                <article
                  key={`loading-news-${index}`}
                  aria-hidden="true"
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse"
                >
                  <div className="h-40 w-full bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                    <div className="h-5 w-4/5 rounded bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && filteredNews.length === 0 && !requestError && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No news updates found in this category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
