// Port of survival-criteria.cpp (end-of-generation scoring) and the
// per-simStep challenge hooks from endOfSimStep.cpp.

import { coordLength, coordSub, type Coord } from './geometry';
import { visitNeighborhood } from './grid';
import { Challenge } from './params';
import type { Indiv } from './individual';
import type { SimWorld } from './world';

export interface SurvivalResult {
  passed: boolean;
  score: number;
}

const FAIL: SurvivalResult = { passed: false, score: 0 };

export function passedSurvivalCriterion(world: SimWorld, indiv: Indiv, challenge: Challenge): SurvivalResult {
  if (!indiv.alive) return FAIL;
  const { params, grid } = world;
  const sizeX = params.sizeX;
  const sizeY = params.sizeY;

  switch (challenge) {
    case Challenge.CIRCLE: {
      const safeCenter: Coord = { x: Math.floor(sizeX / 4), y: Math.floor(sizeY / 4) };
      const radius = sizeX / 4.0;
      const distance = coordLength(coordSub(safeCenter, indiv.loc));
      return distance <= radius ? { passed: true, score: (radius - distance) / radius } : FAIL;
    }

    case Challenge.RIGHT_HALF:
      return indiv.loc.x > sizeX / 2 ? { passed: true, score: 1 } : FAIL;

    case Challenge.RIGHT_QUARTER:
      return indiv.loc.x > sizeX / 2 + sizeX / 4 ? { passed: true, score: 1 } : FAIL;

    case Challenge.LEFT_EIGHTH:
      return indiv.loc.x < sizeX / 8 ? { passed: true, score: 1 } : FAIL;

    case Challenge.STRING: {
      const minNeighbors = 2;
      const maxNeighbors = 22;
      const radius = 1.5;
      if (grid.isBorder(indiv.loc)) return FAIL;
      let count = 0;
      visitNeighborhood(indiv.loc, radius, grid.sizeX, grid.sizeY, (loc2) => {
        if (grid.isOccupiedAt(loc2)) count++;
      });
      return count >= minNeighbors && count <= maxNeighbors ? { passed: true, score: 1 } : FAIL;
    }

    case Challenge.CENTER_WEIGHTED: {
      const safeCenter: Coord = { x: Math.floor(sizeX / 2), y: Math.floor(sizeY / 2) };
      const radius = sizeX / 3.0;
      const distance = coordLength(coordSub(safeCenter, indiv.loc));
      return distance <= radius ? { passed: true, score: (radius - distance) / radius } : FAIL;
    }

    case Challenge.CENTER_UNWEIGHTED: {
      const safeCenter: Coord = { x: Math.floor(sizeX / 2), y: Math.floor(sizeY / 2) };
      const radius = sizeX / 3.0;
      const distance = coordLength(coordSub(safeCenter, indiv.loc));
      return distance <= radius ? { passed: true, score: 1 } : FAIL;
    }

    case Challenge.CENTER_SPARSE: {
      const safeCenter: Coord = { x: Math.floor(sizeX / 2), y: Math.floor(sizeY / 2) };
      const outerRadius = sizeX / 4.0;
      const innerRadius = 1.5;
      const minNeighbors = 5;
      const maxNeighbors = 8;
      const distance = coordLength(coordSub(safeCenter, indiv.loc));
      if (distance <= outerRadius) {
        let count = 0;
        visitNeighborhood(indiv.loc, innerRadius, grid.sizeX, grid.sizeY, (loc2) => {
          if (grid.isOccupiedAt(loc2)) count++;
        });
        if (count >= minNeighbors && count <= maxNeighbors) return { passed: true, score: 1 };
      }
      return FAIL;
    }

    case Challenge.CORNER: {
      const radius = sizeX / 8.0;
      const corners: Coord[] = [
        { x: 0, y: 0 },
        { x: 0, y: sizeY - 1 },
        { x: sizeX - 1, y: 0 },
        { x: sizeX - 1, y: sizeY - 1 },
      ];
      for (const c of corners) {
        if (coordLength(coordSub(c, indiv.loc)) <= radius) return { passed: true, score: 1 };
      }
      return FAIL;
    }

    case Challenge.CORNER_WEIGHTED: {
      const radius = sizeX / 4.0;
      const corners: Coord[] = [
        { x: 0, y: 0 },
        { x: 0, y: sizeY - 1 },
        { x: sizeX - 1, y: 0 },
        { x: sizeX - 1, y: sizeY - 1 },
      ];
      for (const c of corners) {
        const distance = coordLength(coordSub(c, indiv.loc));
        if (distance <= radius) return { passed: true, score: (radius - distance) / radius };
      }
      return FAIL;
    }

    case Challenge.RADIOACTIVE_WALLS:
      return { passed: true, score: 1 };

    case Challenge.AGAINST_ANY_WALL: {
      const onEdge = indiv.loc.x === 0 || indiv.loc.x === sizeX - 1 || indiv.loc.y === 0 || indiv.loc.y === sizeY - 1;
      return onEdge ? { passed: true, score: 1 } : FAIL;
    }

    case Challenge.TOUCH_ANY_WALL:
      return indiv.challengeBits !== 0 ? { passed: true, score: 1 } : FAIL;

    case Challenge.MIGRATE_DISTANCE: {
      let distance = coordLength(coordSub(indiv.loc, indiv.birthLoc));
      distance = distance / Math.max(sizeX, sizeY);
      return { passed: true, score: distance };
    }

    case Challenge.EAST_WEST_EIGHTHS:
      return indiv.loc.x < sizeX / 8 || indiv.loc.x >= sizeX - sizeX / 8 ? { passed: true, score: 1 } : FAIL;

    case Challenge.NEAR_BARRIER: {
      const radius = sizeX / 2;
      let minDistance = 1e8;
      for (const center of grid.barrierCenters) {
        const distance = coordLength(coordSub(indiv.loc, center));
        if (distance < minDistance) minDistance = distance;
      }
      return minDistance <= radius ? { passed: true, score: 1 - minDistance / radius } : FAIL;
    }

    case Challenge.PAIRS: {
      const onEdge = indiv.loc.x === 0 || indiv.loc.x === sizeX - 1 || indiv.loc.y === 0 || indiv.loc.y === sizeY - 1;
      if (onEdge) return FAIL;
      let count = 0;
      for (let x = indiv.loc.x - 1; x <= indiv.loc.x + 1; x++) {
        for (let y = indiv.loc.y - 1; y <= indiv.loc.y + 1; y++) {
          const tloc = { x, y };
          if ((tloc.x !== indiv.loc.x || tloc.y !== indiv.loc.y) && grid.isInBounds(tloc) && grid.isOccupiedAt(tloc)) {
            count++;
            if (count === 1) {
              for (let x1 = tloc.x - 1; x1 <= tloc.x + 1; x1++) {
                for (let y1 = tloc.y - 1; y1 <= tloc.y + 1; y1++) {
                  const tloc1 = { x: x1, y: y1 };
                  if (
                    (tloc1.x !== tloc.x || tloc1.y !== tloc.y) &&
                    (tloc1.x !== indiv.loc.x || tloc1.y !== indiv.loc.y) &&
                    grid.isInBounds(tloc1) &&
                    grid.isOccupiedAt(tloc1)
                  ) {
                    return FAIL;
                  }
                }
              }
            } else {
              return FAIL;
            }
          }
        }
      }
      return count === 1 ? { passed: true, score: 1 } : FAIL;
    }

    case Challenge.LOCATION_SEQUENCE: {
      let count = 0;
      const bits = indiv.challengeBits;
      for (let n = 0; n < 32; n++) if (bits & (1 << n)) count++;
      return count > 0 ? { passed: true, score: count / 32 } : FAIL;
    }

    case Challenge.ALTRUISM: {
      const safeCenter: Coord = { x: Math.floor(sizeX / 4), y: Math.floor(sizeY / 4) };
      const radius = sizeX / 4.0;
      const distance = coordLength(coordSub(safeCenter, indiv.loc));
      return distance <= radius ? { passed: true, score: (radius - distance) / radius } : FAIL;
    }

    default:
      return FAIL;
  }
}

/** The "altruism sacrifice" zone -- used only alongside Challenge.ALTRUISM. */
export function passedAltruismSacrifice(world: SimWorld, indiv: Indiv): SurvivalResult {
  const { params } = world;
  const radius = params.sizeX / 4.0;
  const distance = coordLength(coordSub({ x: params.sizeX - params.sizeX / 4, y: params.sizeY - params.sizeY / 4 }, indiv.loc));
  return distance <= radius ? { passed: true, score: (radius - distance) / radius } : FAIL;
}

/** Per-simStep challenge bookkeeping, ported from endOfSimStep.cpp. */
export function applyPerStepChallenge(world: SimWorld): void {
  const { params, grid, individuals } = world;

  if (params.challenge === Challenge.RADIOACTIVE_WALLS) {
    const radioactiveX = world.simStep < params.stepsPerGeneration / 2 ? 0 : params.sizeX - 1;
    for (let index = 1; index <= params.population; index++) {
      const indiv = individuals[index];
      if (!indiv.alive) continue;
      const distanceFromWall = Math.abs(indiv.loc.x - radioactiveX);
      if (distanceFromWall < params.sizeX / 2 && distanceFromWall > 0) {
        const chanceOfDeath = 1.0 / distanceFromWall;
        if (world.rng.nextFloat() < chanceOfDeath) world.deathQueue.push(index);
      }
    }
  }

  if (params.challenge === Challenge.TOUCH_ANY_WALL) {
    for (let index = 1; index <= params.population; index++) {
      const indiv = individuals[index];
      if (indiv.loc.x === 0 || indiv.loc.x === params.sizeX - 1 || indiv.loc.y === 0 || indiv.loc.y === params.sizeY - 1) {
        indiv.challengeBits = 1;
      }
    }
  }

  if (params.challenge === Challenge.LOCATION_SEQUENCE) {
    const radius = 9.0;
    for (let index = 1; index <= params.population; index++) {
      const indiv = individuals[index];
      for (let n = 0; n < grid.barrierCenters.length; n++) {
        const bit = 1 << n;
        if ((indiv.challengeBits & bit) === 0) {
          if (coordLength(coordSub(indiv.loc, grid.barrierCenters[n])) <= radius) indiv.challengeBits |= bit;
          break;
        }
      }
    }
  }
}
