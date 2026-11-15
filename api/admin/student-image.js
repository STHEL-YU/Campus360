import { get } from "@vercel/blob";
import { Readable } from "node:stream";
import process from "node:process";
import {
  clearAdminSessionCookie,
  getAdminSessionAdminId,
} from "../admin-session.js";
import {
  findActiveAdminById,
  findStudentIdImageForAdmin,
} from "../campusdatabase.js";

const BLOB_TOKEN = process.env.CAMPUS_BLOB_READ_WRITE_TOKEN;
const IMAGE_PATH_PATTERN = /^student-id\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png)$/i;

export default async function handler(req, res) {
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
      return res.status(503).json({ error: "Student ID images are unavailable" });
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
    return res.status(500).json({ error: "Unable to load the student ID image" });
  }
}
