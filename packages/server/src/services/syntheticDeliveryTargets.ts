import type { AgentMessage } from "@botiverse/raft-shared";

/**
 * Server-authored deliveries that are not addressed to a real channel.
 *
 * `deliverOwnerFactsContext` hands the onboarding agent the owner's signup facts
 * under this synthetic channel id. Delivery-target visibility checks look the
 * target up in `channels` (a uuid column), so the synthetic id made the query
 * throw and the context was always dropped: the onboarding agent never learned
 * who the owner was. Only server code calls `deliverMessage`, so an exact id plus
 * a system sender cannot be produced by users or daemons.
 */
export const ONBOARDING_CONTEXT_CHANNEL_ID = "onboarding-context";

export function isServerSyntheticDeliveryTarget(
  message: Pick<AgentMessage, "channel_id" | "sender_type">,
): boolean {
  return message.channel_id === ONBOARDING_CONTEXT_CHANNEL_ID && message.sender_type === "system";
}
