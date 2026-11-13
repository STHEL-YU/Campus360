import React, { useState } from "react";
import { ChevronLeft, Bell, Upload, CheckCircle2 } from "lucide-react";

export default function Register({ onBack, onSuccess }) {
  const [role, setRole] = useState("Student");
  const [formData, setFormData] = useState({
    fullName: "",
    schoolId: "",
    email: "",
    college: "College of Engineering",
    program: "BS Information Technology",
    yearLevel: "Third year",
    password: "",
    confirmPassword: "",
    confirmed: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setSubmitted(true);
    if (onSuccess) onSuccess(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center pb-28">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Registration Submitted
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Your information will be reviewed by an administrator before your
          account is activated.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            if (onBack) onBack();
          }}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
        >
          Return to Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-base font-bold text-slate-900">Create account</h1>

        <button
          aria-label="Notifications"
          className="relative w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      </header>

      {/* Main Container */}
      <main className="px-5 pt-4 max-w-md mx-auto space-y-5">
        {/* Title Section */}
        <div>
          <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">
            Account Registration
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            Join your campus safety network
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your information will be reviewed by an administrator.
          </p>
        </div>

        {/* Role Toggle Tabs (Student / Faculty) */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl">
          {["Student", "Faculty"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRole(tab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                role === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Complete Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Complete name
            </label>
            <input
              type="text"
              required
              placeholder="First name, Middle name, Last name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* School ID & Email Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                School ID number
              </label>
              <input
                type="text"
                required
                placeholder="2024-01842"
                value={formData.schoolId}
                onChange={(e) =>
                  setFormData({ ...formData, schoolId: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="name@university.edu"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm truncate"
              />
            </div>
          </div>

          {/* College and Academic Program Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                College
              </label>
              <div className="relative">
                <select
                  value={formData.college}
                  onChange={(e) =>
                    setFormData({ ...formData, college: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm truncate font-medium"
                >
                  <option value="College of Engineering">
                    College of Engineering
                  </option>
                  <option value="College of Arts & Sciences">
                    College of Arts & Sciences
                  </option>
                  <option value="College of Nursing">College of Nursing</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Academic program
              </label>
              <div className="relative">
                <select
                  value={formData.program}
                  onChange={(e) =>
                    setFormData({ ...formData, program: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm truncate font-medium"
                >
                  <option value="BS Information Technology">
                    BS Information Technology
                  </option>
                  <option value="BS Computer Engineering">
                    BS Computer Engineering
                  </option>
                  <option value="BS Nursing">BS Nursing</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Year Level & Password Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Year level
              </label>
              <div className="relative">
                <select
                  value={formData.yearLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, yearLevel: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm font-medium"
                >
                  <option value="First year">First year</option>
                  <option value="Second year">Second year</option>
                  <option value="Third year">Third year</option>
                  <option value="Fourth year">Fourth year</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Confirm password
            </label>
            <input
              type="password"
              required
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Upload School ID Box */}
          <div className="space-y-1.5">
            <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-1.5">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Upload your school ID
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                JPG or PNG, up to 5 MB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                required
                className="hidden"
              />
            </label>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 pt-1">
            <input
              type="checkbox"
              id="confirm"
              required
              checked={formData.confirmed}
              onChange={(e) =>
                setFormData({ ...formData, confirmed: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <label
              htmlFor="confirm"
              className="text-xs text-slate-600 select-none leading-relaxed"
            >
              I confirm that the information provided is accurate and belongs to
              me.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99]"
            >
              Submit for verification
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
