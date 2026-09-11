// Port of getSensor.cpp.

import { coordAdd, coordSub, dirToNormalizedCoord, dirRotate90CW, type Coord, type Compass } from './geometry';
import { visitNeighborhood, TERRAIN_SPEED_COLD, TERRAIN_SPEED_HOT } from './grid';
import { genomeSimilarity } from './genome';
import { Sensor } from './sensorsActions';
import type { Indiv } from './individual';
import type { SimWorld } from './world';

function getPopulationDensityAlongAxis(world: SimWorld, loc: Coord, dir: Compass): number {
  const { grid, params } = world;
  let sum = 0;
  const dirVec = dirToNormalizedCoord(dir);
  const len = Math.sqrt(dirVec.x * dirVec.x + dirVec.y * dirVec.y);
  const dvx = dirVec.x / len;
  const dvy = dirVec.y / len;

  visitNeighborhood(loc, params.populationSensorRadius, grid.sizeX, grid.sizeY, (tloc) => {
    if ((tloc.x !== loc.x || tloc.y !== loc.y) && grid.isOccupiedAt(tloc)) {
      const offset = coordSub(tloc, loc);
      const proj = dvx * offset.x + dvy * offset.y;
      sum += proj / (offset.x * offset.x + offset.y * offset.y);
    }
  });

  const maxSumMag = 6.0 * params.populationSensorRadius;
  let sensorVal = sum / maxSumMag;
  sensorVal = (sensorVal + 1.0) / 2.0;
  return sensorVal;
}

function getShortProbeBarrierDistance(world: SimWorld, loc0: Coord, dir: Compass, probeDistance: number): number {
  const { grid } = world;
  const dirVec = dirToNormalizedCoord(dir);
  let countFwd = 0;
  let countRev = 0;
  let loc = coordAdd(loc0, dirVec);
  let n = probeDistance;
  while (n > 0 && grid.isInBounds(loc) && !grid.isBarrierAt(loc)) {
    countFwd++;
    loc = coordAdd(loc, dirVec);
    n--;
  }
  if (n > 0 && !grid.isInBounds(loc)) countFwd = probeDistance;

  n = probeDistance;
  loc = coordSub(loc0, dirVec);
  while (n > 0 && grid.isInBounds(loc) && !grid.isBarrierAt(loc)) {
    countRev++;
    loc = coordSub(loc, dirVec);
    n--;
  }
  if (n > 0 && !grid.isInBounds(loc)) countRev = probeDistance;

  let sensorVal = countFwd - countRev + probeDistance;
  sensorVal = sensorVal / 2.0 / probeDistance;
  return sensorVal;
}

function getSignalDensity(world: SimWorld, loc: Coord): number {
  const { grid, signals, params } = world;
  let countLocs = 0;
  let sum = 0;
  visitNeighborhood(loc, params.signalSensorRadius, grid.sizeX, grid.sizeY, (tloc) => {
    countLocs++;
    sum += signals.getMagnitude(tloc);
  });
  const maxSum = countLocs * 255;
  return sum / maxSum;
}

function getSignalDensityAlongAxis(world: SimWorld, loc: Coord, dir: Compass): number {
  const { grid, signals, params } = world;
  let sum = 0;
  const dirVec = dirToNormalizedCoord(dir);
  const len = Math.sqrt(dirVec.x * dirVec.x + dirVec.y * dirVec.y);
  const dvx = dirVec.x / len;
  const dvy = dirVec.y / len;

  visitNeighborhood(loc, params.signalSensorRadius, grid.sizeX, grid.sizeY, (tloc) => {
    if (tloc.x !== loc.x || tloc.y !== loc.y) {
      const offset = coordSub(tloc, loc);
      const proj = dvx * offset.x + dvy * offset.y;
      sum += (proj * signals.getMagnitude(tloc)) / (offset.x * offset.x + offset.y * offset.y);
    }
  });

  const maxSumMag = 6.0 * params.signalSensorRadius * 255;
  let sensorVal = sum / maxSumMag;
  sensorVal = (sensorVal + 1.0) / 2.0;
  return sensorVal;
}

function longProbePopulationFwd(world: SimWorld, loc0: Coord, dir: Compass, longProbeDist: number): number {
  const { grid } = world;
  const dirVec = dirToNormalizedCoord(dir);
  let count = 0;
  let loc = coordAdd(loc0, dirVec);
  let n = longProbeDist;
  while (n > 0 && grid.isInBounds(loc) && grid.isEmptyAt(loc)) {
    count++;
    loc = coordAdd(loc, dirVec);
    n--;
  }
  if (n > 0 && (!grid.isInBounds(loc) || grid.isBarrierAt(loc))) return longProbeDist;
  return count;
}

function longProbeBarrierFwd(world: SimWorld, loc0: Coord, dir: Compass, longProbeDist: number): number {
  const { grid } = world;
  const dirVec = dirToNormalizedCoord(dir);
  let count = 0;
  let loc = coordAdd(loc0, dirVec);
  let n = longProbeDist;
  while (n > 0 && grid.isInBounds(loc) && !grid.isBarrierAt(loc)) {
    count++;
    loc = coordAdd(loc, dirVec);
    n--;
  }
  if (n > 0 && !grid.isInBounds(loc)) return longProbeDist;
  return count;
}

export function getSensor(world: SimWorld, indiv: Indiv, sensorNum: Sensor): number {
  const { grid, params, rng, simStep } = world;
  let sensorVal = 0.0;

  switch (sensorNum) {
    case Sensor.AGE:
      sensorVal = indiv.age / params.stepsPerGeneration;
      break;
    case Sensor.BOUNDARY_DIST: {
      const distX = Math.min(indiv.loc.x, params.sizeX - indiv.loc.x - 1);
      const distY = Math.min(indiv.loc.y, params.sizeY - indiv.loc.y - 1);
      const closest = Math.min(distX, distY);
      const maxPossible = Math.max(params.sizeX / 2 - 1, params.sizeY / 2 - 1);
      sensorVal = closest / maxPossible;
      break;
    }
    case Sensor.BOUNDARY_DIST_X: {
      const minDistX = Math.min(indiv.loc.x, params.sizeX - indiv.loc.x - 1);
      sensorVal = minDistX / (params.sizeX / 2.0);
      break;
    }
    case Sensor.BOUNDARY_DIST_Y: {
      const minDistY = Math.min(indiv.loc.y, params.sizeY - indiv.loc.y - 1);
      sensorVal = minDistY / (params.sizeY / 2.0);
      break;
    }
    case Sensor.LAST_MOVE_DIR_X: {
      const lastX = dirToNormalizedCoord(indiv.lastMoveDir).x;
      sensorVal = lastX === 0 ? 0.5 : lastX === -1 ? 0.0 : 1.0;
      break;
    }
    case Sensor.LAST_MOVE_DIR_Y: {
      const lastY = dirToNormalizedCoord(indiv.lastMoveDir).y;
      sensorVal = lastY === 0 ? 0.5 : lastY === -1 ? 0.0 : 1.0;
      break;
    }
    case Sensor.LOC_X:
      sensorVal = indiv.loc.x / (params.sizeX - 1);
      break;
    case Sensor.LOC_Y:
      sensorVal = indiv.loc.y / (params.sizeY - 1);
      break;
    case Sensor.OSC1: {
      const phase = (simStep % indiv.oscPeriod) / indiv.oscPeriod;
      let factor = -Math.cos(phase * 2.0 * Math.PI);
      factor += 1.0;
      factor /= 2.0;
      sensorVal = Math.min(1.0, Math.max(0.0, factor));
      break;
    }
    case Sensor.LONGPROBE_POP_FWD:
      sensorVal = longProbePopulationFwd(world, indiv.loc, indiv.lastMoveDir, indiv.longProbeDist) / indiv.longProbeDist;
      break;
    case Sensor.LONGPROBE_BAR_FWD:
      sensorVal = longProbeBarrierFwd(world, indiv.loc, indiv.lastMoveDir, indiv.longProbeDist) / indiv.longProbeDist;
      break;
    case Sensor.POPULATION: {
      let countLocs = 0;
      let countOccupied = 0;
      visitNeighborhood(indiv.loc, params.populationSensorRadius, grid.sizeX, grid.sizeY, (tloc) => {
        countLocs++;
        if (grid.isOccupiedAt(tloc)) countOccupied++;
      });
      sensorVal = countOccupied / countLocs;
      break;
    }
    case Sensor.POPULATION_FWD:
      sensorVal = getPopulationDensityAlongAxis(world, indiv.loc, indiv.lastMoveDir);
      break;
    case Sensor.POPULATION_LR:
      sensorVal = getPopulationDensityAlongAxis(world, indiv.loc, dirRotate90CW(indiv.lastMoveDir));
      break;
    case Sensor.BARRIER_FWD:
      sensorVal = getShortProbeBarrierDistance(world, indiv.loc, indiv.lastMoveDir, params.shortProbeBarrierDistance);
      break;
    case Sensor.BARRIER_LR:
      sensorVal = getShortProbeBarrierDistance(world, indiv.loc, dirRotate90CW(indiv.lastMoveDir), params.shortProbeBarrierDistance);
      break;
    case Sensor.RANDOM:
      sensorVal = rng.nextFloat();
      break;
    case Sensor.SIGNAL0:
      sensorVal = getSignalDensity(world, indiv.loc);
      break;
    case Sensor.SIGNAL0_FWD:
      sensorVal = getSignalDensityAlongAxis(world, indiv.loc, indiv.lastMoveDir);
      break;
    case Sensor.SIGNAL0_LR:
      sensorVal = getSignalDensityAlongAxis(world, indiv.loc, dirRotate90CW(indiv.lastMoveDir));
      break;
    case Sensor.TERRAIN_SPEED:
      // Terrain temperature at the current cell, normalized from the
      // cold..hot speed range to the sensor's 0..1 range.
      sensorVal = (grid.speedAt(indiv.loc) - TERRAIN_SPEED_COLD) / (TERRAIN_SPEED_HOT - TERRAIN_SPEED_COLD);
      break;
    case Sensor.GENETIC_SIM_FWD: {
      const loc2 = coordAdd(indiv.loc, dirToNormalizedCoord(indiv.lastMoveDir));
      if (grid.isInBounds(loc2) && grid.isOccupiedAt(loc2)) {
        const other = world.individuals[grid.at(loc2)];
        if (other && other.alive) sensorVal = genomeSimilarity(indiv.genome, other.genome);
      }
      break;
    }
    default:
      sensorVal = 0;
  }

  if (Number.isNaN(sensorVal)) sensorVal = 0;
  return Math.max(0, Math.min(1, sensorVal));
}
