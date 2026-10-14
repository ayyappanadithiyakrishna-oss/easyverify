import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
let db: PGlite;
let workspace: string;
let business: string;
let hire: string;
let invite: string;
const owner = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  employee = "33333333-3333-4333-8333-333333333333";
const profile = {
  name: "Test business",
  state: "CA",
  headcount: 18,
  contractor: "none",
  far: "no",
  participation: "yes",
  calendar: "weekdays",
  closures: [],
};
const req = [
  { id: "employee-step", result: "matched", needsReview: false, role: "hire" },
  {
    id: "employer-step",
    result: "matched",
    needsReview: false,
    role: "employer",
  },
  { id: "review-step", result: "matched", needsReview: true, role: "employer" },
];
async function asUser(uid: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  await db.exec("set role authenticated");
}
async function rpc<T = string>(sql: string, args: unknown[] = []) {
  return (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
}
before(async () => {
  db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;",
  );
  for (const [uid, email] of [
    [owner, "owner@example.com"],
    [other, "other@example.com"],
    [employee, "employee@example.com"],
  ])
    await db.query("insert into auth.users values($1,$2,now())", [uid, email]);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261014055821_easyverify.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await asUser(owner);
  workspace = await rpc("select public.create_workspace($1) v", [
    "Test workspace",
  ]);
  business = await rpc("select public.save_business(null,$1,$2,0,$3,$4) v", [
    workspace,
    profile,
    [],
    "test",
  ]);
  hire = await rpc("select public.add_hire($1,$2,$3,$4) v", [
    business,
    {
      name: "Employee",
      email: "employee@example.com",
      hire_date: "2026-10-19",
      termination_date: null,
      short_job: false,
      offer_accepted: true,
    },
    req,
    "test",
  ]);
});
after(async () => {
  await db.close();
});
test("migration enables RLS on all public tables", async () => {
  await db.exec("reset role");
  const result = await db.query<{ relrowsecurity: boolean }>(
    "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
  );
  assert.ok(result.rows.length >= 9);
  assert.ok(result.rows.every((r) => r.relrowsecurity));
});
test("unrelated user cannot read or mutate the workspace", async () => {
  await asUser(other);
  assert.equal(
    (await db.query("select * from public.businesses")).rows.length,
    0,
  );
  await assert.rejects(
    rpc("select public.create_invitation($1,$2) v", [hire, "a".repeat(64)]),
    /access denied/,
  );
});
test("owner has read access but direct table writes are prohibited", async () => {
  await asUser(owner);
  assert.equal(
    (await db.query("select * from public.businesses")).rows.length,
    1,
  );
  await assert.rejects(
    db.query("update public.hires set user_id=$1 where id=$2", [other, hire]),
    /permission denied/,
  );
});
test("invitation recipient must match verified email", async () => {
  await asUser(owner);
  invite = await rpc("select public.create_invitation($1,$2) v", [
    hire,
    "a".repeat(64),
  ]);
  await asUser(other);
  await assert.rejects(
    rpc("select public.redeem_invitation($1) v", ["a".repeat(64)]),
    /not available/,
  );
});
test("recipient can redeem exactly once and see only assigned hire", async () => {
  await asUser(employee);
  assert.equal(
    await rpc("select public.redeem_invitation($1) v", ["a".repeat(64)]),
    hire,
  );
  await assert.rejects(
    rpc("select public.redeem_invitation($1) v", ["a".repeat(64)]),
    /already used/,
  );
  assert.equal((await db.query("select * from public.hires")).rows.length, 1);
  assert.equal(
    (await db.query("select * from public.invitations")).rows.length,
    0,
  );
});
test("new hire can confirm own step but not employer or review steps", async () => {
  await asUser(employee);
  await rpc("select public.confirm_task($1,$2,true,1) v", [
    hire,
    "employee-step",
  ]);
  await assert.rejects(
    rpc("select public.confirm_task($1,$2,true,1) v", [hire, "employer-step"]),
    /Only the employer/,
  );
  await assert.rejects(
    rpc("select public.confirm_task($1,$2,true,1) v", [hire, "review-step"]),
    /cannot be confirmed/,
  );
});
test("profile update invalidates prior confirmations by version and rejects stale writes", async () => {
  await asUser(owner);
  await rpc("select public.save_business($1,$2,$3,1,$4,$5) v", [
    business,
    workspace,
    { ...profile, headcount: 19 },
    [{ hire_id: hire, requirements: req }],
    "test",
  ]);
  await assert.rejects(
    rpc("select public.confirm_task($1,$2,true,1) v", [hire, "employee-step"]),
    /Profile changed/,
  );
  const rows = await db.query<{ profile_version: number }>(
    "select profile_version from public.task_confirmations",
  );
  assert.equal(rows.rows[0].profile_version, 1);
  await assert.rejects(
    rpc("select public.save_business($1,$2,$3,1,$4,$5) v", [
      business,
      workspace,
      profile,
      [{ hire_id: hire, requirements: req }],
      "test",
    ]),
    /Profile changed/,
  );
});
test("invalid snapshot update rolls back profile version transactionally", async () => {
  await asUser(owner);
  await assert.rejects(
    rpc("select public.save_business($1,$2,$3,2,$4,$5) v", [
      business,
      workspace,
      profile,
      [],
      "test",
    ]),
    /Snapshot count mismatch/,
  );
  const b = await db.query<{ version: number }>(
    "select version from public.businesses where id=$1",
    [business],
  );
  assert.equal(b.rows[0].version, 2);
});
test("revoked and expired links cannot be redeemed", async () => {
  await asUser(owner);
  const fresh = await rpc("select public.add_hire($1,$2,$3,$4) v", [
    business,
    {
      name: "Second",
      email: "other@example.com",
      hire_date: "2026-10-19",
      termination_date: null,
      short_job: false,
      offer_accepted: true,
    },
    req,
    "test",
  ]);
  const iid = await rpc("select public.create_invitation($1,$2) v", [
    fresh,
    "b".repeat(64),
  ]);
  await rpc("select public.revoke_invitation($1) v", [iid]);
  await asUser(other);
  await assert.rejects(
    rpc("select public.redeem_invitation($1) v", ["b".repeat(64)]),
    /revoked/,
  );
  await asUser(owner);
  await rpc("select public.create_invitation($1,$2) v", [
    fresh,
    "c".repeat(64),
  ]);
  await db.exec("reset role");
  await db.query(
    "update public.invitations set expires_at=now()-interval '1 minute' where token_hash=$1",
    ["c".repeat(64)],
  );
  await asUser(other);
  await assert.rejects(
    rpc("select public.redeem_invitation($1) v", ["c".repeat(64)]),
    /expired/,
  );
});
test("audit trail remains read-only to authenticated clients", async () => {
  await asUser(owner);
  assert.ok(
    (await db.query("select * from public.activity_events")).rows.length >= 5,
  );
  await assert.rejects(
    db.query("delete from public.activity_events"),
    /permission denied/,
  );
});
test("rate limiting persists across failed mutation attempts", async () => {
  await asUser(other);
  for (let i = 0; i < 60; i++) await rpc("select public.consume_request() v");
  await assert.rejects(
    rpc("select public.consume_request() v"),
    /Too many requests/,
  );
});
