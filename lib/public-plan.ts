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
