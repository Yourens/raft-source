import assert from "node:assert/strict";
import { test } from "vitest";
import { isServerSyntheticDeliveryTarget, ONBOARDING_CONTEXT_CHANNEL_ID } from "./syntheticDeliveryTargets.js";

test("only the system-sent onboarding context bypasses channel visibility lookup", () => {
  assert.equal(isServerSyntheticDeliveryTarget({ channel_id: ONBOARDING_CONTEXT_CHANNEL_ID, sender_type: "system" }), true);
  assert.equal(isServerSyntheticDeliveryTarget({ channel_id: ONBOARDING_CONTEXT_CHANNEL_ID, sender_type: "user" }), false);
  assert.equal(isServerSyntheticDeliveryTarget({ channel_id: ONBOARDING_CONTEXT_CHANNEL_ID, sender_type: "agent" }), false);
  assert.equal(isServerSyntheticDeliveryTarget({ channel_id: "2e7e3ffe-ae19-4960-aeac-7b7d15c77297", sender_type: "system" }), false);
  assert.equal(isServerSyntheticDeliveryTarget({ channel_id: "onboarding-context-x", sender_type: "system" }), false);
});
