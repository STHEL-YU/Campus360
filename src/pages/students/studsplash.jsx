import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, Sparkles } from "lucide-react";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const handleGetStarted = () => {
    setIsExiting(true);
    // Smooth exit transition delay before routing
    setTimeout(() => {
      navigate("/student/login");
    }, 400);
  };

  return (
    <div className="flex justify-center bg-slate-950 min-h-screen font-sans">
      {/* Mobile PWA Shell Frame */}
      <div
        className={`w-full max-w-md bg-[#0f172a] shadow-2xl relative flex flex-col justify-between h-screen overflow-hidden text-white p-8 transition-opacity duration-400 ${isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        {/* Background Ambient Glowing Orbs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Branding Badge */}
        <div className="relative z-10 pt-6 flex items-center justify-between">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/20 px-3 py-1.5 rounded-full text-blue-400 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Smart Campus Security</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">v1.0</span>
        </div>

        {/* Center Hero Graphic & Taglines */}
        <div className="relative z-10 space-y-6 my-auto">
          {/* Animated Glowing Shield Logo */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl blur-xl opacity-60 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl border border-blue-400/40">
              <Shield className="w-12 h-12 text-white animate-bounce" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-white">
              Campus
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                360
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              Your centralized university safety network, real-time alerts, and
              instant incident reporting tool.
            </p>
          </div>
        </div>

        {/* Bottom Action Area */}
        <div className="relative z-10 pb-8 space-y-4">
          <button
            onClick={handleGetStarted}
            className="w-full group bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-300 flex items-center justify-center space-x-3 active:scale-[0.98] cursor-pointer"
          >
            <span className="text-sm tracking-wide">Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[11px] text-slate-400 text-center font-medium">
            Protected by university encryption standards.
          </p>
        </div>
      </div>
    </div>
  );
}
