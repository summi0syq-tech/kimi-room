// Single-user owner session for the Prisma backend (server-only · node:crypto).
//
// 1v1: the whole database belongs to one person, so "auth" is one password. A
// correct password mints a cookie whose value is sha256(password:secret); every
// /api/store request must present it. No password configured → locked shut
// (isAuthed / verifyPassword both return false), never open-by-default. Only the
// two server routes import this. See docs/SELF-HOST.md.

import { createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "kimi_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function expectedToken(): string | null {
  const pw = process.env.KIMI_OWNER_PASSWORD;
  if (!pw) return null;
  const secret = process.env.KIMI_SESSION_SECRET ?? "";
  return createHash("sha256").update(`${pw}:${secret}`).digest("hex");
}

function hexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function isAuthed(req: Request): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)kimi_session=([a-f0-9]+)/);
  return !!m && hexEqual(m[1], expected);
}

export function verifyPassword(input: string): boolean {
  const pw = process.env.KIMI_OWNER_PASSWORD;
  if (!pw) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pw).digest();
  return timingSafeEqual(a, b);
}
