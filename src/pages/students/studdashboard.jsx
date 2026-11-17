import { useEffect, useRef, useState } from "react";
import { getStudentProfile } from "../../auth";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  ChevronRight,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";

const ALARM_SECONDS = 5;
const VIBRATION_PATTERN = [
  600, 200, 600, 200, 600, 200, 600, 200, 600, 200, 600,
];
const SOUND_KEY = "campus360.student.sound";

// Alarm is ON unless the student turned it off before
function readSoundPreference() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveSoundPreference(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

// Real phone notification, shown through the service worker (/sw.js) so it
// also works on Android Chrome. Uses the phone's own notification sound.
async function showSystemNotification({ title, body, url, urgent = false }) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const options = {
    body,
    icon: "/icon-192.png", // put your icon in /public (optional)
    badge: "/icon-192.png",
    tag: `campus360-${Date.now()}`,
    renotify: true,
    vibrate: urgent ? VIBRATION_PATTERN : [200, 100, 200],
    requireInteraction: urgent,
    data: { url },
  };

  try {
    const registration =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration()
        : null;
    if (registration) await registration.showNotification(title, options);
    else new Notification(title, options);
  } catch (error) {
    console.error("Could not show notification", error);
  }
}

async function playAlarmSound(context, onError) {
  try {
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return;

    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
    gain.gain.setValueAtTime(0.25, start + ALARM_SECONDS - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + ALARM_SECONDS);

    oscillator.frequency.setValueAtTime(700, start);
    for (let t = 0; t < ALARM_SECONDS; t += 0.8) {
      oscillator.frequency.linearRampToValueAtTime(1100, start + t + 0.4);
      oscillator.frequency.linearRampToValueAtTime(700, start + t + 0.8);
    }

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + ALARM_SECONDS);
  } catch (error) {
    console.error("Could not play campus alert notification sound", error);
    onError("Unable to play the alert notification sound.");
  }
}

function vibrateDevice(pattern = VIBRATION_PATTERN) {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function"
  ) {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.error("Could not vibrate the device", error);
  }
}

function isAlertFromToday(value) {
  const date = new Date(value);
  const today = new Date();
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getLocalDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatAlertDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function AlertSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-slate-100 border-l-4 border-l-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-10 w-10 shrink-0 rounded-2xl bg-slate-200" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-2/5 rounded bg-slate-200" />
            <div className="h-4 w-14 rounded-full bg-slate-200" />
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

function NewsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      <div className="h-36 w-full bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-32 rounded-full bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-2/3 rounded bg-slate-200" />
        </div>
        <div className="h-3 w-24 rounded bg-slate-200" />
      </div>
    </div>
  );
}

// News image with a skeleton until it loads
function NewsImage({ src, alt }) {
  const [status, setStatus] = useState("loading");
  const imgRef = useRef(null);

  // Handles images already cached before onLoad could fire
  useEffect(() => {
    setStatus("loading");
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setStatus("loaded");
  }, [src]);

  if (status === "error") {
    return (
      <div className="h-24 w-full bg-gradient-to-br from-blue-100 to-slate-200 flex items-center justify-center">
        <span className="text-sm font-bold tracking-widest text-slate-500">
          CAMPUS360
        </span>
      </div>
    );
  }

  const isLoaded = status === "loaded";

  return (
    <div className="h-36 w-full relative overflow-hidden">
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-slate-200"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
      )}
    </div>
  );
}

export default function Dashboard({ onReportClick }) {
  const profile = getStudentProfile() || {};
  const firstName = profile.fullName?.trim().split(/\s+/)[0] || "Student";
  const avatar = profile.profileImage || "/default-avatar.svg";
  const [todayNews, setTodayNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [areAlertsLoading, setAreAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(readSoundPreference);
  const [soundError, setSoundError] = useState("");
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission,
  );
  const [newAlertIds, setNewAlertIds] = useState([]);
  const audioContextRef = useRef(null);
  const seenAlertIdsRef = useRef(null);
  const seenNewsIdsRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  const newAlertTimeoutRef = useRef(null);

  // Creates (or recreates) the audio context and tries to resume it
  const getAudioContext = () => {
    const AudioContextConstructor =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = new AudioContextConstructor();
    }
    return audioContextRef.current;
  };

  const toggleAlertSound = async () => {
    if (soundEnabledRef.current) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      saveSoundPreference(false);
      return;
    }

    try {
      const context = getAudioContext();
      if (!context) {
        setSoundError("This browser does not support notification sounds.");
        return;
      }
      await context.resume();
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      saveSoundPreference(true);
      setSoundError("");
      vibrateDevice(200);
    } catch (error) {
      console.error("Could not enable campus alert sounds", error);
      setSoundError("Unable to enable notification sounds in this browser.");
    }
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      showSystemNotification({
        title: "Notifications enabled",
        body: "You will be alerted when a new campus alert arrives.",
        url: "/student",
      });
    }
  };

  // Register the service worker used for real phone notifications
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Browsers block sound until the first tap, so unlock audio on first touch
  useEffect(() => {
    const events = ["pointerdown", "touchstart", "keydown"];
    const unlock = async () => {
      events.forEach((name) => window.removeEventListener(name, unlock));
      try {
        const context = getAudioContext();
        if (!context) return;
        await context.resume();
      } catch {
        /* ignore */
      }
    };
    events.forEach((name) => window.addEventListener(name, unlock));
    return () =>
      events.forEach((name) => window.removeEventListener(name, unlock));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let requestInFlight = false;

    async function loadAlerts() {
      if (requestInFlight) return;
      requestInFlight = true;
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

        const previousIds = seenAlertIdsRef.current;
        const currentIds = new Set(result.alerts.map((alert) => alert.id));
        if (previousIds) {
          const newlyReceived = result.alerts.filter(
            (alert) =>
              !previousIds.has(alert.id) && isAlertFromToday(alert.createdAt),
          );
          if (newlyReceived.length > 0) {
            setNewAlertIds(newlyReceived.map((alert) => alert.id));
            if (newAlertTimeoutRef.current) {
              window.clearTimeout(newAlertTimeoutRef.current);
            }
            newAlertTimeoutRef.current = window.setTimeout(
              () => setNewAlertIds([]),
              10000,
            );

            vibrateDevice();
            if (soundEnabledRef.current) {
              const context = getAudioContext();
              if (context) void playAlarmSound(context, setSoundError);
            }

            // Real phone notification (works with the screen off / app in background)
            newlyReceived.slice(0, 3).forEach((alert) => {
              const message = String(alert.message || "").slice(0, 140);
              showSystemNotification({
                title: alert.title || "Campus alert",
                body: message || "Open Campus360 to read the alert.",
                url: "/student/alerts",
                urgent: true,
              });
            });
          }
        }
        seenAlertIdsRef.current = currentIds;
        const latestToday = result.alerts
          .filter((alert) => isAlertFromToday(alert.createdAt))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 1);
        setAlerts(latestToday);
        setAlertsError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setAlertsError(error.message || "Unable to load campus alerts.");
        }
      } finally {
        requestInFlight = false;
        if (!controller.signal.aborted) setAreAlertsLoading(false);
      }
    }

    loadAlerts();
    const refreshTimer = window.setInterval(loadAlerts, 15000);
    window.addEventListener("focus", loadAlerts);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadAlerts);
      window.clearTimeout(newAlertTimeoutRef.current);
      controller.abort();
      const context = audioContextRef.current;
      if (context && context.state !== "closed") {
        void context.close();
      }
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let requestInFlight = false;

    async function loadTodayNews() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch("/api/news/feed", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load campus news.");
        }
        if (!Array.isArray(result.announcements)) {
          throw new Error("The server returned an invalid news feed.");
        }

        const today = getLocalDateString();
        const todayItems = result.announcements.filter(
          (announcement) => announcement.publishedAt === today,
        );

        // Phone notification for announcements published after the page opened
        const previousNewsIds = seenNewsIdsRef.current;
        seenNewsIdsRef.current = new Set(todayItems.map((item) => item.id));
        if (previousNewsIds) {
          todayItems
            .filter((item) => !previousNewsIds.has(item.id))
            .slice(0, 3)
            .forEach((item) => {
              showSystemNotification({
                title: "New campus announcement",
                body: item.title || "Open Campus360 to read it.",
                url: "/student/news",
              });
            });
        }

        const latestToday = todayItems
          .sort((a, b) => {
            const aTime = new Date(a.createdAt || a.publishedAt).getTime();
            const bTime = new Date(b.createdAt || b.publishedAt).getTime();
            return (
              (Number.isNaN(bTime) ? 0 : bTime) -
              (Number.isNaN(aTime) ? 0 : aTime)
            );
          })
          .slice(0, 1);
        setTodayNews(latestToday);
        setNewsError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setNewsError(error.message || "Unable to load campus news.");
        }
      } finally {
        requestInFlight = false;
        if (!controller.signal.aborted) setIsNewsLoading(false);
      }
    }

    loadTodayNews();
    const refreshTimer = window.setInterval(loadTodayNews, 15000);
    window.addEventListener("focus", loadTodayNews);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadTodayNews);
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28">
      {/* Main Container */}
      <main className="px-5 space-y-6 max-w-md mx-auto pt-4">
        {/* User Greeting Section */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Student dashboard
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-0.5">
              Good day, {firstName}!
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {profile.college || "College"} · {profile.role || "Student"}
            </p>
          </div>

          {/* Avatar / Profile Graphic */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={avatar}
              alt={`${profile.fullName || "Student"}'s profile`}
              onError={(event) => {
                event.currentTarget.src = "/default-avatar.svg";
              }}
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

        {/* LIVE UPDATES: Latest Safety Alert */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">
                Live Updates
              </span>
              <h3 className="mt-1 text-sm font-bold text-slate-800">
                Latest alert
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAlertSound}
                aria-pressed={soundEnabled}
                aria-label={
                  soundEnabled
                    ? "Disable alarm sound for new alerts"
                    : "Enable alarm sound for new alerts"
                }
                className={`flex items-center gap-1 text-xs font-semibold ${
                  soundEnabled
                    ? "text-emerald-700"
                    : "text-slate-500 hover:text-blue-600"
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                {soundEnabled ? "Alarm on" : "Enable alarm"}
              </button>
              <Link
                to="/student/alerts"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View all
              </Link>
            </div>
          </div>

          {notifPermission !== "unsupported" &&
            notifPermission !== "granted" && (
              <button
                type="button"
                onClick={enableNotifications}
                disabled={notifPermission === "denied"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 disabled:opacity-60"
              >
                <BellRing className="h-4 w-4" />
                {notifPermission === "denied"
                  ? "Notifications are blocked in your browser settings"
                  : "Turn on phone notifications for alerts"}
              </button>
            )}
          {notifPermission === "granted" && (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
              <BellRing className="h-3.5 w-3.5" />
              Phone notifications are on
            </p>
          )}

          {soundError && (
            <p role="status" className="text-[11px] text-rose-600">
              {soundError}
            </p>
          )}
          {alertsError && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
            >
              {alertsError}
            </p>
          )}
          {areAlertsLoading ? (
            <div
              role="status"
              aria-live="polite"
              aria-label="Loading latest safety alert"
            >
              <AlertSkeleton />
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-3" aria-live="assertive">
              {alerts.map((alert) => {
                const isNew = newAlertIds.includes(alert.id);
                return (
                  <article
                    key={alert.id}
                    className={`relative overflow-hidden rounded-2xl border border-slate-100 border-l-4 p-4 shadow-sm ${
                      isNew
                        ? "border-l-rose-600 bg-rose-50 ring-1 ring-rose-200"
                        : "border-l-amber-400 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          isNew
                            ? "animate-pulse bg-rose-100 text-rose-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {alert.title}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isNew
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {isNew ? "Just now" : "Today"}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                          {alert.message}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span>{alert.college}</span>
                          <span className="flex shrink-0 items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatAlertDate(
                              alert.alertTime || alert.createdAt,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            !alertsError && (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-xs text-slate-400 shadow-sm">
                No new alerts today for your college.
              </p>
            )
          )}
        </section>

        {/* Campus Updates / News Section */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Campus updates</h3>
            <Link
              to="/student/news"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {newsError && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
            >
              {newsError}
            </p>
          )}

          {isNewsLoading ? (
            <div
              role="status"
              aria-live="polite"
              aria-label="Loading today's campus news"
              className="space-y-3"
            >
              <NewsSkeleton />
            </div>
          ) : todayNews.length > 0 ? (
            todayNews.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
              >
                {item.imageUrl ? (
                  <NewsImage src={item.imageUrl} alt={item.title} />
                ) : (
                  <div className="h-24 w-full bg-gradient-to-br from-blue-100 to-slate-200 flex items-center justify-center">
                    <span className="text-sm font-bold tracking-widest text-slate-500">
                      CAMPUS360
                    </span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                    New today · {item.type}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.content || "No message content."}
                  </p>
                  <p className="text-[11px] text-slate-400">{item.published}</p>
                </div>
              </article>
            ))
          ) : (
            !newsError && (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-xs text-slate-400 shadow-sm">
                No new announcements today.
              </p>
            )
          )}
        </section>
      </main>
    </div>
  );
}
