import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { serverClient } from "@/lib/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (
    hash &&
    type &&
    ["signup", "email", "recovery", "invite"].includes(type)
  ) {
    const db = await serverClient();
    const { error } = await db.auth.verifyOtp({
      token_hash: hash,
      type: type as EmailOtpType,
    });
    if (!error)
      return NextResponse.redirect(
        new URL(
          type === "recovery" ? "/reset-password?update=1" : "/workspace",
          url.origin,
        ),
      );
  }
  return NextResponse.redirect(
    new URL("/login?error=confirmation", url.origin),
  );
}
