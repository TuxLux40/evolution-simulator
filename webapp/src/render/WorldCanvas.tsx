import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { SimulationEngine, EngineSnapshot } from '../sim/engine';
import { colorFromHash } from './colorFromGenome';

export interface WorldStats {
  generation: number;
  simStep: number;
  stepsPerGeneration: number;
  maxGenerations: number;
  aliveCount: number;
  lastSurvivorCount: number;
  survivorHistory: number[];
  population: number;
  isFinished: boolean;
}

export interface WorldCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  resetView: () => void;
}

interface WorldCanvasProps {
  engine: SimulationEngine;
  running: boolean;
  stepsPerFrame: number;
  showPheromones: boolean;
  onStats?: (stats: WorldStats) => void;
  onRunComplete?: () => void;
  /** Bump this to force an immediate redraw (e.g. after a manual reset). */
  resetToken: number;
  selectedUid: number | null;
  followUid: number | null;
  onSelectCreature: (uid: number | null) => void;
  onFollowLost: () => void;
  showSurvivorPreview: boolean;
}

const FOLLOW_WINDOW = 30; // world cells shown across when following a creature
const DRAG_THRESHOLD_PX = 4;
const ZOOM_STEP = 1.15;

interface ViewWindow {
  vx0: number;
  vy0: number;
  vx1: number;
  vy1: number;
}

/** A user-controlled pan/zoom window, independent of the follow-a-creature window. */
interface ManualView {
  vx0: number;
  vy0: number;
  spanX: number;
  spanY: number;
}

interface ViewTransform extends ViewWindow {
  cell: number;
  offsetX: number;
  offsetY: number;
}

function computeFollowWindow(sizeX: number, sizeY: number, followPos: { x: number; y: number }): ViewWindow {
  const w = Math.min(FOLLOW_WINDOW, sizeX);
  const h = Math.min(FOLLOW_WINDOW, sizeY);
  const vx0 = Math.max(0, Math.min(sizeX - w, Math.round(followPos.x - w / 2)));
  const vy0 = Math.max(0, Math.min(sizeY - h, Math.round(followPos.y - h / 2)));
  return { vx0, vy0, vx1: vx0 + w, vy1: vy0 + h };
}

function resolveView(
  sizeX: number,
  sizeY: number,
  followPos: { x: number; y: number } | null,
  manualView: ManualView | null,
): ViewWindow {
  if (followPos) return computeFollowWindow(sizeX, sizeY, followPos);
  if (manualView) {
    const spanX = Math.min(manualView.spanX, sizeX);
    const spanY = Math.min(manualView.spanY, sizeY);
    const vx0 = Math.max(0, Math.min(sizeX - spanX, manualView.vx0));
    const vy0 = Math.max(0, Math.min(sizeY - spanY, manualView.vy0));
    return { vx0, vy0, vx1: vx0 + spanX, vy1: vy0 + spanY };
  }
  return { vx0: 0, vy0: 0, vx1: sizeX, vy1: sizeY };
}

function draw(
  ctx: CanvasRenderingContext2D,
  snapshot: EngineSnapshot,
  cssWidth: number,
  cssHeight: number,
  showPheromones: boolean,
  view: ViewWindow,
  selectedUid: number | null,
  survivorPreview: Set<number> | null,
): ViewTransform {
  const spanX = view.vx1 - view.vx0;
  const spanY = view.vy1 - view.vy0;
  const cell = Math.max(1, Math.min(cssWidth / spanX, cssHeight / spanY));
  const offsetX = (cssWidth - cell * spanX) / 2;
  const offsetY = (cssHeight - cell * spanY) / 2;
  const transform: ViewTransform = { ...view, cell, offsetX, offsetY };

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  const toCanvasX = (worldX: number) => offsetX + (worldX - view.vx0) * cell;
  const toCanvasY = (worldY: number) => offsetY + (view.vy1 - 1 - worldY) * cell; // flip so Y grows upward

  const inView = (x: number, y: number) => x >= view.vx0 && x < view.vx1 && y >= view.vy0 && y < view.vy1;

  if (showPheromones) {
    for (let x = view.vx0; x < view.vx1; x++) {
      for (let y = view.vy0; y < view.vy1; y++) {
        const mag = snapshot.signalMagnitudeAt(x, y);
        if (mag === 0) continue;
        ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(0.5, mag / 255)})`;
        ctx.fillRect(toCanvasX(x), toCanvasY(y), cell, cell);
      }
    }
  }

  for (const t of snapshot.terrainLocations) {
    if (!inView(t.x, t.y)) continue;
    // t.speed is 0.35 (cold) .. 1.75 (hot), 1.0 neutral -- map to a blue..amber tint.
    const warmth = Math.max(0, Math.min(1, (t.speed - 0.35) / (1.75 - 0.35)));
    const r = Math.round(30 + warmth * 160);
    const g = Math.round(60 + warmth * 60);
    const b = Math.round(140 - warmth * 100);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
    ctx.fillRect(toCanvasX(t.x), toCanvasY(t.y), cell, cell);
  }

  ctx.fillStyle = '#374151';
  for (const b of snapshot.barrierLocations) {
    if (!inView(b.x, b.y)) continue;
    ctx.fillRect(toCanvasX(b.x), toCanvasY(b.y), cell, cell);
  }

  const dotSize = Math.max(1.5, cell * 0.9);
  let selectedCanvasPos: { cx: number; cy: number } | null = null;
  for (const indiv of snapshot.individuals) {
    if (!inView(indiv.x, indiv.y)) continue;
    ctx.fillStyle = colorFromHash(indiv.colorHash);
    const cx = toCanvasX(indiv.x) + cell / 2;
    const cy = toCanvasY(indiv.y) + cell / 2;
    if (dotSize <= 2.5) {
      ctx.fillRect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (indiv.uid === selectedUid) selectedCanvasPos = { cx, cy };
    if (survivorPreview?.has(indiv.uid)) {
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(dotSize * 0.7, 3), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (selectedCanvasPos) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(selectedCanvasPos.cx, selectedCanvasPos.cy, Math.max(dotSize, 6), 0, Math.PI * 2);
    ctx.stroke();
  }

  return transform;
}

export const WorldCanvas = forwardRef<WorldCanvasHandle, WorldCanvasProps>(function WorldCanvas(
  {
    engine,
    running,
    stepsPerFrame,
    showPheromones,
    onStats,
    onRunComplete,
    resetToken,
    selectedUid,
    followUid,
    onSelectCreature,
    onFollowLost,
    showSurvivorPreview,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runningRef = useRef(running);
  const stepsPerFrameRef = useRef(stepsPerFrame);
  const showPheromonesRef = useRef(showPheromones);
  const selectedUidRef = useRef(selectedUid);
  const followUidRef = useRef(followUid);
  const showSurvivorPreviewRef = useRef(showSurvivorPreview);
  const onStatsRef = useRef(onStats);
  const onRunCompleteRef = useRef(onRunComplete);
  const onFollowLostRef = useRef(onFollowLost);
  const statsThrottleRef = useRef(0);
  const survivorPreviewThrottleRef = useRef(0);
  const survivorPreviewRef = useRef<Set<number> | null>(null);
  const lastTransformRef = useRef<ViewTransform | null>(null);
  const lastSnapshotRef = useRef<EngineSnapshot | null>(null);
  const notifiedFinishedRef = useRef(false);
  const manualViewRef = useRef<ManualView | null>(null);
  const suppressClickRef = useRef(false);
  const [isManualView, setIsManualView] = useState(false);

  runningRef.current = running;
  stepsPerFrameRef.current = stepsPerFrame;
  showPheromonesRef.current = showPheromones;
  selectedUidRef.current = selectedUid;
  followUidRef.current = followUid;
  showSurvivorPreviewRef.current = showSurvivorPreview;
  onStatsRef.current = onStats;
  onRunCompleteRef.current = onRunComplete;
  onFollowLostRef.current = onFollowLost;

  useImperativeHandle(
    ref,
    () => ({
      getCanvas: () => canvasRef.current,
      resetView: () => {
        manualViewRef.current = null;
        setIsManualView(false);
      },
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    let raf = 0;
    notifiedFinishedRef.current = false;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const currentManualView = (): ManualView => {
      if (manualViewRef.current) return manualViewRef.current;
      const t = lastTransformRef.current;
      const snapshot = lastSnapshotRef.current;
      if (t) return { vx0: t.vx0, vy0: t.vy0, spanX: t.vx1 - t.vx0, spanY: t.vy1 - t.vy0 };
      return { vx0: 0, vy0: 0, spanX: snapshot?.sizeX ?? 1, spanY: snapshot?.sizeY ?? 1 };
    };

    const onWheel = (e: WheelEvent) => {
      if (followUidRef.current !== null) return; // follow mode owns the camera
      const snapshot = lastSnapshotRef.current;
      const transform = lastTransformRef.current;
      if (!snapshot || !transform) return;
      e.preventDefault();

      const cur = currentManualView();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      // World point currently under the cursor, using the last-drawn transform.
      const worldX = cur.vx0 + (px - transform.offsetX) / transform.cell;
      const worldY = cur.vy0 + cur.spanY - 1 - (py - transform.offsetY) / transform.cell;

      const zoomFactor = e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const minSpanX = Math.max(4, snapshot.sizeX / 40);
      const minSpanY = Math.max(4, snapshot.sizeY / 40);
      const newSpanX = Math.min(snapshot.sizeX, Math.max(minSpanX, cur.spanX * zoomFactor));
      const newSpanY = Math.min(snapshot.sizeY, Math.max(minSpanY, cur.spanY * zoomFactor));

      if (newSpanX >= snapshot.sizeX && newSpanY >= snapshot.sizeY) {
        manualViewRef.current = null;
        setIsManualView(false);
        return;
      }

      // Approximate the same cell size across this (small) zoom step so the
      // cursor-anchored point stays put; any drift self-corrects next tick.
      const cell2 = Math.max(1, Math.min(rect.width / newSpanX, rect.height / newSpanY));
      let newVx0 = worldX - (px - transform.offsetX) / cell2;
      let newVy0 = worldY - newSpanY + 1 + (py - transform.offsetY) / cell2;
      newVx0 = Math.max(0, Math.min(snapshot.sizeX - newSpanX, newVx0));
      newVy0 = Math.max(0, Math.min(snapshot.sizeY - newSpanY, newVy0));

      manualViewRef.current = { vx0: newVx0, vy0: newVy0, spanX: newSpanX, spanY: newSpanY };
      setIsManualView(true);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    let drag: { startPx: number; startPy: number; startVx0: number; startVy0: number; spanX: number; spanY: number; moved: boolean } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (followUidRef.current !== null) return;
      if (e.button !== 0) return;
      const cur = currentManualView();
      drag = { startPx: e.clientX, startPy: e.clientY, startVx0: cur.vx0, startVy0: cur.vy0, spanX: cur.spanX, spanY: cur.spanY, moved: false };
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.startPx;
      const dy = e.clientY - drag.startPy;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      suppressClickRef.current = true;
      const transform = lastTransformRef.current;
      const snapshot = lastSnapshotRef.current;
      if (!transform || !snapshot) return;
      let newVx0 = drag.startVx0 - dx / transform.cell;
      let newVy0 = drag.startVy0 + dy / transform.cell;
      newVx0 = Math.max(0, Math.min(snapshot.sizeX - drag.spanX, newVx0));
      newVy0 = Math.max(0, Math.min(snapshot.sizeY - drag.spanY, newVy0));
      manualViewRef.current = { vx0: newVx0, vy0: newVy0, spanX: drag.spanX, spanY: drag.spanY };
      setIsManualView(true);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (drag) canvas.releasePointerCapture(e.pointerId);
      drag = null;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    async function loop() {
      if (cancelled) return;
      if (runningRef.current) {
        const steps = Math.max(1, Math.floor(stepsPerFrameRef.current));
        for (let i = 0; i < steps; i++) {
          await engine.stepOnce();
          if (cancelled) return;
        }
      }
      const snapshot = engine.getSnapshot();
      lastSnapshotRef.current = snapshot;

      let followPos: { x: number; y: number } | null = null;
      if (followUidRef.current !== null) {
        const found = snapshot.individuals.find((i) => i.uid === followUidRef.current);
        if (found) {
          followPos = { x: found.x, y: found.y };
          if (manualViewRef.current) {
            manualViewRef.current = null;
            setIsManualView(false);
          }
        } else {
          onFollowLostRef.current?.();
        }
      }
      const view = resolveView(snapshot.sizeX, snapshot.sizeY, followPos, manualViewRef.current);

      if (showSurvivorPreviewRef.current) {
        survivorPreviewThrottleRef.current++;
        if (survivorPreviewThrottleRef.current % 5 === 0 || !survivorPreviewRef.current) {
          survivorPreviewRef.current = engine.getSurvivorPreview();
        }
      } else {
        survivorPreviewRef.current = null;
      }

      const rect = container!.getBoundingClientRect();
      const transform = draw(
        ctx!,
        snapshot,
        rect.width,
        rect.height,
        showPheromonesRef.current,
        view,
        selectedUidRef.current,
        survivorPreviewRef.current,
      );
      lastTransformRef.current = transform;

      if (snapshot.isFinished && !notifiedFinishedRef.current) {
        notifiedFinishedRef.current = true;
        onRunCompleteRef.current?.();
      } else if (!snapshot.isFinished) {
        notifiedFinishedRef.current = false;
      }

      statsThrottleRef.current++;
      if (onStatsRef.current && statsThrottleRef.current % 3 === 0) {
        onStatsRef.current({
          generation: snapshot.generation,
          simStep: snapshot.simStep,
          stepsPerGeneration: snapshot.stepsPerGeneration,
          maxGenerations: snapshot.maxGenerations,
          aliveCount: snapshot.aliveCount,
          lastSurvivorCount: snapshot.lastSurvivorCount,
          survivorHistory: snapshot.survivorHistory,
          population: engine.params.population,
          isFinished: snapshot.isFinished,
        });
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      ro.disconnect();
      cancelAnimationFrame(raf);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, resetToken]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const transform = lastTransformRef.current;
    const snapshot = lastSnapshotRef.current;
    if (!transform || !snapshot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    let nearestUid: number | null = null;
    let nearestDist = Infinity;
    const clickRadius = Math.max(10, transform.cell * 1.5);
    for (const indiv of snapshot.individuals) {
      if (indiv.x < transform.vx0 || indiv.x >= transform.vx1 || indiv.y < transform.vy0 || indiv.y >= transform.vy1) continue;
      const cx = transform.offsetX + (indiv.x - transform.vx0) * transform.cell + transform.cell / 2;
      const cy = transform.offsetY + (transform.vy1 - 1 - indiv.y) * transform.cell + transform.cell / 2;
      const dist = Math.hypot(cx - px, cy - py);
      if (dist < clickRadius && dist < nearestDist) {
        nearestDist = dist;
        nearestUid = indiv.uid;
      }
    }
    onSelectCreature(nearestUid);
  };

  return (
    <div ref={containerRef} className="world-canvas-container">
      <canvas ref={canvasRef} onClick={handleClick} />
      {isManualView && followUid === null && (
        <button
          className="reset-view-button"
          onClick={() => {
            manualViewRef.current = null;
            setIsManualView(false);
          }}
        >
          ⤢ Reset view
        </button>
      )}
    </div>
  );
});
