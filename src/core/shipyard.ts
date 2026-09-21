import type { ShipDesign } from "./types.js";

export interface DesignValidation {
  ok: boolean;
  errors: string[];
  totalDryMassKg: number;
  netPowerKw: number;
}

export function validateDesign(design: ShipDesign): DesignValidation {
  const errors: string[] = [];
  const moduleMass = design.modules.reduce((sum, module) => sum + module.massKg, 0);
  const totalDryMassKg = design.dryMassKg + moduleMass;
  const netPowerKw = design.modules.reduce((sum, module) => sum + module.powerKw, 0);

  if (!design.name.trim()) errors.push("Ship name is required.");
  if (design.crewCount < 1) errors.push("At least one crew member is required.");
  if (design.propellantMassKg <= 0) errors.push("Propellant mass must be positive.");
  if (totalDryMassKg <= 0) errors.push("Dry mass must be positive.");
  if (design.shieldIntegrity <= 0 || design.shieldIntegrity > 1) {
    errors.push("Shield integrity must be in the range (0, 1].");
  }

  const habitatCapacity = design.modules
    .filter((module) => module.category === "habitat")
    .reduce((sum, module) => sum + (module.capacity ?? 0), 0);
  if (habitatCapacity < design.crewCount) {
    errors.push("Habitat capacity is below crew count.");
  }

  const hasLifeSupport = design.modules.some((module) => module.category === "life-support");
  if (!hasLifeSupport) errors.push("A life-support module is required.");
  if (netPowerKw < 0) errors.push("Installed modules consume more power than the ship generates.");

  return { ok: errors.length === 0, errors, totalDryMassKg, netPowerKw };
}
