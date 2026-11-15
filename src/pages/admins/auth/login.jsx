import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Signup from "./signup.jsx";

// Images live in src/assets/ (this file is src/pages/admins/auth/login.jsx)
import ssu1 from "../../../assets/ssu1.jpg";
import ssu2 from "../../../assets/ssu2.jpg";
import ssu3 from "../../../assets/ssu3.jpg";

// Slide images come from src/assets (ssu1.jpg, ssu2.jpg, ssu3.jpg).
// If an image fails to load, the built-in default image is shown instead.
const SLIDES = [
  {
    image: ssu1,
    gradient: "from-blue-800 to-blue-500",
    title: "Live incident alerts",
    text: "See new reports the moment they are submitted.",
  },
  {
    image: ssu2,
    gradient: "from-indigo-800 to-blue-500",
    title: "Campus-wide announcements",
    text: "Publish news and advisories to students and faculty.",
  },
  {
    image: ssu3,
    gradient: "from-sky-800 to-blue-600",
    title: "A safer campus together",
    text: "Review reports by college and approve new accounts.",
  },
];

const SLIDE_MS = 5000;

// Default image: a simple campus illustration drawn as an inline SVG (no file needed).
const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#sky)"/>
  <circle cx="620" cy="140" r="54" fill="#fff" opacity="0.18"/>
  <g fill="#fff" opacity="0.22">
    <rect x="130" y="300" width="540" height="200"/>
    <polygon points="110,300 400,190 690,300"/>
    <rect x="360" y="130" width="80" height="60"/>
    <polygon points="350,130 400,95 450,130"/>
  </g>
  <g fill="#fff" opacity="0.35">
    <rect x="165" y="340" width="34" height="160"/>
    <rect x="245" y="340" width="34" height="160"/>
    <rect x="325" y="340" width="34" height="160"/>
    <rect x="441" y="340" width="34" height="160"/>
    <rect x="521" y="340" width="34" height="160"/>
    <rect x="601" y="340" width="34" height="160"/>
    <rect x="378" y="390" width="44" height="110" rx="4"/>
  </g>
  <g fill="#fff" opacity="0.18">
    <circle cx="70" cy="440" r="48"/><rect x="64" y="470" width="12" height="40"/>
    <circle cx="740" cy="440" r="48"/><rect x="734" y="470" width="12" height="40"/>
    <rect x="0" y="500" width="800" height="100"/>
  </g>
  <g opacity="0.9" transform="translate(400 255)">
    <path d="M0 -34 L28 -22 V6 C28 22 14 32 0 38 C-14 32 -28 22 -28 6 V-22 Z" fill="#fff" opacity="0.85"/>
    <path d="M-12 2 L-3 11 L14 -8" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
const DEFAULT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_SVG)}`;

function Slideshow({ className = "" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      SLIDE_MS,
    );
    return () => clearTimeout(timer);
  }, [index]);

  const go = (next) => setIndex((next + SLIDES.length) % SLIDES.length);

  return (
    <section
      className={`relative block overflow-hidden h-56 lg:h-auto lg:min-h-[560px] text-white ${className}`}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <img
            src={slide.image || DEFAULT_IMAGE}
            alt=""
            onError={(e) => {
              if (e.currentTarget.src !== DEFAULT_IMAGE)
                e.currentTarget.src = DEFAULT_IMAGE;
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-slate-900/30" />
        </div>
      ))}

      {/* Brand */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <span className="text-sm font-bold">Campus360</span>
      </div>

      {/* Caption + controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5 lg:min-h-[88px]">
          <h2 className="text-2xl font-bold leading-tight">
            {SLIDES[index].title}
          </h2>
          <p className="hidden lg:block text-sm text-white/80 max-w-sm">
            {SLIDES[index].text}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-8 bg-white"
                    : "w-3 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Login({ onGoogle, onEmailPassword, onNavigate }) {
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";
  const busy = loading !== null;

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleGoogleSuccess = async ({ credential }) => {
    setError("");

    if (!credential) {
      setError("Google did not provide an identity token. Try again.");
      return;
    }

    try {
      setLoading("google");
      await onGoogle({ mode: "signin", credential });
      onNavigate?.("/dashboard");
    } catch (error) {
      setError(error?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading("password");
      await onEmailPassword({
        mode: "signin",
        email: email.trim().toLowerCase(),
        password,
      });
      onNavigate?.("/dashboard");
    } catch (error) {
      setError(error?.message || "Email sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const googleButton = busy ? (
    <div className="flex items-center justify-center gap-2 text-xs text-blue-700">
      <Loader2 className="w-4 h-4 animate-spin" />
      Verifying Google account...
    </div>
  ) : (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => setError("Google sign-in failed. Please try again.")}
      text="signin_with"
      theme="filled_blue"
      size="large"
      shape="rectangular"
      containerProps={{ className: "w-full flex justify-center" }}
    />
  );

  return (
    <main className="h-screen w-full overflow-y-auto bg-slate-100 select-none">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full max-w-[920px] grid grid-cols-1 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden ${
            isSignup
              ? "lg:grid-cols-[420px_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_420px]"
          }`}
        >
          {/* Slideshow: on the LEFT when signing in, on the RIGHT when creating an account.
            On small screens it always sits on top. */}
          <Slideshow
            className={isSignup ? "order-1 lg:order-2" : "order-1 lg:order-1"}
          />

          {/* Form: on the RIGHT when signing in, on the LEFT when creating an account */}
          <section
            className={`p-6 sm:p-8 flex flex-col gap-4 ${
              isSignup ? "order-2 lg:order-1" : "order-2 lg:order-2"
            }`}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
                Campus360
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-xs text-slate-500">
                {isSignup
                  ? "Create your account with email and password, or continue with Google."
                  : "Sign in to the Command Center."}
              </p>
            </div>

            {/* Sign in / Create account tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { id: "signin", label: "Sign in" },
                { id: "signup", label: "Create account" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchMode(tab.id)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    mode === tab.id
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            )}
            {isSignup ? (
              <Signup
                onGoogleSignup={({ credential, profile }) =>
                  onGoogle({ mode: "signup", credential, profile })
                }
                onEmailSignup={({ email, password, profile }) =>
                  onEmailPassword({ mode: "signup", email, password, profile })
                }
              />
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-500">
                  Sign in with your admin email and password, or use Google.
                </p>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={handlePasswordLogin}
                >
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    aria-label="Email address"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    aria-label="Password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading === "password" ? "Signing in..." : "Sign in"}
                  </button>
                </form>
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="h-px flex-1 bg-slate-200" />
                      OR CONTINUE WITH GOOGLE
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    {googleButton}
                  </div>
                ) : (
                  <p className="text-center text-[11px] text-slate-400">
                    Google sign-in is unavailable.
                  </p>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-400 text-center">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? "signin" : "signup")}
                className="font-semibold text-blue-600 hover:underline"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </button>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
