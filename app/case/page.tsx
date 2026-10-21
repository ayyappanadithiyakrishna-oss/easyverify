import type { Metadata } from "next";
import { Header } from "@/components/brand";
import { CaseWalkthrough } from "@/components/case-walkthrough";

export const metadata: Metadata = {
  title: "E-Verify case walkthrough",
  description:
    "How an E-Verify case works, from Form I-9 to a final result, with your due date.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="document-main">
        <span className="eyebrow">E-Verify case walkthrough</span>
        <h1>
          From Form I-9
          <br />
          to a closed case.
        </h1>
        <p className="lead">
          See what the official E-Verify system asks for, what each result
          means, and what to do next. Nothing here is submitted anywhere.
        </p>
        <CaseWalkthrough />
      </main>
    </>
  );
}
