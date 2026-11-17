import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  AlertCircle,
  Users,
  Bell,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  ChevronDown,
  Volume2,
  VolumeX,
  Megaphone,
  UserPlus,
  X,
  CalendarDays,
} from "lucide-react";

const DEMO_MODE = true;

// Routes
const ROUTES = {
  reports: "/report",
  users: "/users",
  news: "/news",
};

//  Notification sounds 
const SOUNDS = {
  incident: Array.from({ length: 10 }, (_, i) => ({
    freq: i % 2 === 0 ? 880 : 660,
    start: i * 0.25,
    dur: 0.2,
    type: "square",
    vol: 0.1,
  })),
  announcement: [
    { freq: 523.25, start: 0, dur: 1.2 },
    { freq: 659.25, start: 0.35, dur: 1.2 },
    { freq: 783.99, start: 0.7, dur: 1.2 },
    { freq: 1046.5, start: 1.05, dur: 1.3 },
  ],
  account: [
    { freq: 784, start: 0, dur: 1.0 },
    { freq: 587.33, start: 0.6, dur: 1.0 },
    { freq: 784, start: 1.3, dur: 1.0 },
    { freq: 587.33, start: 1.9, dur: 0.9 },
  ],
};

// Sample pools used by the Test buttons
const INCIDENT_POOL = [
  { reporter: "Marco Dizon", category: "Fire Alarm", location: "Science Hall" },
  {
    reporter: "Faculty reporter",
    category: "Theft Report",
    location: "Parking Lot C",
  },
  {
    reporter: "Sofia Lim",
    category: "Medical Emergency",
    location: "Gymnasium",
  },
  {
    reporter: "Student reporter",
    category: "Suspicious Person",
    location: "Business School",
  },
];

const ANNOUNCEMENT_POOL = [
  { title: "Weather advisory: storm warning", audience: "University-wide" },
  { title: "Library extended hours this week", audience: "Students Only" },
  { title: "Fire drill schedule posted", audience: "All users" },
];

const ACCOUNT_POOL = [
  { name: "Mark Tan", type: "Student", college: "College of Business" },
  { name: "Prof. Lea Ramos", type: "Faculty", college: "College of Education" },
  { name: "Joanna Cruz", type: "Student", college: "College of Nursing" },
];

const nowTime = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

const KIND_STYLES = {
  incident: {
    label: "New incident report",
    icon: Bell,
    wrap: "bg-rose-50 text-rose-600",
    border: "border-rose-200",
    to: ROUTES.reports,
  },
  announcement: {
    label: "New announcement",
    icon: Megaphone,
    wrap: "bg-blue-50 text-blue-600",
    border: "border-blue-200",
    to: ROUTES.news,
  },
  account: {
    label: "New account registered",
    icon: UserPlus,
    wrap: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-200",
    to: ROUTES.users,
  },
};

const AD_STYLES = [
  "from-blue-600 to-blue-500",
  "from-indigo-600 to-blue-500",
  "from-sky-600 to-blue-600",
  "from-blue-700 to-indigo-500",
];

// Hardware alert cards: color only, no image
const ALERT_STYLES = {
  red: {
    label: "Red alert",
    card: "from-red-600 to-rose-500 text-white",
    iconWrap: "bg-white/20",
    chip: "bg-white/20",
    sub: "text-white/80",
  },
  yellow: {
    label: "Yellow alert",
    card: "from-amber-400 to-yellow-400 text-slate-900",
    iconWrap: "bg-black/10",
    chip: "bg-black/10",
    sub: "text-slate-800/80",
  },
};

// The alerts table has no level column, so the title decides it:
// the red buttons send "General Announcement", the yellow ones a college title.
const getAlertLevel = (alert) =>
  /general/i.test(alert.title || "") ? "red" : "yellow";

const isSameDay = (ms, reference) => {
  const a = new Date(ms);
  return (
    !Number.isNaN(a.getTime()) &&
    a.getFullYear() === reference.getFullYear() &&
    a.getMonth() === reference.getMonth() &&
    a.getDate() === reference.getDate()
  );
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const buildMonthCells = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
};

async function requestDashboardData(signal) {
  const headers = { "X-Campus360-Admin": "1" };

  // Alerts are optional: if this request fails the rest of the dashboard still loads
  const alertsRequest = fetch("/api/alerts/latest?limit=100", {
    credentials: "same-origin",
    headers,
    signal,
  })
    .then(async (response) => {
      const body = await response.json();
      return response.ok && Array.isArray(body.alerts) ? body.alerts : [];
    })
    .catch((error) => {
      if (error.name === "AbortError") throw error;
      return [];
    });

  const [usersResponse, announcementsResponse, reportsResponse, alerts] =
    await Promise.all([
    fetch("/api/student/admin-students", {
      credentials: "same-origin",
      headers,
      signal,
    }),
    fetch("/api/news/announcements", {
      credentials: "same-origin",
      headers,
      signal,
    }),
      fetch("/api/student/admin-reports", {
        credentials: "same-origin",
        headers,
        signal,
      }),
      alertsRequest,
    ]);
  const [usersResult, announcementsResult, reportsResult] = await Promise.all([
    usersResponse.json(),
    announcementsResponse.json(),
    reportsResponse.json(),
  ]);

  if (!usersResponse.ok) {
    throw new Error(usersResult.error || "Unable to load registered users.");
  }
  if (!announcementsResponse.ok) {
    throw new Error(
      announcementsResult.error || "Unable to load news and announcements.",
    );
  }
  if (!reportsResponse.ok) {
    throw new Error(reportsResult.error || "Unable to load incident reports.");
  }
  if (
    !Array.isArray(usersResult.users) ||
    !Array.isArray(announcementsResult.announcements) ||
    !Array.isArray(reportsResult.reports)
  ) {
    throw new Error("The server returned invalid dashboard data.");
  }

  return {
    users: usersResult.users,
    announcements: announcementsResult.announcements,
    reports: reportsResult.reports,
    alerts,
  };
}

function mapDashboardIncident(report) {
  const rawStatus = String(report.status || "").toLowerCase();
  const status =
    rawStatus === "resolved"
      ? "Resolved"
      : rawStatus === "declined" || rawStatus === "rejected"
        ? "Declined"
        : rawStatus === "pending" ||
            rawStatus === "active" ||
            rawStatus === "in review"
          ? "Pending"
          : "New";
  const statusColor =
    status === "Resolved"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
        ? "bg-amber-100 text-amber-700"
        : status === "Declined"
          ? "bg-slate-100 text-slate-600"
          : "bg-rose-100 text-rose-700";
  const submittedAt = new Date(report.submittedAt);

  return {
    id: report.reportNumber || `REP-${report.id}`,
    category: report.category || "Incident report",
    location: [report.building, report.location].filter(Boolean).join(" · ") ||
      "Location not provided",
    time: Number.isNaN(submittedAt.getTime())
      ? "Time unavailable"
      : submittedAt.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
    status,
    statusColor,
    isNew: status === "New",
    reporter: report.anonymous ? "Anonymous" : "Student reporter",
    reportedAt: submittedAt.getTime(),
  };
}

function mapDashboardAlert(alert) {
  const created = new Date(alert.createdAt);
  const shown = new Date(alert.alertTime || alert.createdAt);
  return {
    id: `alert-${alert.id}`,
    kind: "alert",
    title: alert.title,
    message: alert.message,
    college: alert.college,
    level: getAlertLevel(alert),
    createdAt: created.getTime(),
    time: Number.isNaN(shown.getTime())
      ? "Time unavailable"
      : shown.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
  };
}


const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

// Small pulsing block used to build the skeletons
function Skel({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded bg-slate-200 ${className}`}
    />
  );
}

// Skeleton rows for the incident table (7 columns, 5 rows)
function IncidentRowsSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={`incident-skeleton-${index}`} aria-hidden="true">
      <td className="py-3.5 pr-3">
        <Skel className="h-3.5 w-24" />
      </td>
      <td className="py-3.5 pr-3">
        <Skel className="h-3.5 w-20" />
      </td>
      <td className="py-3.5 pr-3">
        <Skel className="h-3.5 w-24" />
      </td>
      <td className="py-3.5 pr-3">
        <Skel className="h-3.5 w-28" />
      </td>
      <td className="py-3.5 pr-3">
        <Skel className="h-3.5 w-12" />
      </td>
      <td className="py-3.5 pr-3">
        <Skel className="h-5 w-14 rounded-full" />
      </td>
      <td className="py-3.5 text-right">
        <Skel className="ml-auto h-6 w-12 rounded-lg" />
      </td>
    </tr>
  ));
}

// Skeleton shaped like one announcement card
function AnnouncementSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading announcements"
      className="min-h-[180px] animate-pulse rounded-2xl bg-slate-200 p-5 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl bg-slate-300" />
        <div className="h-5 w-16 rounded-full bg-slate-300" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 w-4/5 rounded bg-slate-300" />
        <div className="h-3 w-2/5 rounded bg-slate-300" />
      </div>
    </div>
  );
}

// Announcement background image: soft pulse until it loads, hidden if it fails
function AnnouncementImage({ src }) {
  const [status, setStatus] = useState("loading"); // loading | loaded | error
  const imgRef = useRef(null);

  // Handles images already cached before onLoad could fire
  useEffect(() => {
    setStatus("loading");
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setStatus("loaded");
  }, [src]);

  if (status === "error") return null;

  const isLoaded = status === "loaded";

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-white/25"
        />
      )}
      {isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/35 to-slate-900/20"
        />
      )}
    </>
  );
}


export default function Dashboard({ onNavigate }) {
  const go = (path) => {
    if (!path) return;
    if (onNavigate) onNavigate(path);
    else window.location.assign(path);
  };

  const now = useNow();
  const [calView, setCalView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [incidents, setIncidents] = useState([]);
 
  const [announcements, setAnnouncements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [hasLoadedDashboardData, setHasLoadedDashboardData] = useState(false);
  const [dashboardDataError, setDashboardDataError] = useState("");

  // Toasts + sound
  const [toasts, setToasts] = useState([]);
  const [soundOn, setSoundOn] = useState(false);
  const soundRef = useRef(false);
  const audioCtxRef = useRef(null);
  const seq = useRef({ incident: 84, announcement: 0, account: 0 });

  useEffect(() => {
    const controller = new AbortController();
    let refreshInFlight = false;

    async function loadDashboardData() {
      if (refreshInFlight) return;
      refreshInFlight = true;
      try {
        const result = await requestDashboardData(controller.signal);
        setIncidents(result.reports.map(mapDashboardIncident));
        setAccounts(
          result.users.map((user) => ({
            id: user.id,
            name: user.name,
            type: user.accountType,
            college: user.college,
            time: user.submitted,
            status: user.status,
            isNew: false,
          })),
        );
        setAnnouncements(
          result.announcements
            .filter((announcement) => announcement.status === "Published")
            .map((announcement) => ({
              id: announcement.id,
              title: announcement.title,
              audience: announcement.audience,
              time: announcement.published,
              imageUrl: announcement.imageUrl,
              createdAt:
                new Date(
                  announcement.publishedAtTime || announcement.publishedAt,
                ).getTime() || 0,
              sortId: Number(announcement.id) || 0,
              isNew: false,
            })),
        );
        setAlerts(result.alerts.map(mapDashboardAlert));
        setHasLoadedDashboardData(true);
        setDashboardDataError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setDashboardDataError(
            error.message || "Unable to load dashboard data.",
          );
        }
      } finally {
        refreshInFlight = false;
        if (!controller.signal.aborted) setIsDashboardLoading(false);
      }
    }

    loadDashboardData();
    const refreshTimer = window.setInterval(loadDashboardData, 15000);
    window.addEventListener("focus", loadDashboardData);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadDashboardData);
      controller.abort();
    };
  }, []);

  const pendingAccounts = accounts.filter(
    (account) => account.status === "Pending",
  );

  // Alerts created today, newest first
  const todayAlerts = alerts
    .filter((alert) => isSameDay(alert.createdAt, now))
    .sort((a, b) => b.createdAt - a.createdAt);
  const redAlertCount = todayAlerts.filter((a) => a.level === "red").length;
  const yellowAlertCount = todayAlerts.length - redAlertCount;

  // Panel list: alerts and announcements together, newest first
  const feedItems = [
    ...todayAlerts.slice(0, 5).map((alert) => ({
      ...alert,
      sortId: 0,
      isNew: now.getTime() - alert.createdAt < 10 * 60 * 1000,
    })),
    ...announcements.map((announcement) => ({
      ...announcement,
      kind: "announcement",
    })),
  ].sort((a, b) => b.createdAt - a.createdAt || b.sortId - a.sortId);

  const collegeReports = [
    { name: "Engineering", count: 64, width: "90%" },
    { name: "Arts & Sciences", count: 48, width: "70%" },
    { name: "Business", count: 36, width: "55%" },
    { name: "Education", count: 29, width: "42%" },
  ];

  // Sound 
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = (kind) => {
    if (!soundRef.current) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      SOUNDS[kind].forEach(
        ({ freq, start, dur, type = "sine", vol = 0.22 }) => {
          const t0 = ctx.currentTime + start;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = type;
          osc.frequency.value = freq;

          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + dur + 0.05);
        },
      );
    } catch (err) {
      console.error("Could not play notification sound:", err);
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundRef.current = next;
    if (next) getAudioContext(); 
  };

  // Toasts 
  const pushToast = (kind, detail) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [{ id, kind, detail }, ...prev].slice(0, 4));
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      6000,
    );
  };

  const dismissToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const expireNew = (setter, id) => {
    setTimeout(
      () =>
        setter((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isNew: false } : item,
          ),
        ),
      10000,
    );
  };

  // Incoming events 
  const addIncident = (data) => {
    const n = seq.current.incident++;
    const pick = data || INCIDENT_POOL[n % INCIDENT_POOL.length];
    const d = new Date();
    const datePart = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    const incident = {
      id: `C360-${datePart}-${String(n + 1).padStart(3, "0")}`,
      reporter: pick.reporter,
      category: pick.category,
      location: pick.location,
      time: nowTime(),
      status: "New",
      statusColor: "bg-rose-100 text-rose-700",
      isNew: true,
    };

    setIncidents((prev) => [incident, ...prev]);
    expireNew(setIncidents, incident.id);
    pushToast("incident", `${incident.category} at ${incident.location}`);
    playSound("incident");
  };

  const addAnnouncement = (data) => {
    const n = seq.current.announcement++;
    const pick = data || ANNOUNCEMENT_POOL[n % ANNOUNCEMENT_POOL.length];

    const announcement = {
      id: `a-${Date.now()}`,
      title: pick.title,
      audience: pick.audience,
      time: nowTime(),
      createdAt: Date.now(),
      sortId: 0,
      isNew: true,
    };

    setAnnouncements((prev) => [announcement, ...prev]);
    expireNew(setAnnouncements, announcement.id);
    pushToast("announcement", announcement.title);
    playSound("announcement");
  };

  const addAccount = (data) => {
    const n = seq.current.account++;
    const pick = data || ACCOUNT_POOL[n % ACCOUNT_POOL.length];

    const account = {
      id: `u-${Date.now()}`,
      name: pick.name,
      type: pick.type,
      college: pick.college,
      time: nowTime(),
      status: "Pending",
      isNew: true,
    };

    setAccounts((prev) => [account, ...prev]);
    expireNew(setAccounts, account.id);
    pushToast(
      "account",
      `${account.name} (${account.type}) is waiting for approval`,
    );
    playSound("account");
  };

  const NewPill = () => (
    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wide">
      New
    </span>
  );

  const newCount = (items) => items.filter((i) => i.isNew).length;
  const newIncidents = incidents.filter((incident) => incident.status === "New");

  // Calendar
  const calCells = buildMonthCells(calView.year, calView.month);
  const isToday = (day) =>
    day === now.getDate() &&
    calView.month === now.getMonth() &&
    calView.year === now.getFullYear();

  const shiftMonth = (delta) =>
    setCalView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const clockTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  const clockDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const registeredUserCount = isDashboardLoading ? (
    <Skel className="h-7 w-16" />
  ) : hasLoadedDashboardData ? (
    accounts.length.toLocaleString()
  ) : (
    "—"
  );
  const pendingApprovalCount = isDashboardLoading ? (
    <Skel className="h-7 w-16" />
  ) : hasLoadedDashboardData ? (
    pendingAccounts.length.toLocaleString()
  ) : (
    "—"
  );
  const incidentCount = isDashboardLoading ? (
    <Skel className="h-7 w-16" />
  ) : hasLoadedDashboardData ? (
    incidents.length.toLocaleString()
  ) : (
    "—"
  );
  const newAlertCount = isDashboardLoading ? (
    <Skel className="h-7 w-16" />
  ) : hasLoadedDashboardData ? (
    todayAlerts.length.toLocaleString()
  ) : (
    "—"
  );
  const incidentsThisWeek = incidents.filter(
    (incident) =>
      Number.isFinite(incident.reportedAt) &&
      incident.reportedAt >= now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).length;
  const resolvedIncidentCount = incidents.filter(
    (incident) => incident.status === "Resolved",
  ).length;
  const resolutionRate = incidents.length
    ? ((resolvedIncidentCount / incidents.length) * 100).toFixed(1)
    : "0.0";

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-100 select-none">
      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-80">
        {toasts.map((toast) => {
          const style = KIND_STYLES[toast.kind];
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              onClick={() => go(style.to)}
              className={`bg-white border ${style.border} rounded-2xl p-4 shadow-xl flex items-start gap-3 ${
                style.to ? "cursor-pointer" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.wrap}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900">
                  {style.label}
                </span>
                <span className="text-[11px] text-slate-500 leading-snug">
                  {toast.detail}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Dashboard Body */}
      <div className="p-8 pb-12 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
            Campus360 Command Center
          </span>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Security overview
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium mr-2">
                Live campus status
              </span>

              {/* {DEMO_MODE && (
                <>
                  <button
                    onClick={() => addIncident()}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Test incident
                  </button>
                  <button
                    onClick={() => addAnnouncement()}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Test announcement
                  </button>
                  <button
                    onClick={() => addAccount()}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Test account
                  </button>
                </>
              )} */}

              <button
                onClick={toggleSound}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  soundOn
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {soundOn ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                {soundOn ? "Sound on" : "Enable sound"}
              </button>
            </div>
          </div>
        </div>

        {dashboardDataError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700"
          >
            {dashboardDataError}
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          {/*Main dashboard  */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-5 gap-4">
              <div
                onClick={() => go(ROUTES.users)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-medium">Registered users</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {registeredUserCount}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    Across your college
                  </div>
                </div>
              </div>

              <div
                onClick={() => go(ROUTES.users)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-medium">Pending approvals</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {pendingApprovalCount}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    Requires attention
                  </div>
                </div>
              </div>

              <div
                onClick={() => go(ROUTES.reports)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-medium">Incident reports</span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {incidentCount}
                  </div>
                  <div className="text-[11px] text-purple-600 font-medium mt-1">
                    {isDashboardLoading ? (
                      <Skel className="h-3 w-20 bg-purple-100" />
                    ) : (
                      `${incidentsThisWeek} this week`
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-medium">New alerts</span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {newAlertCount}
                  </div>
                  <div className="text-[11px] text-rose-600 font-medium mt-1">
                    {isDashboardLoading ? (
                      <Skel className="h-3 w-24 bg-rose-100" />
                    ) : (
                      `${redAlertCount} red • ${yellowAlertCount} yellow today`
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-medium">
                    Resolved incidents
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {isDashboardLoading ? (
                      <Skel className="h-7 w-16" />
                    ) : hasLoadedDashboardData ? (
                      resolvedIncidentCount.toLocaleString()
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    {isDashboardLoading ? (
                      <Skel className="h-3 w-24" />
                    ) : (
                      `${resolutionRate}% resolution rate`
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Incident reports  + Reports by college */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        New incident reports
                      </h2>
                      <p className="text-xs text-slate-500">
                        Latest submissions requiring review
                      </p>
                    </div>
                    {newCount(incidents) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {newCount(incidents)} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => go(ROUTES.reports)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View all reports
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-medium">
                        <th className="pb-3 uppercase tracking-wider text-[10px]">
                          Report ID
                        </th>
                        <th className="pb-3 uppercase tracking-wider text-[10px]">
                          Reporter
                        </th>
                        <th className="pb-3 uppercase tracking-wider text-[10px]">
                          Category
                        </th>
                        <th className="pb-3 uppercase tracking-wider text-[10px]">
                          Location
                        </th>
                        <th className="pb-3 uppercase tracking-wider text-[10px]">
                          Time
                        </th>
                        <th className="pb-3 uppercase tracking-wider text-[10px]">
                          Status
                        </th>
                        <th className="pb-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y divide-slate-100"
                      aria-busy={isDashboardLoading}
                    >
                      {isDashboardLoading ? (
                        <IncidentRowsSkeleton />
                      ) : !hasLoadedDashboardData ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-xs text-rose-600"
                          >
                            {dashboardDataError ||
                              "Incident reports could not be loaded."}
                          </td>
                        </tr>
                      ) : newIncidents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-xs text-slate-400"
                          >
                            No new incident reports need review.
                          </td>
                        </tr>
                      ) : newIncidents.slice(0, 5).map((incident) => (
                        <tr
                          key={incident.id}
                          onClick={() => go(ROUTES.reports)}
                          className={`transition-colors cursor-pointer ${
                            incident.isNew
                              ? "bg-rose-50/60"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="py-3.5 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              {incident.id}
                              {incident.isNew && <NewPill />}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {incident.reporter}
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {incident.category}
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {incident.location}
                          </td>
                          <td className="py-3.5 text-slate-500">
                            {incident.time}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${incident.statusColor}`}
                            >
                              {incident.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                go(ROUTES.reports);
                              }}
                              className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Reports by college
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">
                    Current academic year
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {collegeReports.map((college, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          {college.name}
                        </span>
                        <span className="font-bold text-slate-900">
                          {college.count}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: college.width }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* New registered accounts */}
              <div
                onClick={() => go(ROUTES.users)}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xs cursor-pointer hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        New registered accounts
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Waiting for approval
                      </p>
                    </div>
                  </div>
                  {pendingAccounts.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {pendingAccounts.length} pending
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  {isDashboardLoading ? (
                    Array.from({ length: 3 }, (_, index) => (
                      <div
                        key={`loading-account-${index}`}
                        aria-hidden="true"
                        className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 animate-pulse"
                      >
                        <div className="h-3.5 w-1/3 rounded bg-slate-200" />
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                      </div>
                    ))
                  ) : !hasLoadedDashboardData ? (
                    <p className="py-4 text-center text-xs text-slate-400">
                      Unable to load accounts.
                    </p>
                  ) : pendingAccounts.length > 0 ? (
                    pendingAccounts.slice(0, 3).map((account) => (
                      <div
                        key={account.id}
                        className={`rounded-xl p-3 flex flex-col gap-1 border transition-colors ${
                          account.isNew
                            ? "bg-emerald-50/70 border-emerald-200"
                            : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {account.name}
                          </span>
                          {account.isNew && <NewPill />}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {account.type} • {account.college} • {account.time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-xs text-slate-400">
                      No accounts awaiting approval.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Incident trends
                    </h2>
                    <p className="text-xs text-slate-500">Last 12 months</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer">
                    <span>12 mo</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="h-44 flex items-end gap-1.5 pt-6">
                  {[45, 30, 50, 40, 35, 60, 55, 45, 65, 55, 75, 95].map(
                    (val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-blue-100 hover:bg-blue-500 rounded-t-lg transition-all relative group"
                        style={{ height: `${val}%` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {val}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* News, time, calendar*/}
          <div className="flex flex-col gap-6 min-w-0">
            {/* News & announcements */}
            <aside className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      News & announcements
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Newest first
                    </p>
                  </div>
                </div>
                {hasLoadedDashboardData && todayAlerts.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {todayAlerts.length}{" "}
                    {todayAlerts.length === 1 ? "alert" : "alerts"}
                  </span>
                )}
              </div>

              {/* Shows one card at a time; scroll for the rest */}
              <div className="flex flex-col gap-4 max-h-[200px] overflow-y-auto snap-y snap-mandatory pr-1">
                {isDashboardLoading ? (
                  <AnnouncementSkeleton />
                ) : !hasLoadedDashboardData ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    Unable to load announcements.
                  </p>
                ) : feedItems.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    No alerts or published announcements.
                  </p>
                ) : (
                  feedItems.map((item, idx) =>
                    item.kind === "alert" ? (
                      <div
                        key={item.id}
                        onClick={() => go(ROUTES.news)}
                        className={`relative overflow-hidden snap-start shrink-0 min-h-[180px] rounded-2xl p-5 flex flex-col justify-between bg-gradient-to-br cursor-pointer hover:brightness-105 transition ${
                          ALERT_STYLES[item.level].card
                        } ${item.isNew ? "ring-2 ring-rose-400 ring-offset-2" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              ALERT_STYLES[item.level].iconWrap
                            }`}
                          >
                            <AlertCircle
                              className={`w-4 h-4 ${item.isNew ? "animate-pulse" : ""}`}
                            />
                          </div>
                          {item.isNew ? (
                            <NewPill />
                          ) : (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                ALERT_STYLES[item.level].chip
                              }`}
                            >
                              {item.time}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                            {ALERT_STYLES[item.level].label}
                          </span>
                          <span className="text-base font-bold leading-snug">
                            {item.title}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              ALERT_STYLES[item.level].sub
                            }`}
                          >
                            {item.college}
                            {item.isNew ? ` • ${item.time}` : ""}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={item.id}
                        onClick={() => go(ROUTES.news)}
                        className={`relative overflow-hidden snap-start shrink-0 min-h-[180px] rounded-2xl p-5 flex flex-col justify-between text-white bg-gradient-to-br cursor-pointer hover:brightness-110 transition ${
                          AD_STYLES[idx % AD_STYLES.length]
                        } ${item.isNew ? "ring-2 ring-rose-400 ring-offset-2" : ""}`}
                      >
                        {item.imageUrl && (
                          <AnnouncementImage src={item.imageUrl} />
                        )}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          {item.isNew ? (
                            <NewPill />
                          ) : (
                            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                              {item.time}
                            </span>
                          )}
                        </div>

                        <div className="relative z-10 flex flex-col gap-1">
                          <span className="text-base font-bold leading-snug">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-white/80 font-medium">
                            {item.audience}
                            {item.isNew ? ` • ${item.time}` : ""}
                          </span>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </aside>

            {/* Live clock */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between gap-6 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Local time
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Live campus clock
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-slate-900 tabular-nums">
                  {clockTime}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {clockDate}
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Calendar
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {MONTHS[calView.month]} {calView.year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => shiftMonth(-1)}
                    className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => shiftMonth(1)}
                    className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-medium uppercase tracking-wider text-slate-400 pb-1"
                  >
                    {d}
                  </span>
                ))}
                {calCells.map((day, idx) =>
                  day === null ? (
                    <span key={`e-${idx}`} />
                  ) : (
                    <span
                      key={day}
                      className={`text-xs py-2 rounded-lg font-medium ${
                        isToday(day)
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {day}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}