import { useEffect, useRef, useState } from 'react';
import './App.css';
import { SimulationEngine } from './sim/engine';
import { DEFAULT_PARAMS, type SimParams, type ComputeBackend } from './sim/params';
import { CpuFeedForwardBackend } from './sim/backend';
import { GpuFeedForwardBackend, isWebGpuAvailable } from './sim/gpuFeedForward';
import { fetchTrueRandomSeed } from './sim/trueRandom';
import { WorldCanvas, type WorldStats, type WorldCanvasHandle } from './render/WorldCanvas';
import { ControlPanel, type GpuStatus } from './ui/ControlPanel';
import { StatsPanel } from './ui/StatsPanel';
import { CreatureInspector } from './ui/CreatureInspector';
import { exportConfigJSON, exportStatsCSV, exportCanvasPNG, CanvasVideoRecorder } from './export/exporters';

function App() {
  const [engine] = useState(() => new SimulationEngine(DEFAULT_PARAMS, new CpuFeedForwardBackend()));
  const canvasHandleRef = useRef<WorldCanvasHandle | null>(null);
  const [recorder] = useState(() => new CanvasVideoRecorder());

  const [params, setParams] = useState<SimParams>({ ...DEFAULT_PARAMS });
  const [running, setRunning] = useState(true);
  const [showPheromones, setShowPheromones] = useState(false);
  const [showSurvivorPreview, setShowSurvivorPreview] = useState(false);
  const [stats, setStats] = useState<WorldStats | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [gpuStatus, setGpuStatus] = useState<GpuStatus>('checking');
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [followUid, setFollowUid] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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
    if (patch.killUsesTrueRng) void engine.reseedKillRngFromDrand();
  };

  const clearSelection = () => {
    setSelectedUid(null);
    setFollowUid(null);
  };

  const handleApplyStructural = (patch: Partial<SimParams>) => {
    engine.reset(patch);
    setParams((p) => ({ ...p, ...patch }));
    setResetToken((t) => t + 1);
    clearSelection();
  };

  const handleResetRun = () => {
    engine.reset();
    setResetToken((t) => t + 1);
    clearSelection();
  };

  const handleFetchTrueRandomSeed = async () => {
    const seed = await fetchTrueRandomSeed();
    handleApplyStructural({ deterministic: true, rngSeed: seed });
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

  const handleSelectCreature = (uid: number | null) => {
    setSelectedUid(uid);
    if (uid === null) setFollowUid(null);
  };

  const handleToggleFollow = () => {
    setFollowUid((current) => (current === selectedUid ? null : selectedUid));
  };

  const handleFollowLost = () => setFollowUid(null);

  const handleRunComplete = () => setRunning(false);

  const handleExportSnapshot = () => {
    const canvas = canvasHandleRef.current?.getCanvas();
    if (canvas) exportCanvasPNG(canvas);
  };

  const handleExportConfig = () => exportConfigJSON(params);
  const handleExportStats = () => exportStatsCSV(stats?.survivorHistory ?? []);

  const handleToggleRecording = () => {
    const canvas = canvasHandleRef.current?.getCanvas();
    if (!canvas) return;
    if (recorder.isRecording) {
      recorder.stopAndDownload();
      setIsRecording(false);
    } else {
      recorder.start(canvas);
      setIsRecording(true);
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
          onFetchTrueRandomSeed={handleFetchTrueRandomSeed}
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
          showSurvivorPreview={showSurvivorPreview}
          onToggleSurvivorPreview={setShowSurvivorPreview}
          onExportConfig={handleExportConfig}
          onExportStats={handleExportStats}
          onExportSnapshot={handleExportSnapshot}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
        />
        <main className="canvas-area">
          <WorldCanvas
            ref={canvasHandleRef}
            engine={engine}
            running={running}
            stepsPerFrame={params.stepsPerFrame}
            showPheromones={showPheromones}
            onStats={setStats}
            onRunComplete={handleRunComplete}
            resetToken={resetToken}
            selectedUid={selectedUid}
            followUid={followUid}
            onSelectCreature={handleSelectCreature}
            onFollowLost={handleFollowLost}
            showSurvivorPreview={showSurvivorPreview}
          />
          {stats?.isFinished && (
            <div className="run-complete-banner">
              <span>Run complete — reached generation {stats.generation}.</span>
              <button onClick={() => handleLiveChange({ maxGenerations: params.maxGenerations + 50 })}>Run 50 more</button>
              <button className="secondary" onClick={() => handleLiveChange({ maxGenerations: 0 })}>
                Remove limit
              </button>
            </div>
          )}
        </main>
        {selectedUid !== null ? (
          <CreatureInspector
            key={selectedUid}
            engine={engine}
            uid={selectedUid}
            isFollowing={followUid === selectedUid}
            onToggleFollow={handleToggleFollow}
            onClose={() => clearSelection()}
            onSelectUid={setSelectedUid}
          />
        ) : (
          <StatsPanel stats={stats} />
        )}
      </div>
    </div>
  );
}

export default App;
