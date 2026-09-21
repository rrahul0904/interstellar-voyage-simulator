import { C, G0 } from "./constants.js";
import type { PropulsionModel, UniverseMode } from "./types.js";

const REAL_PROPULSION: PropulsionModel = {
  id: "fusion-drive",
  name: "Fusion Drive",
  maxProperAccelerationMps2: 0.08 * G0,
  exhaustVelocityMps: 0.035 * C,
  maxThrottle: 1,
  fictional: false
};

const SCIFI_PROPULSION: PropulsionModel = {
  id: "torch-drive",
  name: "Torch Drive",
  maxProperAccelerationMps2: 1.0 * G0,
  exhaustVelocityMps: 0.5 * C,
  maxThrottle: 1,
  fictional: true
};

export function defaultPropulsion(mode: UniverseMode): PropulsionModel {
  return mode === "real" ? REAL_PROPULSION : SCIFI_PROPULSION;
}

export function shieldErosionPerEarthSecond(mode: UniverseMode, velocityMps: number): number {
  const beta = Math.abs(velocityMps) / C;
  if (beta < 0.01) return 0;
  const factor = mode === "real" ? 1.0e-9 : 2.0e-10;
  return factor * beta * beta;
}
