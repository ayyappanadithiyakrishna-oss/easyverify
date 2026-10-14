import { evaluate } from "./engine";
import { rules } from "./rules";
import { z } from "zod";
import { profileSchema, hireSchema } from "./validation";
import type { Profile, Hire } from "./types";
export const publicPlanSchema = z
  .object({
    profile: profileSchema,
    hireDate: z.string(),
    shortJob: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const hire = planHire(value);
    const result = hireSchema.safeParse(hire);
    if (!result.success)
      ctx.addIssue({
        code: "custom",
        message: result.error.issues[0].message,
        path: ["hireDate"],
      });
  });
export type PublicPlan = {
  profile: Profile;
  hireDate: string;
  shortJob: boolean;
};
export function planHire(plan: PublicPlan): Hire {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    business_id: "00000000-0000-4000-8000-000000000102",
    workspace_id: "public-plan",
    name: "New hire",
    email: "planning@example.com",
    hire_date: plan.hireDate,
    termination_date: null,
    short_job: plan.shortJob,
    offer_accepted: true,
    user_id: null,
  };
}
export function sharePlan(plan: PublicPlan) {
  const valid = publicPlanSchema.parse(plan);
  return JSON.stringify({
    ...valid,
    profile: { ...valid.profile, name: "Your business" },
  });
}
export function readSharedPlan(value: string | null) {
  if (!value || value.length > 4096) return null;
  try {
    return publicPlanSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
}

export function planReference(question: string, plan: PublicPlan) {
  const results = evaluate(plan.profile, planHire(plan), rules).filter(
    (requirement) => requirement.result !== "unmatched",
  );
  const selected = results
    .filter((requirement) =>
      /section\s*1/i.test(question)
        ? requirement.id === "i9-section1"
        : /section\s*2|documents/i.test(question)
          ? requirement.id === "i9-section2"
          : /retention|keep/i.test(question)
            ? requirement.id === "i9-retention"
            : /contract|far/i.test(question)
              ? requirement.ruleIds.includes("contractor")
              : /e.verify/i.test(question)
                ? requirement.ruleIds.some((id) =>
                    ["everify-case", "participation", "contractor"].includes(
                      id,
                    ),
                  )
                : true,
    )
    .slice(0, 3);
  return {
    answer:
      `Your plan: ${plan.profile.state}, ${plan.profile.headcount} employees, first paid day ${plan.hireDate}, calendar ${plan.profile.calendar}.\n\n` +
      selected
        .map(
          (requirement) =>
            `${requirement.title}: ${requirement.summary} ${requirement.needsReview ? "Needs review; no confirmed deadline." : requirement.due ? `Planning target: ${requirement.due}.` : "No fixed target."}`,
        )
        .join("\n\n"),
    sources: [
      ...new Map(
        selected
          .flatMap((requirement) => requirement.sources)
          .map((source) => [
            source.url,
            { title: source.title, url: source.url, reviewed: source.reviewed },
          ]),
      ).values(),
    ],
  };
}
