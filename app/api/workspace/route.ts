import { NextResponse } from "next/server";
import { serverClient } from "@/lib/server";
export async function GET() {
  try {
    const db = await serverClient();
    const {
      data: { user },
      error,
    } = await db.auth.getUser();
    if (error || !user)
      return NextResponse.json(
        { error: "Sign in to continue." },
        { status: 401 },
      );
    const responses = await Promise.all([
      db.from("memberships").select("*"),
      db.from("workspaces").select("*"),
      db.from("businesses").select("*"),
      db.from("hires").select("*"),
      db.from("task_confirmations").select("*"),
      db
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("invitations")
        .select("id,hire_id,expires_at,revoked_at,redeemed_at"),
      db.from("requirement_snapshots").select("*"),
    ]);
    for (const response of responses)
      if (response.error)
        throw new Error("Workspace data could not be loaded.");
    const [
      members,
      workspaces,
      businesses,
      hires,
      confirmations,
      events,
      invites,
      snapshots,
    ] = responses.map((r) => r.data || []);
    return NextResponse.json(
      {
        workspace: workspaces[0] || null,
        businesses,
        hires,
        confirmations,
        events,
        invites,
        snapshots,
        role: members.length ? "employer" : "hire",
        userEmail: user.email,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to load workspace." },
      { status: 503 },
    );
  }
}
