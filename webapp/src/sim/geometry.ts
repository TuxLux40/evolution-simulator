// Port of biosim4's basicTypes.h/.cpp: an 8-direction compass plus CENTER,
// and integer grid coordinates. Ported as plain numbers/objects for speed
// (this runs once per sensor/action per creature per simStep).

import { Rng } from './random';

// Compass arithmetic values:
//   6  7  8
//   3  4  5
//   0  1  2
// Plain const object instead of TS `enum` (erasableSyntaxOnly build).
export const Compass = {
  SW: 0,
  S: 1,
  SE: 2,
  W: 3,
  CENTER: 4,
  E: 5,
  NW: 6,
  N: 7,
  NE: 8,
} as const;
export type Compass = (typeof Compass)[keyof typeof Compass];

export type Coord = { x: number; y: number };

export function coord(x = 0, y = 0): Coord {
  return { x, y };
}

export function coordAdd(a: Coord, b: Coord): Coord {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function coordSub(a: Coord, b: Coord): Coord {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function coordEq(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function coordLength(c: Coord): number {
  return Math.floor(Math.sqrt(c.x * c.x + c.y * c.y));
}

const NORMALIZED_COORDS: Coord[] = [
  { x: -1, y: -1 }, // SW
  { x: 0, y: -1 }, // S
  { x: 1, y: -1 }, // SE
  { x: -1, y: 0 }, // W
  { x: 0, y: 0 }, // CENTER
  { x: 1, y: 0 }, // E
  { x: -1, y: 1 }, // NW
  { x: 0, y: 1 }, // N
  { x: 1, y: 1 }, // NE
];

export function dirToNormalizedCoord(dir: Compass): Coord {
  return NORMALIZED_COORDS[dir];
}

// rotations[dir*8 + (n&7)] -- exact port of the 72-entry table in basicTypes.cpp
const ROTATIONS: Compass[] = [
  Compass.SW, Compass.W, Compass.NW, Compass.N, Compass.NE, Compass.E, Compass.SE, Compass.S,
  Compass.S, Compass.SW, Compass.W, Compass.NW, Compass.N, Compass.NE, Compass.E, Compass.SE,
  Compass.SE, Compass.S, Compass.SW, Compass.W, Compass.NW, Compass.N, Compass.NE, Compass.E,
  Compass.W, Compass.NW, Compass.N, Compass.NE, Compass.E, Compass.SE, Compass.S, Compass.SW,
  Compass.CENTER, Compass.CENTER, Compass.CENTER, Compass.CENTER, Compass.CENTER, Compass.CENTER, Compass.CENTER, Compass.CENTER,
  Compass.E, Compass.SE, Compass.S, Compass.SW, Compass.W, Compass.NW, Compass.N, Compass.NE,
  Compass.NW, Compass.N, Compass.NE, Compass.E, Compass.SE, Compass.S, Compass.SW, Compass.W,
  Compass.N, Compass.NE, Compass.E, Compass.SE, Compass.S, Compass.SW, Compass.W, Compass.NW,
  Compass.NE, Compass.E, Compass.SE, Compass.S, Compass.SW, Compass.W, Compass.NW, Compass.N,
];

export function dirRotate(dir: Compass, n: number): Compass {
  return ROTATIONS[dir * 8 + (((n % 8) + 8) % 8)];
}

export function dirRotate90CW(dir: Compass): Compass {
  return dirRotate(dir, 2);
}

export function dirRotate90CCW(dir: Compass): Compass {
  return dirRotate(dir, -2);
}

export function randomDir8(rng: Rng): Compass {
  return dirRotate(Compass.N, rng.nextInt(0, 7));
}

// Converts a coordinate offset to the nearest of the 8 compass directions.
// Faithful port of Coord::asDir() (22.5-degree sector boundaries).
const TAN_N = 13860;
const TAN_D = 33461;
const ASDIR_CONVERSION: Compass[] = [
  Compass.S, Compass.CENTER, Compass.SW, Compass.N, Compass.SE, Compass.E, Compass.N,
  Compass.N, Compass.N, Compass.N, Compass.W, Compass.NW, Compass.N, Compass.NE, Compass.N, Compass.N,
];

export function coordAsDir(c: Coord): Compass {
  const xp = c.x * TAN_D + c.y * TAN_N;
  const yp = c.y * TAN_D - c.x * TAN_N;
  const idx = ((yp > 0 ? 1 : 0) * 8) + ((xp > 0 ? 1 : 0) * 4) + ((yp > xp ? 1 : 0) * 2) + (yp >= -xp ? 1 : 0);
  return ASDIR_CONVERSION[idx];
}

// -1.0 (opposite) .. 1.0 (same direction). Returns 1.0 if either vector is zero.
export function raySameness(a: Coord, b: Coord): number {
  const magSq = (a.x * a.x + a.y * a.y) * (b.x * b.x + b.y * b.y);
  if (magSq === 0) return 1.0;
  return (a.x * b.x + a.y * b.y) / Math.sqrt(magSq);
}

export function raySamenessDir(a: Coord, dir: Compass): number {
  return raySameness(a, dirToNormalizedCoord(dir));
}
