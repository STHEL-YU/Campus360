import process from "node:process";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import pg from "pg";
import {
  findActiveAdminById,
  findStudentProfileById,
} from "../campusdatabase.js";
import {
  clearAdminSessionCookie,
  getAdminSessionAdminId,
} from "../admin-session.js";
import {
  clearStudentSessionCookie,
  getStudentSessionId,
} from "../student-session.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || "").replace(/\?.*$/, ""),
  ssl: process.env.AIVEN_CA_CERT
    ? { ca: process.env.AIVEN_CA_CERT, rejectUnauthorized: true }
    : { rejectUnauthorized: false },
  max: 1,
});

const DEVICE_API_KEY = process.env.DEVICE_API_KEY || "";
const CROSS_COLLEGE_ALERT_TITLE = "RED ALERT: MOVE TO SAFETY";

const MAX_CLOCK_DRIFT_MS = 10 * 60 * 1000;

function isValidDeviceKey(provided) {
  if (!DEVICE_API_KEY || typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(DEVICE_API_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

function resolveAlertTime(alertTime, createdAt) {
  const created = new Date(createdAt);
  const device = alertTime ? new Date(alertTime) : null;
  if (
    device &&
    Number.isFinite(device.getTime()) &&
    Math.abs(device.getTime() - created.getTime()) <= MAX_CLOCK_DRIFT_MS
  ) {
    return device.toISOString();
  }
  return created.toISOString();
}

/* ---------- Action: ingest (called by the ESP32) ---------- */

async function handleIngest(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isValidDeviceKey(req.headers["x-device-key"])) {
    return res.status(401).json({ error: "Invalid device key" });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  const { title, message, college } = body;
  const alertTime = body.alertTime ?? null;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 200 ||
    typeof message !== "string" ||
    message.length > 2000 ||
    typeof college !== "string" ||
    !college.trim() ||
    college.length > 100 ||
    (alertTime !== null &&
      (typeof alertTime !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(alertTime) ||
        !Number.isFinite(Date.parse(alertTime))))
  ) {
    return res.status(400).json({ error: "Invalid alert data" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO alerts (title, message, college, alert_time)
       VALUES (
         $1, $2, $3,
         CASE
           WHEN $4::timestamptz BETWEEN now() - INTERVAL '10 minutes'
                                    AND now() + INTERVAL '10 minutes'
           THEN $4::timestamptz
           ELSE now()
         END
       )
       RETURNING id`,
      [title.trim(), message.trim(), college.trim(), alertTime],
    );
    return res.status(201).json({ ok: true, id: String(result.rows[0].id) });
  } catch (error) {
    console.error("Alert insert failed", error);
    return res.status(500).json({ error: "Unable to save alert" });
  }
}

/* ---------- Action: latest (called by the website) ---------- */

async function handleLatest(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
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

    const limit = Math.min(Math.max(Number(req.query?.limit) || 50, 1), 500);
    const result = await pool.query(
      `SELECT id, title, message, college, alert_time, created_at
       FROM alerts
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({
      alerts: result.rows.map((row) => ({
        id: String(row.id),
        title: row.title,
        message: row.message,
        college: row.college,
        alertTime: resolveAlertTime(row.alert_time, row.created_at),
        createdAt: new Date(row.created_at).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Alert query failed", error);
    return res.status(500).json({ error: "Unable to load alerts" });
  }
}

async function handleAdminManage(req, res) {
  if (!["GET", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, DELETE");
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

    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT id, title, message, college, alert_time, created_at
         FROM alerts
         ORDER BY created_at DESC, id DESC`,
      );

      res.setHeader("Cache-Control", "private, no-store");
      return res.status(200).json({
        alerts: result.rows.map((row) => ({
          id: String(row.id),
          title: row.title,
          message: row.message,
          college: row.college,
          alertTime: resolveAlertTime(row.alert_time, row.created_at),
          createdAt: new Date(row.created_at).toISOString(),
        })),
      });
    }

    const id = req.body?.id;
    if (
      (typeof id !== "string" && typeof id !== "number") ||
      !/^[1-9]\d*$/.test(String(id))
    ) {
      return res.status(400).json({ error: "A valid alert ID is required" });
    }

    const result = await pool.query(
      "DELETE FROM alerts WHERE id = $1 RETURNING id",
      [String(id)],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ deletedId: String(result.rows[0].id) });
  } catch (error) {
    console.error("Admin alert management request failed", error);
    return res.status(500).json({
      error:
        req.method === "GET"
          ? "Unable to load alerts"
          : "Unable to delete alert",
    });
  }
}

async function handleStudentLatest(req, res) {
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

  try {
    const student = await findStudentProfileById(studentId);
    if (!student || student.status.toLowerCase() !== "active") {
      clearStudentSessionCookie(res);
      return res.status(401).json({ error: "Student sign-in is required" });
    }

    const result = await pool.query(
      `SELECT id, title, message, college, alert_time, created_at
       FROM alerts
       WHERE (BTRIM(REGEXP_REPLACE(
               REGEXP_REPLACE(LOWER(college), '[[:space:]]*&[[:space:]]*', ' and ', 'g'),
               '[[:space:]]+', ' ', 'g'
             )) = BTRIM(REGEXP_REPLACE(
               REGEXP_REPLACE(LOWER($1), '[[:space:]]*&[[:space:]]*', ' and ', 'g'),
               '[[:space:]]+', ' ', 'g'
             ))
          OR UPPER(BTRIM(title)) = UPPER($2)
       )
         AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC, id DESC`,
      [student.college, CROSS_COLLEGE_ALERT_TITLE],
    );

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({
      alerts: result.rows.map((row) => ({
        id: String(row.id),
        title: row.title,
        message: row.message,
        college: row.college,
        alertTime: resolveAlertTime(row.alert_time, row.created_at),
        createdAt: new Date(row.created_at).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Student alert query failed", error);
    return res.status(500).json({ error: "Unable to load campus alerts" });
  }
}

/* ---------- Router ---------- */

const ACTION_HANDLERS = {
  ingest: handleIngest,
  latest: handleLatest,
  manage: handleAdminManage,
  "student-latest": handleStudentLatest,
};

export default async function handler(req, res) {
  const action = req.query?.action;
  const actionHandler = Object.hasOwn(ACTION_HANDLERS, action)
    ? ACTION_HANDLERS[action]
    : null;

  if (!actionHandler) {
    return res.status(404).json({ error: "Alert action not found" });
  }
  return actionHandler(req, res);
}
