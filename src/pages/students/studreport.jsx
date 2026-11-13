import React, { useState } from "react";
import {
  ChevronLeft,
  Bell,
  Shield,
  Upload,
  Mic,
  AlertCircle,
  CheckCircle,
  MapPin,
} from "lucide-react";

export default function ReportIncident({ onBack }) {
  const [formData, setFormData] = useState({
    category: "",
    college: "College of Engineering",
    building: "Engineering Building",
    location: "",
    pin: null, // { x: 0-100, y: 0-100 } as % of the map image
    description: "",
    anonymous: true,
  });

  const [submitted, setSubmitted] = useState(false);
  const [mapError, setMapError] = useState(false);

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFormData({
      ...formData,
      pin: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to your API or backend submission logic
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center pb-28">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Report Submitted Successfully
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Your safety report has been securely sent to authorized campus
          personnel. Thank you for keeping our community safe.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            if (onBack) onBack();
          }}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* Main Container */}
      <main className="px-5 pt-4 max-w-md mx-auto">
        {/* Confidentiality Notice Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start space-x-3 shadow-sm mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-blue-900">
              Your report is confidential
            </h2>
            <p className="text-[11px] text-blue-700/80 mt-0.5">
              Only authorized campus safety personnel can view it.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Incident Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Incident category
            </label>
            <div className="relative">
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm font-medium"
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option value="safety">Safety Hazard</option>
                <option value="maintenance">Facility Maintenance</option>
                <option value="security">Security Concern</option>
                <option value="medical">Medical Emergency</option>
                <option value="other">Other Issue</option>
              </select>
            </div>
          </div>

          {/* College and Building Row */}
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm font-medium truncate"
                >
                  <option value="College of Engineering">
                    College of Engineering
                  </option>
                  <option value="College of Arts & Sciences">
                    College of Arts & Sciences
                  </option>
                  <option value="College of Nursing">College of Nursing</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Building
              </label>
              <div className="relative">
                <select
                  value={formData.building}
                  onChange={(e) =>
                    setFormData({ ...formData, building: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm font-medium truncate"
                >
                  <option value="Engineering Building">
                    Engineering Building
                  </option>
                  <option value="Science Annex">Science Annex</option>
                  <option value="Main Administration">
                    Main Administration
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Specific location / room */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Specific location / room
            </label>
            <input
              type="text"
              placeholder="e.g. 2nd floor, Room 214"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Pin Location on Map */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Pin location on map{" "}
                <span className="text-slate-400 font-normal">Optional</span>
              </label>
              {formData.pin && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pin: null })}
                  className="text-[11px] font-semibold text-red-600 hover:underline"
                >
                  Clear pin
                </button>
              )}
            </div>

            <div
              onClick={handleMapClick}
              className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-crosshair bg-slate-100"
              style={
                mapError
                  ? {
                      backgroundImage:
                        "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }
                  : undefined
              }
            >
              {!mapError && (
                <img
                  src="/campus-map.png"
                  alt="Campus map"
                  draggable={false}
                  onError={() => setMapError(true)}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              )}

              {/* Pin marker */}
              {formData.pin && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${formData.pin.x}%`,
                    top: `${formData.pin.y}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <MapPin className="w-8 h-8 text-red-600 fill-red-100 drop-shadow-md" />
                </div>
              )}

              {/* Hint overlay */}
              {!formData.pin && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-white/90 text-slate-600 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-sm">
                    Tap the map to drop a pin
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              {formData.pin
                ? "Pin placed. Tap another spot to move it."
                : "Mark the exact spot where the incident happened."}
            </p>
          </div>

          {/* Add Evidence Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Add evidence{" "}
              <span className="text-slate-400 font-normal">Optional</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Add Photo Box */}
              <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Add photo
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  JPG or PNG
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                />
              </label>

              {/* Voice Message Box */}
              <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Voice message
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Record or upload
                </span>
                <input type="file" accept="audio/*" className="hidden" />
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Description{" "}
              <span className="text-slate-400 font-normal">Optional</span>
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe what you observed. Avoid putting yourself in danger to collect details."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
            />
          </div>

          {/* Anonymous Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.anonymous}
              onChange={(e) =>
                setFormData({ ...formData, anonymous: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="anonymous"
              className="text-xs font-medium text-slate-700 select-none"
            >
              Do not display my identity to other users.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-red-500/25 transition-all active:scale-[0.99]"
            >
              Submit safety report
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              In immediate life-threatening danger, contact local emergency
              services.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
