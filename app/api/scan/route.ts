import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MAX_EMAILS,
  applyResult,
  createSchema,
  emailContent,
  emailSchema,
  isSameOrigin,
  loadRecord,
  makeRecord,
  newToken,
  readToken,
  requestOrigin,
  resultSchema,
  saveRecord,
  sendEmail,
  statusOf,
  type ScanRecord,
} from "@/lib/scan";

const bodySchema = z.discriminatedUnion("action", [
  createSchema,
  emailSchema,
  resultSchema,
]);

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

/** What a link holder may see. No email address is ever stored or returned. */
function view(r: ScanRecord) {
  return {
    hireName: r.hireName,
    businessName: r.businessName,
    caseNumber: r.caseNumber,
    status: statusOf(r),
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    openedAt: r.openedAt,
    emailSentAt: r.emailSentAt,
    completedAt: r.completedAt,
    result: r.result,
  };
}

async function find(token: string | null) {
  const id = token ? readToken(token) : null;
  if (!id) return null;
  return loadRecord(id);
}

/** GET ?token=... returns the session; the employee page calls it with ?open=1. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const record = await find(url.searchParams.get("token"));
    if (!record) return json({ error: "This link is not valid." }, 404);
    if (url.searchParams.get("open") === "1" && !record.openedAt) {
      record.openedAt = new Date().toISOString();
      await saveRecord(record);
    }
    return json(view(record));
  } catch {
    return json({ error: "Could not load this session." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request))
      return json({ error: "Request origin rejected." }, 403);
    const raw = await request.text();
    if (raw.length > 5000) return json({ error: "Request too large." }, 413);
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        400,
      );
    const input = parsed.data;

    if (input.action === "create") {
      const { id, token } = newToken();
      const record = makeRecord({
        id,
        hireName: input.hireName,
        businessName: input.businessName,
        caseNumber: input.caseNumber.toUpperCase(),
      });
      await saveRecord(record);
      return json({
        token,
        url: `${requestOrigin(request)}/check/${token}`,
        ...view(record),
      });
    }

    const record = await find(input.token);
    if (!record) return json({ error: "This link is not valid." }, 404);

    if (input.action === "email") {
      if (statusOf(record) === "expired" || record.completedAt)
        return json({ error: "This session is already finished." }, 409);
      if (record.emailCount >= MAX_EMAILS)
        return json({ error: "Email limit reached for this session." }, 429);
      const url = `${requestOrigin(request)}/check/${input.token}`;
      const sent = await sendEmail(
        input.to,
        emailContent({
          hireName: record.hireName,
          businessName: record.businessName,
          url,
        }),
      );
      if (!sent.ok) return json({ error: sent.message }, sent.status);
      record.emailCount += 1;
      record.emailSentAt = new Date().toISOString();
      await saveRecord(record);
      return json(view(record));
    }

    // result
    if (record.completedAt)
      return json({ error: "Results were already sent." }, 409);
    if (statusOf(record) === "expired")
      return json({ error: "This link has expired." }, 410);
    const done = applyResult(record, input);
    await saveRecord(done);
    return json(view(done));
  } catch {
    return json({ error: "Something went wrong. Try again." }, 500);
  }
}
