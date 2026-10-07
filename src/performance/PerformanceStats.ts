export interface PerformanceStatsSnapshot {
  fps: number;
  frameMs: number;
  visibleModels: number;
  totalModels: number;
}

export class PerformanceStats {
  private last = performance.now();
  private frameMs = 16.67;
  private fps = 60;

  beginFrame(now = performance.now()) { this.last = now; }
  endFrame(now = performance.now()) {
    const sample = Math.max(0.1, now - this.last);
    this.frameMs = this.frameMs * 0.9 + sample * 0.1;
    this.fps = 1000 / this.frameMs;
  }
  snapshot(visibleModels: number, totalModels: number): PerformanceStatsSnapshot {
    return { fps: this.fps, frameMs: this.frameMs, visibleModels, totalModels };
  }
}
