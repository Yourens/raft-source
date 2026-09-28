// [siltok patch] RAFT_REGISTRATION_ALLOWED_EMAIL_DOMAINS: comma-separated email
// domains (e.g. "siltok-ai.com,example.com") that may create new accounts.
// Unset or empty keeps upstream behaviour (open registration). Existing
// accounts can always sign in; only new-account creation is gated.
function allowedEmailDomains(): string[] {
  return (process.env.RAFT_REGISTRATION_ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function getRegistrationBlockedReason(email?: string): string | null {
  const domains = allowedEmailDomains();
  if (domains.length === 0 || email === undefined) return null;
  const domain = email.trim().toLowerCase().split("@").pop() ?? "";
  if (domains.includes(domain)) return null;
  return `Registration is limited to ${domains.map((d) => `@${d}`).join(", ")} email addresses`;
}

export function isRegistrationEnabled(email?: string): boolean {
  return getRegistrationBlockedReason(email) === null;
}

export function assertRegistrationEnabled(email?: string): void {
  const blockedReason = getRegistrationBlockedReason(email);
  if (blockedReason) {
    throw new Error(blockedReason);
  }
}
