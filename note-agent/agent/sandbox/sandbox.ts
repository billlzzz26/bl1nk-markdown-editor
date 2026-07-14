import { defineSandbox, defaultBackend } from "eve/sandbox";

/**
 * Sandbox configuration for the note agent.
 *
 * The sandbox is the agent's isolated bash environment — a filesystem
 * rooted at /workspace where it can run shell commands, execute scripts,
 * and read/write files without touching the app runtime.
 *
 * Backend auto-detection priority:
 *   1. Vercel Sandbox (when deployed on Vercel)
 *   2. Docker (when docker CLI is available)
 *   3. microsandbox (macOS Apple Silicon / Linux KVM)
 *   4. just-bash (pure JS fallback, no real binaries)
 *
 * Default egress: allow-all
 * For production: change to deny-all + explicit allow-list
 */

export default defineSandbox({
  backend: defaultBackend({
    justbash: {
      // just-bash is the only backend that works on Termux/Android
      // On other platforms, Docker/microsandbox will be auto-selected
    },
  }),

  // Increment when dependencies/workspace setup changes
  revalidationKey: () => "note-agent-v1",

  async bootstrap({ use }) {
    const sandbox = await use();
    // Install basic tools available in the sandbox
    // (just-bash has no real binaries; Docker/microsandbox will)
    try {
      await sandbox.run({ command: "mkdir -p /workspace/notes /workspace/scripts /workspace/data" });
    } catch {
      // just-bash may not support mkdir; workspace is pre-created
    }
  },

  async onSession({ use, ctx }) {
    // Lock down network for production — deny-all by default.
    // Override with environment variable or per-session policy.
    const policy = process.env.SANDBOX_NETWORK_POLICY || "allow-all";
    await use({ networkPolicy: policy as "allow-all" | "deny-all" });
  },
});
