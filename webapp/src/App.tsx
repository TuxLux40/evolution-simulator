import { useEffect, useState } from 'react';
import './App.css';
import { SimulationEngine } from './sim/engine';
import { DEFAULT_PARAMS, type SimParams, type ComputeBackend } from './sim/params';
import { CpuFeedForwardBackend } from './sim/backend';
import { GpuFeedForwardBackend, isWebGpuAvailable } from './sim/gpuFeedForward';
import { WorldCanvas, type WorldStats } from './render/WorldCanvas';
import { ControlPanel, type GpuStatus } from './ui/ControlPanel';
import { StatsPanel } from './ui/StatsPanel';

function App() {
  const [engine] = useState(() => new SimulationEngine(DEFAULT_PARAMS, new CpuFeedForwardBackend()));

  const [params, setParams] = useState<SimParams>({ ...DEFAULT_PARAMS });
  const [running, setRunning] = useState(true);
  const [showPheromones, setShowPheromones] = useState(false);
  const [stats, setStats] = useState<WorldStats | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [gpuStatus, setGpuStatus] = useState<GpuStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    isWebGpuAvailable().then((available) => {
      if (!cancelled) setGpuStatus(available ? 'available' : 'unavailable');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLiveChange = (patch: Partial<SimParams>) => {
    engine.updateParams(patch);
    setParams((p) => ({ ...p, ...patch }));
  };

  const handleApplyStructural = (patch: Partial<SimParams>) => {
    engine.reset(patch);
    setParams((p) => ({ ...p, ...patch }));
    setResetToken((t) => t + 1);
  };

  const handleResetRun = () => {
    engine.reset();
    setResetToken((t) => t + 1);
  };

  const handleBackendChange = async (backend: ComputeBackend) => {
    if (backend === params.computeBackend) return;
    if (backend === 'gpu' && gpuStatus !== 'available') return;
    const instance = backend === 'gpu' ? new GpuFeedForwardBackend() : new CpuFeedForwardBackend();
    try {
      await engine.setBackend(instance);
      engine.updateParams({ computeBackend: backend });
      setParams((p) => ({ ...p, computeBackend: backend }));
    } catch (err) {
      console.error('Failed to switch compute backend', err);
      setGpuStatus('unavailable');
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Evolution Simulator</h1>
        <p>Interactive natural-selection sandbox — a web port of biosim4. Tune the world, watch generations evolve, live.</p>
      </header>
      <div className="app-body">
        <ControlPanel
          params={params}
          onLiveChange={handleLiveChange}
          onApplyStructural={handleApplyStructural}
          gpuStatus={gpuStatus}
          onBackendChange={handleBackendChange}
          running={running}
          onPlayPause={() => setRunning((r) => !r)}
          onStep={() => {
            void engine.stepOnce();
          }}
          onResetRun={handleResetRun}
          showPheromones={showPheromones}
          onTogglePheromones={setShowPheromones}
        />
        <main className="canvas-area">
          <WorldCanvas
            engine={engine}
            running={running}
            stepsPerFrame={params.stepsPerFrame}
            showPheromones={showPheromones}
            onStats={setStats}
            resetToken={resetToken}
          />
        </main>
        <StatsPanel stats={stats} />
      </div>
    </div>
  );
}

export default App;
