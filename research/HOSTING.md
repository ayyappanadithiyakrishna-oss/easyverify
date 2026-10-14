# Public hosting and service boundaries

Vercel currently hosts the application at https://easyverify.vercel.app. GitHub is now public: https://github.com/ayyappanadithiyakrishna-oss/easyverify . Opening the website on another laptop does not require repository access.

The free public planner uses validated, nonpersonal inputs and produces a shareable URL. That URL recreates rule inputs and dates across devices. It does not synchronize completion, employer accounts, or employee records. Those workflows require the Supabase backend.

The in-browser Llama chatbot downloads the pinned 1.69 GB quantized model after explicit activation and runs inference in a Web Worker with WebAssembly. It needs a capable browser and sufficient memory/storage. Browser caching can fail when quota is insufficient. CPU generation can be slow. The source-reference answer remains available, and generated output is untrusted. No public desktop Ollama port or tunnel is exposed.

Alternative deployment: Dockerfile builds the complete standalone Next.js server. render.yaml is a free Render web-service blueprint, and the container uses port 7860 for compatibility with a Docker Hugging Face Space. Neither service was created or deployed: those provider accounts are not connected/authenticated. This is prepared deployment configuration, not a claimed second live host.

Render free services spin down and do not retain local filesystem writes across redeploys. Free Render Postgres expires after 30 days; it is not an appropriate durable substitute for this application's planned Supabase storage. See https://render.com/docs/free . Hugging Face's official Next.js tutorial documents Docker Space deployment: https://huggingface.co/docs/transformers.js/main/en/tutorials/next .

Supabase access remains limited to the unrelated Snip organization and its inactive project. The selected separate EasyVerify organization is unavailable. Browser setup redirects to GitHub sign-in, so organization creation, real database deployment, and Google OAuth provider setup remain uncompleted. No existing unrelated organization or project was modified.

Google OAuth handler and redirects exist in source behind NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false. Enable only after a real Google client and Supabase provider callback are configured and tested. Docker NEXT_PUBLIC_* settings must be supplied at image build time because Next.js embeds them in client bundles.

The older q8 asset generated an unrelated answer in the functional test. The release uses the updated q4 asset instead, and applies a conservative topic/number consistency check before displaying generated output. Failed checks show the original rule reference with an error notice. This is a relevance guard, not a legal fact-verification guarantee. Raw generated drafts are not shown as source-backed guidance.

For broader device access, the default is now the 137 MB SmolLM2-135M-Instruct model at revision 12fd25f77366fa6b3b4b768ec3050bf629380bac. Llama 3.2 remains selectable. Both execute in the browser. No universal compatibility or instant-response guarantee is made.
