import process from "node:process";
import { Readable } from "node:stream";
import { BlobNotFoundError, del, get, head } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import {
  deleteStudentForAdmin,
  createIncidentReport,
  deleteIncidentReportForStudent,
  deleteIncidentReportForAdmin,
  findIncidentReportEvidenceForStudent,
  findActiveAdminById,
  findIncidentReportEvidenceForAdmin,
  findStudentIdImageForAdmin,
  findStudentProfileById,
  createStudentRegistration,
  findStudentForLogin,
  listIncidentReportsForAdmin,
  listIncidentReportsForStudent,
  listStudentsForAdmin,
  updateIncidentReportForStudent,
  updateIncidentReportStatusForAdmin,
  updateStudentForAdmin,
  updateStudentProfileImage,
} from "../campusdatabase.js";
import {
  clearAdminSessionCookie,
  getAdminSessionAdminId,
} from "../admin-session.js";
import {
  clearStudentSessionCookie,
  getStudentSessionId,
  setStudentSessionCookie,
} from "../student-session.js";
import { hashPassword, verifyPassword } from "../passwords.js";

const MAX_SCHOOL_ID_SIZE = 5 * 1024 * 1024;
const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_REPORT_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_REPORT_AUDIO_SIZE = 10 * 1024 * 1024;
const SCHOOL_ID_CONTENT_TYPES = ["image/jpeg", "image/png"];
const PROFILE_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png"];
const REPORT_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png"];
const REPORT_AUDIO_CONTENT_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
];
const VALID_INCIDENT_REPORT_STATUSES = new Set([
  "Pending",
  "Resolved",
  "Declined",
]);
const REPORT_EVIDENCE_PATH_PATTERN =
  /^incident-reports\/([1-9]\d*)\/(image|audio)\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webm|ogg|mp3|m4a|wav)$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(["active", "blocked", "inactive", "pending"]);
const IMAGE_PATH_PATTERN = /^student-id\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png)$/i;
const INCIDENT_CATEGORIES = {
  safety: "Safety Hazard",
  maintenance: "Facility Maintenance",
  security: "Security Concern",
  medical: "Medical Emergency",
  other: "Other Issue",
};

// Blob token: set BLOB_READ_WRITE_TOKEN in your environment, never in frontend code.
//   Local:  .env.local  ->  BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxx"
//   Vercel: Project -> Settings -> Environment Variables
const BLOB_TOKEN = process.env.CAMPUS_BLOB_READ_WRITE_TOKEN;
const blobAuth = BLOB_TOKEN ? { token: BLOB_TOKEN } : {};

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function serializeStudent(student) {
  const status = String(student.status).toLowerCase();
  return {
    id: String(student.id),
    name: student.full_name,
    studentId: student.school_id,
    accountType: student.role,
    college: student.college,
    program: student.program,
    yearLevel: student.year_level,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    email: student.email,
    submitted: student.created_at
      ? new Date(student.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  };
}

function parseId(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const id = String(value);
  return /^[1-9]\d*$/.test(id) ? id : null;
}

function isOwnedReportEvidencePath(pathname, studentId, kind) {
  if (typeof pathname !== "string") return false;
  const match = REPORT_EVIDENCE_PATH_PATTERN.exec(pathname);
  if (!match || match[1] !== String(studentId) || match[2] !== kind) {
    return false;
  }

  const extension = match[3].toLowerCase();
  return kind === "image"
    ? ["jpg", "jpeg", "png"].includes(extension)
    : ["webm", "ogg", "mp3", "m4a", "wav"].includes(extension);
}

async function verifyReportEvidence(pathname, contentTypes, maxSize) {
  try {
    const blob = await head(pathname, { access: "private", ...blobAuth });
    return (
      contentTypes.includes(blob.contentType) &&
      blob.size > 0 &&
      blob.size <= maxSize
    );
  } catch (error) {
    if (error instanceof BlobNotFoundError) return false;
    throw error;
  }
}

function getStudentUpdates(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A JSON request body is required" };
  }

  const updates = {};
  const fields = [
    ["fullName", "Full name", 200],
    ["schoolId", "School ID", 100],
    ["college", "College", 200],
    ["program", "Program", 200],
    ["yearLevel", "Year level", 80],
  ];

  for (const [field, label, maxLength] of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    if (
      !isNonEmptyString(body[field]) ||
      body[field].trim().length > maxLength
    ) {
      return { error: `Enter a valid ${label.toLowerCase()}` };
    }
    updates[field] = body[field].trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    if (
      !isNonEmptyString(body.email) ||
      body.email.trim().length > 254 ||
      !EMAIL_PATTERN.test(body.email.trim())
    ) {
      return { error: "Enter a valid email address" };
    }
    updates.email = body.email.trim().toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    if (body.role !== "Student" && body.role !== "Faculty") {
      return { error: "Select a valid account type" };
    }
    updates.role = body.role;
  }

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (typeof body.status !== "string") {
      return { error: "Select a valid account status" };
    }
    const status = body.status.toLowerCase();
    if (!VALID_STATUSES.has(status)) {
      return { error: "Select a valid account status" };
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No student fields were provided" };
  }

  return { updates };
}

async function handleAdminStudents(req, res) {
  if (!["GET", "PATCH", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.headers["x-campus360-admin"] !== "1") {
    return res.status(403).json({ error: "Invalid admin request" });
  }

  let adminId;
  try {
    adminId = getAdminSessionAdminId(req);
  } catch (error) {
    console.error("Admin session validation failed", error);
    return res.status(500).json({ error: "Admin session is not configured" });
  }
  if (!adminId) {
    return res.status(401).json({ error: "Admin sign-in is required" });
  }

  try {
    const admin = await findActiveAdminById(adminId);
    if (!admin) {
      clearAdminSessionCookie(res);
      return res.status(401).json({ error: "Admin sign-in is required" });
    }
    if (!isNonEmptyString(admin.college)) {
      return res.status(403).json({ error: "Admin college is not configured" });
    }

    if (req.method === "GET") {
      const students = await listStudentsForAdmin(admin.college);
      return res.status(200).json({
        users: students.map(serializeStudent),
        college: admin.college,
      });
    }

    if (req.method === "PATCH") {
      const id = parseId(req.body?.id);
      if (!id) {
        return res
          .status(400)
          .json({ error: "A valid student ID is required" });
      }

      const { updates, error } = getStudentUpdates(req.body);
      if (error) {
        return res.status(400).json({ error });
      }
      if (updates.college && updates.college !== admin.college) {
        return res
          .status(403)
          .json({ error: "You can only manage users in your college" });
      }

      const student = await updateStudentForAdmin(id, updates, admin.college);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      return res.status(200).json({ user: serializeStudent(student) });
    }

    const id = parseId(req.body?.id);
    if (!id) {
      return res.status(400).json({ error: "A valid student ID is required" });
    }

    const deleted = await deleteStudentForAdmin(id, admin.college);
    if (!deleted) {
      return res.status(404).json({ error: "Student not found" });
    }
    return res.status(200).json({ deletedId: String(deleted.id) });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "A student already exists with that email address or school ID",
      });
    }

    console.error("Student management request failed", error);
    return res.status(500).json({ error: "Unable to manage student accounts" });
  }
}

function parseIncidentReport(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A JSON request body is required" };
  }

  const category =
    typeof body.category === "string"
      ? INCIDENT_CATEGORIES[body.category]
      : null;
  if (!category) {
    return { error: "Select a valid incident category" };
  }

  if (
    !isNonEmptyString(body.college) ||
    body.college.trim().length > 200 ||
    !isNonEmptyString(body.building) ||
    body.building.trim().length > 200
  ) {
    return { error: "Enter a valid college and building" };
  }
  if (
    (body.location !== undefined &&
      (typeof body.location !== "string" || body.location.length > 200)) ||
    (body.description !== undefined &&
      (typeof body.description !== "string" || body.description.length > 10000))
  ) {
    return { error: "Location or description is too long" };
  }
  if (typeof body.anonymous !== "boolean") {
    return { error: "Choose whether to hide your identity" };
  }

  let pinX = null;
  let pinY = null;
  if (body.pin !== null && body.pin !== undefined) {
    if (
      !body.pin ||
      typeof body.pin !== "object" ||
      Array.isArray(body.pin) ||
      typeof body.pin.x !== "number" ||
      typeof body.pin.y !== "number" ||
      !Number.isFinite(body.pin.x) ||
      !Number.isFinite(body.pin.y) ||
      body.pin.x < 0 ||
      body.pin.x > 100 ||
      body.pin.y < 0 ||
      body.pin.y > 100
    ) {
      return { error: "Choose a valid location on the map" };
    }

    pinX = body.pin.x;
    pinY = body.pin.y;
  }

  return {
    report: {
      category,
      college: body.college.trim(),
      building: body.building.trim(),
      location: body.location?.trim() || "",
      description: body.description?.trim() || "",
      pinX,
      pinY,
      isAnonymous: body.anonymous,
    },
  };
}

// Fields a student may change on a report they already submitted
function parseIncidentReportUpdate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A JSON request body is required" };
  }

  const category =
    typeof body.category === "string" &&
    Object.hasOwn(INCIDENT_CATEGORIES, body.category)
      ? INCIDENT_CATEGORIES[body.category]
      : null;
  if (!category) {
    return { error: "Select a valid incident category" };
  }
  if (!isNonEmptyString(body.building) || body.building.trim().length > 200) {
    return { error: "Enter a valid building" };
  }
  if (
    (body.location !== undefined &&
      (typeof body.location !== "string" || body.location.length > 200)) ||
    (body.description !== undefined &&
      (typeof body.description !== "string" || body.description.length > 10000))
  ) {
    return { error: "Location or description is too long" };
  }

  return {
    update: {
      category,
      building: body.building.trim(),
      location: body.location?.trim() || "",
      description: body.description?.trim() || "",
    },
  };
}

function serializeIncidentReport(report) {
  const submittedAt = new Date(report.created_at).toISOString();
  return {
    id: String(report.id),
    reportNumber: `REP-${new Date(report.created_at).getUTCFullYear()}-${String(
      report.id,
    ).padStart(6, "0")}`,
    category: report.category,
    college: report.college,
    building: report.building,
    location: report.location,
    description: report.description,
    status: report.status,
    submittedAt,
    updatedAt: new Date(report.updated_at || report.created_at).toISOString(),
    pin:
      report.pin_x === null
        ? null
        : { x: Number(report.pin_x), y: Number(report.pin_y) },
    anonymous: report.is_anonymous,
    imageUrl: report.image_path
      ? `/api/student/report-evidence?id=${encodeURIComponent(
          String(report.id),
        )}&kind=image`
      : null,
    audioUrl: report.audio_path
      ? `/api/student/report-evidence?id=${encodeURIComponent(
          String(report.id),
        )}&kind=audio`
      : null,
  };
}

async function handleStudentIncidentReport(req, res) {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
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

  try {
    const student = await findStudentProfileById(studentId);
    if (!student || student.status.toLowerCase() !== "active") {
      clearStudentSessionCookie(res);
      return res.status(401).json({ error: "Student sign-in is required" });
    }

    res.setHeader("Cache-Control", "private, no-store");
    if (req.method === "GET") {
      const reports = await listIncidentReportsForStudent(studentId);
      return res.status(200).json({
        reports: reports.map(serializeIncidentReport),
      });
    }

    if (req.method === "PATCH") {
      const id = parseId(req.body?.id);
      if (!id) {
        return res.status(400).json({ error: "A valid report ID is required" });
      }
      const { update, error: updateError } = parseIncidentReportUpdate(
        req.body,
      );
      if (updateError) return res.status(400).json({ error: updateError });

      const updated = await updateIncidentReportForStudent(
        id,
        studentId,
        update,
      );
      if (!updated) {
        return res.status(404).json({
          error: "Report not found, or it can no longer be edited",
        });
      }
      return res.status(200).json({
        report: serializeIncidentReport(updated),
      });
    }

    if (req.method === "DELETE") {
      const id = parseId(req.body?.id);
      if (!id) {
        return res.status(400).json({ error: "A valid report ID is required" });
      }

      const deleted = await deleteIncidentReportForStudent(id, studentId);
      if (!deleted) {
        return res.status(404).json({
          error: "Report not found, or it can no longer be deleted",
        });
      }

      // Remove the attached files too (best effort; the report is already gone)
      const evidencePaths = [deleted.image_path, deleted.audio_path].filter(
        Boolean,
      );
      if (BLOB_TOKEN && evidencePaths.length > 0) {
        try {
          await del(evidencePaths, { ...blobAuth });
        } catch (blobError) {
          console.error("Report evidence cleanup failed", blobError);
        }
      }

      return res.status(200).json({ deletedId: String(deleted.id) });
    }

    const { report, error } = parseIncidentReport(req.body);
    if (error) return res.status(400).json({ error });

    const imagePath = req.body.imagePath ?? null;
    const audioPath = req.body.audioPath ?? null;
    if (
      (imagePath !== null &&
        !isOwnedReportEvidencePath(imagePath, studentId, "image")) ||
      (audioPath !== null &&
        !isOwnedReportEvidencePath(audioPath, studentId, "audio"))
    ) {
      return res.status(400).json({ error: "Invalid report evidence" });
    }
    if (imagePath || audioPath) {
      if (!BLOB_TOKEN) {
        console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
        return res
          .status(503)
          .json({ error: "Report evidence storage is unavailable" });
      }

      const evidenceIsValid = await Promise.all([
        imagePath
          ? verifyReportEvidence(
              imagePath,
              REPORT_IMAGE_CONTENT_TYPES,
              MAX_REPORT_IMAGE_SIZE,
            )
          : true,
        audioPath
          ? verifyReportEvidence(
              audioPath,
              REPORT_AUDIO_CONTENT_TYPES,
              MAX_REPORT_AUDIO_SIZE,
            )
          : true,
      ]);

      if (evidenceIsValid.includes(false)) {
        return res.status(400).json({
          error: "Report evidence is missing or has an unsupported format",
        });
      }
    }

    const created = await createIncidentReport({
      studentId,
      ...report,
      imagePath,
      audioPath,
    });
    if (!created) {
      throw new Error("Incident report was not created");
    }

    return res.status(201).json({
      report: serializeIncidentReport(created),
    });
  } catch (error) {
    console.error("Student incident report submission failed", error);
    return res.status(500).json({ error: "Unable to submit incident report" });
  }
}

async function handleStudentReportEvidence(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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

  const reportId = parseId(req.query.id);
  const kind = req.query.kind;
  if (!reportId || (kind !== "image" && kind !== "audio")) {
    return res
      .status(400)
      .json({ error: "A valid report evidence reference is required" });
  }
  if (!BLOB_TOKEN) {
    console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
    return res
      .status(503)
      .json({ error: "Report evidence storage is unavailable" });
  }

  try {
    const student = await findStudentProfileById(studentId);
    if (!student || student.status.toLowerCase() !== "active") {
      clearStudentSessionCookie(res);
      return res.status(401).json({ error: "Student sign-in is required" });
    }

    const report = await findIncidentReportEvidenceForStudent(
      reportId,
      studentId,
    );
    const pathname = kind === "image" ? report?.image_path : report?.audio_path;
    const contentTypes =
      kind === "image"
        ? REPORT_IMAGE_CONTENT_TYPES
        : REPORT_AUDIO_CONTENT_TYPES;
    const maxSize =
      kind === "image" ? MAX_REPORT_IMAGE_SIZE : MAX_REPORT_AUDIO_SIZE;
    if (!pathname || !isOwnedReportEvidencePath(pathname, studentId, kind)) {
      return res.status(404).json({ error: "Report evidence not found" });
    }

    const evidence = await get(pathname, { access: "private", ...blobAuth });
    if (
      !evidence ||
      !contentTypes.includes(evidence.blob.contentType) ||
      evidence.blob.size <= 0 ||
      evidence.blob.size > maxSize
    ) {
      return res.status(404).json({ error: "Report evidence not found" });
    }

    res.setHeader("Content-Type", evidence.blob.contentType);
    res.setHeader("Content-Length", String(evidence.blob.size));
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = Readable.fromWeb(evidence.stream);
    stream.on("error", (error) => {
      console.error("Student report evidence stream failed", error);
      res.destroy(error);
    });
    stream.pipe(res);
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return res.status(404).json({ error: "Report evidence not found" });
    }
    console.error("Student report evidence request failed", error);
    return res.status(500).json({ error: "Unable to load report evidence" });
  }
}

function serializeAdminIncidentReport(report) {
  const submittedAt = new Date(report.created_at).toISOString();
  return {
    id: String(report.id),
    reportNumber: `REP-${new Date(report.created_at).getUTCFullYear()}-${String(
      report.id,
    ).padStart(6, "0")}`,
    category: report.category,
    college: report.college,
    building: report.building,
    location: report.location,
    description: report.description,
    status: report.status,
    submittedAt,
    pin:
      report.pin_x === null
        ? null
        : { x: Number(report.pin_x), y: Number(report.pin_y) },
    hasImage: Boolean(report.image_path),
    hasAudio: Boolean(report.audio_path),
    imageUrl: report.image_path
      ? `/api/student/admin-report-evidence?id=${encodeURIComponent(
          String(report.id),
        )}&kind=image`
      : null,
    audioUrl: report.audio_path
      ? `/api/student/admin-report-evidence?id=${encodeURIComponent(
          String(report.id),
        )}&kind=audio`
      : null,
    anonymous: report.is_anonymous,
  };
}

async function handleAdminIncidentReports(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.headers["x-campus360-admin"] !== "1") {
    return res.status(403).json({ error: "Invalid admin request" });
  }

  let adminId;
  try {
    adminId = getAdminSessionAdminId(req);
  } catch (error) {
    console.error("Admin session validation failed", error);
    return res.status(500).json({ error: "Admin session is not configured" });
  }
  if (!adminId) {
    return res.status(401).json({ error: "Admin sign-in is required" });
  }

  try {
    const admin = await findActiveAdminById(adminId);
    if (!admin) {
      clearAdminSessionCookie(res);
      return res.status(401).json({ error: "Admin sign-in is required" });
    }
    if (!isNonEmptyString(admin.college)) {
      return res.status(403).json({ error: "Admin college is not configured" });
    }

    const reports = await listIncidentReportsForAdmin(admin.college);
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({
      reports: reports.map(serializeAdminIncidentReport),
      college: admin.college,
    });
  } catch (error) {
    console.error("Admin incident reports request failed", error);
    return res.status(500).json({ error: "Unable to load incident reports" });
  }
}

async function handleAdminReportStatus(req, res) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.headers["x-campus360-admin"] !== "1") {
    return res.status(403).json({ error: "Invalid admin request" });
  }

  const { id, status } = req.body || {};
  if (
    typeof id !== "string" ||
    !/^[1-9]\d*$/.test(id) ||
    typeof status !== "string" ||
    !VALID_INCIDENT_REPORT_STATUSES.has(status)
  ) {
    return res.status(400).json({ error: "Invalid report status update" });
  }

  let adminId;
  try {
    adminId = getAdminSessionAdminId(req);
  } catch (error) {
    console.error("Admin session validation failed", error);
    return res.status(500).json({ error: "Admin session is not configured" });
  }
  if (!adminId) {
    return res.status(401).json({ error: "Admin sign-in is required" });
  }

  try {
    const admin = await findActiveAdminById(adminId);
    if (!admin) {
      clearAdminSessionCookie(res);
      return res.status(401).json({ error: "Admin sign-in is required" });
    }
    if (!isNonEmptyString(admin.college)) {
      return res.status(403).json({ error: "Admin college is not configured" });
    }

    const report = await updateIncidentReportStatusForAdmin({
      id,
      college: admin.college,
      status,
    });
    if (!report) {
      return res.status(404).json({ error: "Incident report not found" });
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({
      report: {
        id: String(report.id),
        status: report.status,
        updatedAt: new Date(report.updated_at).toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin incident report status update failed", error);
    return res.status(500).json({ error: "Unable to update incident report" });
  }
}

async function handleAdminReportDelete(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.headers["x-campus360-admin"] !== "1") {
    return res.status(403).json({ error: "Invalid admin request" });
  }

  const id = parseId(req.body?.id);
  if (!id) {
    return res.status(400).json({ error: "A valid report ID is required" });
  }

  let adminId;
  try {
    adminId = getAdminSessionAdminId(req);
  } catch (error) {
    console.error("Admin session validation failed", error);
    return res.status(500).json({ error: "Admin session is not configured" });
  }
  if (!adminId) {
    return res.status(401).json({ error: "Admin sign-in is required" });
  }

  try {
    const admin = await findActiveAdminById(adminId);
    if (!admin) {
      clearAdminSessionCookie(res);
      return res.status(401).json({ error: "Admin sign-in is required" });
    }
    if (!isNonEmptyString(admin.college)) {
      return res.status(403).json({ error: "Admin college is not configured" });
    }

    const deleted = await deleteIncidentReportForAdmin(id, admin.college);
    if (!deleted) {
      return res.status(404).json({ error: "Incident report not found" });
    }

    const evidencePaths = [deleted.image_path, deleted.audio_path].filter(
      (pathname) => {
        const match =
          typeof pathname === "string"
            ? REPORT_EVIDENCE_PATH_PATTERN.exec(pathname)
            : null;
        return match && match[1] === String(deleted.id);
      },
    );
    if (BLOB_TOKEN && evidencePaths.length > 0) {
      try {
        await del(evidencePaths, { ...blobAuth });
      } catch (blobError) {
        console.error("Report evidence cleanup failed", blobError);
      }
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ deletedId: String(deleted.id) });
  } catch (error) {
    console.error("Admin incident report deletion failed", error);
    return res.status(500).json({ error: "Unable to delete incident report" });
  }
}

async function handleAdminReportEvidence(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const reportId = parseId(req.query.id);
  const kind = req.query.kind;
  if (!reportId || (kind !== "image" && kind !== "audio")) {
    return res
      .status(400)
      .json({ error: "A valid report evidence reference is required" });
  }

  let adminId;
  try {
    adminId = getAdminSessionAdminId(req);
  } catch (error) {
    console.error("Admin session validation failed", error);
    return res.status(500).json({ error: "Admin session is not configured" });
  }
  if (!adminId) {
    return res.status(401).json({ error: "Admin sign-in is required" });
  }

  try {
    const admin = await findActiveAdminById(adminId);
    if (!admin) {
      clearAdminSessionCookie(res);
      return res.status(401).json({ error: "Admin sign-in is required" });
    }
    if (!isNonEmptyString(admin.college)) {
      return res.status(403).json({ error: "Admin college is not configured" });
    }
    if (!BLOB_TOKEN) {
      console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
      return res.status(503).json({ error: "Report evidence is unavailable" });
    }

    const report = await findIncidentReportEvidenceForAdmin(
      reportId,
      admin.college,
    );
    const pathname = kind === "image" ? report?.image_path : report?.audio_path;
    const contentTypes =
      kind === "image"
        ? REPORT_IMAGE_CONTENT_TYPES
        : REPORT_AUDIO_CONTENT_TYPES;
    const maxSize =
      kind === "image" ? MAX_REPORT_IMAGE_SIZE : MAX_REPORT_AUDIO_SIZE;
    const pathMatch =
      typeof pathname === "string"
        ? REPORT_EVIDENCE_PATH_PATTERN.exec(pathname)
        : null;
    const extension = pathMatch?.[3]?.toLowerCase();
    const extensionMatchesKind =
      kind === "image"
        ? ["jpg", "jpeg", "png"].includes(extension)
        : ["webm", "ogg", "mp3", "m4a", "wav"].includes(extension);
    if (
      !pathMatch ||
      pathMatch[2].toLowerCase() !== kind ||
      !extensionMatchesKind ||
      !pathname
    ) {
      return res.status(404).json({ error: "Report evidence not found" });
    }

    const evidence = await get(pathname, {
      access: "private",
      token: BLOB_TOKEN,
    });
    if (
      !evidence ||
      evidence.statusCode !== 200 ||
      !contentTypes.includes(evidence.blob.contentType) ||
      evidence.blob.size <= 0 ||
      evidence.blob.size > maxSize
    ) {
      return res.status(404).json({ error: "Report evidence not found" });
    }

    res.setHeader("Content-Type", evidence.blob.contentType);
    res.setHeader("Content-Length", String(evidence.blob.size));
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = Readable.fromWeb(evidence.stream);
    stream.on("error", (error) => {
      console.error("Admin report evidence stream failed", error);
      res.destroy(error);
    });
    stream.pipe(res);
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return res.status(404).json({ error: "Report evidence not found" });
    }
    console.error("Admin report evidence request failed", error);
    return res.status(500).json({ error: "Unable to load report evidence" });
  }
}

async function handleAdminStudentImage(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const studentId = req.query.studentId;
  if (
    (typeof studentId !== "string" && typeof studentId !== "number") ||
    !/^[1-9]\d*$/.test(String(studentId))
  ) {
    return res.status(400).json({ error: "A valid student ID is required" });
  }

  let adminId;
  try {
    adminId = getAdminSessionAdminId(req);
  } catch (error) {
    console.error("Admin session validation failed", error);
    return res.status(500).json({ error: "Admin session is not configured" });
  }
  if (!adminId) {
    return res.status(401).json({ error: "Admin sign-in is required" });
  }

  try {
    const admin = await findActiveAdminById(adminId);
    if (!admin) {
      clearAdminSessionCookie(res);
      return res.status(401).json({ error: "Admin sign-in is required" });
    }

    const student = await findStudentIdImageForAdmin(
      String(studentId),
      admin.college,
    );
    if (
      !student ||
      student.role !== "Student" ||
      !IMAGE_PATH_PATTERN.test(student.school_id_image_path)
    ) {
      return res.status(404).json({ error: "Student ID image not found" });
    }
    if (!BLOB_TOKEN) {
      console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
      return res
        .status(503)
        .json({ error: "Student ID images are unavailable" });
    }

    const image = await get(student.school_id_image_path, {
      access: "private",
      token: BLOB_TOKEN,
    });
    if (!image || image.statusCode !== 200) {
      return res.status(404).json({ error: "Student ID image not found" });
    }
    if (!["image/jpeg", "image/png"].includes(image.blob.contentType)) {
      return res.status(415).json({ error: "Unsupported student ID image" });
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", image.blob.contentType);
    res.setHeader("Content-Length", image.blob.size);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = Readable.fromWeb(image.stream);
    stream.on("error", (error) => {
      console.error("Student ID image stream failed", error);
      res.destroy(error);
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Student ID image request failed", error);
    return res
      .status(500)
      .json({ error: "Unable to load the student ID image" });
  }
}

async function handleProfileImageRead(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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

    const pathPattern = new RegExp(
      `^student-profile/${studentId}/[A-Za-z0-9_-]+\\.(?:jpg|jpeg|png)$`,
      "i",
    );
    if (
      !student.profile_image_path ||
      !pathPattern.test(student.profile_image_path)
    ) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    const image = await get(student.profile_image_path, {
      access: "private",
      token: BLOB_TOKEN,
    });
    if (
      !image ||
      image.statusCode !== 200 ||
      !PROFILE_IMAGE_CONTENT_TYPES.includes(image.blob.contentType) ||
      image.blob.size > MAX_PROFILE_IMAGE_SIZE
    ) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", image.blob.contentType);
    res.setHeader("Content-Length", image.blob.size);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = Readable.fromWeb(image.stream);
    stream.on("error", (error) => {
      console.error("Student profile image stream failed", error);
      res.destroy(error);
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Student profile image request failed", error);
    return res.status(500).json({ error: "Unable to load the profile image" });
  }
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

async function handleReportEvidenceUpload(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!BLOB_TOKEN) {
    console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
    return res
      .status(503)
      .json({ error: "Report evidence storage is unavailable" });
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

  try {
    const student = await findStudentProfileById(studentId);
    if (!student || student.status.toLowerCase() !== "active") {
      clearStudentSessionCookie(res);
      return res.status(401).json({ error: "Student sign-in is required" });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "A valid upload request is required" });
    }

    const result = await handleUpload({
      ...blobAuth,
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const match =
          typeof pathname === "string"
            ? REPORT_EVIDENCE_PATH_PATTERN.exec(pathname)
            : null;
        if (!match || match[1] !== studentId) {
          throw new Error("Invalid report evidence upload path");
        }

        const kind = match[2].toLowerCase();
        return {
          allowedContentTypes:
            kind === "image"
              ? REPORT_IMAGE_CONTENT_TYPES
              : REPORT_AUDIO_CONTENT_TYPES,
          maximumSizeInBytes:
            kind === "image" ? MAX_REPORT_IMAGE_SIZE : MAX_REPORT_AUDIO_SIZE,
          validUntil: Date.now() + 5 * 60 * 1000,
        };
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Report evidence upload authorization failed", error);
    return res
      .status(400)
      .json({ error: "Unable to authorize report evidence upload" });
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
    if (!student || !(await verifyPassword(password, student.password_hash))) {
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

  if (action === "report-upload") {
    return handleReportEvidenceUpload(req, res);
  }

  if (action === "profile") {
    return handleProfileImageUpdate(req, res);
  }

  if (action === "profile-image") {
    return handleProfileImageRead(req, res);
  }

  if (action === "admin-students") {
    return handleAdminStudents(req, res);
  }

  if (action === "admin-reports") {
    return handleAdminIncidentReports(req, res);
  }

  if (action === "admin-report-status") {
    return handleAdminReportStatus(req, res);
  }
  if (action === "admin-report-delete") {
    return handleAdminReportDelete(req, res);
  }

  if (action === "admin-report-evidence") {
    return handleAdminReportEvidence(req, res);
  }

  if (action === "admin-student-image") {
    return handleAdminStudentImage(req, res);
  }

  if (action === "report") {
    return handleStudentIncidentReport(req, res);
  }

  if (action === "report-evidence") {
    return handleStudentReportEvidence(req, res);
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
