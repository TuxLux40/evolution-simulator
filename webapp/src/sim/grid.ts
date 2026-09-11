// Port of grid.cpp/h, signals.cpp, and createBarrier.cpp.

import type { Coord } from './geometry';
import { Rng } from './random';
import { BarrierType, TerrainType } from './params';

export const EMPTY = 0;
export const BARRIER = 0xffff;
export const SIGNAL_MAX = 255;

// Terrain speed is a movement-probability multiplier: 1.0 is neutral,
// <1.0 is cold/slow (snow, mud), >1.0 is hot/fast. Sensors normalize against
// this range (see sensors.ts TERRAIN_SPEED).
export const TERRAIN_SPEED_COLD = 0.35;
export const TERRAIN_SPEED_NEUTRAL = 1.0;
export const TERRAIN_SPEED_HOT = 1.75;

export interface TerrainCell extends Coord {
  speed: number;
}

export class Grid {
  sizeX: number;
  sizeY: number;
  private data: Uint16Array;
  private terrainSpeed: Float32Array;
  barrierLocations: Coord[] = [];
  barrierCenters: Coord[] = [];
  terrainLocations: TerrainCell[] = [];

  constructor(sizeX: number, sizeY: number) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.data = new Uint16Array(sizeX * sizeY);
    this.terrainSpeed = new Float32Array(sizeX * sizeY).fill(TERRAIN_SPEED_NEUTRAL);
  }

  private idx(x: number, y: number): number {
    return x * this.sizeY + y;
  }

  zeroFill(): void {
    this.data.fill(0);
    this.terrainSpeed.fill(TERRAIN_SPEED_NEUTRAL);
    this.terrainLocations = [];
  }

  speedAt(loc: Coord): number {
    return this.terrainSpeed[this.idx(loc.x, loc.y)];
  }

  isInBounds(loc: Coord): boolean {
    return loc.x >= 0 && loc.x < this.sizeX && loc.y >= 0 && loc.y < this.sizeY;
  }

  at(loc: Coord): number {
    return this.data[this.idx(loc.x, loc.y)];
  }

  set(loc: Coord, val: number): void {
    this.data[this.idx(loc.x, loc.y)] = val;
  }

  isEmptyAt(loc: Coord): boolean {
    return this.at(loc) === EMPTY;
  }

  isBarrierAt(loc: Coord): boolean {
    return this.at(loc) === BARRIER;
  }

  isOccupiedAt(loc: Coord): boolean {
    const v = this.at(loc);
    return v !== EMPTY && v !== BARRIER;
  }

  isBorder(loc: Coord): boolean {
    return loc.x === 0 || loc.x === this.sizeX - 1 || loc.y === 0 || loc.y === this.sizeY - 1;
  }

  findEmptyLocation(rng: Rng): Coord {
    for (;;) {
      const loc = { x: rng.nextInt(0, this.sizeX - 1), y: rng.nextInt(0, this.sizeY - 1) };
      if (this.isEmptyAt(loc)) return loc;
    }
  }

  createBarrier(barrierType: BarrierType, rng: Rng): void {
    this.barrierLocations = [];
    this.barrierCenters = [];

    const drawBox = (minX: number, minY: number, maxX: number, maxY: number) => {
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.set({ x, y }, BARRIER);
          this.barrierLocations.push({ x, y });
        }
      }
    };

    const { sizeX, sizeY } = this;

    switch (barrierType) {
      case BarrierType.NONE:
        return;

      case BarrierType.VERTICAL_BAR_CONSTANT: {
        const minX = Math.floor(sizeX / 2);
        const maxX = minX + 1;
        const minY = Math.floor(sizeY / 4);
        const maxY = minY + Math.floor(sizeY / 2);
        drawBox(minX, minY, maxX, maxY);
        break;
      }

      case BarrierType.VERTICAL_BAR_RANDOM: {
        const minX = rng.nextInt(20, sizeX - 20);
        const maxX = minX + 1;
        const minY = rng.nextInt(20, Math.floor(sizeY / 2) - 20);
        const maxY = minY + Math.floor(sizeY / 2);
        drawBox(minX, minY, maxX, maxY);
        break;
      }

      case BarrierType.FIVE_STAGGERED_BLOCKS: {
        const blockSizeX = 2;
        const blockSizeY = Math.floor(sizeX / 3);
        let x0 = Math.floor(sizeX / 4 - blockSizeX / 2);
        let y0 = Math.floor(sizeY / 4 - blockSizeY / 2);
        let x1 = x0 + blockSizeX;
        let y1 = y0 + blockSizeY;
        drawBox(x0, y0, x1, y1);
        x0 += Math.floor(sizeX / 2);
        x1 = x0 + blockSizeX;
        drawBox(x0, y0, x1, y1);
        y0 += Math.floor(sizeY / 2);
        y1 = y0 + blockSizeY;
        drawBox(x0, y0, x1, y1);
        x0 -= Math.floor(sizeX / 2);
        x1 = x0 + blockSizeX;
        drawBox(x0, y0, x1, y1);
        x0 = Math.floor(sizeX / 2 - blockSizeX / 2);
        x1 = x0 + blockSizeX;
        y0 = Math.floor(sizeY / 2 - blockSizeY / 2);
        y1 = y0 + blockSizeY;
        drawBox(x0, y0, x1, y1);
        return;
      }

      case BarrierType.HORIZONTAL_BAR: {
        const minX = Math.floor(sizeX / 4);
        const maxX = minX + Math.floor(sizeX / 2);
        const minY = Math.floor(sizeY / 2 + sizeY / 4);
        const maxY = minY + 2;
        drawBox(minX, minY, maxX, maxY);
        break;
      }

      case BarrierType.FLOATING_ISLAND: {
        const radius = 3.0;
        const margin = 2 * Math.floor(radius);
        const randomLoc = (): Coord => ({
          x: rng.nextInt(margin, sizeX - margin),
          y: rng.nextInt(margin, sizeY - margin),
        });
        const center0 = randomLoc();
        this.barrierCenters.push(center0);
        visitNeighborhood(center0, radius, this.sizeX, this.sizeY, (loc) => {
          this.set(loc, BARRIER);
          this.barrierLocations.push(loc);
        });
        break;
      }

      case BarrierType.SPOTS: {
        const numberOfLocations = 5;
        const radius = 5.0;
        const verticalSliceSize = Math.floor(sizeY / (numberOfLocations + 1));
        for (let n = 1; n <= numberOfLocations; n++) {
          const loc = { x: Math.floor(sizeX / 2), y: n * verticalSliceSize };
          visitNeighborhood(loc, radius, this.sizeX, this.sizeY, (l) => {
            this.set(l, BARRIER);
            this.barrierLocations.push(l);
          });
          this.barrierCenters.push(loc);
        }
        break;
      }
    }
  }

  /**
   * Paints a temperature-flavored terrain layer: cold patches slow movement,
   * hot patches speed it up (a stand-in for snow/mud/elevation). Never
   * blocks movement outright the way barriers do.
   */
  createTerrain(terrainType: TerrainType, rng: Rng): void {
    this.terrainSpeed.fill(TERRAIN_SPEED_NEUTRAL);
    this.terrainLocations = [];

    const paint = (loc: Coord, speed: number) => {
      this.terrainSpeed[this.idx(loc.x, loc.y)] = speed;
      this.terrainLocations.push({ ...loc, speed });
    };
    const paintBox = (minX: number, minY: number, maxX: number, maxY: number, speed: number) => {
      for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) paint({ x, y }, speed);
    };

    const { sizeX, sizeY } = this;

    switch (terrainType) {
      case TerrainType.NONE:
        return;

      case TerrainType.GRADIENT: {
        // Smooth west(cold)-to-east(hot) gradient, like a temperature map.
        for (let x = 0; x < sizeX; x++) {
          const speed = TERRAIN_SPEED_COLD + ((TERRAIN_SPEED_HOT - TERRAIN_SPEED_COLD) * x) / Math.max(1, sizeX - 1);
          for (let y = 0; y < sizeY; y++) paint({ x, y }, speed);
        }
        break;
      }

      case TerrainType.COLD_PATCH_CENTER: {
        const radius = Math.min(sizeX, sizeY) / 4;
        const center = { x: Math.floor(sizeX / 2), y: Math.floor(sizeY / 2) };
        visitNeighborhood(center, radius, sizeX, sizeY, (loc) => paint(loc, TERRAIN_SPEED_COLD));
        break;
      }

      case TerrainType.HOT_PATCH_CENTER: {
        const radius = Math.min(sizeX, sizeY) / 4;
        const center = { x: Math.floor(sizeX / 2), y: Math.floor(sizeY / 2) };
        visitNeighborhood(center, radius, sizeX, sizeY, (loc) => paint(loc, TERRAIN_SPEED_HOT));
        break;
      }

      case TerrainType.ALTERNATING_BANDS: {
        const bandHeight = Math.max(1, Math.floor(sizeY / 8));
        for (let band = 0; band < 8; band++) {
          const speed = band % 2 === 0 ? TERRAIN_SPEED_COLD : TERRAIN_SPEED_HOT;
          paintBox(0, band * bandHeight, sizeX - 1, Math.min(sizeY - 1, band * bandHeight + bandHeight - 1), speed);
        }
        break;
      }

      case TerrainType.RANDOM_SPOTS: {
        const numberOfSpots = 8;
        const radius = Math.min(sizeX, sizeY) / 10;
        for (let n = 0; n < numberOfSpots; n++) {
          const center = { x: rng.nextInt(0, sizeX - 1), y: rng.nextInt(0, sizeY - 1) };
          const speed = rng.chance(0.5) ? TERRAIN_SPEED_COLD : TERRAIN_SPEED_HOT;
          visitNeighborhood(center, radius, sizeX, sizeY, (loc) => paint(loc, speed));
        }
        break;
      }
    }
  }
}

export class Signals {
  sizeX: number;
  sizeY: number;
  private data: Uint8Array;

  constructor(sizeX: number, sizeY: number) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.data = new Uint8Array(sizeX * sizeY);
  }

  private idx(x: number, y: number): number {
    return x * this.sizeY + y;
  }

  zeroFill(): void {
    this.data.fill(0);
  }

  getMagnitude(loc: Coord): number {
    return this.data[this.idx(loc.x, loc.y)];
  }

  increment(loc: Coord): void {
    const centerAmount = 2;
    const neighborAmount = 1;
    visitNeighborhood(loc, 1.5, this.sizeX, this.sizeY, (l) => {
      const i = this.idx(l.x, l.y);
      if (this.data[i] < SIGNAL_MAX) this.data[i] = Math.min(SIGNAL_MAX, this.data[i] + neighborAmount);
    });
    const i = this.idx(loc.x, loc.y);
    if (this.data[i] < SIGNAL_MAX) this.data[i] = Math.min(SIGNAL_MAX, this.data[i] + centerAmount);
  }

  fade(): void {
    const fadeAmount = 1;
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = this.data[i] >= fadeAmount ? this.data[i] - fadeAmount : 0;
    }
  }
}

/** Visits every in-bounds location within `radius` of `loc`, including loc itself. */
export function visitNeighborhood(
  loc: Coord,
  radius: number,
  sizeX: number,
  sizeY: number,
  f: (c: Coord) => void,
): void {
  const dxMin = -Math.min(radius, loc.x);
  const dxMax = Math.min(radius, sizeX - loc.x - 1);
  for (let dx = Math.ceil(dxMin); dx <= Math.floor(dxMax); dx++) {
    const x = loc.x + dx;
    const extentY = Math.sqrt(radius * radius - dx * dx);
    const dyMin = -Math.min(extentY, loc.y);
    const dyMax = Math.min(extentY, sizeY - loc.y - 1);
    for (let dy = Math.ceil(dyMin); dy <= Math.floor(dyMax); dy++) {
      f({ x, y: loc.y + dy });
    }
  }
}
