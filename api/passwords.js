import { Buffer } from "node:buffer";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, encodedHash) {
  if (typeof encodedHash !== "string") {
    return false;
  }

  const [algorithm, saltHex, hashHex] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !/^[a-f0-9]{32}$/i.test(saltHex || "") ||
    !/^[a-f0-9]{128}$/i.test(hashHex || "")
  ) {
    return false;
  }

  const expectedHash = Buffer.from(hashHex, "hex");
  const actualHash = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  return timingSafeEqual(expectedHash, actualHash);
}
