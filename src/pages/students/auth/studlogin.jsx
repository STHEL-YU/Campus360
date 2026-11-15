import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/student/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: credentials.identifier.trim(),
          password: credentials.password,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to sign in.");
      }

      if (onLogin) {
        await onLogin(result.student);
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Hero Section (Deep Navy Blue) */}
      <div className="bg-[#0f172a] text-white px-6 pt-10 pb-12 relative overflow-hidden rounded-b-[40px] shadow-xl">
        {/* Abstract Background Ring Decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 border border-blue-500/20 rounded-full pointer-events-none" />
        <div className="absolute -right-24 -top-24 w-96 h-96 border border-blue-500/10 rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-md mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center">
                Campus<span className="text-blue-400">360</span>
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                University Safety
              </p>
            </div>
          </div>

          {/* Headline Text */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
              Safer Together
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Your Campus.
              <br />
              Your Safety.
              <br />
              <span className="text-blue-400">Connected.</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xs pt-1">
              University safety and emergency alert system
            </p>
          </div>
        </div>
      </div>

      {/* Form Container (Clean Light Mode Bottom Card) */}
      <div className="flex-1 px-6 pt-8 pb-10 max-w-md mx-auto w-full flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <p className="text-xs text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
          <div>
            <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
              Welcome Back
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Sign in to Campus360
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Use your university credentials to continue.
            </p>
          </div>

          {/* Email or ID Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Email or Student ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2024-01842"
              value={credentials.identifier}
              onChange={(e) =>
                setCredentials({ ...credentials, identifier: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Password
              </label>
              <a
                href="#forgot"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  
                    <Eye className="w-4 h-4" />
                  
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-70"
            >
              <span>{loading ? "Signing in..." : "Sign in"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer & Registration Link */}
        <div className="pt-6 text-center space-y-4">
          <p className="text-xs text-slate-500">
            New to Campus360?{" "}
            <Link
              to="/student/signup"
              className="font-bold text-blue-600 hover:underline"
            >
              Register account
            </Link>
          </p>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-medium">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Your information is protected by the university.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
