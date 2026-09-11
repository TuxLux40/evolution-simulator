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
  original's survival criteria), barrier layouts, sensor radii, a manual
  generation cap, and more. Every slider has a paired numeric input box.
- A live canvas showing every creature moving every simulation step, colored
  by a hash of its genome, with an optional pheromone-trail overlay and a
  "preview who'd survive right now" highlight for the active challenge.
  Scroll to zoom (cursor-anchored) and drag to pan; click any creature to
  select it, and camera **follow** keeps it centered as it moves (a "Reset
  view" button appears whenever you've panned/zoomed away from the fit-to-
  window default).
- A **creature inspector**: status, age, location, migration distance,
  genome/neuron/connection counts, a lineage chain (parents and ancestors,
  clickable to jump between them), and a live, *editable* SVG diagram of its
  neural net (sensors → neurons → actions, edges colored/weighted by
  connection sign and strength) — click a neuron to pin it at a fixed value
  (it stops reacting to its inputs for the rest of that creature's life),
  and export the diagram as its own SVG file. Neuron pinning is CPU-backend
  only (the GPU compute shader has no notion of a pinned neuron; the
  controls gray themselves out on GPU).
- **Terrain**: patches of cold (slow) or hot (fast) ground layered
  independently of barriers — a gradient, bands, patches, or random spots —
  which creatures can also sense directly. A stand-in for snow/mud/elevation
  without the cost of full 3D terrain.
- A generation/survivor history chart, and export buttons for a PNG
  snapshot, the current config as JSON, survivor-history as CSV, and a
  WebM video recording (via the browser's own `MediaRecorder`, no extra
  library).
- A **true-randomness** option for kill decisions: when killing is enabled,
  toggling this reseeds a dedicated RNG stream each generation from
  [drand](https://drand.love), the public randomness beacon Cloudflare
  hosts (fed in part by their "lava lamp wall" entropy source, which has no
  public API of its own) — real entropy for the one place in the sim where
  it's actually meaningful (life-or-death), without a network call per
  decision.
- A **Learn** panel (📖 button, bottom-right of the canvas) explaining eleven
  core evolutionary-biology and neuroevolution concepts -- natural
  selection, genotype/phenotype, mutation, sexual vs. asexual reproduction,
  selection pressure, genetic drift, neuroevolution, stigmergy/pheromones,
  kin selection & altruism, adaptation, and population bottlenecks -- each
  with a plain-language explanation *and* a note on exactly how it maps to
  something happening in this simulator. Small **?** icons next to the
  relevant controls open the panel straight to that topic, so you don't
  have to go looking for the connection yourself.
- **Dark/light mode**, defaulting to your OS preference with a manual
  override (persisted), and a **language switcher** (English/German, also
  persisted) covering the full UI and the Learn content. (Not translated:
  the compact sensor/action labels inside the technical brain-diagram SVG
  -- see "Not built (yet)".)
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
  challenges, barriers, terrain) plus the pluggable CPU/GPU feed-forward
  backends, lineage/uid tracking, and the drand true-randomness client.
- `src/render/` — the canvas renderer, the color-from-genome mapping, and
  the brain (neural net) SVG diagram.
- `src/ui/` — the control panel, stats panel, creature inspector, history
  chart, info tooltip, Learn panel, and the shared slider+numeric-input field.
- `src/content/topics.ts` — the ordered list of Learn topics; the actual
  copy (English + German) lives in `src/i18n/translations.ts` alongside
  every other UI string.
- `src/i18n/` — the translation dictionary and the `useI18n()` hook/context.
- `src/theme/` — the light/dark theme context and the canvas color palette
  it drives (`palette.ts`, since `<canvas>` can't read CSS variables cheaply
  every frame).
- `src/export/` — PNG/JSON/CSV/SVG downloads and WebM video recording.
- `src/App.tsx` — wires the engine to the UI and owns top-level state.

## Not built (yet)

A couple of ideas that came up but aren't in yet: save/load of a running
simulation's full state, and GIF export (WebM video covers the same need
with zero extra dependencies). [ilyabrilev's SFML fork](https://github.com/ilyabrilev/biosim4)
of the original C++ project has both and is worth a look for reference.

Also out of scope for now: translating the compact sensor/action labels
used only inside the technical brain-diagram SVG, and any language beyond
English/German (the `src/i18n/translations.ts` dictionary structure makes
adding one mostly a matter of writing the copy).

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
