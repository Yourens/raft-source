// Which build of Raft this is. The private repository is "cloud", our own
// deployment. scripts/source-available/export-snapshot.ts rewrites the one
// line below to "source-available" in every published snapshot, and the
// export fails unless it finds exactly that line.
//
// The source-available edition has no social account login (Google, GitHub,
// Apple): services/socialAuthService.ts refuses it whatever the environment
// configures. Nor does it have enterprise single sign-on (OIDC and SAML, with
// "Require SSO"): routes/sso.ts and routes/serverSso.ts refuse every route, and
// services/sso/ssoEnforcement.ts enforces no requirement, whatever rows the
// database holds.
export const RAFT_EDITION: "cloud" | "source-available" = "source-available";

/** Whether this edition offers social account login at all; providers still need their configuration. */
export function socialLoginAllowed(edition: string = RAFT_EDITION): boolean {
  return edition === "cloud";
}

/** Whether this edition offers enterprise single sign-on (OIDC, SAML, "Require SSO") at all. */
export function enterpriseSsoAllowed(edition: string = RAFT_EDITION): boolean {
  return edition === "cloud";
}

