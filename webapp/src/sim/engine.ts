// Top-level orchestration: the generation/simStep loop, spawning, and the
// public snapshot API used for rendering. Ported from simulator.cpp,
// spawnNewGeneration.cpp, peeps.cpp, and endOfSimStep.cpp.

import { Rng, makeSeed } from './random';
import { fetchTrueRandomSeed } from './trueRandom';
import { randomDir8, coordAsDir, coordLength, coordSub, type Coord } from './geometry';
import { Grid, Signals, type TerrainCell } from './grid';
import {
  makeRandomGenome,
  generateChildGenome,
  createWiringFromGenome,
  genomeColorHash,
  type Genome,
  type Gene,
  type ParentCandidate,
} from './genome';
import { executeActions } from './actions';
import { passedSurvivalCriterion, passedAltruismSacrifice, applyPerStepChallenge } from './challenges';
import { Challenge, type SimParams } from './params';
import type { Indiv } from './individual';
import type { SimWorld } from './world';
import type { FeedForwardBackend } from './backend';
import { CpuFeedForwardBackend } from './backend';

export interface RenderIndiv {
  uid: number;
  x: number;
  y: number;
  colorHash: number;
}

export interface EngineSnapshot {
  sizeX: number;
  sizeY: number;
  generation: number;
  simStep: number;
  stepsPerGeneration: number;
  maxGenerations: number;
  aliveCount: number;
  lastSurvivorCount: number;
  survivorHistory: number[];
  barrierLocations: Coord[];
  terrainLocations: TerrainCell[];
  individuals: RenderIndiv[];
  signalMagnitudeAt: (x: number, y: number) => number;
  isFinished: boolean;
}

export interface IndividualDetail {
  uid: number;
  index: number;
  alive: boolean;
  loc: Coord;
  birthLoc: Coord;
  migrationDistance: number;
  age: number;
  generation: number;
  genomeLength: number;
  responsiveness: number;
  oscPeriod: number;
  longProbeDist: number;
  colorHash: number;
  parentUids: [number, number] | null;
  neurons: Array<{ output: number; driven: boolean }>;
  connections: Gene[];
}

export interface LineageRecord {
  uid: number;
  generation: number;
  parentUids: [number, number] | null;
  genomeLength: number;
  colorHash: number;
}

const LINEAGE_LOG_CAP = 20000;

export class SimulationEngine {
  params: SimParams;
  private grid: Grid;
  private signals: Signals;
  private individuals: Indiv[];
  private rng: Rng;
  private killRng: Rng;
  private generation = 0;
  private simStep = 0;
  private survivorHistory: number[] = [];
  private lastSurvivorCount = 0;
  private backend: FeedForwardBackend;
  private world: SimWorld;

  private nextUid = 1;
  private uidToIndex = new Map<number, number>();
  private lineageLog = new Map<number, LineageRecord>();
  private lineageOrder: number[] = []; // uids in insertion order, for FIFO eviction

  constructor(params: SimParams, backend: FeedForwardBackend = new CpuFeedForwardBackend()) {
    this.params = { ...params };
    this.grid = new Grid(params.sizeX, params.sizeY);
    this.signals = new Signals(params.sizeX, params.sizeY);
    this.individuals = new Array(params.population + 1);
    this.rng = new Rng(params.deterministic ? params.rngSeed : makeSeed());
    this.killRng = new Rng(makeSeed());
    this.backend = backend;
    this.world = {
      grid: this.grid,
      signals: this.signals,
      individuals: this.individuals,
      params: this.params,
      rng: this.rng,
      killRng: this.killRng,
      simStep: 0,
      deathQueue: [],
      moveQueue: [],
    };
    this.initializeGeneration0();
  }

  /** Reseeds the kill-decision RNG stream from a real drand beacon fetch. Fire-and-forget; falls back silently to its current seed if the fetch fails. */
  async reseedKillRngFromDrand(): Promise<void> {
    try {
      const seed = await fetchTrueRandomSeed();
      this.killRng = new Rng(seed);
      this.world.killRng = this.killRng;
    } catch (err) {
      console.warn('Could not fetch a true-random seed for kill decisions; keeping the previous stream.', err);
    }
  }

  async setBackend(backend: FeedForwardBackend): Promise<void> {
    // Fully prepare the new backend before swapping it in -- the render loop
    // keeps calling stepOnce() concurrently, and swapping first would let it
    // hit the new backend before its buffers/device are ready.
    await backend.prepareGeneration(this.world);
    const old = this.backend;
    this.backend = backend;
    old.dispose();
  }

  private spawnIndividual(index: number, loc: Coord, genome: Genome, parentUids: [number, number] | null): Indiv {
    const uid = this.nextUid++;
    const indiv: Indiv = {
      alive: true,
      index,
      uid,
      generation: this.generation,
      parentUids,
      loc,
      birthLoc: { ...loc },
      age: 0,
      genome,
      nnet: createWiringFromGenome(genome, this.params),
      responsiveness: 0.5,
      oscPeriod: 34,
      longProbeDist: this.params.longProbeDistance,
      lastMoveDir: randomDir8(this.rng),
      challengeBits: 0,
    };
    this.grid.set(loc, index);
    this.uidToIndex.set(uid, index);

    this.lineageLog.set(uid, {
      uid,
      generation: this.generation,
      parentUids,
      genomeLength: genome.length,
      colorHash: genomeColorHash(genome),
    });
    this.lineageOrder.push(uid);
    if (this.lineageOrder.length > LINEAGE_LOG_CAP) {
      const evicted = this.lineageOrder.shift()!;
      this.lineageLog.delete(evicted);
    }

    return indiv;
  }

  private initializeGeneration0(): void {
    this.generation = 0;
    this.grid.zeroFill();
    this.grid.createBarrier(this.params.barrierType, this.rng);
    this.grid.createTerrain(this.params.terrainType, this.rng);
    this.signals.zeroFill();
    this.uidToIndex.clear();
    for (let index = 1; index <= this.params.population; index++) {
      const genome = makeRandomGenome(this.rng, this.params.genomeInitialLength);
      const loc = this.grid.findEmptyLocation(this.rng);
      this.individuals[index] = this.spawnIndividual(index, loc, genome, null);
    }
    this.simStep = 0;
    void this.backend.prepareGeneration(this.world);
    if (this.params.killEnable && this.params.killUsesTrueRng) void this.reseedKillRngFromDrand();
  }

  private initializeNewGeneration(parents: ParentCandidate[]): void {
    this.grid.zeroFill();
    this.grid.createBarrier(this.params.barrierType, this.rng);
    this.grid.createTerrain(this.params.terrainType, this.rng);
    this.signals.zeroFill();
    this.uidToIndex.clear();
    for (let index = 1; index <= this.params.population; index++) {
      const { genome, parentUids } = generateChildGenome(parents, this.params, this.rng);
      const loc = this.grid.findEmptyLocation(this.rng);
      this.individuals[index] = this.spawnIndividual(index, loc, genome, parentUids);
    }
    this.simStep = 0;
    if (this.params.killEnable && this.params.killUsesTrueRng) void this.reseedKillRngFromDrand();
  }

  /** Restarts the whole run with fresh random genomes, keeping current params. */
  reset(params?: Partial<SimParams>): void {
    if (params) this.params = { ...this.params, ...params };
    this.grid = new Grid(this.params.sizeX, this.params.sizeY);
    this.signals = new Signals(this.params.sizeX, this.params.sizeY);
    this.individuals = new Array(this.params.population + 1);
    this.rng = new Rng(this.params.deterministic ? this.params.rngSeed : makeSeed());
    this.killRng = new Rng(makeSeed());
    this.survivorHistory = [];
    this.lastSurvivorCount = 0;
    this.world.grid = this.grid;
    this.world.signals = this.signals;
    this.world.individuals = this.individuals;
    this.world.params = this.params;
    this.world.rng = this.rng;
    this.world.killRng = this.killRng;
    this.world.deathQueue = [];
    this.world.moveQueue = [];
    this.nextUid = 1;
    this.uidToIndex.clear();
    this.lineageLog.clear();
    this.lineageOrder = [];
    this.initializeGeneration0();
  }

  /** Applies params that don't require a full reset (most behavioral knobs). */
  updateParams(patch: Partial<SimParams>): void {
    Object.assign(this.params, patch);
  }

  private endGeneration(): void {
    const { params, individuals } = this;
    const parents: Array<{ index: number; score: number }> = [];

    if (params.challenge !== Challenge.ALTRUISM) {
      for (let index = 1; index <= params.population; index++) {
        const indiv = individuals[index];
        const result = passedSurvivalCriterion(this.world, indiv, params.challenge);
        if (result.passed && indiv.nnet.connections.length > 0) parents.push({ index, score: result.score });
      }
    } else {
      // Simplified vs. upstream: spawning-zone survivors reproduce; the
      // elaborate kinship-based rescue of sacrificed individuals is omitted.
      for (let index = 1; index <= params.population; index++) {
        const indiv = individuals[index];
        const result = passedSurvivalCriterion(this.world, indiv, Challenge.ALTRUISM);
        if (result.passed && indiv.nnet.connections.length > 0) {
          parents.push({ index, score: result.score });
        } else {
          passedAltruismSacrifice(this.world, indiv); // zone check kept for future UI stat
        }
      }
    }

    parents.sort((a, b) => b.score - a.score); // descending: best score first, matching upstream's parent-bias indexing
    const parentCandidates: ParentCandidate[] = parents.map((p) => ({
      uid: individuals[p.index].uid,
      genome: individuals[p.index].genome,
    }));

    this.lastSurvivorCount = parentCandidates.length;
    this.survivorHistory.push(parentCandidates.length);
    if (this.survivorHistory.length > 500) this.survivorHistory.shift();

    if (parentCandidates.length > 0) {
      this.generation++;
      this.initializeNewGeneration(parentCandidates);
    } else {
      this.initializeGeneration0();
    }
    void this.backend.prepareGeneration(this.world);
  }

  /** True once the configured generation limit (if any) has been reached. */
  isFinished(): boolean {
    return this.params.maxGenerations > 0 && this.generation >= this.params.maxGenerations;
  }

  async stepOnce(): Promise<void> {
    if (this.isFinished()) return;
    const { params, individuals } = this.world;
    this.world.simStep = this.simStep;

    for (let index = 1; index <= params.population; index++) {
      const indiv = individuals[index];
      if (indiv.alive) indiv.age++;
    }

    const actionLevelsByIndex = await this.backend.evaluateStep(this.world);

    for (let index = 1; index <= params.population; index++) {
      const indiv = individuals[index];
      if (!indiv.alive) continue;
      const levels = actionLevelsByIndex[index];
      if (levels) executeActions(this.world, indiv, levels);
    }

    applyPerStepChallenge(this.world);

    // Drain death queue
    const deaths = new Set(this.world.deathQueue);
    for (const index of deaths) {
      const indiv = individuals[index];
      if (indiv.alive) {
        this.grid.set(indiv.loc, 0);
        indiv.alive = false;
      }
    }
    this.world.deathQueue = [];

    // Drain move queue
    for (const move of this.world.moveQueue) {
      const indiv = individuals[move.index];
      if (indiv.alive && this.grid.isEmptyAt(move.newLoc)) {
        const moveDir = coordAsDir({ x: move.newLoc.x - indiv.loc.x, y: move.newLoc.y - indiv.loc.y });
        this.grid.set(indiv.loc, 0);
        this.grid.set(move.newLoc, indiv.index);
        indiv.loc = move.newLoc;
        indiv.lastMoveDir = moveDir;
      }
    }
    this.world.moveQueue = [];

    this.signals.fade();

    this.simStep++;
    if (this.simStep >= params.stepsPerGeneration) {
      this.endGeneration();
    }
  }

  /** uids of currently-alive creatures that would pass the active challenge right now (a live preview, not a commitment -- positions keep changing). */
  getSurvivorPreview(): Set<number> {
    const uids = new Set<number>();
    const challenge = this.params.challenge === Challenge.ALTRUISM ? Challenge.ALTRUISM : this.params.challenge;
    for (let index = 1; index <= this.params.population; index++) {
      const indiv = this.individuals[index];
      if (indiv?.alive && passedSurvivalCriterion(this.world, indiv, challenge).passed) uids.add(indiv.uid);
    }
    return uids;
  }

  getSnapshot(): EngineSnapshot {
    const individuals: RenderIndiv[] = [];
    let aliveCount = 0;
    for (let index = 1; index <= this.params.population; index++) {
      const indiv = this.individuals[index];
      if (indiv && indiv.alive) {
        aliveCount++;
        individuals.push({ uid: indiv.uid, x: indiv.loc.x, y: indiv.loc.y, colorHash: genomeColorHash(indiv.genome) });
      }
    }
    return {
      sizeX: this.params.sizeX,
      sizeY: this.params.sizeY,
      generation: this.generation,
      simStep: this.simStep,
      stepsPerGeneration: this.params.stepsPerGeneration,
      maxGenerations: this.params.maxGenerations,
      aliveCount,
      lastSurvivorCount: this.lastSurvivorCount,
      survivorHistory: this.survivorHistory,
      barrierLocations: this.grid.barrierLocations,
      terrainLocations: this.grid.terrainLocations,
      individuals,
      signalMagnitudeAt: (x: number, y: number) => this.signals.getMagnitude({ x, y }),
      isFinished: this.isFinished(),
    };
  }

  /** Full detail for one creature (for the selection/inspector panel), by its stable uid. */
  getIndividualDetail(uid: number): IndividualDetail | null {
    const index = this.uidToIndex.get(uid);
    if (index === undefined) return null;
    const indiv = this.individuals[index];
    if (!indiv || indiv.uid !== uid) return null;

    return {
      uid: indiv.uid,
      index: indiv.index,
      alive: indiv.alive,
      loc: indiv.loc,
      birthLoc: indiv.birthLoc,
      migrationDistance: coordLength(coordSub(indiv.loc, indiv.birthLoc)),
      age: indiv.age,
      generation: indiv.generation,
      genomeLength: indiv.genome.length,
      responsiveness: indiv.responsiveness,
      oscPeriod: indiv.oscPeriod,
      longProbeDist: indiv.longProbeDist,
      colorHash: genomeColorHash(indiv.genome),
      parentUids: indiv.parentUids,
      neurons: indiv.nnet.neurons.map((n) => ({ ...n })),
      connections: indiv.nnet.connections.map((c) => ({ ...c })),
    };
  }

  /** Walks the (memory-bounded) lineage log backward from `uid`, oldest ancestor last. */
  getLineage(uid: number, maxDepth = 8): LineageRecord[] {
    const chain: LineageRecord[] = [];
    let current = this.lineageLog.get(uid);
    const seen = new Set<number>();
    while (current && chain.length < maxDepth && !seen.has(current.uid)) {
      chain.push(current);
      seen.add(current.uid);
      const nextUid = current.parentUids ? current.parentUids[0] : undefined;
      current = nextUid !== undefined ? this.lineageLog.get(nextUid) : undefined;
    }
    return chain;
  }
}
