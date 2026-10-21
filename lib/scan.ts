import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { get, put } from "@vercel/blob";
import { z } from "zod";
import { verdictFor, type Band } from "./face/verdict";

/**
 * Optional face-check sessions. An employer creates a session for one new
 * hire and shares a signed link. The hire runs the comparison on their own
 * device and sends back only a similarity score; photos and face data never
 * leave the device. A session link is a capability: whoever holds it can read
 * and complete that one session, nothing else.
 */

export const SESSION_DAYS = 7;
export const MAX_EMAILS = 3;

export const caseNumberSchema = z
  .string()
  .trim()
  .min(6, "Enter the E-Verify case number from your case")
  .max(24)
  .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and dashes only");

export const createSchema = z.object({
  action: z.literal("create"),
  hireName: z.string().trim().min(1).max(80),
  businessName: z.string().trim().min(1).max(80),
  caseNumber: caseNumberSchema,
});
export const emailSchema = z.object({
  action: z.literal("email"),
  token: z.string().min(10).max(120),
  to: z.string().trim().email().max(200),
});
export const resultSchema = z.object({
  action: z.literal("result"),
  token: z.string().min(10).max(120),
  similarity: z.number().min(-1).max(1),
  warnings: z.number().int().min(0).max(20),
});

export type ScanRecord = {
  id: string;
  hireName: string;
  businessName: string;
  caseNumber: string;
  createdAt: string;
  expiresAt: string;
  openedAt: string | null;
  emailSentAt: string | null;
  emailCount: number;
  completedAt: string | null;
  result: { similarity: number; band: Band; warnings: number } | null;
};

export type ScanStatus = "waiting" | "opened" | "completed" | "expired";

export function statusOf(r: ScanRecord, now = new Date()): ScanStatus {
  if (r.completedAt) return "completed";
  if (new Date(r.expiresAt) < now) return "expired";
  return r.openedAt ? "opened" : "waiting";
}

function secret(): string {
  const value = process.env.SCAN_LINK_SECRET;
  if (value && value.length >= 24) return value;
  if (process.env.NODE_ENV === "production")
    throw new Error("SCAN_LINK_SECRET is not configured.");
  return "development-only-scan-secret-not-for-production";
}

const sign = (id: string) =>
  createHmac("sha256", secret()).update(id).digest("base64url").slice(0, 27);

export function newToken(): { id: string; token: string } {
  const id = randomBytes(12).toString("base64url");
  return { id, token: `${id}.${sign(id)}` };
}

/** Returns the session id if the token's signature is valid, else null. */
export function readToken(token: string): string | null {
  const [id, sig, extra] = token.split(".");
  if (!id || !sig || extra !== undefined || !/^[A-Za-z0-9_-]{16}$/.test(id))
    return null;
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected)
    ? id
    : null;
}

export function makeRecord(
  input: Pick<ScanRecord, "id" | "hireName" | "businessName" | "caseNumber">,
  now = new Date(),
): ScanRecord {
  return {
    ...input,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DAYS * 86_400_000).toISOString(),
    openedAt: null,
    emailSentAt: null,
    emailCount: 0,
    completedAt: null,
    result: null,
  };
}

export function applyResult(
  record: ScanRecord,
  input: { similarity: number; warnings: number },
  now = new Date(),
): ScanRecord {
  return {
    ...record,
    completedAt: now.toISOString(),
    result: {
      similarity: Math.round(input.similarity * 1000) / 1000,
      band: verdictFor(input.similarity).band,
      warnings: input.warnings,
    },
  };
}

/* ---------- storage: private Vercel Blob in production, memory in dev ---------- */

const memory = new Map<string, ScanRecord>();
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const path = (id: string) => `scan-sessions/${id}.json`;

export function storageMode(): "blob" | "memory" {
  return useBlob() ? "blob" : "memory";
}

export async function loadRecord(id: string): Promise<ScanRecord | null> {
  if (!useBlob()) return memory.get(id) ?? null;
  const found = await get(path(id), { access: "private", useCache: false });
  if (!found || found.statusCode !== 200) return null;
  return (await new Response(found.stream).json()) as ScanRecord;
}

export async function saveRecord(record: ScanRecord): Promise<void> {
  if (!useBlob()) {
    memory.set(record.id, record);
    return;
  }
  await put(path(record.id), JSON.stringify(record), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/* ---------- email via Resend ---------- */

import { AGREEMENT } from "./scan-agreement";

export { AGREEMENT };

export function emailContent(input: {
  hireName: string;
  businessName: string;
  url: string;
}) {
  const subject = `${input.businessName}: optional photo comparison for your hire`;
  const text = [
    `Hi ${input.hireName},`,
    "",
    `${input.businessName} invited you to an optional photo comparison. Please read the agreement, then open your private link:`,
    "",
    ...AGREEMENT.map((line) => `- ${line}`),
    "",
    input.url,
    "",
    `The link works for ${SESSION_DAYS} days. If you did not expect this, ignore this email.`,
  ].join("\n");
  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;color:#1d1d1f;line-height:1.5">
<p>Hi ${esc(input.hireName)},</p>
<p>${esc(input.businessName)} invited you to an optional photo comparison. Please read the agreement, then open your private link.</p>
<ul>${AGREEMENT.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<p><a href="${esc(input.url)}" style="background:#0071e3;color:#fff;padding:10px 20px;border-radius:980px;text-decoration:none;display:inline-block">Open my private link</a></p>
<p style="color:#6e6e73;font-size:13px">The link works for ${SESSION_DAYS} days. If you did not expect this, ignore this email.</p>
</div>`;
  return { subject, text, html };
}

export async function sendEmail(
  to: string,
  content: { subject: string; text: string; html: string },
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key)
    return {
      ok: false,
      status: 503,
      message: "Email is not set up yet. Copy the link and send it yourself.",
    };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "EasyVerify <onboarding@resend.dev>",
      to: [to],
      ...content,
    }),
  });
  if (response.ok) return { ok: true };
  const detail = await response.json().catch(() => ({}));
  return {
    ok: false,
    status: 502,
    message:
      typeof detail?.message === "string"
        ? `Email was not sent: ${detail.message}`
        : "Email was not sent.",
  };
}

/** Public origin of this request, honoring the proxy's forwarded headers. */
export function requestOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(requestOrigin(request)).host;
  } catch {
    return false;
  }
}
