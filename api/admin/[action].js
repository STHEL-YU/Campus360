import process from "node:process";
import { OAuth2Client } from "google-auth-library";
import {
  createAdminRegistration,
  findAdminByEmail,
  findOrLinkAdminByGoogleIdentity,
} from "../campusdatabase.js";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "../admin-session.js";
import { hashPassword, verifyPassword } from "../passwords.js";

const COLLEGES = new Set([
  "College of Engineering",
  "College of Industrial Technology",
  "College of Arts & Sciences",
  "College of Education",
  "College of Nursing and Health Sciences",
  "College of Fisheries and Marine Aquatic Sciences",
  "College of Graduate Studies",
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getProfileError(profile) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile) ||
    !isNonEmptyString(profile.firstName) ||
    !isNonEmptyString(profile.lastName) ||
    !isNonEmptyString(profile.phone) ||
    !isNonEmptyString(profile.employeeId) ||
    !isNonEmptyString(profile.college)
  ) {
    return "Complete all required admin fields";
  }

  if (profile.phone.replace(/\D/g, "").length < 7) {
    return "Enter a valid phone number";
  }

  if (!COLLEGES.has(profile.college)) {
    return "Select a valid college";
  }

  return null;
}

function normalizeProfile(profile) {
  return {
    firstName: profile.firstName.trim(),
    middleName: isNonEmptyString(profile.middleName)
      ? profile.middleName.trim()
      : "",
    lastName: profile.lastName.trim(),
    phone: profile.phone.trim(),
    employeeId: profile.employeeId.trim(),
    college: profile.college,
  };
}

function isValidEmail(email) {
  return (
    isNonEmptyString(email) &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

function setSession(res, adminId) {
  try {
    setAdminSessionCookie(res, adminId);
    return true;
  } catch (error) {
    console.error("Admin session creation failed", error);
    res.status(500).json({
      error:
        "Admin session is not configured. Set ADMIN_SESSION_SECRET to at least 32 characters.",
    });
    return false;
  }
}

async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return null;
  }

  return {
    googleSub: payload.sub,
    email: payload.email.trim().toLowerCase(),
  };
}

async function getIdentity(credential, res) {
  try {
    const identity = await verifyGoogleCredential(credential);
    if (!identity) {
      res.status(401).json({ error: "A verified Google email is required" });
      return null;
    }
    return identity;
  } catch (error) {
    if (error.message === "GOOGLE_CLIENT_ID is not configured") {
      console.error(error.message);
      res.status(500).json({ error: "Google sign-in is not configured" });
      return null;
    }

    res.status(401).json({ error: "Unable to verify your Google account" });
    return null;
  }
}

async function handleSignup(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { method, credential, email, password, profile } = req.body || {};
  const profileError = getProfileError(profile);
  if (profileError) {
    return res.status(400).json({ error: profileError });
  }

  if (method !== undefined && method !== "google" && method !== "password") {
    return res.status(400).json({ error: "Unsupported signup method" });
  }

  let accountEmail;
  let googleSub = null;
  let passwordHash = null;

  if (method === "password") {
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (!isNonEmptyString(password) || password.length < 8 || password.length > 128) {
      return res.status(400).json({
        error: "Password must be between 8 and 128 characters",
      });
    }

    accountEmail = email.trim().toLowerCase();
  } else {
    if (!isNonEmptyString(credential) || credential.length > 8192) {
      return res.status(400).json({ error: "Google sign-in is required" });
    }

    const identity = await getIdentity(credential, res);
    if (!identity) return;
    accountEmail = identity.email;
    googleSub = identity.googleSub;
  }

  try {
    if (method === "password") {
      passwordHash = await hashPassword(password);
    }

    const admin = await createAdminRegistration({
      ...normalizeProfile(profile),
      email: accountEmail,
      googleSub,
      passwordHash,
    });

    return res.status(201).json({ admin });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "An admin account already exists for this email or employee ID",
      });
    }

    console.error("Admin registration failed", error);
    return res.status(500).json({ error: "Unable to create admin account" });
  }
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { method, credential, email, password } = req.body || {};

  if (method === "password") {
    if (!isValidEmail(email) || !isNonEmptyString(password) || password.length > 128) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const admin = await findAdminByEmail(email.trim().toLowerCase());
      if (
        !admin ||
        !(await verifyPassword(password, admin.password_hash))
      ) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (admin.status.toLowerCase() !== "active") {
        return res
          .status(403)
          .json({ error: "This admin account is not active" });
      }

      if (!setSession(res, admin.id)) return;

      const safeAdmin = { ...admin };
      delete safeAdmin.password_hash;
      return res.status(200).json({ admin: safeAdmin });
    } catch (error) {
      console.error("Admin password login failed", error);
      return res.status(500).json({ error: "Unable to sign in" });
    }
  }

  if (method !== undefined && method !== "google") {
    return res.status(400).json({ error: "Unsupported sign-in method" });
  }

  if (!isNonEmptyString(credential) || credential.length > 8192) {
    return res.status(400).json({ error: "Google sign-in is required" });
  }

  const identity = await getIdentity(credential, res);
  if (!identity) return;

  try {
    const admin = await findOrLinkAdminByGoogleIdentity(
      identity.googleSub,
      identity.email,
    );
    if (!admin) {
      return res.status(403).json({
        error: "No admin account found. Create an account first.",
      });
    }

    const status = admin.status.toLowerCase();
    if (status !== "active") {
      return res.status(403).json({ error: "This admin account is not active" });
    }

    if (!setSession(res, admin.id)) return;

    return res.status(200).json({ admin });
  } catch (error) {
    console.error("Admin login failed", error);
    return res.status(500).json({ error: "Unable to sign in" });
  }
}

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === "signup") {
    return handleSignup(req, res);
  }

  if (action === "login") {
    return handleLogin(req, res);
  }

  if (action === "logout") {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    clearAdminSessionCookie(res);
    return res.status(200).json({ loggedOut: true });
  }

  return res.status(404).json({ error: "Admin action not found" });
}