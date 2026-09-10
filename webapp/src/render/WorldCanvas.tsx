import { useEffect, useRef } from 'react';
import type { SimulationEngine, EngineSnapshot } from '../sim/engine';
import { colorFromHash } from './colorFromGenome';

export interface WorldStats {
  generation: number;
  simStep: number;
  stepsPerGeneration: number;
  aliveCount: number;
  lastSurvivorCount: number;
  survivorHistory: number[];
  population: number;
}

interface WorldCanvasProps {
  engine: SimulationEngine;
  running: boolean;
  stepsPerFrame: number;
  showPheromones: boolean;
  onStats?: (stats: WorldStats) => void;
  /** Bump this to force an immediate redraw (e.g. after a manual reset). */
  resetToken: number;
}

function draw(
  ctx: CanvasRenderingContext2D,
  snapshot: EngineSnapshot,
  cssWidth: number,
  cssHeight: number,
  showPheromones: boolean,
): void {
  const cell = Math.max(1, Math.min(cssWidth / snapshot.sizeX, cssHeight / snapshot.sizeY));
  const offsetX = (cssWidth - cell * snapshot.sizeX) / 2;
  const offsetY = (cssHeight - cell * snapshot.sizeY) / 2;

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  const toCanvasY = (worldY: number) => snapshot.sizeY - 1 - worldY; // flip so Y grows upward

  if (showPheromones) {
    for (let x = 0; x < snapshot.sizeX; x++) {
      for (let y = 0; y < snapshot.sizeY; y++) {
        const mag = snapshot.signalMagnitudeAt(x, y);
        if (mag === 0) continue;
        ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(0.5, mag / 255)})`;
        ctx.fillRect(offsetX + x * cell, offsetY + toCanvasY(y) * cell, cell, cell);
      }
    }
  }

  ctx.fillStyle = '#374151';
  for (const b of snapshot.barrierLocations) {
    ctx.fillRect(offsetX + b.x * cell, offsetY + toCanvasY(b.y) * cell, cell, cell);
  }

  const dotSize = Math.max(1.5, cell * 0.9);
  for (const indiv of snapshot.individuals) {
    ctx.fillStyle = colorFromHash(indiv.colorHash);
    const cx = offsetX + indiv.x * cell + cell / 2;
    const cy = offsetY + toCanvasY(indiv.y) * cell + cell / 2;
    if (dotSize <= 2.5) {
      ctx.fillRect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function WorldCanvas({ engine, running, stepsPerFrame, showPheromones, onStats, resetToken }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runningRef = useRef(running);
  const stepsPerFrameRef = useRef(stepsPerFrame);
  const showPheromonesRef = useRef(showPheromones);
  const onStatsRef = useRef(onStats);
  const statsThrottleRef = useRef(0);

  runningRef.current = running;
  stepsPerFrameRef.current = stepsPerFrame;
  showPheromonesRef.current = showPheromones;
  onStatsRef.current = onStats;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    let raf = 0;

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
      const rect = container!.getBoundingClientRect();
      draw(ctx!, snapshot, rect.width, rect.height, showPheromonesRef.current);

      statsThrottleRef.current++;
      if (onStatsRef.current && statsThrottleRef.current % 3 === 0) {
        onStatsRef.current({
          generation: snapshot.generation,
          simStep: snapshot.simStep,
          stepsPerGeneration: snapshot.stepsPerGeneration,
          aliveCount: snapshot.aliveCount,
          lastSurvivorCount: snapshot.lastSurvivorCount,
          survivorHistory: snapshot.survivorHistory,
          population: engine.params.population,
        });
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, resetToken]);

  return (
    <div ref={containerRef} className="world-canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
