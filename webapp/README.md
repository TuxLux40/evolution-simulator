# Evolution Simulator (web)

An interactive, browser-based reimplementation of [biosim4](../README.md) — the
neural-net-driven natural-selection simulator from the video
["I programmed some creatures. They evolved."](https://www.youtube.com/watch?v=N3tRFayqVtk)

No server, no compilation of C++, nothing to install besides Node for
development. The whole simulation runs client-side in TypeScript.

## Running it

```sh
npm install
npm run dev      # dev server with hot reload
npm run build    # type-checks and produces a static dist/ you can host anywhere
```

## What it does

- A control panel to tune the world live: population, world size, mutation
  rate, sexual/asexual reproduction, selection challenge (14+ of the
  original's survival criteria), barrier layouts, sensor radii, and more.
- A live canvas showing every creature moving every simulation step, colored
  by a hash of its genome, plus an optional pheromone-trail overlay.
- A generation/survivor history chart.
- A choice of compute backend for the neural-net evaluation step:
  - **CPU** — walks each creature's neural net in plain JS. Simple, and
    fastest for small-to-medium populations.
  - **GPU** — batches the *entire population's* neural-net evaluation into
    one WebGPU compute-shader dispatch per simulation step. Sensor readings
    (which need to inspect the grid/neighbors) still happen on the CPU each
    step; what moves to the GPU is the actual weighted-sum/tanh evaluation
    through each creature's private connection graph — the part that's
    embarrassingly parallel across thousands of individuals. This pays off
    at large populations; for small ones the CPU backend is usually faster
    since there's no dispatch/readback latency. Falls back to CPU
    automatically (with the option grayed out) if the browser doesn't
    support WebGPU.

## Architecture

- `src/sim/` — the simulation engine, ported from the original C++ (grid,
  signals/pheromones, genome, neural-net wiring, sensors, actions, survival
  challenges, barriers) plus the pluggable CPU/GPU feed-forward backends.
- `src/render/` — the canvas renderer and the color-from-genome mapping.
- `src/ui/` — the control panel, stats panel, and history chart.
- `src/App.tsx` — wires the engine to the UI and owns top-level state.

## Deliberate differences from upstream biosim4

- All 21 sensors and 17 actions are always addressable by the genome
  (upstream compiles a subset in/out at build time). `killEnable` gates the
  kill action's effect at runtime instead, so it's a UI toggle rather than a
  rebuild.
- `genomeSimilarity` uses a simpler shared-length gene-match ratio instead of
  upstream's Jaro-Winkler/Hamming methods — cheap, length-agnostic, and good
  enough for the sensor and future diversity stats.
- The altruism challenge reproduces only the "spawning zone" survivors; the
  upstream kinship-based rescue of sacrificed individuals is omitted.
- The RNG is a seedable `mulberry32`, not the original's generator — seeded
  runs are reproducible within this implementation but won't match upstream
  bit-for-bit.
