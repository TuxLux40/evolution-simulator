// Port of executeActions.cpp.

import { coordAdd, dirRotate90CW, dirRotate90CCW, dirToNormalizedCoord, randomDir8 } from './geometry';
import { Action } from './sensorsActions';
import type { Indiv } from './individual';
import type { SimWorld } from './world';

function prob2bool(world: SimWorld, factor: number): boolean {
  return world.rng.nextFloat() < factor;
}

function responseCurve(r: number, kFactor: number): number {
  const k = kFactor;
  return Math.pow(r - 2.0, -2.0 * k) - Math.pow(2.0, -2.0 * k) * (1.0 - r);
}

export function executeActions(world: SimWorld, indiv: Indiv, actionLevels: Float32Array): void {
  // Responsiveness: convert to 0..1
  {
    const level = actionLevels[Action.SET_RESPONSIVENESS];
    indiv.responsiveness = (Math.tanh(level) + 1.0) / 2.0;
  }

  const responsivenessAdjusted = responseCurve(indiv.responsiveness, world.params.responsivenessCurveKFactor);

  // Oscillator period: nonlinear map to 2..~1200
  {
    const periodf = actionLevels[Action.SET_OSCILLATOR_PERIOD];
    const newPeriodf01 = (Math.tanh(periodf) + 1.0) / 2.0;
    indiv.oscPeriod = 1 + Math.floor(1.5 + Math.exp(7.0 * newPeriodf01));
  }

  // Long probe distance: 1..33
  {
    const maxLongProbeDistance = 32;
    let level = actionLevels[Action.SET_LONGPROBE_DIST];
    level = (Math.tanh(level) + 1.0) / 2.0;
    level = 1 + level * maxLongProbeDistance;
    indiv.longProbeDist = Math.floor(level);
  }

  // Emit pheromone
  {
    const emitThreshold = 0.5;
    let level = actionLevels[Action.EMIT_SIGNAL0];
    level = (Math.tanh(level) + 1.0) / 2.0;
    level *= responsivenessAdjusted;
    if (level > emitThreshold && prob2bool(world, level)) {
      world.signals.increment(indiv.loc);
    }
  }

  // Kill forward -- runtime-gated by params.killEnable (see sensorsActions.ts note)
  if (world.params.killEnable) {
    const killThreshold = 0.5;
    let level = actionLevels[Action.KILL_FORWARD];
    level = (Math.tanh(level) + 1.0) / 2.0;
    level *= responsivenessAdjusted;
    if (level > killThreshold && prob2bool(world, level)) {
      const otherLoc = coordAdd(indiv.loc, dirToNormalizedCoord(indiv.lastMoveDir));
      if (world.grid.isInBounds(otherLoc) && world.grid.isOccupiedAt(otherLoc)) {
        const otherIndex = world.grid.at(otherLoc);
        world.deathQueue.push(otherIndex);
      }
    }
  }

  // ---- Movement ----
  const lastMoveOffset = dirToNormalizedCoord(indiv.lastMoveDir);
  let moveX = actionLevels[Action.MOVE_X];
  let moveY = actionLevels[Action.MOVE_Y];

  moveX += actionLevels[Action.MOVE_EAST];
  moveX -= actionLevels[Action.MOVE_WEST];
  moveY += actionLevels[Action.MOVE_NORTH];
  moveY -= actionLevels[Action.MOVE_SOUTH];

  {
    const level = actionLevels[Action.MOVE_FORWARD];
    moveX += lastMoveOffset.x * level;
    moveY += lastMoveOffset.y * level;
  }
  {
    const level = actionLevels[Action.MOVE_REVERSE];
    moveX -= lastMoveOffset.x * level;
    moveY -= lastMoveOffset.y * level;
  }
  {
    const level = actionLevels[Action.MOVE_LEFT];
    const offset = dirToNormalizedCoord(dirRotate90CCW(indiv.lastMoveDir));
    moveX += offset.x * level;
    moveY += offset.y * level;
  }
  {
    const level = actionLevels[Action.MOVE_RIGHT];
    const offset = dirToNormalizedCoord(dirRotate90CW(indiv.lastMoveDir));
    moveX += offset.x * level;
    moveY += offset.y * level;
  }
  {
    const level = actionLevels[Action.MOVE_RL];
    const offset = dirToNormalizedCoord(dirRotate90CW(indiv.lastMoveDir));
    moveX += offset.x * level;
    moveY += offset.y * level;
  }
  {
    const level = actionLevels[Action.MOVE_RANDOM];
    const offset = dirToNormalizedCoord(randomDir8(world.rng));
    moveX += offset.x * level;
    moveY += offset.y * level;
  }

  moveX = Math.tanh(moveX) * responsivenessAdjusted;
  moveY = Math.tanh(moveY) * responsivenessAdjusted;

  const probX = prob2bool(world, Math.abs(moveX)) ? 1 : 0;
  const probY = prob2bool(world, Math.abs(moveY)) ? 1 : 0;
  const signumX = moveX < 0 ? -1 : 1;
  const signumY = moveY < 0 ? -1 : 1;

  const movementOffset = { x: probX * signumX, y: probY * signumY };
  if (movementOffset.x !== 0 || movementOffset.y !== 0) {
    const newLoc = coordAdd(indiv.loc, movementOffset);
    if (world.grid.isInBounds(newLoc) && world.grid.isEmptyAt(newLoc)) {
      world.moveQueue.push({ index: indiv.index, newLoc });
    }
  }
}
