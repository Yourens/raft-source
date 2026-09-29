import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveNewServerPlan } from "./selfHostedServerPlan.js";

test("RAFT_DEFAULT_SERVER_PLAN accepts only free and founder", () => {
  assert.equal(resolveNewServerPlan({}), null);
  assert.equal(resolveNewServerPlan({ RAFT_DEFAULT_SERVER_PLAN: "" }), null);
  assert.equal(resolveNewServerPlan({ RAFT_DEFAULT_SERVER_PLAN: " Founder " }), "founder");
  assert.equal(resolveNewServerPlan({ RAFT_DEFAULT_SERVER_PLAN: "free" }), "free");
  assert.equal(resolveNewServerPlan({ RAFT_DEFAULT_SERVER_PLAN: "pro" }), null);
  assert.equal(resolveNewServerPlan({ RAFT_DEFAULT_SERVER_PLAN: "partner" }), null);
});
