import test from "node:test";
import assert from "node:assert/strict";
import { createVoyage, defaultPropulsion, midpointThrottle, stepVoyage } from "../dist/core/index.js";

const route = { destinationName: "Test Target", distanceMeters: 1e12 };

function design() {
  return {
    name: "Pathfinder",
    dryMassKg: 120_000,
    propellantMassKg: 80_000,
    crewCount: 12,
    propulsion: defaultPropulsion("real"),
    shieldIntegrity: 1,
    modules: [
      { id: "hab-1", name: "Habitat", massKg: 20_000, powerKw: -120, category: "habitat", capacity: 16 },
      { id: "life-1", name: "Closed-loop Life Support", massKg: 8_000, powerKw: -80, category: "life-support" },
      { id: "power-1", name: "Reactor", massKg: 15_000, powerKw: 500, category: "power" },
      { id: "shield-1", name: "Whipple Shield", massKg: 10_000, powerKw: -20, category: "shield" }
    ]
  };
}

test("earth and proper clocks advance monotonically", () => {
  const d = design();
  let state = createVoyage(d, "real", route);
  state = stepVoyage(state, d, { earthDtSeconds: 10, throttle: 1 });
  assert.equal(state.earthTimeSeconds, 10);
  assert.ok(state.properTimeSeconds > 0);
  assert.ok(state.properTimeSeconds <= state.earthTimeSeconds);
});

test("powered flight consumes propellant and increases distance", () => {
  const d = design();
  const initial = createVoyage(d, "real", route);
  const next = stepVoyage(initial, d, { earthDtSeconds: 60, throttle: 1 });
  assert.ok(next.remainingPropellantKg < initial.remainingPropellantKg);
  assert.ok(next.distanceMeters > 0);
  assert.ok(next.velocityMps > 0);
  assert.equal(next.phase, "powered-flight");
});

test("invalid ship fails closed before launch", () => {
  const d = design();
  d.modules = [];
  assert.throws(() => createVoyage(d, "real", route), /Invalid design/);
});

test("power deficit fails closed before launch", () => {
  const d = design();
  d.modules = d.modules.filter((m) => m.category !== "power");
  assert.throws(() => createVoyage(d, "real", route), /consume more power/);
});

test("midpoint guidance accelerates then brakes", () => {
  const d = design();
  const state = createVoyage(d, "real", route);
  assert.ok(midpointThrottle(state, d) > 0);
  const afterHalfway = { ...state, distanceMeters: route.distanceMeters * 0.75, velocityMps: 1000 };
  assert.ok(midpointThrottle(afterHalfway, d) < 0);
});

test("arrival clamps distance and terminates subsequent stepping", () => {
  const d = design();
  const shortRoute = { destinationName: "Nearby Test", distanceMeters: 1 };
  const initial = createVoyage(d, "real", shortRoute);
  const arrived = stepVoyage(initial, d, { earthDtSeconds: 10, throttle: 1 });
  assert.equal(arrived.phase, "arrived");
  assert.equal(arrived.distanceMeters, shortRoute.distanceMeters);
  assert.equal(stepVoyage(arrived, d, { earthDtSeconds: 10, throttle: 1 }), arrived);
});
