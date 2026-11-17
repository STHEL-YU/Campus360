import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Upload,
  Mic,
  MapPin,
  LoaderCircle,
  X,
} from "lucide-react";
import { getStudentProfile } from "../../auth";

// Set to false to use your real map at /campus-map.png
const USE_DUMMY_MAP = true;

const DUMMY_MAP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#dcfce7"/>
  <rect x="0" y="270" width="800" height="60" fill="#e2e8f0"/>
  <rect x="370" y="0" width="60" height="600" fill="#e2e8f0"/>
  <rect x="60" y="60" width="240" height="150" rx="10" fill="#93c5fd"/>
  <text x="180" y="143" font-size="24" text-anchor="middle" fill="#1e3a8a" font-family="Arial">Engineering</text>
  <rect x="500" y="60" width="240" height="150" rx="10" fill="#fca5a5"/>
  <text x="620" y="143" font-size="24" text-anchor="middle" fill="#7f1d1d" font-family="Arial">Library</text>
  <rect x="60" y="390" width="240" height="150" rx="10" fill="#fde68a"/>
  <text x="180" y="473" font-size="24" text-anchor="middle" fill="#78350f" font-family="Arial">Admin</text>
  <rect x="500" y="390" width="240" height="150" rx="10" fill="#c4b5fd"/>
  <text x="620" y="473" font-size="24" text-anchor="middle" fill="#4c1d95" font-family="Arial">Gymnasium</text>
  <circle cx="400" cy="300" r="22" fill="#86efac" stroke="#16a34a" stroke-width="4"/>
  <text x="400" y="585" font-size="18" text-anchor="middle" fill="#475569" font-family="Arial">DUMMY TEST MAP</text>
</svg>`;

const MAP_SRC = USE_DUMMY_MAP
  ? `data:image/svg+xml;utf8,${encodeURIComponent(DUMMY_MAP_SVG)}`
  : "/campus-map.png";

const INITIAL_FORM_DATA = {
  category: "",
  college: "College of Engineering",
  building: "Engineering Building",
  location: "",
  pin: null,
  description: "",
  anonymous: true,
};
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
];
const AUDIO_EXTENSIONS = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

export default function ReportIncident() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM_DATA }));
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );
  useEffect(
    () => () => {
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    },
    [audioPreview],
  );

  const setEvidenceFile = (kind, file) => {
    if (!file) return;
    const allowedTypes =
      kind === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
    const maxSize = kind === "image" ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
    if (!allowedTypes.includes(file.type)) {
      setEvidenceError(
        kind === "image"
          ? "Choose a JPG or PNG image."
          : "Choose a supported audio file.",
      );
      if (kind === "image" && imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      if (kind === "audio" && audioInputRef.current) {
        audioInputRef.current.value = "";
      }
      return;
    }
    if (file.size <= 0 || file.size > maxSize) {
      setEvidenceError(
        kind === "image"
          ? "Images must be smaller than 3 MB."
          : "Audio files must be smaller than 10 MB.",
      );
      if (kind === "image" && imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      if (kind === "audio" && audioInputRef.current) {
        audioInputRef.current.value = "";
      }
      return;
    }

    setEvidenceError("");
    setSubmitError("");
    if (kind === "image") {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
    }
  };

  const uploadEvidence = async (file, kind, studentId) => {
    if (!file) return null;
    const extension =
      kind === "image"
        ? file.type === "image/png"
          ? "png"
          : "jpg"
        : AUDIO_EXTENSIONS[file.type];
    if (!extension) throw new Error("This evidence file format is not supported.");

    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(
      `incident-reports/${studentId}/${kind}/${crypto.randomUUID()}.${extension}`,
      file,
      {
        access: "private",
        handleUploadUrl: "/api/student/report-upload",
      },
    );
    return blob.pathname;
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFormData({
      ...formData,
      pin: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (evidenceError) {
      setSubmitError(evidenceError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      let imagePath = null;
      let audioPath = null;
      if (imageFile || audioFile) {
        const student = getStudentProfile();
        if (!student?.id) {
          throw new Error("Please sign in again before uploading report evidence.");
        }
        [imagePath, audioPath] = await Promise.all([
          uploadEvidence(imageFile, "image", student.id),
          uploadEvidence(audioFile, "audio", student.id),
        ]);
      }

      const response = await fetch("/api/student/report", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imagePath, audioPath }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit incident report.");
      }
      if (!result.report?.id) {
        throw new Error("The server returned an invalid incident report.");
      }

      setFormData({ ...INITIAL_FORM_DATA });
      setImageFile(null);
      setAudioFile(null);
      setImagePreview(null);
      setAudioPreview(null);
      setEvidenceError("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      navigate("/student/alerts", { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Unable to submit incident report.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <Link
          to="/student/alerts"
          className="mb-5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
        >
          <span>Track my submitted reports</span>
          <span className="text-blue-600">My reports →</span>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
            >
              {submitError}
            </p>
          )}

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

            {/* Container wraps the image exactly (no fixed height / cropping)
                so the pin percentages always match the image */}
            <div
              onClick={handleMapClick}
              className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-crosshair bg-slate-100 ${
                mapError ? "h-56" : ""
              }`}
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
                  src={MAP_SRC}
                  alt="Campus map"
                  draggable={false}
                  onError={() => setMapError(true)}
                  className="block w-full h-auto select-none pointer-events-none"
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

            {/* Test only: shows the saved coordinates */}
            {USE_DUMMY_MAP && formData.pin && (
              <p className="text-[11px] font-mono font-semibold text-slate-600">
                x: {formData.pin.x}%, y: {formData.pin.y}%
              </p>
            )}
          </div>

          {/* Add Evidence Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Add evidence{" "}
              <span className="text-slate-400 font-normal">Optional</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Add Photo Box */}
              <div>
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
                    ref={imageInputRef}
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) =>
                      setEvidenceFile("image", e.target.files?.[0])
                    }
                  />
                </label>
                {imageFile && (
                  <div className="mt-2 space-y-2">
                    <img
                      src={imagePreview}
                      alt="Selected report evidence"
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{imageFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setEvidenceError("");
                          setSubmitError("");
                          if (imageInputRef.current) {
                            imageInputRef.current.value = "";
                          }
                        }}
                        className="inline-flex shrink-0 items-center gap-1 font-semibold text-rose-600"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice Message Box */}
              <div>
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Voice message
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Upload audio
                  </span>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept={ALLOWED_AUDIO_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => setEvidenceFile("audio", e.target.files?.[0])}
                  />
                </label>
                {audioFile && (
                  <div className="mt-2 space-y-2">
                    <audio
                      controls
                      preload="metadata"
                      src={audioPreview}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{audioFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAudioFile(null);
                          setAudioPreview(null);
                          setEvidenceError("");
                          setSubmitError("");
                          if (audioInputRef.current) audioInputRef.current.value = "";
                        }}
                        className="inline-flex shrink-0 items-center gap-1 font-semibold text-rose-600"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {evidenceError && (
              <p role="alert" className="text-[11px] text-rose-600">
                {evidenceError}
              </p>
            )}
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
              Keep my identity anonymous in shared report views.
            </label>
          </div>
          <p className="text-[11px] text-slate-400 -mt-4 ml-6">
            Authorized staff can still identify you to follow up.
          </p>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-red-500/25 transition-all active:scale-[0.99]"
            >
              {isSubmitting && (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {isSubmitting ? "Submitting..." : "Submit safety report"}
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
