import { createVoyage, defaultPropulsion, stepVoyage, type ShipDesign } from "../core/index.js";

const design: ShipDesign = {
  name: "Pathfinder",
  dryMassKg: 120_000,
  propellantMassKg: 80_000,
  crewCount: 12,
  propulsion: defaultPropulsion("real"),
  shieldIntegrity: 1,
  modules: [
    { id: "hab", name: "Habitat", massKg: 20_000, powerKw: -120, category: "habitat", capacity: 16 },
    { id: "life", name: "Life Support", massKg: 8_000, powerKw: -80, category: "life-support" },
    { id: "power", name: "Reactor", massKg: 15_000, powerKw: 500, category: "power" }
  ]
};

let state = createVoyage(design, "real", { destinationName: "Demonstration Target", distanceMeters: 1e12 });

export function tick(seconds = 1): typeof state {
  state = stepVoyage(state, design, { earthDtSeconds: seconds, throttle: 1 });
  return state;
}

export function snapshot(): typeof state {
  return state;
}
