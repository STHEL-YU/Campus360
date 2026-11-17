import { Buffer } from "node:buffer";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { BlobNotFoundError, get, head, put } from "@vercel/blob";
import {
  createNewsAnnouncement,
  deleteNewsAnnouncement,
  findActiveAdminById,
  findNewsAnnouncementImage,
  findStudentNewsAnnouncementImage,
  findStudentProfileById,
  listNewsAnnouncements,
  listNewsAnnouncementsForStudent,
  updateNewsAnnouncement,
} from "../campusdatabase.js";
import {
  clearAdminSessionCookie,
  getAdminSessionAdminId,
} from "../admin-session.js";
import {
  clearStudentSessionCookie,
  getStudentSessionId,
} from "../student-session.js";

const NEWS_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png"];
const MAX_NEWS_IMAGE_SIZE = 3 * 1024 * 1024;
const NEWS_IMAGE_PATH_PATTERN = /^news\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png)$/i;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const BLOB_TOKEN = process.env.CAMPUS_BLOB_READ_WRITE_TOKEN;
const blobAuth = BLOB_TOKEN ? { token: BLOB_TOKEN } : {};
// Campus dates are shown in Philippine time, not UTC
const CAMPUS_TIME_ZONE = "Asia/Manila";
const ANNOUNCEMENT_TYPES = new Set([
  "Announcement",
  "Campaign",
  "Safety Advisory",
]);
const ANNOUNCEMENT_AUDIENCES = new Set([
  "General announcement",
  "Specific college",
  "University-wide",
  "All users",
  "Students Only",
  "Faculty Only",
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseId(value) {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^[1-9]\d*$/.test(String(value))
  ) {
    return null;
  }
  return String(value);
}

function parseAnnouncement(body, adminCollege) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A JSON request body is required" };
  }

  const { title, type, audience, content } = body;
  if (!isNonEmptyString(title) || title.trim().length > 200) {
    return { error: "Enter a title up to 200 characters" };
  }
  if (typeof type !== "string" || !ANNOUNCEMENT_TYPES.has(type)) {
    return { error: "Select a valid announcement type" };
  }
  if (typeof audience !== "string" || !ANNOUNCEMENT_AUDIENCES.has(audience)) {
    return { error: "Select a valid audience" };
  }
  if (typeof content !== "string" || content.length > 20000) {
    return { error: "Message must be 20,000 characters or fewer" };
  }

  const eventAt = body.eventAt ?? null;
  if (
    eventAt !== null &&
    (typeof eventAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(eventAt) ||
      !Number.isFinite(Date.parse(eventAt)))
  ) {
    return { error: "Enter a valid event date and time" };
  }

  const imagePath = body.imagePath ?? null;
  if (
    imagePath !== null &&
    (typeof imagePath !== "string" || !NEWS_IMAGE_PATH_PATTERN.test(imagePath))
  ) {
    return { error: "Upload a valid announcement image" };
  }
  if (audience === "Specific college" && !isNonEmptyString(adminCollege)) {
    return {
      error: "Your admin account does not have an assigned college",
      status: 403,
    };
  }

  return {
    announcement: {
      title: title.trim(),
      type,
      audience,
      content: content.trim(),
      eventAt: eventAt ? new Date(eventAt) : null,
      targetCollege: audience === "Specific college" ? adminCollege : null,
      imagePath,
    },
  };
}

async function getNewsImageDetails(imagePath) {
  if (!imagePath) {
    return { imagePath: null, imageUrl: null };
  }
  if (!BLOB_TOKEN) {
    return {
      error: "Announcement image storage is not configured",
      status: 503,
    };
  }

  let image;
  try {
    image = await head(imagePath, { access: "private", ...blobAuth });
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return { error: "Upload a valid announcement image", status: 400 };
    }
    throw error;
  }

  if (
    !NEWS_IMAGE_CONTENT_TYPES.includes(image.contentType) ||
    image.size > MAX_NEWS_IMAGE_SIZE
  ) {
    return { error: "Upload a valid announcement image", status: 400 };
  }

  return { imagePath, imageUrl: null };
}

function serializeAnnouncement(announcement) {
  const publishedAt = new Date(announcement.published_at);

  return {
    id: String(announcement.id),
    title: announcement.title,
    type: announcement.type,
    audience: announcement.audience,
    content: announcement.content,
    status: announcement.status,
    eventAt: announcement.event_at
      ? new Date(announcement.event_at).toISOString()
      : null,
    targetCollege: announcement.target_college,
    imagePath: announcement.image_path,
    imageUrl: announcement.image_path
      ? `/api/news/image-content?id=${encodeURIComponent(String(announcement.id))}`
      : null,
    // YYYY-MM-DD in Philippine time
    publishedAt: publishedAt.toLocaleDateString("en-CA", {
      timeZone: CAMPUS_TIME_ZONE,
    }),
    published: publishedAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: CAMPUS_TIME_ZONE,
    }),
  };
}

function serializeStudentAnnouncement(announcement) {
  return {
    ...serializeAnnouncement(announcement),
    imageUrl: announcement.image_path
      ? `/api/news/student-image?id=${encodeURIComponent(String(announcement.id))}`
      : null,
  };
}

/* ---------- Shared image streaming ---------- */

async function streamNewsImage(res, imagePath, streamErrorLabel) {
  let image;
  try {
    image = await get(imagePath, {
      access: "private",
      token: BLOB_TOKEN,
    });
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return res.status(404).json({ error: "Announcement image not found" });
    }
    throw error;
  }

  if (
    !image ||
    image.statusCode !== 200 ||
    !NEWS_IMAGE_CONTENT_TYPES.includes(image.blob.contentType) ||
    image.blob.size > MAX_NEWS_IMAGE_SIZE
  ) {
    return res.status(404).json({ error: "Announcement image not found" });
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", image.blob.contentType);
  res.setHeader("Content-Length", image.blob.size);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const stream = Readable.fromWeb(image.stream);
  stream.on("error", (error) => {
    console.error(streamErrorLabel, error);
    res.destroy(error);
  });
  stream.pipe(res);
}

/* ---------- Action: feed (student news list) ---------- */

async function handleStudentNewsFeed(req, res) {
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
    if (!isNonEmptyString(student.college)) {
      return res
        .status(403)
        .json({ error: "Student college is not configured" });
    }

    const announcements = await listNewsAnnouncementsForStudent(
      student.college,
      student.role,
    );
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({
      announcements: announcements.map(serializeStudentAnnouncement),
    });
  } catch (error) {
    console.error("Student news feed request failed", error);
    return res.status(500).json({ error: "Unable to load campus news" });
  }
}

/* ---------- Action: image-content (admin image) ---------- */

async function handleAdminImage(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!BLOB_TOKEN) {
    console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
    return res
      .status(503)
      .json({ error: "Announcement images are unavailable" });
  }

  const id = parseId(req.query?.id);
  if (!id) {
    return res
      .status(400)
      .json({ error: "A valid announcement ID is required" });
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

    const announcement = await findNewsAnnouncementImage(id, admin.college);
    if (
      !announcement?.image_path ||
      !NEWS_IMAGE_PATH_PATTERN.test(announcement.image_path)
    ) {
      return res.status(404).json({ error: "Announcement image not found" });
    }

    return await streamNewsImage(
      res,
      announcement.image_path,
      "Announcement image stream failed",
    );
  } catch (error) {
    console.error("Announcement image request failed", error);
    return res
      .status(500)
      .json({ error: "Unable to load the announcement image" });
  }
}

/* ---------- Action: student-image ---------- */

async function handleStudentImage(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!BLOB_TOKEN) {
    console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
    return res
      .status(503)
      .json({ error: "Announcement images are unavailable" });
  }

  const id = parseId(req.query?.id);
  if (!id) {
    return res
      .status(400)
      .json({ error: "A valid announcement ID is required" });
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
    if (!isNonEmptyString(student.college)) {
      return res
        .status(403)
        .json({ error: "Student college is not configured" });
    }

    const announcement = await findStudentNewsAnnouncementImage(
      id,
      student.college,
      student.role,
    );
    if (
      !announcement?.image_path ||
      !NEWS_IMAGE_PATH_PATTERN.test(announcement.image_path)
    ) {
      return res.status(404).json({ error: "Announcement image not found" });
    }

    return await streamNewsImage(
      res,
      announcement.image_path,
      "Student announcement image stream failed",
    );
  } catch (error) {
    console.error("Student announcement image request failed", error);
    return res
      .status(500)
      .json({ error: "Unable to load the announcement image" });
  }
}

/* ---------- Action: upload-image ---------- */

async function handleImageUpload(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!BLOB_TOKEN) {
    console.error("CAMPUS_BLOB_READ_WRITE_TOKEN is not configured");
    return res
      .status(503)
      .json({ error: "Announcement image storage is unavailable" });
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

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "A JSON request body is required" });
    }

    const { contentType, base64 } = req.body;
    if (
      typeof contentType !== "string" ||
      !NEWS_IMAGE_CONTENT_TYPES.includes(contentType)
    ) {
      return res.status(415).json({ error: "Choose a JPG or PNG image" });
    }
    if (
      typeof base64 !== "string" ||
      base64.length > Math.ceil(MAX_NEWS_IMAGE_SIZE / 3) * 4 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
    ) {
      return res.status(400).json({ error: "A valid image is required" });
    }
    const image = Buffer.from(base64, "base64");
    if (
      image.length === 0 ||
      image.length > MAX_NEWS_IMAGE_SIZE ||
      image.toString("base64") !== base64
    ) {
      return res.status(400).json({ error: "A valid image is required" });
    }

    const isPng =
      image.length >= PNG_SIGNATURE.length &&
      image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
    const isJpeg =
      image.length >= 3 &&
      image[0] === 0xff &&
      image[1] === 0xd8 &&
      image[2] === 0xff;
    if (
      (contentType === "image/png" && !isPng) ||
      (contentType === "image/jpeg" && !isJpeg)
    ) {
      return res.status(415).json({ error: "Choose a valid JPG or PNG image" });
    }

    const extension = contentType === "image/png" ? "png" : "jpg";
    const blob = await put(`news/${randomUUID()}.${extension}`, image, {
      access: "private",
      contentType,
      token: BLOB_TOKEN,
    });

    return res.status(201).json({ pathname: blob.pathname });
  } catch (error) {
    console.error("Announcement image upload failed", error);
    return res
      .status(500)
      .json({ error: "Unable to upload the announcement image" });
  }
}

/* ---------- Action: announcements (admin CRUD) ---------- */

async function handleAnnouncements(req, res) {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
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
      const announcements = await listNewsAnnouncements(admin.college);
      return res.status(200).json({
        announcements: announcements.map(serializeAnnouncement),
        adminCollege: admin.college,
      });
    }

    if (req.method === "POST") {
      const { announcement, error, status } = parseAnnouncement(
        req.body,
        admin.college,
      );
      if (error) return res.status(status || 400).json({ error });

      const image = await getNewsImageDetails(announcement.imagePath);
      if (image.error)
        return res.status(image.status).json({ error: image.error });

      const created = await createNewsAnnouncement({
        ...announcement,
        ...image,
      });
      return res
        .status(201)
        .json({ announcement: serializeAnnouncement(created) });
    }

    const id = parseId(req.body?.id);
    if (!id) {
      return res
        .status(400)
        .json({ error: "A valid announcement ID is required" });
    }

    if (req.method === "PATCH") {
      const { announcement, error, status } = parseAnnouncement(
        req.body,
        admin.college,
      );
      if (error) return res.status(status || 400).json({ error });

      const image = await getNewsImageDetails(announcement.imagePath);
      if (image.error)
        return res.status(image.status).json({ error: image.error });

      const updated = await updateNewsAnnouncement(
        id,
        {
          ...announcement,
          ...image,
        },
        admin.college,
      );
      if (!updated) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      return res
        .status(200)
        .json({ announcement: serializeAnnouncement(updated) });
    }

    const deleted = await deleteNewsAnnouncement(id, admin.college);
    if (!deleted) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    return res.status(200).json({ deletedId: String(deleted.id) });
  } catch (error) {
    console.error("News announcement request failed", error);
    return res.status(500).json({ error: "Unable to manage announcements" });
  }
}

/* ---------- Router ---------- */

const ACTION_HANDLERS = {
  feed: handleStudentNewsFeed,
  announcements: handleAnnouncements,
  "image-content": handleAdminImage,
  "student-image": handleStudentImage,
  "upload-image": handleImageUpload,
};

export default async function handler(req, res) {
  const action = req.query?.action;
  const actionHandler = Object.hasOwn(ACTION_HANDLERS, action)
    ? ACTION_HANDLERS[action]
    : null;

  if (!actionHandler) {
    return res.status(404).json({ error: "News action not found" });
  }
  return actionHandler(req, res);
}
