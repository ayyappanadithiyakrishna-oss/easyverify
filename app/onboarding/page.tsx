import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding";
export default function Page() {
  return (
    <Suspense fallback={<main id="main">Loading invitation…</main>}>
      <Onboarding />
    </Suspense>
  );
}
