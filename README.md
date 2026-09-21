# Interstellar Voyage Simulator

An original browser-based educational simulation for exploring relativistic interstellar travel, propulsion trade-offs, ship survivability, and the separation between physics-driven calculations and explicitly fictional rules.

## Production surface

The repository now includes a complete static web experience:

- Shipyard mission configuration
- Real-physics and sci-fi propulsion modes
- Real wall-clock simulation loop with no fast-forward
- Relativistic velocity, gamma, Earth time, and proper-time telemetry
- Fuel consumption, shielding, mass, signal delay, and kinetic-energy telemetry
- Midpoint accelerate/brake guidance
- Fail-closed launch validation
- Local completed-voyage ledger
- Responsive UI and restrictive production security headers
- Zero runtime dependencies

## Core engineering

- deterministic simulation core
- rapidity-based relativistic kinematics
- velocity strictly bounded below `c`
- finite-fuel propulsion
- shipyard and power-budget validation
- destination/arrival contracts
- shield erosion boundary
- unit tests and GitHub Actions CI

## Commands

```bash
npm run build
npm test
```

The production site serves `index.html`, `styles.css`, and the TypeScript compiler output under `dist/`.

## Product boundary

This is a clean-room implementation inspired by the educational problem space. It does not copy the referenced product's branding, prose, artwork, source code, or proprietary assets.

See `docs/reverse-engineering.md` for the implementation roadmap and design notes.
