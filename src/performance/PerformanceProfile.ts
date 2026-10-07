export type PerformanceProfileName = "auto" | "battery" | "balanced" | "quality";

export interface PerformanceProfile {
  name: PerformanceProfileName;
  targetFps: number;
  maxDpr: number;
  animationUpdateHz: number;
  distantUpdateHz: number;
  lodEnabled: boolean;
}

export const PERFORMANCE_PROFILES: Record<PerformanceProfileName, PerformanceProfile> = {
  auto: { name: "auto", targetFps: 45, maxDpr: 1.5, animationUpdateHz: 60, distantUpdateHz: 15, lodEnabled: true },
  battery: { name: "battery", targetFps: 30, maxDpr: 1, animationUpdateHz: 30, distantUpdateHz: 8, lodEnabled: true },
  balanced: { name: "balanced", targetFps: 45, maxDpr: 1.5, animationUpdateHz: 60, distantUpdateHz: 12, lodEnabled: true },
  quality: { name: "quality", targetFps: 60, maxDpr: 2, animationUpdateHz: 60, distantUpdateHz: 30, lodEnabled: false },
};
