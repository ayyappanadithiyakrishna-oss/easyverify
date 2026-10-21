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
            runs on your device, inside your browser. No account required.
          </p>
          <p className="small">
            Optional chat downloads a model to your device and requires enough
            memory and storage. You can use source-linked guidance without it.
            AI answers can be wrong; check their rule references. Keep identity
            details and employee documents out of chat.
          </p>
        </div>
        <HelpPanel full />
      </main>
    </>
  );
}
