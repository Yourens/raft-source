// Self-hosted knob (siltok): RAFT_CROSS_ORIGIN_RESOURCE_POLICY sets Helmet's global
// Cross-Origin-Resource-Policy. Helmet defaults it to same-origin, so a deployment that
// serves the web app and the API from different hosts (raft.example.com vs
// raft-api.example.com) has every API-served image -- user avatars, agent avatars,
// integration logos -- refused by the browser. `same-site` admits sibling subdomains
// and still blocks other sites. Unset or invalid keeps the upstream default.
export type CrossOriginResourcePolicy = "same-origin" | "same-site" | "cross-origin";

const POLICIES: readonly CrossOriginResourcePolicy[] = ["same-origin", "same-site", "cross-origin"];

export function getCrossOriginResourcePolicy(
  env: NodeJS.ProcessEnv = process.env,
): CrossOriginResourcePolicy | null {
  const value = env.RAFT_CROSS_ORIGIN_RESOURCE_POLICY?.trim().toLowerCase();
  return POLICIES.find((policy) => policy === value) ?? null;
}
