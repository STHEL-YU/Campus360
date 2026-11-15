import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";

const COLLEGES = [
  "College of Engineering",
  "College of Industrial Technology",
  "College of Arts & Sciences",
  "College of Education",
  "College of Nursing and Health Sciences",
  "College of Fisheries and Marine Aquatic Sciences",
  "College of Graduate Studies",
];

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

export default function Signup({ onGoogleSignup, onEmailSignup }) {
  const [profile, setProfile] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    employeeId: "",
    college: "",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const setField = (key) => (event) =>
    setProfile((current) => ({ ...current, [key]: event.target.value }));

  const setPhone = (event) =>
    setProfile((current) => ({
      ...current,
      phone: event.target.value.replace(/[^\d+\-\s]/g, ""),
    }));

  const validateProfile = () => {
    if (!profile.firstName.trim()) {
      return "Enter your first name.";
    }
    if (!profile.lastName.trim()) {
      return "Enter your last name.";
    }
    if (profile.phone.replace(/\D/g, "").length < 7) {
      return "Enter a valid phone number.";
    }
    if (!profile.employeeId.trim()) {
      return "Enter your employee ID.";
    }
    if (!profile.college) {
      return "Select your college.";
    }

    return "";
  };

  const getProfile = () => ({
    firstName: profile.firstName.trim(),
    middleName: profile.middleName.trim(),
    lastName: profile.lastName.trim(),
    phone: profile.phone.trim(),
    employeeId: profile.employeeId.trim(),
    college: profile.college,
  });

  const handleGoogleSuccess = async ({ credential }) => {
    setError("");
    setNotice("");

    const profileError = validateProfile();
    if (profileError) {
      setError(profileError);
      return;
    }
    if (!credential) {
      setError("Google did not provide an identity token. Try again.");
      return;
    }

    try {
      setBusy(true);
      await onGoogleSignup({ credential, profile: getProfile() });
      setNotice("Your admin account is ready. You can sign in with Google.");
    } catch (signupError) {
      setError(signupError?.message || "Unable to create your admin account.");
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSignup = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const profileError = validateProfile();
    if (profileError) {
      setError(profileError);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      await onEmailSignup({
        email: email.trim().toLowerCase(),
        password,
        profile: getProfile(),
      });
      setNotice("Your admin account is ready. You can now sign in with email and password.");
      setPassword("");
      setConfirmPassword("");
    } catch (signupError) {
      setError(signupError?.message || "Unable to create your admin account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {error && (
        <div
          className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-medium"
          role="alert"
        >
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-xs font-medium">{notice}</span>
        </div>
      )}

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
          {COLLEGES.map((college) => (
            <option key={college} value={college}>
              {college}
            </option>
          ))}
        </select>
      </Field>

      <form className="flex flex-col gap-3.5" onSubmit={handleEmailSignup}>
        <div className="border-t border-slate-100 pt-3.5">
          <p className="text-xs font-semibold text-slate-700">
            Create an account with email
          </p>
        </div>
        <Field id="adminEmail" label="Email address" icon={Mail}>
          <input
            id="adminEmail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@university.edu"
            className={`${inputBase} pl-10 pr-3`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="adminPassword" label="Password">
            <input
              id="adminPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className={`${inputBase} px-3`}
            />
          </Field>
          <Field id="confirmAdminPassword" label="Confirm password">
            <input
              id="confirmAdminPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              className={`${inputBase} px-3`}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>

      {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OR CONTINUE WITH GOOGLE
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          {busy ? (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying Google account...
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setError("Google sign-in failed. Please try again.")
              }
              text="signup_with"
              theme="filled_blue"
              size="large"
              shape="rectangular"
              containerProps={{ className: "w-full flex justify-center" }}
            />
          )}
        </div>
      ) : (
        <p className="text-center text-[11px] text-slate-400">
          Google signup is unavailable; use email and password instead.
        </p>
      )}
    </div>
  );
}