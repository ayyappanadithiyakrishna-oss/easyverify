import Link from "next/link";
import { Header } from "@/components/brand";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="document-main">
        <h1>That page isn’t here.</h1>
        <p>Return to your workspace or explore the sample application.</p>
        <div className="actions">
          <Link className="button" href="/workspace">
            Open workspace
          </Link>
          <Link href="/demo">Explore demo</Link>
        </div>
      </main>
    </>
  );
}
