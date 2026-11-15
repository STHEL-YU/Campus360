import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import process from "node:process";

const COOKIE_NAME = "campus360_student_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSecret() {
  const secret =
    process.env.STUDENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error(
      "STUDENT_SESSION_SECRET or ADMIN_SESSION_SECRET must contain at least 32 characters",
    );
  }
  return secret;
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function setStudentSessionCookie(res, studentId) {
  if (!/^[1-9]\d*$/.test(String(studentId))) {
    throw new Error("A valid student ID is required for the session");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: String(studentId), exp: now + SESSION_TTL_SECONDS }),
  ).toString("base64url");
  const token = `${payload}.${sign(payload, getSecret())}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  );
}

export function clearStudentSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  );
}

export function getStudentSessionId(req) {
  const cookieHeader = req.headers?.cookie;
  if (typeof cookieHeader !== "string") return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;

  const token = cookie.slice(COOKIE_NAME.length + 1);
  if (token.length > 2048) return null;

  const [payload, signature, extra] = token.split(".");
  if (
    extra !== undefined ||
    !payload ||
    !signature ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !/^[A-Za-z0-9_-]+$/.test(signature)
  ) {
    return null;
  }

  const expected = Buffer.from(sign(payload, getSecret()), "base64url");
  const provided = Buffer.from(signature, "base64url");
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof data.sub !== "string" ||
      !/^[1-9]\d*$/.test(data.sub) ||
      !Number.isInteger(data.exp) ||
      data.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return data.sub;
  } catch {
    return null;
  }
}
