import { PERFORMANCE_PROFILES, PerformanceProfileName, PerformanceProfile } from "./PerformanceProfile";
import { PerformanceStats } from "./PerformanceStats";
import { UpdateScheduler } from "./UpdateScheduler";

export class PerformanceManager {
  readonly stats = new PerformanceStats();
  readonly scheduler = new UpdateScheduler();
  private requested: PerformanceProfileName = "auto";
  private active: PerformanceProfile = PERFORMANCE_PROFILES.auto;

  setProfile(profile: PerformanceProfileName) {
    this.requested = profile;
    this.active = PERFORMANCE_PROFILES[profile];
  }

  getProfile() { return this.active; }

  beginFrame(now = performance.now()) { this.stats.beginFrame(now); }
  endFrame(now = performance.now()) { this.stats.endFrame(now); }

  resolveAutoProfile(): PerformanceProfile {
    if (this.requested !== "auto") return this.active;
    const fps = this.stats.snapshot(0, 0).fps;
    if (fps < 28) return PERFORMANCE_PROFILES.battery;
    if (fps < 42) return PERFORMANCE_PROFILES.balanced;
    return PERFORMANCE_PROFILES.quality;
  }
}
