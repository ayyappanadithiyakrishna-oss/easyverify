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
            Ask about a hiring step, compare situations, and follow up. The AI
            runs on this laptop, inside your browser. No Ollama installation or
            account required.
          </p>
          <p className="small">
            Choose a smaller 137 MB model or Llama 3.2 (about 1.7 GB) and
            requires a capable browser with enough memory. AI answers can be
            wrong; check their rule references. Keep identity details and
            employee documents out of chat.
          </p>
        </div>
        <HelpPanel full />
      </main>
    </>
  );
}
