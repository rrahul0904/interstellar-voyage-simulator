import { C } from "./constants.js";

export function velocityFromRapidity(rapidity: number): number {
  return C * Math.tanh(rapidity);
}

export function gammaFromRapidity(rapidity: number): number {
  return Math.cosh(rapidity);
}

export function rapidityFromVelocity(velocityMps: number): number {
  if (Math.abs(velocityMps) >= C) {
    throw new RangeError("velocity must remain below the speed of light");
  }
  return Math.atanh(velocityMps / C);
}

export function properTimeIncrement(earthDtSeconds: number, gamma: number): number {
  if (earthDtSeconds < 0) throw new RangeError("earthDtSeconds must be non-negative");
  if (gamma < 1) throw new RangeError("gamma must be >= 1");
  return earthDtSeconds / gamma;
}

export function kineticEnergyJoules(totalMassKg: number, gamma: number): number {
  if (totalMassKg < 0) throw new RangeError("mass must be non-negative");
  return (gamma - 1) * totalMassKg * C * C;
}
