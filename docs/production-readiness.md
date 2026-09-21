# Production readiness

## Repository-certified

The production branch is expected to pass these gates on every push:

- clean `npm ci`
- strict TypeScript compilation
- 8 deterministic simulation regression tests
- static production packaging into `public-build/`
- packaged HTML/DOM contract smoke tests
- deploy-safe relative asset paths
- CSP/security configuration checks
- no server/API/WebSocket dependency in the production browser bundle
- required production artifact presence

## Product surface

Implemented:

- Shipyard configuration
- Real-physics and explicitly fictional propulsion modes
- fail-closed ship, habitat, life-support, and power validation
- wall-clock voyage stepping
- rapidity-based relativistic kinematics
- Earth-frame and proper-time clocks
- finite propellant and mass depletion
- midpoint accelerate/brake guidance
- shield erosion rule boundary
- Flight Deck telemetry
- pause/resume and shipyard reset
- local completed-voyage ledger
- responsive static UI
- original branding/copy/assets

## Security baseline

The application intentionally has no backend, accounts, cookies, analytics SDK, remote API calls, WebSockets, or third-party runtime JavaScript.

Controls include:

- restrictive Content Security Policy in the HTML for static hosts
- equivalent response-header policy for Vercel
- no `unsafe-inline` or `unsafe-eval`
- escaped dynamic HTML for user/local-storage derived values
- camera, microphone, and geolocation disabled in Vercel permissions policy
- local-only completed voyage storage
- fail-closed launch validation

## Deployment

Preferred production artifact: `public-build/`.

The GitHub Pages workflow builds and tests the exact production artifact before publishing. A Pages site must be enabled for this repository with **Settings → Pages → Source: GitHub Actions**. The workflow cannot create that account-level Pages site with its normal Actions token.

Vercel configuration is also committed. Railway is a compatible alternative, but deployment capacity/account configuration is external to the repository.

## Release boundary

Do not claim the product is publicly deployed until a hosted URL is reachable and the Shipyard → Launch → Flight Deck flow has been verified against that exact deployment.
