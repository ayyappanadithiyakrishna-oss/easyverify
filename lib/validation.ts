import { z } from "zod";
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .refine(
    (v) =>
      v >= "2000-01-01" &&
      v <= "2099-12-31" &&
      Number.isFinite(new Date(v + "T00:00:00Z").getTime()) &&
      new Date(v + "T00:00:00Z").toISOString().slice(0, 10) === v,
    "Use a real date between 2000 and 2099",
  );
export const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;
export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    state: z.enum(states),
    headcount: z.number().int().min(1).max(1000000),
    contractor: z.enum(["none", "prime", "subcontractor", "unknown"]),
    far: z.enum(["yes", "no", "unknown"]),
    participation: z.enum(["yes", "no", "unknown"]),
    calendar: z.enum(["weekdays", "sixDays", "everyDay"]),
    closures: z.array(date).max(50),
  })
  .refine(
    (p) => p.contractor !== "none" || p.far !== "yes",
    "A confirmed contract clause requires a contractor profile",
  );
export const hireSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    hire_date: date,
    termination_date: date.nullable().default(null),
    short_job: z.boolean(),
    offer_accepted: z.literal(true, {
      error: "Confirm that the job offer was accepted",
    }),
  })
  .refine(
    (h) => !h.termination_date || h.termination_date >= h.hire_date,
    "Termination cannot precede hire",
  );
export const id = z.uuid();
export const token = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Invalid invitation link");
