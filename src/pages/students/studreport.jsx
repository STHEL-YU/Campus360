import { useEffect, useRef, useState } from "react";
import {
  Shield,
  Camera,
  Mic,
  MapPin,
  LoaderCircle,
  X,
  Square,
} from "lucide-react";
import { getStudentProfile } from "../../auth";
import { useLocation, useNavigate } from "react-router-dom";
import ReportsList from "./studreportlist.jsx";

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
const MAX_RECORD_SECONDS = 15;
const MAX_PHOTO_DIMENSION = 1280;
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

// Picks a recording format this browser can make (Chrome/Android: webm, Safari: mp4)
function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

async function preparePhoto(file) {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const photo = new Image();
      photo.onload = () => resolve(photo);
      photo.onerror = () => reject(new Error("Unable to read the photo."));
      photo.src = imageUrl;
    });
    const scale = Math.min(
      1,
      MAX_PHOTO_DIMENSION / Math.max(image.width, image.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to process the photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let blob = null;
    for (const quality of [0.85, 0.75, 0.65]) {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= MAX_IMAGE_SIZE) break;
    }
    if (!blob || blob.size > MAX_IMAGE_SIZE) {
      throw new Error("The photo is too large to attach. Try another photo.");
    }
    return new File([blob], `photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

const formatClock = (seconds) => {
  const whole = Math.floor(seconds);
  return `0:${String(whole).padStart(2, "0")}`;
};

export default function ReportIncident() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM_DATA }));
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const photoInputRef = useRef(null);

  // Camera + voice recording
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordStreamRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  const showReports = isReportsOpen || Boolean(location.state?.openReports);
  const closeReports = () => {
    setIsReportsOpen(false);
    if (location.state?.openReports) {
      navigate(location.pathname, { replace: true, state: null });
    }
  };

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

  const stopCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
  };

  const stopRecordStream = () => {
    recordStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordStreamRef.current = null;
  };

  useEffect(() => {
    if (!isCameraOpen) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (error) {
        console.error("Could not open the camera", error);
        if (!cancelled) {
          setIsCameraOpen(false);
          setEvidenceError(
            "Unable to open the camera. Allow camera access and try again.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [isCameraOpen]);

  // Stop everything if the student leaves the page mid-recording
  useEffect(
    () => () => {
      window.clearInterval(recordTimerRef.current);
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      stopCameraStream();
      stopRecordStream();
    },
    [],
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
          : "This browser recorded an unsupported audio format.",
      );
      return;
    }
    if (file.size <= 0 || file.size > maxSize) {
      setEvidenceError(
        kind === "image"
          ? "Photos must be smaller than 3 MB."
          : "Recordings must be smaller than 10 MB.",
      );
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

  /* ---------- Take a picture ---------- */

  const openCamera = () => {
    setEvidenceError("");
    setSubmitError("");

    // Phones and tablets: open the device's own camera app
    const isTouchDevice = window.matchMedia?.("(pointer: coarse)").matches;
    if (isTouchDevice || !navigator.mediaDevices?.getUserMedia) {
      photoInputRef.current?.click();
      return;
    }

    // Computers: use the webcam screen
    setIsCameraOpen(true);
  };
  const closeCamera = () => setIsCameraOpen(false);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setEvidenceError("The camera is not ready yet. Try again.");
      return;
    }

    const scale = Math.min(
      1,
      MAX_PHOTO_DIMENSION / Math.max(video.videoWidth, video.videoHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      setEvidenceError("Unable to take the photo. Try again.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setEvidenceError("Unable to take the photo. Try again.");
          return;
        }
        setEvidenceFile(
          "image",
          new File([blob], `photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        );
        setIsCameraOpen(false);
      },
      "image/jpeg",
      0.85,
    );
  };

  const handlePhotoInput = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    try {
      setEvidenceFile("image", await preparePhoto(file));
    } catch (error) {
      setEvidenceError(error.message || "Unable to process the photo.");
    }
  };

  const removePhoto = () => {
    setImageFile(null);
    setImagePreview(null);
    setEvidenceError("");
    setSubmitError("");
  };

  /* ---------- Record voice (max 15 seconds) ---------- */

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  };

  const startRecording = async () => {
    if (isRecording) return;
    setEvidenceError("");
    setSubmitError("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setEvidenceError("Voice recording is not supported on this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;

      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recordChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        window.clearInterval(recordTimerRef.current);
        stopRecordStream();
        setIsRecording(false);

        const baseType = (recorder.mimeType || mimeType || "audio/webm").split(
          ";",
        )[0];
        const blob = new Blob(recordChunksRef.current, { type: baseType });
        recordChunksRef.current = [];
        if (blob.size === 0) {
          setEvidenceError("Nothing was recorded. Try again.");
          return;
        }
        const extension = AUDIO_EXTENSIONS[baseType] || "webm";
        const file = new File([blob], `voice-${Date.now()}.${extension}`, {
          type: baseType,
        });
        setEvidenceFile("audio", file);
      };

      // A new recording replaces the previous one
      setAudioFile(null);
      setAudioPreview(null);

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      const startedAt = Date.now();
      recordTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        setRecordSeconds(Math.min(elapsed, MAX_RECORD_SECONDS));
        if (elapsed >= MAX_RECORD_SECONDS) stopRecording();
      }, 200);
    } catch (error) {
      console.error("Could not start recording", error);
      stopRecordStream();
      setIsRecording(false);
      setEvidenceError(
        "Unable to use the microphone. Allow microphone access and try again.",
      );
    }
  };

  const removeRecording = () => {
    setAudioFile(null);
    setAudioPreview(null);
    setEvidenceError("");
    setSubmitError("");
  };

  /* ---------- Upload + submit ---------- */

  const uploadEvidence = async (file, kind, studentId) => {
    if (!file) return null;
    const extension =
      kind === "image"
        ? file.type === "image/png"
          ? "png"
          : "jpg"
        : AUDIO_EXTENSIONS[file.type];
    if (!extension)
      throw new Error("This evidence file format is not supported.");

    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(
      `incident-reports/${studentId}/${kind}/${crypto.randomUUID()}.${extension}`,
      file,
      {
        access: "private",
        // Without this, Blob guesses from the extension and treats .webm as video/webm
        contentType: file.type,
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
    if (isRecording) {
      setSubmitError("Stop the recording before submitting.");
      return;
    }
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
          throw new Error(
            "Please sign in again before uploading report evidence.",
          );
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
      setIsReportsOpen(true);
    } catch (error) {
      setSubmitError(error.message || "Unable to submit incident report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      <main className="px-5 pt-4 max-w-md mx-auto">
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

        <button
          type="button"
          onClick={() => setIsReportsOpen(true)}
          className="mb-5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
        >
          <span>Track my submitted reports</span>
          <span className="text-blue-600">My reports →</span>
        </button>

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
                <option value="shooting">Shooting</option>
                <option value="fire">Fire</option>
                <option value="threat/violence">Threat/Violence</option>
                <option value="bullying">Bullying</option>
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
                  <option value="CAS Building">CAS Building</option>
                  <option value="GYM Grounds">GYM Grounds</option>
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
              {/* Take photo */}
              <div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoInput}
                  disabled={isRecording}
                  className="hidden"
                  aria-label="Take or choose a photo"
                />
                <button
                  type="button"
                  onClick={openCamera}
                  disabled={isRecording}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 disabled:opacity-60 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm"
                >
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {imageFile ? "Retake photo" : "Take photo"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Use the camera
                  </span>
                </button>
                {imageFile && (
                  <div className="mt-2 space-y-2">
                    <img
                      src={imagePreview}
                      alt="Photo taken as report evidence"
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Record voice */}
              <div>
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-full border-2 border-rose-300 bg-rose-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
                  >
                    <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center mb-2 animate-pulse">
                      <Square className="w-4 h-4 fill-white" />
                    </div>
                    <span className="text-xs font-bold text-rose-700">
                      Recording… tap to stop
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-rose-600 mt-0.5">
                      {formatClock(recordSeconds)} /{" "}
                      {formatClock(MAX_RECORD_SECONDS)}
                    </span>
                    <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-rose-100">
                      <span
                        className="block h-full rounded-full bg-rose-600 transition-all"
                        style={{
                          width: `${(recordSeconds / MAX_RECORD_SECONDS) * 100}%`,
                        }}
                      />
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm"
                  >
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                      <Mic className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {audioFile ? "Record again" : "Record voice"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Up to {MAX_RECORD_SECONDS} seconds
                    </span>
                  </button>
                )}
                {audioFile && !isRecording && (
                  <div className="mt-2 space-y-2">
                    <audio
                      controls
                      preload="metadata"
                      src={audioPreview}
                      className="w-full"
                    />
                    <button
                      type="button"
                      onClick={removeRecording}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
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

      {isCameraOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Take a photo"
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between px-8 py-6">
            <button
              type="button"
              onClick={closeCamera}
              className="text-sm font-semibold text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              aria-label="Take picture"
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/30 active:bg-white/60"
            >
              <Camera className="h-7 w-7 text-white" />
            </button>
            <span className="w-12" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* My reports modal: mounted only while open, so it reloads the list each time */}
      {showReports && <ReportsList onClose={closeReports} />}
    </div>
  );
}
