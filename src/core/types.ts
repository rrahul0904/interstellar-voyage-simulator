export type UniverseMode = "real" | "scifi";
export type VoyagePhase =
  | "design"
  | "departure"
  | "powered-flight"
  | "coast"
  | "arrived"
  | "crew-lost"
  | "abandoned";

export interface PropulsionModel {
  id: string;
  name: string;
  maxProperAccelerationMps2: number;
  exhaustVelocityMps: number;
  maxThrottle: number;
  fictional: boolean;
}

export interface ShipModule {
  id: string;
  name: string;
  massKg: number;
  powerKw: number;
  category: "habitat" | "power" | "shield" | "cargo" | "life-support";
  capacity?: number;
  fictional?: boolean;
}

export interface ShipDesign {
  name: string;
  dryMassKg: number;
  propellantMassKg: number;
  crewCount: number;
  propulsion: PropulsionModel;
  modules: ShipModule[];
  shieldIntegrity: number;
}

export interface RoutePlan {
  destinationName: string;
  distanceMeters: number;
}

export interface VoyageState {
  phase: VoyagePhase;
  mode: UniverseMode;
  destinationName: string;
  targetDistanceMeters: number;
  earthTimeSeconds: number;
  properTimeSeconds: number;
  rapidity: number;
  velocityMps: number;
  gamma: number;
  distanceMeters: number;
  remainingPropellantKg: number;
  totalMassKg: number;
  crewAlive: number;
  shieldIntegrity: number;
  log: string[];
}

export interface StepInput {
  earthDtSeconds: number;
  /** -1..1: negative throttle applies braking acceleration. */
  throttle: number;
}
