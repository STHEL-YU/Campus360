import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Images live in src/assets/ (this file is src/pages/admins/auth/login.jsx)
import ssu1 from "../../../assets/ssu1.jpg";
import ssu2 from "../../../assets/ssu2.jpg";
import ssu3 from "../../../assets/ssu3.jpg";

const COLLEGES = [
  "College of Engineering",
  "College of Arts & Sciences",
  "College of Business",
  "College of Education",
  "College of Nursing",
];

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

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
    />
    <path
      fill="#FBBC05"
      d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
    />
  </svg>
);

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

const inputBase =
  "w-full bg-white border border-slate-200 rounded-xl py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({ id, label, icon: Icon, optional, children }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
        {optional && (
          <span className="text-slate-400 font-medium"> (optional)</span>
        )}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        {children}
      </div>
    </div>
  );
}

export default function Login({ onLogin, onGoogle, onNavigate }) {
  const [mode, setMode] = useState("signin"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    employeeId: "",
    college: "",
  });
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isSignup = mode === "signup";
  const busy = loading !== null;

  const setField = (key) => (e) =>
    setProfile((p) => ({ ...p, [key]: e.target.value }));

  // Phone: allow digits, +, spaces and dashes only
  const setPhone = (e) =>
    setProfile((p) => ({
      ...p,
      phone: e.target.value.replace(/[^\d+\-\s]/g, ""),
    }));

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading("email");
      await onLogin?.({ email: email.trim(), password });
      onNavigate?.("/dashboard");
    } catch (err) {
      setError(
        err?.message || "Could not sign in. Check your details and try again.",
      );
    } finally {
      setLoading(null);
    }
  };

  const validateProfile = () => {
    if (!profile.firstName.trim()) return "Enter your first name.";
    if (!profile.lastName.trim()) return "Enter your last name.";
    if (profile.phone.replace(/\D/g, "").length < 7)
      return "Enter a valid phone number.";
    if (!profile.employeeId.trim()) return "Enter your employee ID.";
    if (!profile.college) return "Select your college.";
    return "";
  };

  const handleGoogle = async () => {
    setError("");
    setNotice("");

    if (isSignup) {
      const problem = validateProfile();
      if (problem) {
        setError(problem);
        return;
      }
    }

    try {
      setLoading("google");
      await onGoogle?.(
        isSignup
          ? {
              mode,
              profile: {
                firstName: profile.firstName.trim(),
                middleName: profile.middleName.trim(),
                lastName: profile.lastName.trim(),
                phone: profile.phone.trim(),
                employeeId: profile.employeeId.trim(),
                college: profile.college,
              },
            }
          : { mode },
      );

      if (isSignup) {
        setNotice(
          "Account request sent. You can sign in once an administrator approves it.",
        );
      } else {
        onNavigate?.("/dashboard");
      }
    } catch (err) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

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
                  ? "Fill in your details, then continue with Google. An administrator approves new accounts."
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
            {notice && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-medium">{notice}</span>
              </div>
            )}

            {isSignup ? (
              /* ----- Create account ----- */
              <div className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="firstName" label="First name" icon={User}>
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={profile.firstName}
                      onChange={setField("firstName")}
                      placeholder="Juan"
                      className={`${inputBase} pl-10 pr-3`}
                    />
                  </Field>
                  <Field id="middleName" label="Middle name" optional>
                    <input
                      id="middleName"
                      type="text"
                      autoComplete="additional-name"
                      value={profile.middleName}
                      onChange={setField("middleName")}
                      placeholder="Santos"
                      className={`${inputBase} px-3`}
                    />
                  </Field>
                </div>

                <Field id="lastName" label="Last name">
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={profile.lastName}
                    onChange={setField("lastName")}
                    placeholder="Dela Cruz"
                    className={`${inputBase} px-3`}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field id="phone" label="Phone number" icon={Phone}>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={profile.phone}
                      onChange={setPhone}
                      placeholder="0917 123 4567"
                      className={`${inputBase} pl-10 pr-3`}
                    />
                  </Field>
                  <Field id="employeeId" label="Employee ID" icon={BadgeCheck}>
                    <input
                      id="employeeId"
                      type="text"
                      value={profile.employeeId}
                      onChange={setField("employeeId")}
                      placeholder="EMP-0001"
                      className={`${inputBase} pl-10 pr-3`}
                    />
                  </Field>
                </div>

                <Field id="college" label="College" icon={Building2}>
                  <select
                    id="college"
                    value={profile.college}
                    onChange={setField("college")}
                    className={`${inputBase} pl-10 pr-3`}
                  >
                    <option value="">Select your college</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {loading === "google" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <GoogleIcon />
                    </span>
                  )}
                  Create account with Google
                </button>
              </div>
            ) : (
              /* ----- Sign in ----- */
              <div className="flex flex-col gap-4">
                <form
                  onSubmit={handleEmailLogin}
                  className="flex flex-col gap-4"
                >
                  <Field id="email" label="Email" icon={Mail}>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@school.edu"
                      className={`${inputBase} pl-10 pr-3`}
                    />
                  </Field>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="password"
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={`${inputBase} pl-10 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                  >
                    {loading === "email" && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Sign in
                  </button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-medium">
                    or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {loading === "google" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>
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
