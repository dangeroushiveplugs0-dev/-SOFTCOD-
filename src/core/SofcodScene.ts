import type { AnimationClip } from "three";

export type SofcodScene = {
  version: number;
  models: string[];
  skeletons: string[];
  ikChains: string[];
  animationClips: string[];
  lighting: unknown;
};

export const SNC_VERSION = 2;
