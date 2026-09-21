import {
  C,
  LIGHT_YEAR_METERS,
  YEAR_SECONDS,
  createVoyage,
  defaultPropulsion,
  gammaFromRapidity,
  kineticEnergyJoules,
  midpointThrottle,
  stepVoyage,
  type ShipDesign,
  type UniverseMode,
  type VoyageState
} from "../core/index.js";

const destinations = {
  "Proxima Centauri": 4.2465 * LIGHT_YEAR_METERS,
  "Barnard's Star": 5.963 * LIGHT_YEAR_METERS,
  "Sirius": 8.611 * LIGHT_YEAR_METERS,
  "TRAPPIST-1": 40.66 * LIGHT_YEAR_METERS
} as const;

type DestinationName = keyof typeof destinations;

const ui = {
  shipyard: document.querySelector<HTMLElement>("#shipyard")!,
  flightDeck: document.querySelector<HTMLElement>("#flight-deck")!,
  mode: document.querySelector<HTMLSelectElement>("#mode")!,
  shipName: document.querySelector<HTMLInputElement>("#ship-name")!,
  crew: document.querySelector<HTMLInputElement>("#crew")!,
  propellant: document.querySelector<HTMLInputElement>("#propellant")!,
  destination: document.querySelector<HTMLSelectElement>("#destination")!,
  launch: document.querySelector<HTMLButtonElement>("#launch")!,
  validation: document.querySelector<HTMLElement>("#validation")!,
  pause: document.querySelector<HTMLButtonElement>("#pause")!,
  reset: document.querySelector<HTMLButtonElement>("#reset")!,
  telemetry: document.querySelector<HTMLElement>("#telemetry")!,
  progress: document.querySelector<HTMLElement>("#progress-bar")!,
  missionTitle: document.querySelector<HTMLElement>("#mission-title")!,
  missionMeta: document.querySelector<HTMLElement>("#mission-meta")!,
  modeBadge: document.querySelector<HTMLElement>("#mode-badge")!,
  phaseBadge: document.querySelector<HTMLElement>("#phase-badge")!,
  log: document.querySelector<HTMLElement>("#mission-log")!,
  scienceNote: document.querySelector<HTMLElement>("#science-note")!,
  ledger: document.querySelector<HTMLElement>("#ledger")!
};

let design: ShipDesign | null = null;
let state: VoyageState | null = null;
let running = false;
let lastFrameMs = performance.now();
let raf = 0;

function buildDesign(mode: UniverseMode): ShipDesign {
  const crewCount = clampInt(Number(ui.crew.value), 1, 64);
  const propellantMassKg = clamp(Number(ui.propellant.value) * 1000, 10_000, 5_000_000);

  return {
    name: ui.shipName.value.trim() || "Pathfinder",
    dryMassKg: 120_000,
    propellantMassKg,
    crewCount,
    propulsion: defaultPropulsion(mode),
    shieldIntegrity: 1,
    modules: [
      { id: "hab", name: "Habitat Ring", massKg: 20_000, powerKw: -120, category: "habitat", capacity: 64 },
      { id: "life", name: "Closed-loop Life Support", massKg: 8_000, powerKw: -80, category: "life-support" },
      { id: "power", name: "Primary Reactor", massKg: 15_000, powerKw: 500, category: "power" },
      { id: "shield", name: "Forward Dust Shield", massKg: 10_000, powerKw: -20, category: "shield" }
    ]
  };
}

function startMission(): void {
  try {
    const mode = ui.mode.value as UniverseMode;
    const destination = ui.destination.value as DestinationName;
    design = buildDesign(mode);
    state = createVoyage(design, mode, {
      destinationName: destination,
      distanceMeters: destinations[destination]
    });
    running = true;
    lastFrameMs = performance.now();
    ui.validation.textContent = "";
    ui.shipyard.hidden = true;
    ui.flightDeck.hidden = false;
    ui.pause.textContent = "Pause";
    render();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  } catch (error) {
    ui.validation.textContent = error instanceof Error ? error.message : "Unable to launch.";
  }
}

function loop(nowMs: number): void {
  if (!state || !design) return;
  const elapsed = Math.min(2, Math.max(0, (nowMs - lastFrameMs) / 1000));
  lastFrameMs = nowMs;

  if (running && elapsed > 0 && !isTerminal(state)) {
    const throttle = midpointThrottle(state, design);
    state = stepVoyage(state, design, { earthDtSeconds: elapsed, throttle });
    if (isTerminal(state)) {
      running = false;
      recordCompletedVoyage(state, design);
    }
    render();
  }

  raf = requestAnimationFrame(loop);
}

function isTerminal(v: VoyageState): boolean {
  return ["arrived", "crew-lost", "abandoned"].includes(v.phase);
}

function togglePause(): void {
  if (!state || isTerminal(state)) return;
  running = !running;
  lastFrameMs = performance.now();
  ui.pause.textContent = running ? "Pause" : "Resume";
}

function resetMission(): void {
  running = false;
  cancelAnimationFrame(raf);
  design = null;
  state = null;
  ui.flightDeck.hidden = true;
  ui.shipyard.hidden = false;
  renderLedger();
}

function render(): void {
  if (!state || !design) return;

  const beta = Math.abs(state.velocityMps / C);
  const progress = Math.min(1, state.distanceMeters / state.targetDistanceMeters);
  const remainingLy = Math.max(0, state.targetDistanceMeters - state.distanceMeters) / LIGHT_YEAR_METERS;
  const earthYears = state.earthTimeSeconds / YEAR_SECONDS;
  const shipYears = state.properTimeSeconds / YEAR_SECONDS;
  const energy = kineticEnergyJoules(state.totalMassKg, gammaFromRapidity(state.rapidity));
  const commDelayYears = state.distanceMeters / C / YEAR_SECONDS;

  ui.missionTitle.textContent = `${design.name} → ${state.destinationName}`;
  ui.missionMeta.textContent = `${design.crewCount} crew · ${design.propulsion.name} · ${formatMass(state.totalMassKg)}`;
  ui.modeBadge.textContent = state.mode === "real" ? "REAL PHYSICS" : "SCI-FI RULESET";
  ui.phaseBadge.textContent = state.phase.replaceAll("-", " ").toUpperCase();
  ui.progress.style.width = `${Math.max(progress * 100, 0.2)}%`;
  ui.progress.setAttribute("aria-valuenow", String(progress * 100));

  const rows: [string, string][] = [
    ["Earth elapsed", formatDuration(state.earthTimeSeconds)],
    ["Ship proper time", formatDuration(state.properTimeSeconds)],
    ["Velocity", `${(beta * 100).toFixed(beta < 0.001 ? 5 : 3)}% c`],
    ["Lorentz factor γ", state.gamma.toFixed(6)],
    ["Distance traveled", `${(state.distanceMeters / LIGHT_YEAR_METERS).toExponential(4)} ly`],
    ["Distance remaining", `${remainingLy.toFixed(5)} ly`],
    ["Propellant", formatMass(state.remainingPropellantKg)],
    ["Shield integrity", `${(state.shieldIntegrity * 100).toFixed(4)}%`],
    ["Crew alive", String(state.crewAlive)],
    ["Signal delay", formatYears(commDelayYears)],
    ["Kinetic energy", formatEnergy(energy)],
    ["Clock divergence", formatYears(Math.max(0, earthYears - shipYears))]
  ];

  ui.telemetry.innerHTML = rows
    .map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  ui.log.innerHTML = state.log
    .slice(-8)
    .reverse()
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  ui.scienceNote.textContent = state.mode === "real"
    ? "Relativistic kinematics, proper time, finite exhaust velocity, fuel use, and c-limit enforcement are physics-driven. Crew biology and shield-loss thresholds remain simplified simulation rules."
    : "Relativistic kinematics still obey c, but the torch drive and reduced shielding penalty are explicitly fictional gameplay assumptions.";
}

function recordCompletedVoyage(voyage: VoyageState, ship: ShipDesign): void {
  const key = "ivs:completed-v1";
  const current = readLedger();
  current.unshift({
    ship: ship.name,
    destination: voyage.destinationName,
    phase: voyage.phase,
    mode: voyage.mode,
    earthTimeSeconds: voyage.earthTimeSeconds,
    properTimeSeconds: voyage.properTimeSeconds,
    completedAt: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(current.slice(0, 12)));
  renderLedger();
}

function readLedger(): Array<Record<string, unknown>> {
  try {
    const raw = localStorage.getItem("ivs:completed-v1");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function renderLedger(): void {
  const entries = readLedger();
  if (!entries.length) {
    ui.ledger.innerHTML = '<p class="empty">No completed voyages stored on this device yet.</p>';
    return;
  }

  ui.ledger.innerHTML = entries
    .map((entry) => {
      const ship = escapeHtml(String(entry.ship ?? "Unknown"));
      const destination = escapeHtml(String(entry.destination ?? "Unknown"));
      const phase = escapeHtml(String(entry.phase ?? "unknown"));
      const elapsed = formatDuration(Number(entry.earthTimeSeconds ?? 0));
      return `<div class="ledger-row"><div><strong>${ship}</strong><span>${destination}</span></div><div><strong>${phase}</strong><span>${elapsed}</span></div></div>`;
    })
    .join("");
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)} min`;
  if (seconds < 86_400) return `${(seconds / 3600).toFixed(2)} h`;
  if (seconds < YEAR_SECONDS) return `${(seconds / 86_400).toFixed(2)} d`;
  return `${(seconds / YEAR_SECONDS).toFixed(4)} y`;
}

function formatYears(years: number): string {
  if (years < 1 / 365) return `${(years * 365 * 24).toFixed(2)} h`;
  if (years < 1) return `${(years * 365.25).toFixed(2)} d`;
  return `${years.toFixed(5)} y`;
}

function formatMass(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg.toFixed(1)} kg`;
}

function formatEnergy(joules: number): string {
  if (joules <= 0) return "0 J";
  const exponent = Math.floor(Math.log10(joules));
  return `${(joules / 10 ** exponent).toFixed(3)} × 10^${exponent} J`;
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char] ?? char);
}

ui.launch.addEventListener("click", startMission);
ui.pause.addEventListener("click", togglePause);
ui.reset.addEventListener("click", resetMission);
ui.mode.addEventListener("change", () => {
  const fictional = ui.mode.value === "scifi";
  document.body.dataset.mode = fictional ? "scifi" : "real";
});

document.body.dataset.mode = ui.mode.value;
renderLedger();
