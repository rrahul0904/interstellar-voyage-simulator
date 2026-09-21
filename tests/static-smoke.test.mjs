import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

test("production artifact contains required static entrypoints", () => {
  for (const path of [
    "public-build/index.html",
    "public-build/styles.css",
    "public-build/dist/web/app.js",
    "public-build/dist/core/index.js"
  ]) {
    assert.ok(existsSync(path), `missing production artifact: ${path}`);
  }
});

test("packaged HTML uses deploy-safe relative assets and required UI contract", () => {
  const html = read("public-build/index.html");
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/dist\/web\/app\.js"/);
  assert.doesNotMatch(html, /(?:href|src)="\/(?!\/)/);

  for (const id of [
    "shipyard",
    "flight-deck",
    "mode",
    "ship-name",
    "crew",
    "propellant",
    "destination",
    "launch",
    "pause",
    "reset",
    "telemetry",
    "progress-bar",
    "mission-log",
    "ledger"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing required UI id: ${id}`);
  }
});

test("Vercel config keeps a restrictive browser security baseline", () => {
  const config = JSON.parse(read("vercel.json"));
  assert.equal(config.outputDirectory, "public-build");
  const headers = config.headers?.[0]?.headers ?? [];
  const map = new Map(headers.map((entry) => [entry.key.toLowerCase(), entry.value]));

  assert.equal(map.get("x-content-type-options"), "nosniff");
  assert.match(map.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(map.get("permissions-policy") ?? "", /microphone=\(\)/);
  assert.match(map.get("permissions-policy") ?? "", /geolocation=\(\)/);

  const csp = map.get("content-security-policy") ?? "";
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
});

test("production bundle remains serverless and third-party free", () => {
  const app = read("public-build/dist/web/app.js");
  assert.doesNotMatch(app, /fetch\s*\(/);
  assert.doesNotMatch(app, /XMLHttpRequest|WebSocket/);
  assert.match(app, /localStorage/);
});
