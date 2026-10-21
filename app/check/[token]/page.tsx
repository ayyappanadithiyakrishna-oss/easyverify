import type { Metadata } from "next";
import { Header } from "@/components/brand";
import { CheckClient } from "@/components/check-client";

export const metadata: Metadata = {
  title: "Your optional photo comparison",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <>
      <Header />
      <main id="main" className="document-main check-page">
        <CheckClient token={token} />
      </main>
    </>
  );
}
