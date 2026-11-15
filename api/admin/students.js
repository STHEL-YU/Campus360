import {
  clearAdminSessionCookie,
  getAdminSessionAdminId,
} from "../admin-session.js";
import {
  deleteStudentForAdmin,
  findActiveAdminById,
  listStudentsForAdmin,
  updateStudentForAdmin,
} from "../campusdatabase.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(["active", "blocked", "inactive", "pending"]);

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

export default async function handler(req, res) {
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
        return res.status(400).json({ error: "A valid student ID is required" });
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
