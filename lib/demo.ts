import type { WorkspaceData, Profile, Hire } from "./types";
import { evaluate, RULESET_VERSION } from "./engine";
import { rules } from "./rules";
export const demoKey = "easyverify-isolated-demo-v1";
export function makeDemo(): WorkspaceData {
  const profiles: Profile[] = [
    {
      name: "Riverside Workshop",
      state: "CA",
      headcount: 18,
      contractor: "none",
      far: "no",
      participation: "yes",
      calendar: "weekdays",
      closures: [],
    },
    {
      name: "Inland Contract Services",
      state: "CA",
      headcount: 32,
      contractor: "subcontractor",
      far: "yes",
      participation: "yes",
      calendar: "weekdays",
      closures: [],
    },
  ];
  const businesses = profiles.map((profile, i) => ({
    id: `00000000-0000-4000-8000-00000000000${i + 1}`,
    workspace_id: "demo",
    profile,
    version: 1,
  }));
  const hires: Hire[] = businesses.map((b, i) => ({
    id: `00000000-0000-4000-8000-00000000001${i + 1}`,
    business_id: b.id,
    workspace_id: "demo",
    name: i ? "Taylor Sample" : "Jordan Sample",
    email: `sample${i + 1}@example.com`,
    hire_date: "2026-10-19",
    termination_date: null,
    short_job: false,
    offer_accepted: true,
    user_id: null,
  }));
  return {
    workspace: { id: "demo", name: "Sample workspace" },
    businesses,
    hires,
    confirmations: [],
    events: [],
    invites: [],
    role: "employer",
    userEmail: "Demo workspace",
    snapshots: hires.map((h) => ({
      hire_id: h.id,
      profile_version: 1,
      ruleset_version: RULESET_VERSION,
      requirements: evaluate(
        businesses.find((b) => b.id === h.business_id)!.profile,
        h,
        rules,
      ),
    })),
  };
}
