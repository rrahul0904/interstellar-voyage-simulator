import { C } from "./constants.js";
import { gammaFromRapidity, properTimeIncrement, velocityFromRapidity } from "./relativity.js";
import { shieldErosionPerEarthSecond } from "./rulesets.js";
import { validateDesign } from "./shipyard.js";
import type { RoutePlan, ShipDesign, StepInput, UniverseMode, VoyageState } from "./types.js";

export function createVoyage(design: ShipDesign, mode: UniverseMode, route: RoutePlan): VoyageState {
  const validation = validateDesign(design);
  if (!validation.ok) {
    throw new Error(`Invalid design: ${validation.errors.join(" ")}`);
  }
  if (!route.destinationName.trim()) throw new Error("Destination name is required.");
  if (route.distanceMeters <= 0) throw new Error("Destination distance must be positive.");

  return {
    phase: "departure",
    mode,
    destinationName: route.destinationName,
    targetDistanceMeters: route.distanceMeters,
    earthTimeSeconds: 0,
    properTimeSeconds: 0,
    rapidity: 0,
    velocityMps: 0,
    gamma: 1,
    distanceMeters: 0,
    remainingPropellantKg: design.propellantMassKg,
    totalMassKg: validation.totalDryMassKg + design.propelantMassKg,
    crewAlive: design.crewCount,
    shieldIntegrity: design.shieldIntegrity,
    log: [`Voyage initialized for ${route.destinationName}.`]
  };
}

export function stepVoyage(
  state: VoyageState,
  design: ShipDesign,
  input: StepInput
d): VoyageState {
  if (input.earthDtSeconds <= 0) throw new RangeError("earthDtSeconds must be positive");
  if (Math.abs(input.throttle) > design.propulsion.maxThrottle) {
    throw new RangeError("throttle outside propulsion limits");
  }
  if (["arrived", "crew-lost", "abandoned"].includes(state.phase)) return state;

  const gamma = gammaFromRapidity(state.rapidity);
  const dTau = properTimeIncrement(input.earthDtSeconds, gamma);
  const requestedAcceleration = design.propulsion.maxProperAccelerationMps2 * input.throttle;
  const requestedAccelerationMagnitude = Math.abs(requestedAcceleration);

  const massFlowKgPerSecond = requestedAccelerationMagnitude === 0
    ? 0
    : (requestedAccelerationMagnitude * state.totalMassKg) / design.propulsion.exhaustVelocityMps;
  const requestedFuel = massFlowKgPerSecond * dTau;
  const fuelFraction = requestedFuel <= 0
    ? 0
    : Math.min(1, state.remainingPropellantKg / requestedFuel);
  const actualAcceleration = requestedAcceleration * fuelFraction;
  const consumedFuel = requestedFuel * fuelFraction;

  const proposedRapidity = state.rapidity + (actualAcceleration / C) * dTau;
  const newRapidity = Math.max(0, proposedRapidity);
  const newVelocity = velocityFromRapidity(newRapidity);
  const newGamma = gammaFromRapidity(newRapidity);
  const averageVelocity = 0.5 * (state.velocityMps + newVelocity);
  const proposedDistance = state.distanceMeters + averageVelocity * input.earthDtSeconds;
  const arrived = proposedDistance >= state.targetDistanceMeters;
  const newDistance = arrived ? state.targetDistanceMeters : proposedDistance;

  const erosion = shieldErosionPerEarthSecond(state.mode, newVelocity) * input.earthDtSeconds;
  const newShield = Math.max(0, state.shieldIntegrity - erosion);
  const crewAlive = newShield <= 0 ? 0 : state.crewAlive;
  const phase = crewAlive <= 0
    ? "crew-lost"
    : arrived
      ? "arrived"
      : actualAcceleration !== 0
        ? "powered-flight"
        : "coast";

  const log = [...state.log];
  if (state.remainingPropellantKg > 0 && state.remainingPropellantKg - consumedFuel <= 0) {
    log.push("Propellant exhausted; vessel entered coast phase.");
  }
  if (state.shieldIntegrity > 0 && newShield <= 0) {
    log.push("Shield integrity reached zero; crew survival failed closed.");
  }
  if (arrived && state.phase !== "arrived") {
    log.push(`Arrived at ${state.destinationName}.`);
  }

  return {
    ...state,
    phase,
    earthTimeSeconds: state.earthTimeSeconds + input.earthDtSeconds,
    properTimeSeconds: state.properTimeSeconds + dTau,
    rapidity: newRapidity,
    velocityMps: newVelocity,
    gamma: newGamma,
    distanceMeters: newDistance,
    remainingPropellantKg: Math.max(0, state.remainingPropellantKg - consumedFuel),
    totalMassKg: Math.max(0, state.totalMassKg - consumedFuel),
    crewAlive,
    shieldIntegrity: newShield,
    log
  };
}
