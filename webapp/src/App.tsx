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
import { LearnPanel } from './ui/LearnPanel';
import { exportConfigJSON, exportStatsCSV, exportCanvasPNG, CanvasVideoRecorder } from './export/exporters';
import { useTheme, type ThemeMode } from './theme/ThemeContext';
import { useI18n, LANGUAGES } from './i18n/I18nContext';
import type { Language } from './i18n/translations';
import type { TopicKey } from './content/topics';

function App() {
  const [engine] = useState(() => new SimulationEngine(DEFAULT_PARAMS, new CpuFeedForwardBackend()));
  const canvasHandleRef = useRef<WorldCanvasHandle | null>(null);
  const [recorder] = useState(() => new CanvasVideoRecorder());
  const { mode: themeMode, resolvedTheme, setMode: setThemeMode } = useTheme();
  const { language, setLanguage, t } = useI18n();

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
  const [learnTopic, setLearnTopic] = useState<TopicKey | null | undefined>(undefined); // undefined = closed

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

  const openLearn = (topic: TopicKey) => setLearnTopic(topic);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-text">
          <h1>{t('app.title')}</h1>
          <p>{t('app.tagline')}</p>
        </div>
        <div className="app-header-controls">
          <select aria-label={t('header.language')} value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            {Object.entries(LANGUAGES).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <div className="theme-toggle-group">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
              <button key={m} className={themeMode === m ? 'active' : ''} onClick={() => setThemeMode(m)} title={t(`header.theme${m[0].toUpperCase()}${m.slice(1)}`)}>
                {m === 'light' ? '☀️' : m === 'dark' ? '🌙' : '💻'}
              </button>
            ))}
          </div>
        </div>
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
          onOpenLearn={openLearn}
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
            theme={resolvedTheme}
          />
          {stats?.isFinished && (
            <div className="run-complete-banner">
              <span>{t('app.runComplete', { gen: stats.generation })}</span>
              <button onClick={() => handleLiveChange({ maxGenerations: params.maxGenerations + 50 })}>{t('app.run50More')}</button>
              <button className="secondary" onClick={() => handleLiveChange({ maxGenerations: 0 })}>
                {t('app.removeLimit')}
              </button>
            </div>
          )}
          <button className="learn-button" onClick={() => setLearnTopic(null)}>
            {t('learn.button')}
          </button>
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
            onOpenLearn={openLearn}
          />
        ) : (
          <StatsPanel stats={stats} onOpenLearn={openLearn} />
        )}
      </div>
      {learnTopic !== undefined && <LearnPanel initialTopic={learnTopic} onClose={() => setLearnTopic(undefined)} />}
    </div>
  );
}

export default App;
