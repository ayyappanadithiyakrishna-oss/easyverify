import type { Condition, Profile, Hire, Rule, Requirement } from "./types";
import { addBusinessDays, section2Target } from "../support/dates.mjs";
export const RULESET_VERSION = "2026-10-20.1";
export function match(
  condition: Condition,
  p: Profile,
): { result: boolean | null; trace: string[] } {
  if ("all" in condition || "any" in condition) {
    const all = "all" in condition;
    const children = (
      all ? condition.all : "any" in condition ? condition.any : []
    ).map((c) => match(c, p));
    const result = all
      ? children.some((c) => c.result === false)
        ? false
        : children.some((c) => c.result === null)
          ? null
          : true
      : children.some((c) => c.result === true)
        ? true
        : children.some((c) => c.result === null)
          ? null
          : false;
    return {
      result,
      trace: children.length
        ? children.flatMap((c) => c.trace)
        : [
            all
              ? "Federal baseline: an ordinary new paid hire in the United States."
              : "No applicability conditions matched.",
          ],
    };
  }
  const actual = p[condition.field];
  const unresolved = actual === "unknown" && condition.equals !== "unknown";
  return {
    result: unresolved ? null : actual === condition.equals,
    trace: [
      `${condition.field}: ${Array.isArray(actual) ? actual.join(", ") : actual} → expected ${condition.equals}${unresolved ? " (unresolved)" : ""}`,
    ],
  };
}
function anniversary(value: string, years: number) {
  const d = new Date(value + "T00:00:00Z");
  const m = d.getUTCMonth();
  d.setUTCFullYear(d.getUTCFullYear() + years);
  if (d.getUTCMonth() !== m) d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}
export function retentionTarget(hire: string, termination: string | null) {
  if (!termination) return null;
  return [anniversary(hire, 3), anniversary(termination, 1)].sort().at(-1)!;
}
export function evaluate(
  p: Profile,
  h: Pick<Hire, "hire_date" | "termination_date" | "short_job">,
  rules: Rule[],
  today = new Date().toISOString().slice(0, 10),
): Requirement[] {
  const calendar = {
    workingDays:
      p.calendar === "everyDay"
        ? [0, 1, 2, 3, 4, 5, 6]
        : p.calendar === "sixDays"
          ? [1, 2, 3, 4, 5, 6]
          : [1, 2, 3, 4, 5],
    closures: p.closures,
  };
  const results = rules.map((rule) => {
    const m = match(rule.condition, p);
    const stale = rule.sources.some(
      (s) =>
        !s.reviewed ||
        today >
          addBusinessDays(s.reviewed, 90, {
            workingDays: [0, 1, 2, 3, 4, 5, 6],
          }),
    );
    const needsReview = m.result === null || !!rule.reviewOnly || stale;
    let due: string | null = null;
    if (m.result === true && !needsReview) {
      if (rule.deadline === "hire") due = h.hire_date;
      if (rule.deadline === "section2")
        due = section2Target(h.hire_date, {
          jobLastsLessThanThreeDays: h.short_job,
          ...calendar,
        });
      if (rule.deadline === "case")
        due = addBusinessDays(h.hire_date, 3, calendar);
      if (rule.deadline === "retention")
        due = retentionTarget(h.hire_date, h.termination_date);
    }
    return {
      id: rule.id,
      ruleIds: [rule.id],
      title: rule.title,
      summary: rule.summary,
      actions: [...rule.actions],
      jurisdictions: [rule.jurisdiction],
      role: rule.role,
      sources: rule.sources.map((source) => ({ ...source })),
      trace: m.trace,
      result:
        m.result === null ? "unresolved" : m.result ? "matched" : "unmatched",
      needsReview,
      due,
    } satisfies Requirement;
  });
  // Compose only explicitly related, matched records; never impose blanket jurisdiction precedence.
  for (const rule of rules.filter((r) => r.restriction && r.group)) {
    const restriction = results.find((r) => r.id === rule.id)!;
    const base = rules.find((r) => !r.restriction && r.group === rule.group);
    const target = base && results.find((r) => r.id === base.id);
    if (restriction.result === "matched" && target?.result === "matched") {
      target.ruleIds.push(rule.id);
      target.sources.push(...restriction.sources);
      target.actions.push(...restriction.actions);
      target.trace.push(...restriction.trace);
      target.jurisdictions.push(...restriction.jurisdictions);
      target.needsReview ||= restriction.needsReview;
      if (target.needsReview) target.due = null;
      restriction.result = "unmatched";
    }
  }
  return results;
}
export function status(r: Requirement, done: boolean, today: string) {
  return r.needsReview
    ? "Needs review"
    : done
      ? "Complete"
      : r.due && r.due < today
        ? "Past target"
        : r.due === today
          ? "Due today"
          : r.due
            ? "Upcoming"
            : "Open";
}
