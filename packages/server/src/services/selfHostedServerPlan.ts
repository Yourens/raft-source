/**
 * Plan for newly created servers on a self-hosted deployment (siltok).
 *
 * Upstream creates every server on `free` and sells `pro` through Stripe, which a
 * self-hosted deployment does not run: its servers would be stuck with free-tier
 * limits (30-day history, upload caps, one joint channel). RAFT_DEFAULT_SERVER_PLAN
 * lets the operator create servers on the internal unlimited `founder` plan
 * instead. Only `free` and `founder` are accepted; `pro` is derived from a real
 * subscription and cannot be granted by configuration. Unset or anything else
 * keeps the upstream column default.
 */
export type SelfHostedServerPlan = "free" | "founder";

export function resolveNewServerPlan(env: NodeJS.ProcessEnv = process.env): SelfHostedServerPlan | null {
  const value = env.RAFT_DEFAULT_SERVER_PLAN?.trim().toLowerCase();
  return value === "free" || value === "founder" ? value : null;
}
