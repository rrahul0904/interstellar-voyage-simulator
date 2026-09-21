import type { ShipDesign, VoyageState } from "./types.js";

/**
 * A deliberately conservative midpoint guidance rule.
 * It accelerates during the first half of the route and brakes during the second.
 * A later slice can replace this with a fuel-aware relativistic optimizer.
 */
export function midpointThrottle(state: VoyageState, design: ShipDesign): number {
  if (state.phase === "arrived" || state.phase === "crew-lost" || state.phase === "abandoned") return 0;
  if (state.remainingPropellantKg <= 0) return 0;

  const remaining = Math.max(0, state.targetDistanceMeters - state.distanceMeters);
  const halfway = state.targetDistanceMeters / 2;

  if (remaining <= 0) return 0;
  if (state.distanceMeters < halfway) return design.propulsion.maxThrottle;
  if (state.velocityMps > 0) return -design.propulsion.maxThrottle;
  return 0;
}
