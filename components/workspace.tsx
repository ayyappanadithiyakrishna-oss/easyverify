"use client";
import { StateCoveragePanel } from "@/components/state-coverage";
import { stateCoverage } from "@/lib/state-laws";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  History,
  Settings,
  BookOpen,
  ArrowRight,
  Plus,
  ArrowLeft,
  Copy,
  Printer,
  Download,
  LogOut,
  Check,
  Search,
  GitCompareArrows,
  ScanFace,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Brand } from "./brand";
import { browserClient } from "@/lib/supabase";
import { makeDemo, demoKey } from "@/lib/demo";
import { evaluate, status, RULESET_VERSION } from "@/lib/engine";
import { rules } from "@/lib/rules";
import { profileSchema, hireSchema, states } from "@/lib/validation";
import type {
  WorkspaceData,
  Profile,
  Business,
  Hire,
  Requirement,
} from "@/lib/types";
const emptyProfile: Profile = {
  name: "",
  state: "CA",
  headcount: 1,
  contractor: "none",
  far: "no",
  participation: "unknown",
  calendar: "weekdays",
  closures: [],
};
const calendarNames = {
  weekdays: "Monday–Friday",
  sixDays: "Monday–Saturday",
  everyDay: "Every day",
};
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateLabel(value: string | null) {
  return value
    ? new Date(value + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No fixed target";
}
export function Workspace({
  demo = false,
  onboarding = false,
}: {
  demo?: boolean;
  onboarding?: boolean;
}) {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("dashboard");
  const [businessId, setBusinessId] = useState("");
  const [hireId, setHireId] = useState("");
  const [detail, setDetail] = useState<Requirement | null>(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [edit, setEdit] = useState<Business | null>(null);
  async function load() {
    if (demo) {
      let value = makeDemo();
      try {
        const saved = localStorage.getItem(demoKey);
        if (saved) {
          const candidate = JSON.parse(saved);
          if (
            candidate.workspace?.id === "demo" &&
            candidate.businesses?.every(
              (b: Business) => profileSchema.safeParse(b.profile).success,
            ) &&
            Array.isArray(candidate.hires) &&
            Array.isArray(candidate.confirmations) &&
            Array.isArray(candidate.events) &&
            Array.isArray(candidate.invites) &&
            Array.isArray(candidate.snapshots)
          )
            value = candidate;
        }
      } catch {
        localStorage.removeItem(demoKey);
      }
      setData(value);
      return;
    }
    const response = await fetch("/api/workspace", { cache: "no-store" });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error);
    setData(value);
  }
  useEffect(() => {
    load().catch((e) =>
      setError(e.message),
    ); /* Isolated demo state must not load into live workspace. */
  }, [demo]);
  const business =
    data?.businesses.find((b) => b.id === businessId) || data?.businesses[0];
  const hires = data?.hires.filter((h) => h.business_id === business?.id) || [];
  const hire = hires.find((h) => h.id === hireId) || hires[0];
  const requirements =
    business && hire
      ? evaluate(business.profile, hire, rules, today()).filter(
          (r) => r.result !== "unmatched",
        )
      : [];
  const snapshot = data?.snapshots.find(
    (s) => s.hire_id === hire?.id && s.profile_version === business?.version,
  );
  const outdated =
    !demo && hire && snapshot?.ruleset_version !== RULESET_VERSION;
  const done = (r: Requirement) =>
    !outdated &&
    !!data?.confirmations.find(
      (c) =>
        c.hire_id === hire?.id &&
        c.requirement_id === r.id &&
        c.profile_version === business?.version,
    )?.completed;
  const actionable = requirements.filter((r) => !r.needsReview);
  const complete = actionable.filter(done).length;
  const reviews = requirements.filter((r) => r.needsReview).length;
  function navigate(next: string) {
    setView(next);
    setError("");
    setInviteUrl("");
    setTimeout(
      () => document.querySelector<HTMLElement>("#main h1")?.focus(),
      0,
    );
  }
  function saveDemo(next: WorkspaceData) {
    setData(next);
    try {
      localStorage.setItem(demoKey, JSON.stringify(next));
    } catch {
      setNotice(
        "Demo changes are held in this tab. Browser storage is unavailable.",
      );
    }
  }
  async function mutate(
    payload: Record<string, unknown>,
  ): Promise<{ id?: string; inviteToken?: string }> {
    setBusy(true);
    setError("");
    try {
      if (demo) {
        const next = structuredClone(data!);
        const uid = crypto.randomUUID();
        let result: { id?: string; inviteToken?: string } = { id: uid };
        const action = payload.action;
        if (action === "business") {
          const p = profileSchema.parse(payload.profile);
          const found = next.businesses.find((b) => b.id === payload.id);
          if (found) {
            found.profile = p;
            found.version++;
            for (const h of next.hires.filter(
              (h) => h.business_id === found.id,
            ))
              next.snapshots.push({
                hire_id: h.id,
                profile_version: found.version,
                ruleset_version: RULESET_VERSION,
                requirements: evaluate(p, h, rules),
              });
          } else
            next.businesses.push({
              id: uid,
              workspace_id: "demo",
              profile: p,
              version: 1,
            });
        }
        if (action === "hire") {
          const h = hireSchema.parse(payload.hire);
          const b = next.businesses.find((b) => b.id === payload.business_id)!;
          next.hires.push({
            ...h,
            id: uid,
            workspace_id: "demo",
            business_id: b.id,
            user_id: null,
          });
          next.snapshots.push({
            hire_id: uid,
            profile_version: b.version,
            ruleset_version: RULESET_VERSION,
            requirements: evaluate(b.profile, h, rules),
          });
        }
        if (action === "confirm") {
          const current = next.confirmations.find(
            (c) =>
              c.hire_id === payload.hire_id &&
              c.requirement_id === payload.requirement_id &&
              c.profile_version === payload.version,
          );
          if (current) {
            current.completed = !!payload.completed;
            current.updated_at = new Date().toISOString();
          } else
            next.confirmations.push({
              hire_id: String(payload.hire_id),
              requirement_id: String(payload.requirement_id),
              profile_version: Number(payload.version),
              completed: !!payload.completed,
              actor_id: "demo",
              updated_at: new Date().toISOString(),
            });
        }
        if (action === "invite") {
          next.invites = next.invites.map((i) =>
            i.hire_id === payload.hire_id
              ? { ...i, revoked_at: new Date().toISOString() }
              : i,
          );
          next.invites.push({
            id: uid,
            hire_id: String(payload.hire_id),
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
            revoked_at: null,
            redeemed_at: null,
          });
          result = { id: uid };
          setNotice(
            "Sample invitation recorded. Live invitations are available in a signed-in workspace.",
          );
        }
        if (action === "revoke")
          next.invites = next.invites.map((i) =>
            i.id === payload.id
              ? { ...i, revoked_at: new Date().toISOString() }
              : i,
          );
        next.events.unshift({
          id: uid,
          workspace_id: "demo",
          business_id: business?.id || null,
          hire_id: hire?.id || null,
          description:
            action === "confirm"
              ? payload.completed
                ? "Completion reported"
                : "Completion reopened"
              : action === "business"
                ? "Business profile saved"
                : action === "hire"
                  ? "Sample hire added"
                  : action === "revoke"
                    ? "Invitation revoked"
                    : "Sample invitation created",
          created_at: new Date().toISOString(),
        });
        saveDemo(next);
        return result;
      }
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function toggle(r: Requirement) {
    if (!hire || !business) return;
    try {
      await mutate({
        action: "confirm",
        hire_id: hire.id,
        requirement_id: r.id,
        completed: !done(r),
        version: business.version,
      });
      setNotice(done(r) ? "Step reopened." : "Completion recorded.");
    } catch {
      /* Error rendered above. */
    }
  }
  async function invite(h: Hire) {
    try {
      const result = await mutate({ action: "invite", hire_id: h.id });
      if (result.inviteToken)
        setInviteUrl(
          `${location.origin}/onboarding?token=${result.inviteToken}`,
        );
    } catch {}
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setNotice(
        "Invitation link copied. Share it with the intended recipient.",
      );
    } catch {
      setNotice("Select and copy the invitation link below.");
    }
  }
  function exportReport() {
    if (!business) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            business: business.profile,
            hire: hire ? { name: hire.name, hire_date: hire.hire_date } : null,
            requirements,
            completed: requirements.filter(done).map((r) => r.id),
            ruleset: RULESET_VERSION,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "easyverify-report.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (!data)
    return (
      <main id="main" className="loading">
        <Brand />
        <h1>
          {error ? "Unable to open workspace" : "Opening your workspace…"}
        </h1>
        {error && (
          <>
            <p role="alert">{error}</p>
            <Link className="button" href="/login">
              Log in
            </Link>
            <Link href="/demo">Explore the demo</Link>
          </>
        )}
      </main>
    );
  const navItems = [
    ["dashboard", "Overview", LayoutDashboard],
    ["requirements", "Requirements", ListChecks],
    ["hires", "New hires", Users],
    ["comparison", "Compare profiles", GitCompareArrows],
    ["activity", "Activity", History],
    ["profile", "Business profile", Settings],
  ] as const;
  function requirementCard(r: Requirement) {
    const state = status(r, done(r), today());
    return (
      <article
        className={`requirement-row ${done(r) ? "completed" : ""}`}
        key={r.id}
      >
        <button
          aria-label={`${done(r) ? "Reopen" : "Complete"} ${r.title}`}
          className="check-box"
          disabled={
            busy ||
            r.needsReview ||
            !!outdated ||
            (data?.role === "hire" && r.role !== "hire")
          }
          onClick={() => toggle(r)}
        >
          {done(r) && <Check size={17} />}
        </button>
        <button
          className="row-content"
          onClick={() => {
            setDetail(r);
            navigate("detail");
          }}
        >
          <strong>{r.title}</strong>
          <span>
            {r.jurisdictions.join(" + ")} ·{" "}
            {r.role === "hire" ? "New hire" : "Employer"}
          </span>
        </button>
        <div className="row-end">
          <span className={`badge ${state === "Complete" ? "dark" : ""}`}>
            {state}
          </span>
          <small>{dateLabel(r.due)}</small>
        </div>
        <button
          className="icon-button"
          aria-label={`Open ${r.title}`}
          onClick={() => {
            setDetail(r);
            navigate("detail");
          }}
        >
          <ArrowRight size={17} />
        </button>
      </article>
    );
  }
  const titles: Record<string, string> = {
    dashboard: "Your hiring overview",
    requirements: "My requirements",
    hires: "New hires",
    comparison: "Compare business profiles",
    activity: "Activity history",
    profile: edit ? "Edit business profile" : "Business profile",
    newhire: "Add a new hire",
    detail: detail?.title || "Requirement",
  };
  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">
          <span className="avatar">
            {demo ? "D" : data.userEmail.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{data.workspace?.name || "Your account"}</strong>
            <small>
              {demo
                ? "Isolated sample data"
                : data.role === "hire"
                  ? "New-hire access"
                  : "Employer workspace"}
            </small>
          </div>
        </div>
        <nav aria-label="Workspace">
          {navItems
            .filter(
              ([key]) =>
                data.role === "employer" ||
                ["dashboard", "requirements", "activity"].includes(key),
            )
            .map(([key, label, Icon]) => (
              <button
                key={key}
                className={view === key ? "active" : ""}
                onClick={() => {
                  if (key === "profile") setEdit(business || null);
                  navigate(key);
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          <Link href="/identity-check">
            <ScanFace size={18} />
            Optional face lab
          </Link>
          <Link href="/sources">
            <BookOpen size={18} />
            Sources & coverage
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <small>{data.userEmail}</small>
          {demo ? (
            <Link href="/register" className="button full">
              Create your workspace
            </Link>
          ) : (
            <button
              className="text-button"
              onClick={async () => {
                await browserClient().auth.signOut();
                location.assign("/login");
              }}
            >
              <LogOut size={16} />
              Log out
            </button>
          )}
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-top">
          <span>
            {demo
              ? "Sample workspace"
              : onboarding
                ? "New-hire onboarding"
                : "Business workspace"}
          </span>
          <div>
            <ThemeToggle />
            {demo && (
              <button
                className="text-button"
                onClick={() => {
                  localStorage.removeItem(demoKey);
                  setData(makeDemo());
                  setBusinessId("");
                  setHireId("");
                  setNotice("Sample workspace reset.");
                }}
              >
                Reset demo
              </button>
            )}
            <button
              className="icon-button"
              onClick={() => window.print()}
              aria-label="Print report"
            >
              <Printer size={18} />
            </button>
          </div>
        </header>
        <main id="main" className="workspace-main">
          <div className="page-heading">
            <div>
              <h1 tabIndex={-1}>{titles[view]}</h1>
              <p>
                {business
                  ? `${business.profile.state} · ${business.profile.headcount} employees · ${business.profile.contractor === "none" ? "No federal contract" : business.profile.contractor + " contractor"}`
                  : "Start with a business profile to see your next steps."}
              </p>
            </div>
            {data.role === "employer" && view !== "profile" && (
              <button
                className="button secondary"
                onClick={() => {
                  setEdit(null);
                  navigate("profile");
                }}
              >
                <Plus size={16} />
                Add business
              </button>
            )}
          </div>
          {error && (
            <div className="callout error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="callout" role="status">
              <span>{notice}</span>
              <button
                className="text-button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                Dismiss
              </button>
            </div>
          )}
          {!data.workspace && !demo && !onboarding && (
            <div className="panel">
              <h2>Create your employer workspace</h2>
              <p>
                Give your workspace a name. Invited new hires should use their
                invitation link instead.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const name = String(
                    new FormData(e.currentTarget).get("name"),
                  );
                  try {
                    await mutate({ action: "workspace", name });
                  } catch {}
                }}
              >
                <label>
                  Workspace name
                  <input name="name" required maxLength={80} />
                </label>
                <button className="button" disabled={busy}>
                  Create workspace
                </button>
              </form>
            </div>
          )}
          {data.businesses.length > 0 &&
            !["profile", "newhire", "comparison"].includes(view) && (
              <div className="selectors">
                <label>
                  Business
                  <select
                    value={business?.id}
                    onChange={(e) => {
                      setBusinessId(e.target.value);
                      setHireId("");
                      setDetail(null);
                      if (view === "detail") setView("requirements");
                    }}
                  >
                    {data.businesses.map((b) => (
                      <option value={b.id} key={b.id}>
                        {b.profile.name}
                      </option>
                    ))}
                  </select>
                </label>
                {hires.length > 0 && (
                  <label>
                    New hire
                    <select
                      value={hire?.id}
                      onChange={(e) => {
                        setHireId(e.target.value);
                        setDetail(null);
                        if (view === "detail") setView("requirements");
                      }}
                    >
                      {hires.map((h) => (
                        <option value={h.id} key={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
          {outdated && (
            <div className="callout">
              These requirements need regeneration after a source update. Ask
              the employer to save the business profile again.
            </div>
          )}
          {business && (
            <div className="callout">
              {stateCoverage(business.profile.state)}
            </div>
          )}
          {view === "dashboard" && (
            <>
              <div className="stats">
                <div className="stat">
                  <span>Checklist completion</span>
                  <strong>
                    {complete}
                    <small> / {actionable.length}</small>
                  </strong>
                  <progress value={complete} max={actionable.length || 1} />
                  <small>Reported completion, not certification</small>
                </div>
                <div className="stat">
                  <span>Needs review</span>
                  <strong>{reviews}</strong>
                  <small>Unknown inputs or additional legal review</small>
                </div>
                <div className="stat">
                  <span>Next dated target</span>
                  <strong className="date-stat">
                    {dateLabel(
                      actionable
                        .filter((r) => !done(r) && r.due)
                        .sort((a, b) => a.due!.localeCompare(b.due!))[0]?.due ||
                        null,
                    )}
                  </strong>
                  <small>
                    {hire
                      ? `For ${hire.name}`
                      : "Add a hire to calculate dates"}
                  </small>
                </div>
              </div>
              <div className="two-columns">
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Next steps</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("requirements")}
                    >
                      All requirements <ArrowRight size={15} />
                    </button>
                  </div>
                  {requirements.length ? (
                    requirements
                      .filter((r) => !done(r))
                      .sort((a, b) =>
                        (a.due ?? "9999").localeCompare(b.due ?? "9999"),
                      )
                      .slice(0, 5)
                      .map(requirementCard)
                  ) : (
                    <div className="empty">
                      <ListChecks size={30} />
                      <h3>
                        {business
                          ? "Add your first hire"
                          : "Set up your business"}
                      </h3>
                      <p>
                        {business
                          ? "Requirements and dates appear here when a hire is added."
                          : "A few answers will determine the guidance in your workspace."}
                      </p>
                      {data.role === "employer" && (
                        <button
                          className="button"
                          onClick={() => {
                            setEdit(null);
                            navigate(business ? "newhire" : "profile");
                          }}
                        >
                          {business ? "Add new hire" : "Set up business"}
                        </button>
                      )}
                    </div>
                  )}
                  {requirements.length > 0 &&
                    complete === actionable.length && (
                      <p>
                        All actionable checklist items are reported complete.
                        Review items still need attention.
                      </p>
                    )}
                </section>
                <aside className="panel dashboard-state-panel">
                  <StateCoveragePanel state={business?.profile.state ?? "CA"} />
                  <button
                    className="text-button"
                    onClick={() => navigate("comparison")}
                  >
                    Compare business profiles <ArrowRight size={15} />
                  </button>
                </aside>
              </div>
            </>
          )}
          {view === "requirements" && (
            <section className="panel">
              <div className="toolbar">
                <div className="search">
                  <Search size={16} />
                  <input
                    aria-label="Search requirements"
                    placeholder="Search requirements"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <label className="inline-label">
                  Status
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {["All", "Open", "Complete", "Needs review"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <button className="text-button" onClick={exportReport}>
                  <Download size={16} />
                  Export report
                </button>
              </div>
              {requirements
                .filter(
                  (r) =>
                    r.title.toLowerCase().includes(query.toLowerCase()) &&
                    (filter === "All" ||
                      (filter === "Needs review" && r.needsReview) ||
                      (filter === "Complete" && done(r)) ||
                      (filter === "Open" && !done(r) && !r.needsReview)),
                )
                .map(requirementCard)}
              {!requirements.length && (
                <div className="empty">
                  <p>Add a new hire to generate the checklist.</p>
                </div>
              )}
              <p className="small">
                Targets use{" "}
                {business
                  ? calendarNames[business.profile.calendar]
                  : "your working calendar"}{" "}
                and the closure dates in your profile. Review the calendar for
                your circumstances.
              </p>
            </section>
          )}
          {view === "detail" && detail && (
            <section className="detail-layout">
              <div className="panel">
                <button
                  className="text-button"
                  onClick={() => navigate("requirements")}
                >
                  <ArrowLeft size={16} />
                  Back to requirements
                </button>
                <div className="detail-tags">
                  {detail.jurisdictions.map((j) => (
                    <span className="badge" key={j}>
                      {j}
                    </span>
                  ))}
                  <span className="badge">
                    {detail.needsReview ? "Needs review" : "Matched"}
                  </span>
                </div>
                <h2>What it means</h2>
                <p>{detail.summary}</p>
                <h2>What to do</h2>
                <ol className="action-list">
                  {detail.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
                <h2>Official sources</h2>
                {detail.sources.map((s) => (
                  <div className="source-link" key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title} ↗
                    </a>
                    <small>
                      {s.citation} ·{" "}
                      {s.reviewed
                        ? "Reviewed " + s.reviewed
                        : "Awaiting independent review"}
                    </small>
                  </div>
                ))}
              </div>
              <aside className="panel">
                <h2>Step details</h2>
                <dl>
                  <dt>Responsible</dt>
                  <dd>{detail.role === "hire" ? "New hire" : "Employer"}</dd>
                  <dt>Target date</dt>
                  <dd>{dateLabel(detail.due)}</dd>
                  <dt>Rule version</dt>
                  <dd>{RULESET_VERSION}</dd>
                </dl>
                {(!detail.needsReview && data.role === "employer") ||
                (!detail.needsReview && detail.role === "hire") ? (
                  <button
                    className="button full"
                    disabled={busy || !!outdated}
                    onClick={() => toggle(detail)}
                  >
                    {done(detail) ? "Reopen step" : "Report completion"}
                  </button>
                ) : (
                  <p>This step requires review before it can be confirmed.</p>
                )}
              </aside>
            </section>
          )}
          {view === "hires" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Hiring records</h2>
                <button
                  className="button"
                  disabled={!business}
                  onClick={() => navigate("newhire")}
                >
                  <Plus size={16} />
                  Add new hire
                </button>
              </div>
              {hires.map((h) => (
                <div key={h.id} className="hire-row">
                  <div>
                    <strong>{h.name}</strong>
                    <small>
                      {h.email} · Starts {dateLabel(h.hire_date)}
                    </small>
                  </div>
                  <span className="badge">
                    {h.user_id ? "Joined" : "Not joined"}
                  </span>
                  <button
                    className="button secondary"
                    disabled={busy || !!h.user_id}
                    onClick={() => invite(h)}
                  >
                    Create invite link
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setHireId(h.id);
                      navigate("requirements");
                    }}
                  >
                    View steps
                  </button>
                </div>
              ))}
              {!hires.length && (
                <p>
                  No hiring records yet. Add a hire after the offer is accepted.
                </p>
              )}
              {inviteUrl && (
                <div className="callout">
                  <div>
                    <strong>
                      Share this one-time link with the intended new hire.
                    </strong>
                    <p>
                      It expires in seven days. Creating a link does not send
                      email.
                    </p>
                    <input
                      aria-label="Invitation link"
                      readOnly
                      value={inviteUrl}
                    />
                  </div>
                  <button className="button" onClick={copy}>
                    <Copy size={16} />
                    Copy link
                  </button>
                </div>
              )}
              {data.invites
                .filter((i) => hires.some((h) => h.id === i.hire_id))
                .map((i) => (
                  <div className="invite-row" key={i.id}>
                    <span>
                      {hires.find((h) => h.id === i.hire_id)?.name} ·{" "}
                      {i.revoked_at
                        ? "Revoked"
                        : i.redeemed_at
                          ? "Used"
                          : new Date(i.expires_at) < new Date()
                            ? "Expired"
                            : "Active"}{" "}
                      · Expires {new Date(i.expires_at).toLocaleDateString()}
                    </span>
                    {!i.revoked_at && !i.redeemed_at && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          mutate({ action: "revoke", id: i.id }).catch(() => {})
                        }
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
            </section>
          )}
          {view === "profile" && data.role === "employer" && (
            <ProfileForm
              key={edit?.id || "new"}
              business={edit}
              busy={busy}
              onSave={async (p) => {
                const r = await mutate({
                  action: "business",
                  workspace_id: data.workspace?.id,
                  id: edit?.id || null,
                  profile: p,
                  version: edit?.version || 0,
                });
                if (r.id) setBusinessId(r.id);
                navigate("dashboard");
                setNotice(
                  "Business profile saved. Requirements have been updated.",
                );
              }}
            />
          )}
          {view === "newhire" && business && (
            <HireForm
              busy={busy}
              onSave={async (h) => {
                const r = await mutate({
                  action: "hire",
                  business_id: business.id,
                  hire: h,
                });
                if (r.id) setHireId(r.id);
                navigate("hires");
                setNotice(
                  "New hire added. You can create their invitation link.",
                );
              }}
            />
          )}
          {view === "comparison" && (
            <div className="comparison">
              {data.businesses.slice(0, 2).map((b) => {
                const h = data.hires.find((h) => h.business_id === b.id) || {
                  hire_date: today(),
                  termination_date: null,
                  short_job: false,
                };
                const rr = evaluate(b.profile, h, rules, today()).filter(
                  (r) => r.result !== "unmatched",
                );
                return (
                  <section className="panel" key={b.id}>
                    <span className="eyebrow">
                      {b.profile.contractor === "none"
                        ? "Ordinary employer"
                        : "Contractor profile"}
                    </span>
                    <h2>{b.profile.name}</h2>
                    <p>
                      {b.profile.state} · {b.profile.headcount} employees · FAR
                      clause: {b.profile.far}
                    </p>
                    {rr.map((r) => (
                      <details key={r.id}>
                        <summary>
                          {r.title}
                          <span className="badge">
                            {r.needsReview ? "Review" : "Matched"}
                          </span>
                        </summary>
                        <p>{r.summary}</p>
                        <ul className="trace">
                          {r.trace.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </section>
                );
              })}
              {data.businesses.length < 2 && (
                <div className="panel">
                  <h2>Add a second profile</h2>
                  <p>
                    Compare a different contract or participation answer to see
                    which requirements change.
                  </p>
                </div>
              )}
            </div>
          )}
          {view === "activity" && (
            <section className="panel">
              <h2>Recorded changes</h2>
              {data.events.length ? (
                data.events.map((e) => (
                  <div className="event" key={e.id}>
                    <span className="event-dot" />
                    <div>
                      <strong>{e.description}</strong>
                      <small>{new Date(e.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p>
                  No activity has been recorded yet. Saved changes will appear
                  here.
                </p>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
function ProfileForm({
  business,
  busy,
  onSave,
}: {
  business: Business | null;
  busy: boolean;
  onSave: (p: Profile) => Promise<void>;
}) {
  const p = business?.profile || emptyProfile;
  const [error, setError] = useState("");
  return (
    <section className="panel form-panel">
      <h2>
        {business
          ? "Update the inputs behind your checklist"
          : "Tell us about your business"}
      </h2>
      <p>
        Unknown answers remain review items. Changing a saved profile requires
        confirming the updated checklist again.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget);
          const parsed = profileSchema.safeParse({
            name: f.get("name"),
            state: f.get("state"),
            headcount: Number(f.get("headcount")),
            contractor: f.get("contractor"),
            far: f.get("far"),
            participation: f.get("participation"),
            calendar: f.get("calendar"),
            closures: String(f.get("closures") || "")
              .split(/[\s,]+/)
              .filter(Boolean),
          });
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
          }
          try {
            await onSave(parsed.data);
          } catch {}
        }}
      >
        <div className="form-grid">
          <label>
            Business name
            <input name="name" defaultValue={p.name} maxLength={80} required />
          </label>
          <label>
            State where employees work
            <select name="state" defaultValue={p.state}>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Exact employee count
            <input
              name="headcount"
              type="number"
              min="1"
              max="1000000"
              step="1"
              defaultValue={p.headcount}
              required
            />
          </label>
          <label>
            Federal contract or subcontract
            <select name="contractor" defaultValue={p.contractor}>
              <option value="none">None</option>
              <option value="prime">Prime contractor</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="unknown">Not sure</option>
            </select>
          </label>
          <label>
            FAR E-Verify clause in contract
            <select name="far" defaultValue={p.far}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unknown">Not sure</option>
            </select>
          </label>
          <label>
            Currently enrolled in E-Verify
            <select name="participation" defaultValue={p.participation}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unknown">Not sure</option>
            </select>
          </label>
          <label>
            Working calendar
            <select name="calendar" defaultValue={p.calendar}>
              {Object.entries(calendarNames).map(([v, t]) => (
                <option value={v} key={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Closure dates
            <small>
              YYYY-MM-DD, separated by commas. Review calendar assumptions.
            </small>
            <input
              name="closures"
              defaultValue={p.closures.join(", ")}
              placeholder="2026-11-26, 2026-12-25"
            />
          </label>
        </div>
        {error && (
          <p className="callout error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Saving…"
            : business
              ? "Save & regenerate requirements"
              : "Create business profile"}
          <ArrowRight size={16} />
        </button>
      </form>
    </section>
  );
}
function HireForm({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (h: ReturnType<typeof hireSchema.parse>) => Promise<void>;
}) {
  const [error, setError] = useState("");
  return (
    <section className="panel form-panel">
      <h2>Add a hire after the offer is accepted</h2>
      <p>
        Store only the contact details and dates needed for onboarding. Official
        forms and identity documents stay outside EasyVerify.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const parsed = hireSchema.safeParse({
            name: f.get("name"),
            email: f.get("email"),
            hire_date: f.get("hire_date"),
            termination_date: f.get("termination_date") || null,
            short_job: f.get("short_job") === "on",
            offer_accepted: f.get("offer_accepted") === "on",
          });
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
          }
          try {
            await onSave(parsed.data);
          } catch {}
        }}
      >
        <div className="form-grid">
          <label>
            Name
            <input name="name" maxLength={80} required />
          </label>
          <label>
            Email for invitation
            <input name="email" type="email" required maxLength={254} />
          </label>
          <label>
            First day of paid work
            <input
              name="hire_date"
              type="date"
              min="2000-01-01"
              max="2099-12-31"
              required
            />
          </label>
          <label>
            Termination date, if applicable
            <input
              name="termination_date"
              type="date"
              min="2000-01-01"
              max="2099-12-31"
            />
          </label>
        </div>
        <label className="checkbox-label">
          <input name="short_job" type="checkbox" />
          The job lasts fewer than three days.
        </label>
        <label className="checkbox-label">
          <input name="offer_accepted" type="checkbox" required />
          The job offer has been accepted.
        </label>
        {error && (
          <p role="alert" className="callout error">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Add new hire"}
          <ArrowRight size={16} />
        </button>
      </form>
    </section>
  );
}
