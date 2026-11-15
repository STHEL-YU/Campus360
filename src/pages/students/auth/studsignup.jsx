import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Bell,
  Upload,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Register({ onBack, onSuccess }) {
  const [role, setRole] = useState("Student");
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
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
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolIdImage, setSchoolIdImage] = useState(null);
  const [schoolIdPreview, setSchoolIdPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (schoolIdPreview) {
      return () => URL.revokeObjectURL(schoolIdPreview);
    }
  }, [schoolIdPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage("Enter your first and last name.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (!schoolIdImage) {
      setErrorMessage("Upload your school ID image.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const { upload } = await import("@vercel/blob/client");
      const extension = schoolIdImage.type === "image/png" ? "png" : "jpg";
      const fullName = [
        formData.firstName,
        formData.middleName,
        formData.lastName,
      ]
        .map((name) => name.trim())
        .filter(Boolean)
        .join(" ");
      const blob = await upload(
        `student-id/${crypto.randomUUID()}.${extension}`,
        schoolIdImage,
        {
          access: "private",
          handleUploadUrl: "/api/student/upload",
        },
      );
      const response = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          schoolId: formData.schoolId,
          email: formData.email,
          college: formData.college,
          program: formData.program,
          yearLevel: formData.yearLevel,
          password: formData.password,
          confirmed: formData.confirmed,
          role,
          schoolIdImagePath: blob.pathname,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit registration.");
      }

      setSubmitted(true);
      if (onSuccess) onSuccess(formData);
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit registration.");
    } finally {
      setIsSubmitting(false);
    }
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
      <header className="flex items-center px-6 pt-6 pb-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20 gap-3">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-base font-bold text-slate-900 ">Back to Sign in</h1>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <p className="text-xs text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Name</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                aria-label="First name"
                autoComplete="given-name"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <input
                type="text"
                aria-label="Middle name, optional"
                autoComplete="additional-name"
                placeholder="Middle name (optional)"
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <input
              type="text"
              required
              aria-label="Last name"
              autoComplete="family-name"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
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
                  <option value="College of Nursing and Health Sciences">
                    College of Nursing and Health Sciences
                  </option>
                  <option value="College of Industrial Technology ">
                    College of Industrial Technology{" "}
                  </option>
                  <option value="College of Fisheries and Marine Aquatic Sciences">
                    College of Fisheries and Marine Aquatic Sciences
                  </option>
                  <option value="College of Graduate Studies">
                    College of Graduate Studies
                  </option>
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
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 pr-11 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-11 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Upload School ID Box */}
          <div className="space-y-1.5">
            <p className="text-[11px] leading-relaxed text-slate-500">
              Place the front and back of your school ID together in one frame,
              then upload that image here.
            </p>
            <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm">
              {schoolIdPreview ? (
                <>
                  <img
                    src={schoolIdPreview}
                    alt="Preview of selected school ID image"
                    className="max-h-56 w-full rounded-xl object-contain"
                  />
                  <span className="mt-2 text-xs font-bold text-slate-800">
                    {schoolIdImage.name}
                  </span>
                  <span className="text-[10px] text-blue-600 mt-0.5">
                    Click to choose a different image
                  </span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-1.5">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Upload your school ID
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    JPG or PNG, up to 5 MB
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (
                    file &&
                    !["image/jpeg", "image/png"].includes(file.type)
                  ) {
                    setSchoolIdImage(null);
                    setSchoolIdPreview("");
                    setErrorMessage("School ID must be a JPG or PNG image.");
                    e.target.value = "";
                    return;
                  }
                  if (file && file.size > 5 * 1024 * 1024) {
                    setSchoolIdImage(null);
                    setSchoolIdPreview("");
                    setErrorMessage("School ID image must be 5 MB or smaller.");
                    e.target.value = "";
                    return;
                  }
                  setSchoolIdImage(file);
                  setSchoolIdPreview(file ? URL.createObjectURL(file) : "");
                  setErrorMessage("");
                }}
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
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? "Submitting..." : "Submit for verification"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
