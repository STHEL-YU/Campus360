import { get } from "@vercel/blob";
import { Readable } from "node:stream";
import process from "node:process";
import {
  clearStudentSessionCookie,
  getStudentSessionId,
} from "../student-session.js";
import { findStudentProfileById } from "../campusdatabase.js";

const BLOB_TOKEN = process.env.CAMPUS_BLOB_READ_WRITE_TOKEN;

export default async function handler(req, res) {
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
    if (!student.profile_image_path || !pathPattern.test(student.profile_image_path)) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    const image = await get(student.profile_image_path, {
      access: "private",
      token: BLOB_TOKEN,
    });
    if (
      !image ||
      image.statusCode !== 200 ||
      !["image/jpeg", "image/png"].includes(image.blob.contentType) ||
      image.blob.size > 2 * 1024 * 1024
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
