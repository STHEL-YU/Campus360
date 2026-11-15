import process from "node:process";
import { BlobNotFoundError, head } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import {
  findStudentProfileById,
  createStudentRegistration,
  findStudentForLogin,
  updateStudentProfileImage,
} from "../campusdatabase.js";
import {
  clearStudentSessionCookie,
  getStudentSessionId,
  setStudentSessionCookie,
} from "../student-session.js";
import { hashPassword, verifyPassword } from "../passwords.js";

const MAX_SCHOOL_ID_SIZE = 5 * 1024 * 1024;
const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const SCHOOL_ID_CONTENT_TYPES = ["image/jpeg", "image/png"];
const PROFILE_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png"];

// Blob token: set BLOB_READ_WRITE_TOKEN in your environment, never in frontend code.
//   Local:  .env.local  ->  BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxx"
//   Vercel: Project -> Settings -> Environment Variables
const BLOB_TOKEN = process.env.CAMPUS_BLOB_READ_WRITE_TOKEN;
const blobAuth = BLOB_TOKEN ? { token: BLOB_TOKEN } : {};

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function handleSchoolIdUpload(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  try {
    const result = await handleUpload({
      ...blobAuth,
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith("student-id/")) {
          return {
            allowedContentTypes: SCHOOL_ID_CONTENT_TYPES,
            maximumSizeInBytes: MAX_SCHOOL_ID_SIZE,
            validUntil: Date.now() + 5 * 60 * 1000,
          };
        }

        const profilePath = pathname.match(
          /^student-profile\/([1-9]\d*)\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png)$/i,
        );
        if (!profilePath) {
          throw new Error("Invalid student image upload path");
        }

        const studentId = getStudentSessionId(req);
        if (!studentId || studentId !== profilePath[1]) {
          throw new Error("Student sign-in is required for profile uploads");
        }
        const student = await findStudentProfileById(studentId);
        if (!student || student.status.toLowerCase() !== "active") {
          throw new Error("An active student account is required");
        }

        return {
          allowedContentTypes: PROFILE_IMAGE_CONTENT_TYPES,
          maximumSizeInBytes: MAX_PROFILE_IMAGE_SIZE,
          validUntil: Date.now() + 5 * 60 * 1000,
        };
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("School ID upload authorization failed", error);
    return res
      .status(400)
      .json({ error: "Unable to authorize school ID upload" });
  }
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { identifier, password } = req.body || {};
  if (!isNonEmptyString(identifier) || !isNonEmptyString(password)) {
    return res
      .status(400)
      .json({ error: "Email or school ID and password are required" });
  }

  try {
    const student = await findStudentForLogin(identifier.trim());
    if (
      !student ||
      !(await verifyPassword(password, student.password_hash))
    ) {
      return res.status(401).json({ error: "Invalid email/ID or password" });
    }

    if (student.status.toLowerCase() !== "active") {
      const error =
        student.status.toLowerCase() === "pending"
          ? "Your account is pending administrator approval"
          : "This account is not active. Contact an administrator";
      return res.status(403).json({ error });
    }

    try {
      setStudentSessionCookie(res, student.id);
    } catch (error) {
      console.error("Student session creation failed", error);
      return res.status(500).json({
        error: "Student session is not configured",
      });
    }

    return res.status(200).json({
      student: {
        id: student.id,
        fullName: student.full_name,
        schoolId: student.school_id,
        email: student.email,
        college: student.college,
        program: student.program,
        yearLevel: student.year_level,
        role: student.role,
        profileImage: student.profile_image_path
          ? "/api/student/profile-image"
          : null,
      },
    });
  } catch (error) {
    console.error("Student login failed", error);
    return res.status(500).json({ error: "Unable to sign in" });
  }
}

async function handleProfileImageUpdate(req, res) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let studentId;
  try {
    studentId = getStudentSessionId(req);
  } catch (error) {
    console.error("Student session validation failed", error);
    return res.status(500).json({ error: "Student session is not configured" });
  }
  if (!studentId) {
    return res.status(401).json({ error: "Student sign-in is required" });
  }

  const imagePath = req.body?.profileImagePath;
  if (
    typeof imagePath !== "string" ||
    !new RegExp(
      `^student-profile/${studentId}/[A-Za-z0-9_-]+\\.(?:jpg|jpeg|png)$`,
      "i",
    ).test(imagePath)
  ) {
    return res.status(400).json({ error: "Upload a valid profile image" });
  }

  if (!BLOB_TOKEN) {
    console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
    return res.status(503).json({ error: "Profile images are unavailable" });
  }

  try {
    const student = await findStudentProfileById(studentId);
    if (!student || student.status.toLowerCase() !== "active") {
      clearStudentSessionCookie(res);
      return res.status(401).json({ error: "Student sign-in is required" });
    }

    let image;
    try {
      image = await head(imagePath, { access: "private", ...blobAuth });
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        return res.status(400).json({ error: "Upload a valid profile image" });
      }
      throw error;
    }

    if (
      !PROFILE_IMAGE_CONTENT_TYPES.includes(image.contentType) ||
      image.size > MAX_PROFILE_IMAGE_SIZE
    ) {
      return res.status(400).json({ error: "Upload a valid profile image" });
    }

    const updated = await updateStudentProfileImage(studentId, imagePath);
    if (!updated) {
      return res.status(404).json({ error: "Student account not found" });
    }

    return res.status(200).json({
      profileImage: "/api/student/profile-image",
    });
  } catch (error) {
    console.error("Student profile image update failed", error);
    return res
      .status(500)
      .json({ error: "Unable to update the profile image" });
  }
}

async function handleLogout(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  clearStudentSessionCookie(res);
  return res.status(200).json({ loggedOut: true });
}

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === "login") {
    return handleLogin(req, res);
  }

  if (action === "logout") {
    return handleLogout(req, res);
  }

  if (action === "upload") {
    return handleSchoolIdUpload(req, res);
  }

  if (action === "profile") {
    return handleProfileImageUpdate(req, res);
  }

  if (action !== "register") {
    return res.status(404).json({ error: "Student action not found" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  const {
    fullName,
    schoolId,
    email,
    college,
    program,
    yearLevel,
    password,
    confirmed,
    role,
    schoolIdImagePath,
  } = body;

  if (
    ![
      fullName,
      schoolId,
      email,
      college,
      program,
      yearLevel,
      password,
      schoolIdImagePath,
    ].every(isNonEmptyString)
  ) {
    return res
      .status(400)
      .json({ error: "All registration fields are required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  if (confirmed !== true) {
    return res
      .status(400)
      .json({ error: "Confirm that your information is accurate" });
  }

  if (role !== "Student" && role !== "Faculty") {
    return res.status(400).json({ error: "Select a valid account type" });
  }

  if (!schoolIdImagePath.startsWith("student-id/")) {
    return res.status(400).json({ error: "Upload a valid school ID image" });
  }

  try {
    let schoolIdImage;
    try {
      schoolIdImage = await head(schoolIdImagePath, {
        access: "private",
        ...blobAuth,
      });
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        return res
          .status(400)
          .json({ error: "Upload a valid school ID image" });
      }
      throw error;
    }

    if (
      !SCHOOL_ID_CONTENT_TYPES.includes(schoolIdImage.contentType) ||
      schoolIdImage.size > MAX_SCHOOL_ID_SIZE
    ) {
      return res.status(400).json({ error: "Upload a valid school ID image" });
    }

    const passwordHash = await hashPassword(password);
    const student = await createStudentRegistration({
      fullName: fullName.trim(),
      schoolId: schoolId.trim(),
      email: email.trim().toLowerCase(),
      college: college.trim(),
      program: program.trim(),
      yearLevel: yearLevel.trim(),
      passwordHash,
      role,
      schoolIdImagePath,
    });

    return res.status(201).json({ student });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "An account with that email address or school ID already exists",
      });
    }

    console.error("Student registration failed", error);
    return res.status(500).json({ error: "Unable to submit registration" });
  }
}
