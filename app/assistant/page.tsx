import { Header } from "@/components/brand";
import { HelpPanel } from "@/components/help-panel";
export default function Assistant() {
  return (
    <>
      <Header />
      <main id="main" className="assistant-page">
        <div className="assistant-intro">
          <span className="badge">On-device AI chat</span>
          <h1>
            A conversation.
            <br />A clearer next step.
          </h1>
          <p>
            Ask a question, draft a message, explore an idea, or work through a
            hiring step. The AI runs on your device, inside your browser. No
            account required.
          </p>
          <p className="small">
            Quick start uses a compact local model; a more capable option is
            available for longer conversations. Model files are cached when
            possible. The source guide works without a download. AI answers can
            be wrong; check their rule references. Keep identity details and
            employee documents out of chat.
          </p>
        </div>
        <HelpPanel full />
      </main>
    </>
  );
}
