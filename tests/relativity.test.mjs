import test from "node:test";
import assert from "node:assert/strict";
import { C, gammaFromRapidity, rapidityFromVelocity, velocityFromRapidity } from "../dist/core/index.js";

test("rapidity round-trips sublight velocity", () => {
  const v = 0.8 * C;
  const eta = rapidityFromVelocity(v);
  assert.ok(Math.abs(velocityFromRapidity(eta) - v) < 1e-6 * C);
});

test("velocity never reaches c for finite rapidity", () => {
  for (const eta of [0, 0.1, 1, 3, 10]) {
    assert.ok(Math.abs(velocityFromRapidity(eta)) < C);
    assert.ok(gammaFromRapidity(eta) >= 1);
  }
});
