// Export helpers: config JSON, stats CSV, canvas PNG snapshot, and WebM video
// recording via the browser's own MediaRecorder (no extra library needed).

import type { SimParams } from '../sim/params';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function exportConfigJSON(params: SimParams): void {
  const blob = new Blob([JSON.stringify(params, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `evolution-sim-config-${timestamp()}.json`);
}

export function exportStatsCSV(survivorHistory: number[]): void {
  const rows = ['generation,survivors', ...survivorHistory.map((count, gen) => `${gen},${count}`)];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  downloadBlob(blob, `evolution-sim-stats-${timestamp()}.csv`);
}

export function exportCanvasPNG(canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `evolution-sim-snapshot-${timestamp()}.png`);
  }, 'image/png');
}

export function exportSvgElement(svg: SVGSVGElement, filenamePrefix: string): void {
  const serialized = new XMLSerializer().serializeToString(svg);
  const withHeader = `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`;
  const blob = new Blob([withHeader], { type: 'image/svg+xml' });
  downloadBlob(blob, `${filenamePrefix}-${timestamp()}.svg`);
}

export class CanvasVideoRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  get isRecording(): boolean {
    return this.recorder !== null && this.recorder.state === 'recording';
  }

  start(canvas: HTMLCanvasElement, fps = 30): void {
    if (this.isRecording) return;
    const stream = canvas.captureStream(fps);
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, { mimeType });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
  }

  stopAndDownload(): void {
    if (!this.recorder) return;
    const recorder = this.recorder;
    recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'video/webm' });
      downloadBlob(blob, `evolution-sim-video-${timestamp()}.webm`);
      this.chunks = [];
    };
    recorder.stop();
    this.recorder = null;
  }
}
