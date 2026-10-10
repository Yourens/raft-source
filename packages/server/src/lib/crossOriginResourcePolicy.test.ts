import assert from "node:assert/strict";
import { getCrossOriginResourcePolicy } from "./crossOriginResourcePolicy";

test("RAFT_CROSS_ORIGIN_RESOURCE_POLICY accepts the three CORP values and ignores anything else", () => {
  assert.equal(getCrossOriginResourcePolicy({}), null);
  assert.equal(getCrossOriginResourcePolicy({ RAFT_CROSS_ORIGIN_RESOURCE_POLICY: "" }), null);
  assert.equal(getCrossOriginResourcePolicy({ RAFT_CROSS_ORIGIN_RESOURCE_POLICY: " Same-Site " }), "same-site");
  assert.equal(getCrossOriginResourcePolicy({ RAFT_CROSS_ORIGIN_RESOURCE_POLICY: "cross-origin" }), "cross-origin");
  assert.equal(getCrossOriginResourcePolicy({ RAFT_CROSS_ORIGIN_RESOURCE_POLICY: "same-origin" }), "same-origin");
  assert.equal(getCrossOriginResourcePolicy({ RAFT_CROSS_ORIGIN_RESOURCE_POLICY: "anywhere" }), null);
});
